// ─────────────────────────────────────────────────────────────────────────────
// features/interrogation — 용의자 심문(방 안 대화형).
//   질문지 = 진술 질문 + '화제'. 관련 단서를 챙기면 화제 질문이 열리고(운동·등산 …),
//   그 화제를 꺼내면 묶인 단서들을 이어서 물어볼 수 있게 된다 — 단서를 낱개로 늘어놓지 않는다.
//   대답을 한 번 더 탭하면 파고들고(캐묻기), 「반박」으로 그 대답에 단서를 들이댄다(모순!).
//   ❗=새 질문 · ✔=이미 물음 · ✅=모순 밝힌 질문.
//   (증언/진술 데이터·판정 로직은 ../interrogation.js 를 참조)
// ─────────────────────────────────────────────────────────────────────────────
import { Fragment, useEffect, useRef, useState } from 'react';
import { getClue, clueIcon } from '../content.js';
import { TRUST_MAX, isUiTap } from '../lib/game.js';
import { visibleStatements, relatedCodes, introOf, clueTargetIn, clueTalkable, visibleTopics, topicClues } from '../interrogation.js';
import { SceneBg, StandingFigure } from '../art.jsx';
import { DialogueBox, TopHud } from '../vn.jsx';

// 화제 아래로 이어지는 단서 질문 한 줄. ❗=아직 안 물음 · ✔=물어봄 · ✅=이걸로 모순을 짚음
function ClueAsk({ c, k, onPick, sub }) {
  const cls = `${k.done ? 'done' : k.asked ? 'asked' : 'new'}${sub ? ' sub' : ''}`;
  return (
    <button className={cls} onClick={() => onPick(c.code)}>
      {k.done ? '✅ ' : k.asked ? '✔ ' : '❗ '}{clueIcon(c)} “{c.title}” 에 대해 묻는다
    </button>
  );
}

// ── 용의자 심문 (방 안 대화형 — 질문/단서 고르기 → 대답 → 캐묻기/반박) ─────────
//   화면 문법: 우측 상단=수첩(어느 화면이든 같은 자리) · 하단 바 없음 ·
//              대사창 우측 하단=이 화면에서 할 것(반박·다른 질문·나가기).
export function CrossExamView({ suspect, location, state, collectedClues, phase = 1, tutorialSeen, onTutorialSeen, onAsked, onAskedClue, onAskedTopic, onPress, onPresent, onOpenRecord, onExit }) {
  const [curId, setCurId] = useState(null); // 지금 붙잡고 있는 질문(진술 id) — null = 질문 목록
  // 대사창 오버라이드: { text, kind } — 진입 시 인사말(1차/2차 다름)부터
  const [line, setLine] = useState(() => (suspect ? { text: introOf(suspect.id, phase), kind: 'intro' } : null));
  const [picker, setPicker] = useState(false);
  const [cutin, setCutin] = useState(null); // 모순! 컷인
  const [shake, setShake] = useState(false);
  const [speaking, setSpeaking] = useState(false); // 대사 타이핑 중 = 말하는 중(토크 모션)
  const [isTutorial] = useState(() => !tutorialSeen); // 이 심문이 첫(튜토리얼) 심문인가 — 화면 표시용
  const dlgRef = useRef(null); // 화면 아무 데나 탭 → 대사 넘김 위임
  // 첫 심문에 진입하면 코치마크 종료(이후 나가면 마무리 멘트) — 인트로를 안 넘겨도 확실히 처리
  useEffect(() => { if (!tutorialSeen) onTutorialSeen?.(); /* eslint-disable-next-line */ }, []);

  const sid = suspect?.id;
  const collected = state.collected || [];
  const unlocked = state.stUnlocked?.[sid] || [];
  const pressedIds = state.pressed?.[sid] || [];
  const askedIds = state.askedQ?.[sid] || [];
  const askedCodes = state.askedC?.[sid] || [];   // 이 인물에게 이미 들어본 단서
  const askedTopics = state.askedT?.[sid] || [];  // 이미 꺼낸 화제 — 그 아래 단서 질문이 열린다
  const broke = state.broke?.[sid] || [];
  const trust = state.trust?.[sid] ?? TRUST_MAX;
  const statements = sid ? visibleStatements(sid, collected, unlocked, phase) : [];
  const brokeOf = (id) => broke.find((e) => e.id === id);
  const confessed = broke.some((e) => e.confess);

  const cur = curId ? statements.find((s) => s.id === curId) : null;
  const bk = cur ? brokeOf(cur.id) : null;
  // 「캐묻는다」는 버튼이 아니라 '한 번 더 탭' 이다 — 대답을 읽고 넘기면 파고든 말이 이어진다.
  //   (전수 조사 결과 캐묻기로 열리는 질문은 하나도 없고 부수효과는 증언 단서 지급뿐이라,
  //    버튼을 따로 둘 이유가 없다. 이미 캐물은 진술은 pressed 에 남아 두 번 재생되지 않는다.)
  const canPress = !!cur?.press && !pressedIds.includes(cur.id);

  // 「반박」에 들이댈 수 있는 증거 — 관련 코드 + 이 인물 소지품(빗나가면 신뢰도가 깎이는 승부수)
  const rel = sid ? relatedCodes(sid) : new Set();
  const isRelated = (c) => c.type !== '증언' && (rel.has(c.code) || c.person === suspect?.name);
  const presentable = collectedClues.filter(isRelated);

  // 화제 — 관련 단서를 챙기면 열리는 질문. 물어보면 그 아래로 개별 단서 질문이 이어진다.
  //   이어질 게 하나도 없는 화제는 띄우지 않는다(물어봐야 허탕) — 단, 이미 꺼낸 건 ✔로 남긴다.
  const cluesOf = (t) => topicClues(sid, t, collected, statements).map((code) => getClue(code)).filter(Boolean);
  const topics = (sid ? visibleTopics(sid, collected) : [])
    .filter((t) => askedTopics.includes(t.id) || cluesOf(t).length > 0);
  // 아직 안 꺼낸 화제(0) → 물어볼 게 남은 화제(1) → 다 들은 화제(2). ❗가 늘 위에 오게 한다
  //   (끝까지 가면 화제 5개에 하위 30줄이라, 정렬을 안 하면 남은 게 스크롤 밖으로 밀린다)
  const tRank = (t) => {
    if (!askedTopics.includes(t.id)) return 0;
    const sub = cluesOf(t);
    return sub.length && sub.every((c) => { const k = cKey(c); return k.asked || k.done; }) ? 2 : 1;
  };

  // 질문 정렬: 새로 열린 질문(0) → 아직 안 한 질문(1) → 이미 물은 질문(2) → 모순 짚은 질문(3) 순으로 위→아래
  const qRank = (s) => {
    if (broke.find((e) => e.id === s.id)) return 3;
    if (askedIds.includes(s.id) || pressedIds.includes(s.id)) return 2;
    if (s.hidden) return 0;
    return 1;
  };
  const sortedStatements = [...statements].sort((a, b) => qRank(a) - qRank(b));
  // 단서 한 줄의 상태 — ❗아직 안 물음 · ✔물어봄 · ✅이걸로 모순을 짚음
  const cKey = (c) => {
    const tgt = clueTargetIn(statements, c.code);
    const done = tgt && tgt.kind === 'contradict' && brokeOf(tgt.stId);
    return { done, asked: askedCodes.includes(c.code) };
  };
  const cRank = (c) => { const k = cKey(c); return k.done ? 2 : k.asked ? 1 : 0; };

  if (!suspect) return null;

  const toMenu = () => { setLine(null); setCurId(null); setPicker(false); };

  // 대사 넘김: 인사말→(첫 심문이면 안내). 대답·반응(press/break/soft/wrong)을 읽고 탭하면 라인만 닫아,
  //   현재 질문(cur)이 있으면 그 답변 화면에 머문다 → 이어서 캐묻기/증거 가능(질문 목록으로 튀지 않음).
  const advance = () => {
    if (!line) return;
    if (line.kind === 'intro' && !tutorialSeen) {
      onTutorialSeen?.();
      setLine({ kind: 'guide', text: '(수사 노트) 질문지에서 골라 이야기를 듣자.\n대답을 한 번 더 탭하면 더 깊은 말이 나오고, 거짓이다 싶으면 「📁 반박」으로 단서를 들이대자.\n단서를 챙기면 그에 얽힌 이야깃거리가 질문지에 생긴다. ❗ 표시는 아직 안 물어본 것.' });
      return;
    }
    // 화제 대답을 읽고 넘기면 한 겹 더(press) — 그 다음 탭에 질문지로 돌아간다
    if (line.kind === 'topic') {
      const t = topics.find((x) => x.id === line.topicId);
      if (t?.press) { setLine({ text: t.press, kind: 'topicPress', topicId: t.id }); return; }
    }
    setLine(null); // cur가 있으면 답변 화면 유지, 없으면(인트로/가이드/인물반응) 질문 목록으로
  };

  const doPress = () => {
    if (!cur) return;
    setPicker(false);
    const r = onPress(cur.id) || {};
    let extra = '';
    if (r.grants) { const t = getClue(r.grants); if (t) extra += `\n🗣 증언 확보 — ${t.title}`; }
    if (r.unlock) extra += '\n❗ 새로운 질문이 열렸다.';
    setLine({ text: (r.text || '…') + extra, kind: 'press' });
  };

  const grantNote = (r) => (r.grants ? `\n⭐ 추리 단서 확보 — ${getClue(r.grants)?.title || r.grants}` : '');

  const doPresent = (code) => {
    if (!cur) return;
    setPicker(false);
    const r = onPresent(cur.id, code) || {};
    if (r.result === 'contradict') {
      setCutin('모순!');
      setTimeout(() => setCutin((c) => (c === '모순!' ? null : c)), 1300);
      setLine({ text: (r.text || '') + (r.confess ? '\n⚖️ …(관여를 인정합니다.)' : '') + (r.unlock ? '\n❗ 새로운 질문이 열렸다.' : '') + grantNote(r), kind: 'break' });
    } else if (r.result === 'soft') {
      setLine({ text: (r.text || '') + grantNote(r), kind: 'soft' });
    } else {
      setShake(true); setTimeout(() => setShake(false), 480);
      const c = getClue(code);
      const own = c && c.person === suspect.name;
      setLine({ text: own
        ? '…그건 제 물건이 맞는데요. 지금 이 얘기랑 무슨 상관이죠?'
        : '그건 제 것도 아닌데… 왜 저한테 보여주시는 거예요?', kind: 'wrong' });
    }
  };

  // 화제를 꺼낸다 — 짧은 대답을 듣고 나면 질문지에 그 화제의 단서 질문들이 이어서 열린다.
  const askTopic = (t) => {
    setPicker(false);
    onAskedTopic?.(t.id);
    setLine({ text: t.text, kind: 'topic', topicId: t.id });
  };

  // 단서 하나를 짚어 묻는다 → 걸린 진술이 있으면 그 진술로 대질, 없으면 인물 단위 반응(CLUE_REACT).
  const askAboutClue = (code) => {
    setPicker(false);
    const tgt = clueTargetIn(statements, code);
    const stId = tgt ? tgt.stId : null;
    onAskedClue?.(code);                            // 질문지에서 ✔ 처리 · 방 알림(❗) 집계에 반영
    if (stId) { setCurId(stId); onAsked?.(stId); }  // 이 경로로만 진행해도 심문한 것으로 집계되게
    // 이미 짚은 모순이면 조용히 재확인만(컷인·"새 질문/자백" 오정보 재출력 방지)
    const already = tgt && tgt.kind === 'contradict' && brokeOf(stId);
    if (already) { setLine({ text: already.text + '\n(이미 짚은 모순이다.)', kind: 'break' }); return; }
    // 목록에서 골라 '물어보는' 것뿐이므로 반응이 없어도 신뢰도를 깎지 않는다(silent).
    //   신뢰도 차감은 대답에 대놓고 '들이대는' 「이 말에 증거」의 몫.
    const r = onPresent(stId, code, true) || {};
    if (r.result === 'contradict') {
      setCutin('모순!');
      setTimeout(() => setCutin((c) => (c === '모순!' ? null : c)), 1300);
      setLine({ text: (r.text || '') + (r.confess ? '\n⚖️ …(관여를 인정합니다.)' : '') + (r.unlock ? '\n❗ 새로운 질문이 열렸다.' : '') + grantNote(r), kind: 'break' });
    } else if (r.result === 'soft') {
      setLine({ text: (r.text || '') + grantNote(r), kind: 'soft' });
    } else {
      setLine({ text: '그 단서로는 지금 이 사람에게 딱히 물을 게 없어 보인다. 다른 질문을 먼저 풀거나 단서를 더 모으자.', kind: 'soft' });
    }
  };

  const menuOpen = !line && !cur;
  const qLabel = (s) => s.q || (s.text.length > 18 ? s.text.slice(0, 18) + '…' : s.text);

  const hasAsks = statements.length > 0 || topics.length > 0;
  const dlgText = line ? line.text
    : cur ? cur.text
    : (hasAsks ? '무엇을 물어볼까.' : '…(지금은 물어볼 것이 없다. 단서를 모으거나 수사가 진행되면 질문이 생긴다.)');
  const dlgLoc = line
    ? (line.kind === 'break' ? '❗ 모순을 짚었다' : line.kind === 'wrong' ? '심기가 불편하다'
      : line.kind === 'guide' ? '수사 노트' : line.kind === 'intro' ? (phase >= 2 ? '2차 심문' : '심문 시작')
      : (line.kind === 'press' || line.kind === 'topicPress') ? '더 캐묻는다'
      : `${suspect.name}의 대답`)   // soft = 증거에 대한 반응, topic = 화제를 꺼낸 대답
    : cur ? (bk ? '✅ 밝혀낸 이야기' : `${suspect.name}의 대답`) : '질문 선택';
  const speakerName = (line && line.kind !== 'guide') || cur ? suspect.name : null;
  const dlgHint = line ? '탭하여 계속 ▶'
    : cur ? (canPress ? '탭하여 더 캐묻는다 ▶' : '거짓이다 싶으면 「📁 반박」')
    : (hasAsks ? '위 목록에서 질문이나 단서를 고르세요' : '');

  return (
    <div className={`aa-fs${shake ? ' aa-shake' : ''}`}
      onClick={(e) => { if (!isUiTap(e)) dlgRef.current?.tap(); }}>
      <div className="aa-stage">
        {location ? <SceneBg location={location} />
          : <div className="aa-court" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 50% 0%, #1a2233 0%, #0a0e16 60%, #05070b 100%)' }} />}
      </div>
      <div className="aa-loc-chip">⚖️ {location?.label ? `${location.label} · ` : ''}{suspect.name} {phase >= 2 ? '2차 심문' : '심문'}</div>
      {isTutorial && <div className="aa-tut-chip">📖 튜토리얼 — 처음이니 차근차근</div>}
      <TopHud>
        <div className="aa-hp" title="신뢰도">
          <span style={{ color: '#e8706e' }}>{'♥'.repeat(trust)}</span><span style={{ opacity: .28 }}>{'♡'.repeat(TRUST_MAX - trust)}</span>
        </div>
        <button className="hall-hud-btn" title="수첩(사건 기록)" onClick={() => { setPicker(false); onOpenRecord?.(); }}>📓</button>
      </TopHud>

      {/* 상반신 프레이밍 — 인물을 크게 그리고 하반신은 대사창 뒤로 잠기게(역전재판식) */}
      <div className={`aa-room-fig bust${speaking && speakerName ? ' talking' : ''}`}>
        {confessed && <div className="aa-court-tag">⚖️ 관여 자백</div>}
        <StandingFigure sid={sid} person={suspect.name} image={suspect.image} height={620} fallbackSize={160} />
      </div>

      {cutin && <div className="aa-cutin"><span>{cutin}</span></div>}

      {/* 질문지 — 「질문」과 「단서」 두 칸이 한 목록에. 대답을 읽는 중엔 숨김 */}
      {menuOpen && (
        <div className="aa-ask">
          <div className="aa-ask-h">🎙 무엇을 물어볼까{isTutorial ? ' · 📖 튜토리얼' : ''}</div>
          {sortedStatements.length > 0 && <div className="aa-ask-sec">💬 질문</div>}
          {sortedStatements.map((s) => {
            const b = brokeOf(s.id);
            const isNew = s.hidden && !askedIds.includes(s.id) && !pressedIds.includes(s.id) && !b;
            const asked = askedIds.includes(s.id) || pressedIds.includes(s.id);
            const cls = b ? 'done' : isNew ? 'new' : asked ? 'asked' : '';
            const mark = b ? '✅ ' : isNew ? '❗ ' : asked ? '✔ ' : '💬 ';
            return (
              <button key={s.id} className={cls} onClick={() => { onAsked?.(s.id); setCurId(s.id); }}>
                {mark}{qLabel(s)}
              </button>
            );
          })}
          {/* 화제 — 단서를 챙기면 열린다. 한 번 꺼내면 그 아래로 단서 질문이 이어진다 */}
          {topics.length > 0 && <div className="aa-ask-sec">📁 단서로 여는 이야기</div>}
          {[...topics].sort((a, b) => tRank(a) - tRank(b)).map((t) => {
            const done = askedTopics.includes(t.id);
            const sub = done ? cluesOf(t).sort((a, b) => cRank(a) - cRank(b)) : [];
            return (
              <Fragment key={t.id}>
                <button className={done ? 'asked' : 'new'} onClick={() => askTopic(t)}>
                  {done ? '✔ ' : '❗ '}{t.q}
                </button>
                {sub.map((c) => <ClueAsk key={c.code} c={c} k={cKey(c)} onPick={askAboutClue} sub />)}
              </Fragment>
            );
          })}
          {sortedStatements.length === 0 && topics.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: '.85rem', padding: '4px 2px' }}>
              지금은 물어볼 것이 없습니다. 방·현장을 더 조사해 단서를 모으면 질문이 생깁니다.
            </p>
          )}
        </div>
      )}

      {/* 하단 바 없음 — 이 화면에서 할 것은 전부 대사창 우측 하단에 */}
      <DialogueBox ref={dlgRef} location={dlgLoc} speaker={speakerName} text={dlgText}
        onAdvance={line ? advance : (canPress ? doPress : undefined)} hint={dlgHint} onTyping={setSpeaking}
        actions={[
          cur && (bk
            ? { label: '✅ 모순 확인됨', onClick: () => setLine({ text: `${bk.text}\n(이미 짚은 모순이다.)`, kind: 'break' }) }
            : { label: picker ? '✕ 반박 취소' : '📁 반박', tone: 'key', onClick: () => { setLine(null); setPicker((p) => !p); } }),
          cur && { label: '↩ 다른 질문', onClick: toMenu },
          { label: '🚪 나가기', onClick: onExit },
        ]} />

      {picker && cur && !bk && (
        <div className="aa-present">
          <div className="aa-present-h">
            <span>📁 반박할 증거를 고르세요 — “{cur.text.length > 22 ? cur.text.slice(0, 22) + '…' : cur.text}”</span>
            <button className="aa-close" onClick={() => setPicker(false)}>✕</button>
          </div>
          {presentable.length === 0
            ? <p style={{ color: 'var(--muted)', fontSize: '.85rem', padding: '4px 2px' }}>이 인물과 관련된 단서가 아직 없습니다. 현장·대화로 단서를 더 모으세요.</p>
            : <div className="s-grid">
                {presentable.map((c) => (
                  <button key={c.code} className="s-card" onClick={() => doPresent(c.code)}>
                    <div className="ck">{clueIcon(c)}</div>
                    <div className="cn" style={{ fontSize: '.82rem' }}>{c.title}</div>
                    <div className="cm">{c.person}</div>
                  </button>
                ))}
              </div>}
        </div>
      )}
    </div>
  );
}
