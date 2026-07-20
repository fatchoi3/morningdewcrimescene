// ─────────────────────────────────────────────────────────────────────────────
// features/interrogation — 용의자 심문(방 안 대화형).
//   질문을 골라 물으면 대답한다. 「캐묻는다」로 파고들고, 「이 말에 증거」로
//   지금 그 대답에 단서를 들이대(모순!). ❗=새 질문 · ✅=모순 밝힌 질문.
//   (증언/진술 데이터·판정 로직은 ../interrogation.js 를 참조)
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { getClue, clueIcon } from '../content.js';
import { TRUST_MAX, isUiTap } from '../lib/game.js';
import { visibleStatements, relatedCodes, introOf, clueTargetIn } from '../interrogation.js';
import { SceneBg, StandingFigure } from '../art.jsx';
import { DialogueBox, CommandBar } from '../vn.jsx';

// ── 용의자 심문 (방 안 대화형 — 질문 선택 → 대답 → 캐묻기/그 말에 증거) ────────
//   질문 목록에서 골라 물으면 인물이 대답한다. 수상하면 「캐묻는다」로 파고들고,
//   거짓이다 싶으면 「이 말에 증거」로 지금 그 대답에 단서를 들이댄다(모순!).
//   ❗=새로 열린 질문 · ✅=모순을 밝힌 질문. 「이만 마친다」로 방에 복귀(반복 없음).
export function CrossExamView({ suspect, location, state, collectedClues, phase = 1, tutorialSeen, onTutorialSeen, onAsked, onPress, onPresent, onExit }) {
  const [curId, setCurId] = useState(null); // 지금 붙잡고 있는 질문(진술 id) — null = 질문 목록
  const [askMode, setAskMode] = useState('q'); // 2차: 'q'=질문 목록 · 'clue'=단서로 묻는다
  // 대사창 오버라이드: { text, kind } — 진입 시 인사말(1차/2차 다름)부터
  const [line, setLine] = useState(() => (suspect ? { text: introOf(suspect.id, phase), kind: 'intro' } : null));
  const [picker, setPicker] = useState(false);
  const [cutin, setCutin] = useState(null); // 모순! 컷인
  const [record, setRecord] = useState(false);
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
  const broke = state.broke?.[sid] || [];
  const trust = state.trust?.[sid] ?? TRUST_MAX;
  const statements = sid ? visibleStatements(sid, collected, unlocked, phase) : [];
  const brokeOf = (id) => broke.find((e) => e.id === id);
  const confessed = broke.some((e) => e.confess);

  const cur = curId ? statements.find((s) => s.id === curId) : null;
  const bk = cur ? brokeOf(cur.id) : null;

  // 이 인물과 관련 있는 '증거'만 제시 목록에 노출(모순·반응 코드 + 인물 소속 단서, 증언은 제외)
  const rel = sid ? relatedCodes(sid) : new Set();
  const isRelated = (c) => c.type !== '증언' && (rel.has(c.code) || c.person === suspect?.name);
  const presentable = collectedClues.filter(isRelated);

  if (!suspect) return null;

  const toMenu = () => { setLine(null); setCurId(null); setPicker(false); };

  // 대사 넘김: 인사말→(첫 심문이면 안내)→질문 목록 / 대답·반응을 읽고 나면 질문 목록
  const advance = () => {
    if (line) {
      if (line.kind === 'intro' && !tutorialSeen) {
        onTutorialSeen?.();
        setLine({ kind: 'guide', text: '(수사 노트) 질문을 골라 이야기를 듣자.\n수상한 대답은 「🔎 캐묻는다」로 파고들고, 거짓이다 싶으면 「📁 이 말에 증거」로 단서를 들이대자.\n❗ 표시가 붙은 새 질문이 열리면 놓치지 말 것.' });
        return;
      }
      if (line.kind === 'intro' || line.kind === 'guide') { setLine(null); return; }
      toMenu();
      return;
    }
    if (cur) toMenu();
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

  const doPresent = (code) => {
    if (!cur) return;
    setPicker(false);
    const r = onPresent(cur.id, code) || {};
    if (r.result === 'contradict') {
      setCutin('모순!');
      setTimeout(() => setCutin((c) => (c === '모순!' ? null : c)), 1300);
      setLine({ text: (r.text || '') + (r.confess ? '\n⚖️ …(관여를 인정합니다.)' : '') + (r.unlock ? '\n❗ 새로운 질문이 열렸다.' : ''), kind: 'break' });
    } else if (r.result === 'soft') {
      setLine({ text: r.text || '', kind: 'soft' });
    } else {
      setShake(true); setTimeout(() => setShake(false), 480);
      const c = getClue(code);
      const own = c && c.person === suspect.name;
      setLine({ text: own
        ? '…그건 제 물건이 맞는데요. 지금 이 얘기랑 무슨 상관이죠?'
        : '그건 제 것도 아닌데… 왜 저한테 보여주시는 거예요?', kind: 'wrong' });
    }
  };

  // 2차: 단서를 골라 '그 단서에 대해' 묻는다 → 그 단서가 반응하는(지금 보이는) 진술로 자동 대질
  const askAboutClue = (code) => {
    const tgt = clueTargetIn(statements, code);
    if (!tgt) { setPicker(false); setLine({ text: '그 단서로는 지금 이 사람에게 딱히 물을 게 없어 보인다. 다른 질문을 먼저 풀거나 단서를 더 모으자.', kind: 'soft' }); return; }
    setPicker(false);
    setCurId(tgt.stId);
    const r = onPresent(tgt.stId, code) || {};
    if (r.result === 'contradict') {
      setCutin('모순!');
      setTimeout(() => setCutin((c) => (c === '모순!' ? null : c)), 1300);
      setLine({ text: (r.text || '') + (r.confess ? '\n⚖️ …(관여를 인정합니다.)' : '') + (r.unlock ? '\n❗ 새로운 질문이 열렸다.' : ''), kind: 'break' });
    } else {
      setLine({ text: r.text || '', kind: 'soft' });
    }
  };

  const menuOpen = !line && !cur;
  const qLabel = (s) => s.q || (s.text.length > 18 ? s.text.slice(0, 18) + '…' : s.text);

  const dlgText = line ? line.text
    : cur ? cur.text
    : (statements.length ? '무엇을 물어볼까. (아래에서 질문을 고르자)' : '…(지금은 물어볼 것이 없다. 단서를 모으거나 수사가 진행되면 질문이 생긴다.)');
  const dlgLoc = line
    ? (line.kind === 'break' ? '❗ 모순을 짚었다' : line.kind === 'wrong' ? '심기가 불편하다' : line.kind === 'guide' ? '수사 노트' : line.kind === 'intro' ? (phase >= 2 ? '2차 심문' : '심문 시작') : '캐묻는다')
    : cur ? (bk ? '✅ 밝혀낸 이야기' : `${suspect.name}의 대답`) : '질문 선택';
  const speakerName = (line && line.kind !== 'guide') || cur ? suspect.name : null;
  const dlgHint = (line || cur) ? '탭하여 계속 ▶' : '';

  return (
    <div className={`aa-fs${shake ? ' aa-shake' : ''}`}
      onClick={(e) => { if (!isUiTap(e)) dlgRef.current?.tap(); }}>
      <div className="aa-stage">
        {location ? <SceneBg location={location} />
          : <div className="aa-court" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 50% 0%, #1a2233 0%, #0a0e16 60%, #05070b 100%)' }} />}
      </div>
      <div className="aa-loc-chip">⚖️ {location?.label ? `${location.label} · ` : ''}{suspect.name} {phase >= 2 ? '2차 심문' : '심문'}</div>
      {isTutorial && <div className="aa-tut-chip">📖 튜토리얼 — 처음이니 차근차근</div>}
      <div className="aa-hp" title="신뢰도">
        <span style={{ color: '#e8706e' }}>{'♥'.repeat(trust)}</span><span style={{ opacity: .28 }}>{'♡'.repeat(TRUST_MAX - trust)}</span>
      </div>

      {/* 상반신 프레이밍 — 인물을 크게 그리고 하반신은 대사창 뒤로 잠기게(역전재판식) */}
      <div className={`aa-room-fig bust${speaking && speakerName ? ' talking' : ''}`}>
        {confessed && <div className="aa-court-tag">⚖️ 관여 자백</div>}
        <StandingFigure sid={sid} person={suspect.name} image={suspect.image} height={620} fallbackSize={160} />
      </div>

      {cutin && <div className="aa-cutin"><span>{cutin}</span></div>}

      {/* 질문 선택지 — 대답/반응을 읽는 중엔 숨김. ✔=이미 들은 질문 */}
      {menuOpen && (
        <div className="aa-ask">
          <div className="aa-ask-h">🎙 무엇을 물어볼까{isTutorial ? ' · 📖 튜토리얼' : ''}</div>
          {phase >= 2 && (
            <div className="s-seg" style={{ margin: '0 0 8px' }}>
              <button className={askMode === 'q' ? 'on' : ''} onClick={() => setAskMode('q')}>💬 질문</button>
              <button className={askMode === 'clue' ? 'on' : ''} onClick={() => setAskMode('clue')}>📁 단서로 묻는다</button>
            </div>
          )}
          {(phase < 2 || askMode === 'q') ? statements.map((s) => {
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
          }) : (
            presentable.length === 0
              ? <p style={{ color: 'var(--muted)', fontSize: '.85rem', padding: '4px 2px' }}>이 인물에게 물을 단서가 아직 없습니다. 방·현장·휴대폰을 더 조사하세요.</p>
              : presentable.map((c) => {
                  const tgt = clueTargetIn(statements, c.code);
                  const done = tgt && tgt.kind === 'contradict' && brokeOf(tgt.stId);
                  return (
                    <button key={c.code} className={done ? 'done' : ''} onClick={() => askAboutClue(c.code)}>
                      {done ? '✅ ' : '📁 '}“{c.title}” 에 대해 묻는다
                    </button>
                  );
                })
          )}
          <button className="end" onClick={onExit}>↩ 이만 마친다 — 방으로 돌아간다</button>
        </div>
      )}

      <DialogueBox ref={dlgRef} location={dlgLoc} speaker={speakerName} text={dlgText}
        onAdvance={(line || cur) ? advance : undefined} hint={dlgHint} onTyping={setSpeaking} />

      <CommandBar items={cur ? [
        { icon: '🔎', label: '캐묻는다', onClick: doPress },
        !bk && { icon: '📁', label: '이 말에 증거', active: picker, onClick: () => { setLine(null); setPicker((p) => !p); } },
        { icon: '↩', label: '다른 질문', onClick: toMenu },
        { icon: '📑', label: '사건기록', onClick: () => { setPicker(false); setRecord(true); } },
      ] : [
        { icon: '📑', label: '사건기록', onClick: () => setRecord(true) },
        { icon: '↩', label: '돌아가기', onClick: onExit },
      ]} />

      {picker && cur && !bk && (
        <div className="aa-present">
          <div className="aa-present-h">
            <span>이 말에 들이댈 증거 — “{cur.text.length > 24 ? cur.text.slice(0, 24) + '…' : cur.text}”</span>
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

      {record && (
        <div className="aa-record">
          <button className="aa-close" onClick={() => setRecord(false)}>✕</button>
          <h3>사건 기록 · 이 인물에게 들이댈 증거 ({collectedClues.length})</h3>
          {collectedClues.length === 0
            ? <p style={{ color: 'var(--muted)' }}>아직 확보한 단서가 없습니다. 현장을 조사하거나 인물과 대화하세요.</p>
            : <div className="s-grid">
                {collectedClues.map((c) => {
                  const relv = isRelated(c);
                  return (
                    <button key={c.code} className="s-card" style={relv ? { borderColor: 'var(--gold)' } : { opacity: .6 }}
                      onClick={() => { if (relv) { setRecord(false); setPicker(true); } }}>
                      <div className="ck">{clueIcon(c)}</div>
                      <div className="cn" style={{ fontSize: '.82rem' }}>{c.title}</div>
                      <div className="cm">{c.type === '증언' ? '증언' : relv ? '이 인물과 관련' : c.person}</div>
                    </button>
                  );
                })}
              </div>}
        </div>
      )}
    </div>
  );
}
