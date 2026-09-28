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
import { visibleStatements, relatedCodes, introOf, clueTargetIn, clueTalkable, visibleTopics, topicClues, topicStatements, rootStatements } from '../interrogation.js';
import { SceneBg, StandingFigure } from '../art.jsx';
import { DialogueBox, TopHud } from '../vn.jsx';
import { TutorialCoach } from './tutorial.jsx';

// 단서로 묻는 한 줄. ❗=아직 안 물음 · ✔=물어봄 · ✅=이걸로 모순을 짚음
function ClueAsk({ c, k, onPick }) {
  return (
    <button className={k.done ? 'done' : k.asked ? 'asked' : 'new'} onClick={() => onPick(c.code)}>
      {k.done ? '✅ ' : k.asked ? '✔ ' : '❗ '}{clueIcon(c)} “{c.title}” 에 대해 묻는다
    </button>
  );
}

// 진술 질문 한 줄. ✅=모순 짚음 · ❗=새로 열림 · ✔=이미 물음
function Ask({ s, k, label, onPick }) {
  return (
    <button className={k.broke ? 'done' : k.isNew ? 'new' : k.asked ? 'asked' : ''} onClick={() => onPick(s)}>
      {k.broke ? '✅ ' : k.isNew ? '❗ ' : k.asked ? '✔ ' : '💬 '}{label}
    </button>
  );
}

// 화자 이름 없이 나가는 라인 — 수사 노트와 플레이어 독백. 나머지는 전부 인물이 직접 하는 말이다.
//   예전엔 'guide' 만 걸러서, 수사관의 추궁문("❗모순 — …CCTV에 찍혔습니다")과 독백까지
//   용의자 이름표를 달고 나왔다(자기가 자기를 추궁하는 꼴).
const NOTE_KINDS = new Set(['guide', 'note']);

// 반박 시트 인물 필터 칩 — solo.css 는 다른 담당자 소유라 여기서 인라인으로 그린다
const chipStyle = (on) => ({
  flex: 'none', background: on ? '#241f14' : '#ffffff10',
  border: `1px solid ${on ? 'var(--gold)' : '#ffffff2e'}`, color: on ? '#ffe9a8' : '#cdd3df',
  fontSize: '.74rem', fontWeight: 700, padding: '5px 11px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap',
});

// ── 용의자 심문 (방 안 대화형 — 질문/단서 고르기 → 대답 → 캐묻기/반박) ─────────
//   화면 문법: 하단 바 없음 · 대사창 우측 하단=이 화면에서 할 것(반박·다른 질문·수첩·나가기).
//   수첩(📓)만은 다른 화면과 달리 우측 상단이 아니라 대사창 액션행에 둔다 —
//   심문은 한 화면에 오래 머물고 단서 확인이 잦은데, 폰 세로에서 우측 상단은 엄지가 닿지 않는다.
export function CrossExamView({ suspect, location, state, collectedClues, phase = 1, tutorialSeen, onTutorialSeen, onAsked, onAskedClue, onAskedTopic, onPress, onPresent, onOpenRecord, onExit, onSkipTutorial }) {
  const [curId, setCurId] = useState(null); // 지금 붙잡고 있는 질문(진술 id) — null = 질문 목록
  // 대사창 오버라이드: { text, kind } — 진입 시 인사말(1차/2차 다름)부터
  const [line, setLine] = useState(() => (suspect ? { text: introOf(suspect.id, phase), kind: 'intro' } : null));
  const [picker, setPicker] = useState(false);
  const [pPerson, setPPerson] = useState(null); // 반박 시트 인물 필터 — null = 전체
  const [peek, setPeek] = useState(null); // 반박 시트에서 길게 눌러 들춰 본 단서
  const [openTopicId, setOpenTopicId] = useState(null); // 지금 들어와 있는 화제 — null = 최상위 질문지
  // 이번 방문에 캐물어 본 화제 — 세이브(askedT)에는 화제를 꺼냈는지만 남아 화제 press 는 여기서만 센다.
  //   여담이라 다시 와서 또 들어도 손해가 없으니 세이브까지 늘릴 이유가 없다.
  const [topicPressed, setTopicPressed] = useState([]);
  const [cutin, setCutin] = useState(null); // 모순! 컷인
  const [shake, setShake] = useState(false);
  const [speaking, setSpeaking] = useState(false); // 대사 타이핑 중 = 말하는 중(토크 모션)
  const [isTutorial] = useState(() => !tutorialSeen); // 이 심문이 첫(튜토리얼) 심문인가 — 화면 표시용
  const dlgRef = useRef(null); // 화면 아무 데나 탭 → 대사 넘김 위임
  const typedRef = useRef(new Set()); // 이미 한 번 흘러간 대사 — 되돌아왔을 때 처음부터 다시 치지 않는다
  const lastTextRef = useRef(null);
  const peekRef = useRef({ t: null, fired: false, at: 0 }); // 길게 누르기 판정 — fired 면 뒤따라오는 click(=제시)을 삼킨다
  // 예전엔 진입 즉시 튜토리얼을 끝내서, 심문 화면 전체가 '안내 없는 구간'이 됐다.
  //   질문 하나를 끝까지 듣고 목록으로 돌아온 시점에 끝낸다 — 그때까지 코치마크가 이어진다.
  useEffect(() => {
    if (!tutorialSeen && (state.askedQ?.[suspect?.id] || []).length >= 1 && !line && !curId) onTutorialSeen?.();
    /* eslint-disable-next-line */
  }, [tutorialSeen, line, curId]);

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

  // 화제 — 관련 단서를 챙기면 열리는 '이야깃거리'. 고르면 그 안으로 들어가고, 파생 질문은
  //   전부 그 안에서만 보인다(트리를 펼쳐 두면 단서가 쌓일수록 남은 걸 못 찾는다).
  const cluesOf = (t) => topicClues(sid, t, collected, statements).map((code) => getClue(code)).filter(Boolean);
  const stsOf = (t) => topicStatements(sid, t, statements);
  const topics = (sid ? visibleTopics(sid, collected) : [])
    .filter((t) => askedTopics.includes(t.id) || cluesOf(t).length > 0 || stsOf(t).length > 0);
  const openTopic = openTopicId ? topics.find((t) => t.id === openTopicId) : null;

  // 질문 정렬: 새로 열린 질문(0) → 아직 안 한 질문(1) → 이미 물은 질문(2) → 모순 짚은 질문(3) 순으로 위→아래
  const qRank = (s) => {
    if (broke.find((e) => e.id === s.id)) return 3;
    if (askedIds.includes(s.id) || pressedIds.includes(s.id)) return 2;
    if (s.hidden) return 0;
    return 1;
  };
  const byQ = (a, b) => qRank(a) - qRank(b);
  // 최상위엔 기본 질문 + 모순으로 열린 질문. 단서로 열리는 질문은 화제 안으로 들어가는데,
  //   그 화제가 아직 안 열려 있으면 최상위로 되돌린다 — 안 그러면 질문이 화면에서 증발한다
  //   (한소미의 「한다영과는 어떤 사이죠?」가 소미 방만 뒤진 경로에서 사라지던 문제).
  const ownedByShownTopic = new Set(topics.flatMap((t) => stsOf(t).map((s) => s.id)));
  const rootSts = statements.filter((s) => !ownedByShownTopic.has(s.id)).sort(byQ);
  // 단서 한 줄의 상태 — ❗아직 안 물음 · ✔물어봄 · ✅이걸로 모순을 짚음
  const cKey = (c) => {
    const tgt = clueTargetIn(statements, c.code);
    const done = tgt && tgt.kind === 'contradict' && brokeOf(tgt.stId);
    return { done, asked: askedCodes.includes(c.code) };
  };
  const cRank = (c) => { const k = cKey(c); return k.done ? 2 : k.asked ? 1 : 0; };
  const sKey = (s) => {
    const b = brokeOf(s.id);
    const asked = askedIds.includes(s.id) || pressedIds.includes(s.id);
    return { broke: !!b, asked, isNew: s.hidden && !asked && !b };
  };
  // 반박 시트 — 21~30장이 주운 순서대로 깔려 있어 폰에서 3~4화면을 훑어야 했다.
  //   아직 안 써본 것을 위로 올리고, 인물로 좁힐 수 있게 한다(화제 목록과 같은 ❗/✔/✅ 표시).
  const presentPersons = [...new Set(presentable.map((c) => c.person).filter(Boolean))];
  const presentList = presentable.filter((c) => !pPerson || c.person === pPerson)
    .sort((a, b) => cRank(a) - cRank(b));

  // 화제 안에서 아직 안 물어본 게 남았나 — 다 들었으면 대사창이 그만 나가자고 말해준다
  const leftInTopic = openTopic
    ? stsOf(openTopic).filter((s) => !askedIds.includes(s.id) && !pressedIds.includes(s.id)).length
      + cluesOf(openTopic).filter((c) => !cKey(c).asked && !cKey(c).done).length
    : 0;
  // 「💬 더 캐묻는다」는 남은 개수에 안 세지만 아직 할 일이긴 하다 — 대사창 힌트와 '더 들을 것 없다'
  //   안내가 서로 다른 말을 하지 않도록 같은 조건을 쓴다.
  const topicHasMore = leftInTopic > 0
    || !!(openTopic?.press && !topicPressed.includes(openTopic.id));
  const hasAsks = rootSts.length > 0 || topics.length > 0;
  // 질문지가 떠 있는 동안 대사창에 나가는 글은 인물의 말이 아니라 화면 안내다 — 타이핑 판정에도 쓴다
  const menuOpen = !line && !cur;
  const dlgText = line ? line.text
    : cur ? cur.text
    : openTopic ? (leftInTopic > 0
        ? `${openTopic.q} — 더 물어볼 게 ${leftInTopic}가지 남았다.`
        : `${openTopic.q} — 이 얘기는 더 들을 게 없다. 다른 이야기를 꺼내볼까.`)
    : (hasAsks ? '무엇을 물어볼까.' : '…(지금은 물어볼 것이 없다. 단서를 모으거나 수사가 진행되면 질문이 생긴다.)');
  // 캐묻기·반응 라인을 닫으면 텍스트가 답변(cur.text)으로 되돌아가는데, DialogueBox 는 텍스트가
  //   바뀐 것으로 보고 방금 읽은 답변을 처음부터 다시 친다. vn.jsx 는 건드릴 수 없으니
  //   여기서 tap() 한 번으로 타이핑을 끝내 준다(이미 읽은 대사는 어디서 다시 만나도 즉시 표시).
  //   lastTextRef 로 '진짜 바뀐 경우'만 거른다 — StrictMode 는 마운트 직후 effect 를 한 번 더 돌리는데,
  //   그때 첫 대사가 '이미 읽은 것'으로 오인되면 인사말이 타이핑 없이 튀어나온다.
  //   화면 안내(menuOpen)는 typedRef 와 무관하게 늘 즉시 띄운다 — 「… 더 물어볼 게 N가지 남았다」는
  //   N 이 줄 때마다 문자열이 달라져 '읽은 글'로 인식되지 못하고 목록에 돌아올 때마다 처음부터 쳤다.
  useEffect(() => {
    if (dlgText !== lastTextRef.current && (menuOpen || typedRef.current.has(dlgText))) dlgRef.current?.tap();
    lastTextRef.current = dlgText;
    typedRef.current.add(dlgText);
  }, [dlgText, menuOpen]);

  if (!suspect) return null;

  // 「다른 질문」 = 지금 있는 겹으로 복귀(화제 안이면 그 화제 목록, 아니면 최상위)
  const toMenu = () => { setLine(null); setCurId(null); setPicker(false); };
  const pickStatement = (s) => { onAsked?.(s.id); setCurId(s.id); };

  // 대사 넘김: 인사말→(첫 심문이면 안내). 대답·반응(press/break/soft/wrong)을 읽고 탭하면 라인만 닫아,
  //   현재 질문(cur)이 있으면 그 답변 화면에 머문다 → 이어서 캐묻기/증거 가능(질문 목록으로 튀지 않음).
  const advance = () => {
    if (!line) return;
    if (line.kind === 'intro' && !tutorialSeen) {
      // 안내만 띄우고 튜토리얼을 끝내지는 않는다 — 질문 하나를 들을 때까지 코치마크가 이어져야 한다
      setLine({ kind: 'guide', text: '(수사 노트) 질문지에서 골라 이야기를 듣자.\n대답을 한 번 더 탭하면 더 깊은 말이 나오고, 거짓이다 싶으면 「📁 반박」으로 단서를 들이대자.\n단서를 챙기면 그에 얽힌 이야깃거리가 질문지에 생긴다. ❗ 표시는 아직 안 물어본 것.' });
      return;
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

  // 이미 손에 있는 단서면 '확보' 알림을 내지 않는다 — DISC-11 로 그 모순을 짚으면 보상이 같은 코드라
  //   "⭐ 확보 — 사라진 대화방"이 두 번 뜬다(상태는 멀쩡한데 안내만 거짓말이 된다).
  const grantNote = (r) => (r.grants && !collected.includes(r.grants)
    ? `\n⭐ 추리 단서 확보 — ${getClue(r.grants)?.title || r.grants}` : '');

  const doPresent = (code) => {
    if (!cur) return;
    setPicker(false);
    onAskedClue?.(code);   // 반박으로 이미 써먹은 단서 — 질문지·방 배지에서도 '들어봤음'으로
    const r = onPresent(cur.id, code) || {};
    if (r.result === 'contradict') {
      // 컷인은 판정 선언이 아니라 '순간의 충격'이다 — 대사는 인물이 직접 하고, 여기선 임팩트만
      setCutin('!!!');
      setTimeout(() => setCutin((c) => (c === '!!!' ? null : c)), 1300);
      setLine({ text: (r.text || '') + (r.confess ? '\n⚖️ …(관여를 인정합니다.)' : '') + (r.unlock ? '\n❗ 새로운 질문이 열렸다.' : '') + grantNote(r), kind: 'break' });
    } else if (r.result === 'soft') {
      setLine({ text: (r.text || '') + grantNote(r), kind: 'soft' });
    } else if (r.result === 'offtopic') {
      // 이 인물의 다른 진술에서 쓰이는 '정답 증거'를 자리만 잘못 짚은 것 — 화낼 일도 감점할 일도 아니다.
      //   흔들림·angry 표정 없이 수사 노트로 알려준다(SoloApp 은 'wrong' 일 때만 신뢰도를 깎는다).
      setLine({ text: r.text || '(이 대답에 들이댈 단서는 아니다. 자리를 잘못 짚었다.)', kind: 'note' });
    } else {
      setShake(true); setTimeout(() => setShake(false), 480);
      const c = getClue(code);
      const own = c && c.person === suspect.name;
      setLine({ text: own
        ? '…그건 제 물건이 맞는데요. 지금 이 얘기랑 무슨 상관이죠?'
        : '그건 제 것도 아닌데… 왜 저한테 보여주시는 거예요?', kind: 'wrong' });
    }
  };

  // 반박 시트 카드엔 제목과 소유자뿐이라, 본문이 가물가물하면 시트를 닫고 📓 를 열었다 되돌아와야 했다.
  //   길게 누르면 그 자리에서 본문만 들춰 본다(짧게 누르면 종전대로 그 단서를 들이댄다).
  //   손가락이 밀려 시트가 스크롤되면 pointercancel 이 와서 판정이 취소된다.
  const peekStart = (c) => {
    clearTimeout(peekRef.current.t);
    peekRef.current.fired = false;
    peekRef.current.t = setTimeout(() => {
      peekRef.current.fired = true; peekRef.current.at = Date.now(); setPeek(c);
    }, 420);
  };
  const peekStop = () => clearTimeout(peekRef.current.t);
  // 손을 떼는 순간 발생하는 click 은 카드가 아니라 그새 그 자리를 덮은 미리보기로 갈 수 있다 —
  //   그대로 두면 길게 누르자마자 저 혼자 닫힌다. 열린 직후의 탭 한 번만 흘려보낸다.
  const peekClose = () => { if (Date.now() - peekRef.current.at > 400) setPeek(null); };

  // 화제로 들어간다 — 대답을 듣고 넘기면 곧장 그 화제의 질문 목록이 열린다.
  //   예전엔 대답과 목록 사이에 화제 press 가 한 겹 더 끼어, TOPICS 32개가 전부 press 를 갖고 있는 탓에
  //   화제 하나를 여는 데 예외 없이 3탭이 들었다(그중 32탭이 press 를 닫는 데만 쓰였다).
  //   press 는 여담이라 목록의 「💬 더 캐묻는다」로 옮겨, 듣고 싶은 사람만 고르게 한다.
  const askTopic = (t) => {
    setPicker(false);
    setCurId(null);
    setOpenTopicId(t.id);
    if (askedTopics.includes(t.id)) return;         // 이미 들은 화제면 곧장 목록으로
    onAskedTopic?.(t.id);
    setLine({ text: t.text, kind: 'topic' });
  };

  // 단서 하나를 짚어 묻는다 → 그 단서에 대한 반응만 듣고 끝난다.
  //   여기서 진술(cur)을 붙잡으면 안 된다 — 반응을 넘긴 순간 엉뚱한 진술 본문("10시에 등산을…")이
  //   튀어나와 "요힘빈 얘기를 했는데 왜 일정 얘기로 돌아가지?" 가 된다.
  const askAboutClue = (code) => {
    setPicker(false);
    const tgt = clueTargetIn(statements, code);
    const stId = tgt ? tgt.stId : null;
    // 이미 짚은 모순이면 조용히 재확인만(컷인·"새 질문/자백" 오정보 재출력 방지)
    const already = tgt && tgt.kind === 'contradict' && brokeOf(stId);
    if (already) {
      onAskedClue?.(code);
      setLine({ text: already.text + '\n(이미 짚은 모순이다.)', kind: 'break' }); return;
    }
    // 아직 그 사람 입으로 못 들은 진술을 이 단서가 깨게 되어 있으면, 여기서 터뜨리지 않는다.
    //   거짓말 원문을 듣기도 전에 반박이 먼저 나오면 추궁의 맛이 사라지고,
    //   그 진술은 ✅로 닫혀 캐묻기로만 주는 증언까지 지나치게 된다.
    if (tgt?.kind === 'contradict' && !askedIds.includes(stId) && !pressedIds.includes(stId)) {
      const st = statements.find((s) => s.id === stId);
      setLine({ kind: 'note', text: `(이 단서를 들이대기 전에, 본인 입으로 하는 말을 먼저 들어야 한다.\n「${st?.q || '그 질문'}」을 물어본 다음 「📁 반박」으로 꺼내자.)` });
      return;
    }
    onAskedClue?.(code);                            // 질문지에서 ✔ 처리 · 방 알림(❗) 집계에 반영
    // 목록에서 골라 '물어보는' 것뿐이므로 반응이 없어도 신뢰도를 깎지 않는다(silent).
    //   신뢰도 차감은 대답에 대놓고 '들이대는' 「이 말에 증거」의 몫.
    const r = onPresent(stId, code, true) || {};
    if (r.result === 'contradict') {
      // 컷인은 판정 선언이 아니라 '순간의 충격'이다 — 대사는 인물이 직접 하고, 여기선 임팩트만
      setCutin('!!!');
      setTimeout(() => setCutin((c) => (c === '!!!' ? null : c)), 1300);
      setLine({ text: (r.text || '') + (r.confess ? '\n⚖️ …(관여를 인정합니다.)' : '') + (r.unlock ? '\n❗ 새로운 질문이 열렸다.' : '') + grantNote(r), kind: 'break' });
    } else if (r.result === 'soft') {
      setLine({ text: (r.text || '') + grantNote(r), kind: 'soft' });
    } else {
      // 'offtopic'(다른 진술에서는 쓰이는 단서)이면 그쪽 안내문을 그대로 쓴다 — 둘 다 인물이 아닌 독백이다
      setLine({ kind: 'note', text: (r.result === 'offtopic' && r.text) || '그 단서로는 지금 이 사람에게 딱히 물을 게 없어 보인다. 다른 질문을 먼저 풀거나 단서를 더 모으자.' });
    }
  };

  const qLabel = (s) => s.q || (s.text.length > 18 ? s.text.slice(0, 18) + '…' : s.text);

  const dlgLoc = line
    ? (line.kind === 'break' ? '❗ 모순을 짚었다' : line.kind === 'wrong' ? '심기가 불편하다'
      : NOTE_KINDS.has(line.kind) ? '수사 노트' : line.kind === 'intro' ? (phase >= 2 ? '2차 심문' : '심문 시작')
      : (line.kind === 'press' || line.kind === 'topicPress') ? '더 캐묻는다'
      : `${suspect.name}의 대답`)   // soft = 증거에 대한 반응, topic = 화제를 꺼낸 대답
    : cur ? (bk ? '✅ 밝혀낸 이야기' : `${suspect.name}의 대답`)
    : openTopic ? '📁 이야기 중' : '질문 선택';
  const speakerName = line ? (NOTE_KINDS.has(line.kind) ? null : suspect.name) : (cur ? suspect.name : null);
  // 표정 — 대사의 성격을 그림으로도 받는다(파일 없는 인물은 StandingFigure가 기본 얼굴로 폴백).
  //   모순을 짚혔으면 당황, 엉뚱한 단서를 들이대면 억울해서 화를 낸다.
  const mood = line?.kind === 'break' ? 'shock' : line?.kind === 'wrong' ? 'angry' : null;
  // 답변 화면에서 캐물 게 남았으면 탭이 「더 캐묻는다」다. 남지 않았으면 탭을 아예 죽인다 —
  //   한때 여기서 질문지로 나가게 했더니, 화면 아무 데나 연타하는 VN 습관 그대로 답변을 읽자마자
  //   질문지로 빠져 「📁 반박」을 통째로 지나쳤다(⏭ 도 '넘기기'가 아니라 '나가기'로 동작했다).
  //   나가는 길은 액션행의 「↩ 다른 질문」 하나로 못 박고, 힌트가 그걸 가리킨다.
  const dlgAdvance = line ? advance : (cur && canPress) ? doPress : undefined;
  const dlgHint = line ? '탭하여 계속 ▶'
    : cur ? (canPress ? '탭하여 더 캐묻는다 ▶' : '거짓이다 싶으면 「📁 반박」 · 「↩ 다른 질문」으로 나간다')
    : openTopic ? (topicHasMore ? '위에서 고르거나 「↩ 다른 이야기」' : '「↩ 다른 이야기」로 돌아가세요')
    : (hasAsks ? '위 목록에서 질문이나 이야깃거리를 고르세요' : '');

  return (
    <div className={`aa-fs${shake ? ' aa-shake' : ''}`}
      onClick={(e) => { if (!isUiTap(e)) dlgRef.current?.tap(); }}>
      <div className="aa-stage">
        {location ? <SceneBg location={location} fit="cover" />
          : <div className="aa-court" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 50% 0%, #1a2233 0%, #0a0e16 60%, #05070b 100%)' }} />}
      </div>
      <div className="aa-loc-chip">⚖️ {location?.label ? `${location.label} · ` : ''}{suspect.name} {phase >= 2 ? '2차 심문' : '심문'}</div>
      {isTutorial && <div className="aa-tut-chip">📖 튜토리얼 — 처음이니 차근차근</div>}
      {/* 수첩은 여기가 아니라 대사창 액션행에 있다 — 위쪽 우측은 폰 세로에서 엄지가 닿지 않는다 */}
      <TopHud>
        <div className="aa-hp" title="신뢰도">
          <span style={{ color: '#e8706e' }}>{'♥'.repeat(trust)}</span><span style={{ opacity: .28 }}>{'♡'.repeat(TRUST_MAX - trust)}</span>
        </div>
      </TopHud>

      {/* 상반신 프레이밍 — 인물을 크게 그리고 하반신은 대사창 뒤로 잠기게(역전재판식) */}
      <div className={`aa-room-fig bust${speaking && speakerName ? ' talking' : ''}`}>
        {confessed && <div className="aa-court-tag">⚖️ 관여 자백</div>}
        <StandingFigure sid={sid} person={suspect.name} image={suspect.image} height={620} fallbackSize={160} mood={mood} />
      </div>

      {cutin && <div className="aa-cutin"><span>{cutin}</span></div>}

      {/* 질문지 — 최상위(기본 질문 + 이야깃거리) 또는 화제 안. 한 화면에 한 겹만 보인다 */}
      {menuOpen && !openTopic && (
        <div className="aa-ask">
          <div className="aa-ask-h">🎙 무엇을 물어볼까{isTutorial ? ' · 📖 튜토리얼' : ''}</div>
          {rootSts.length > 0 && <div className="aa-ask-sec">💬 질문</div>}
          {rootSts.map((s) => <Ask key={s.id} s={s} k={sKey(s)} label={qLabel(s)} onPick={pickStatement} />)}
          {/* 이야깃거리 — 관련 단서를 챙기면 열린다. 파생 질문은 안에 들어가야 보인다 */}
          {topics.length > 0 && <div className="aa-ask-sec">📁 단서로 여는 이야기</div>}
          {topics.map((t) => {
            const left = stsOf(t).filter((s) => !askedIds.includes(s.id) && !pressedIds.includes(s.id)).length
              + cluesOf(t).filter((c) => !cKey(c).asked && !cKey(c).done).length;
            return (
              <button key={t.id} className={left > 0 ? 'new' : 'asked'} onClick={() => askTopic(t)}>
                {left > 0 ? '❗ ' : '✔ '}{t.q}{left > 0 ? ` (${left})` : ''}
              </button>
            );
          })}
          {rootSts.length === 0 && topics.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: '.85rem', padding: '4px 2px' }}>
              지금은 물어볼 것이 없습니다. 방·현장을 더 조사해 단서를 모으면 질문이 생깁니다.
            </p>
          )}
        </div>
      )}

      {/* 화제 안 — 이 이야기에서 파생된 질문과 단서만 */}
      {menuOpen && openTopic && (
        <div className="aa-ask">
          <div className="aa-ask-h">📁 {openTopic.q}</div>
          {stsOf(openTopic).sort(byQ).map((s) => <Ask key={s.id} s={s} k={sKey(s)} label={qLabel(s)} onPick={pickStatement} />)}
          {cluesOf(openTopic).sort((a, b) => cRank(a) - cRank(b))
            .map((c) => <ClueAsk key={c.code} c={c} k={cKey(c)} onPick={askAboutClue} />)}
          {/* 화제를 꺼낸 대답에서 한 겹 더 — 수사에 진전을 주지 않는 여담이라 ❗를 달지 않고
              맨 아래(급하지 않은 것) 자리에 둔다. 남은 개수(leftInTopic)에도 넣지 않는다 */}
          {openTopic.press && (
            <button className={topicPressed.includes(openTopic.id) ? 'asked' : ''}
              onClick={() => {
                setTopicPressed((p) => (p.includes(openTopic.id) ? p : [...p, openTopic.id]));
                setLine({ text: openTopic.press, kind: 'topicPress' });
              }}>
              {topicPressed.includes(openTopic.id) ? '✔ ' : '💬 '}더 캐묻는다
            </button>
          )}
          {!topicHasMore && (
            <p style={{ color: 'var(--muted)', fontSize: '.85rem', padding: '4px 2px' }}>
              이 이야기에서 더 들을 것은 없습니다.
            </p>
          )}
          <button className="end" onClick={() => setOpenTopicId(null)}>↩ 다른 이야기를 꺼낸다</button>
        </div>
      )}

      {/* 하단 바 없음 — 이 화면에서 할 것은 전부 대사창 우측 하단에 */}
      <DialogueBox ref={dlgRef} location={dlgLoc} speaker={speakerName} text={dlgText}
        onAdvance={dlgAdvance} hint={dlgHint} onTyping={setSpeaking}
        actions={[
          cur && (bk
            ? { label: '✅ 모순 확인됨', onClick: () => setLine({ text: `${bk.text}\n(이미 짚은 모순이다.)`, kind: 'break' }) }
            // 「✕ 취소」 — '반박'을 붙이면 이 상태에서만 폭이 22px 늘어 줄바꿈된다.
            //   피커가 화면을 덮고 있어 무엇을 취소하는지는 이미 보인다.
            : { label: picker ? '✕ 취소' : '📁 반박', tone: 'key', onClick: () => { setLine(null); setPeek(null); setPicker((p) => !p); } }),
          cur && { label: openTopic ? '↩ 이 이야기로' : '↩ 다른 질문', onClick: toMenu },
          !cur && openTopic && { label: '↩ 다른 이야기', onClick: () => { setLine(null); setOpenTopicId(null); } },
          // 분량 대부분이 이 화면인데 20ms/자를 끊을 방법이 화면 탭뿐이었다 — 엄지 자리에도 둔다.
          //   (넘길 곳이 있을 때만 = 버튼이 타이핑 도중에 생겼다 사라지며 줄이 흔들리지 않게)
          dlgAdvance && { label: '⏭', onClick: () => dlgRef.current?.tap() },
          { label: '📓', onClick: () => { setPicker(false); onOpenRecord?.(); } },
          // 아이콘만 — 답변 화면에선 버튼이 5개라, 글자를 달면 375px 에서 두 줄로 넘어가
          //   대사창이 42px 두꺼워진다. 심문마다 한 번 쓰는 버튼이라 ⏭·📓 처럼 아이콘으로 둔다.
          { label: '🚪', onClick: onExit },
        ]} />

      {/* 첫 심문 코치마크 — 심문 화면에도 '지금 할 것'이 계속 붙어 있게 한다.
          대사 읽는 중 → 대사창 / 질문 고를 때 → 질문지 / 대답 화면 → 한 번 더 탭 or 돌아가기 */}
      {!tutorialSeen && !picker && (
        <TutorialCoach onSkip={onSkipTutorial}
          {...(line
            ? { targetSel: '.aa-dialogue', text: '대사창을 탭해 이야기를 넘기세요' }
            : cur
              ? (canPress
                ? { targetSel: '.aa-dialogue', text: '한 번 더 탭하면 더 깊은 이야기를 들을 수 있어요' }
                : { targetSel: '.aa-dlg-actions', text: '「↩ 다른 질문」으로 질문지로 돌아가세요' })
              : { targetSel: '.aa-ask', text: '질문지에서 하나를 골라 물어보세요' })} />
      )}

      {picker && cur && !bk && (
        <div className="aa-present">
          <div className="aa-present-h">
            <span>📁 반박할 증거를 고르세요 — “{cur.text.length > 22 ? cur.text.slice(0, 22) + '…' : cur.text}” <span style={{ color: 'var(--muted)' }}>(길게 누르면 본문)</span></span>
            <button className="aa-close" onClick={() => setPicker(false)}>✕</button>
          </div>
          {presentable.length === 0
            ? <p style={{ color: 'var(--muted)', fontSize: '.85rem', padding: '4px 2px' }}>이 인물과 관련된 단서가 아직 없습니다. 현장·대화로 단서를 더 모으세요.</p>
            : <>
                {/* 인물 칩 — 세로줄로 쌓으면 시트가 잡아먹히니 가로로 한 줄만 밀어 본다 */}
                {presentPersons.length > 1 && (
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
                    <button style={chipStyle(!pPerson)} onClick={() => setPPerson(null)}>전체 {presentable.length}</button>
                    {presentPersons.map((p) => (
                      <button key={p} style={chipStyle(pPerson === p)} onClick={() => setPPerson(p)}>{p}</button>
                    ))}
                  </div>
                )}
                <div className="s-grid">
                  {presentList.map((c) => {
                    const k = cKey(c);
                    return (
                      <button key={c.code} className="s-card" style={(k.done || k.asked) ? { opacity: .62 } : undefined}
                        onPointerDown={() => peekStart(c)} onPointerUp={peekStop}
                        onPointerCancel={peekStop} onPointerLeave={peekStop}
                        onContextMenu={(e) => e.preventDefault()}
                        onClick={() => {
                          // 길게 눌러 본문을 들춘 뒤 손을 떼면 click 이 따라온다 — 그걸로 증거가 나가면 안 된다
                          if (peekRef.current.fired) { peekRef.current.fired = false; return; }
                          doPresent(c.code);
                        }}>
                        <div className="ck">{clueIcon(c)}</div>
                        <div className="cn" style={{ fontSize: '.82rem' }}>{k.done ? '✅ ' : k.asked ? '✔ ' : '❗ '}{c.title}</div>
                        <div className="cm">{c.person}</div>
                      </button>
                    );
                  })}
                </div>
              </>}
        </div>
      )}

      {/* 들춰 본 본문 — 시트와 같은 판(.aa-present)을 덮어써서 자리·생김새를 맞춘다.
          전파를 끊어야 뒤의 전체화면 탭 위임이 대사를 넘기지 않는다 */}
      {/* 화면 전체를 덮는 판 — 미리보기는 하단 시트라서, 이게 없으면 그 위 증거 카드가 그대로
          눌려 「반박」이 나가 버리고(신뢰도 −1) 바깥을 누르면 캐묻기가 소모된다 */}
      {picker && peek && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 12 }}
          onClick={(e) => { e.stopPropagation(); peekClose(); }} />
      )}
      {picker && peek && (
        <div className="aa-present" style={{ zIndex: 13 }} onClick={(e) => { e.stopPropagation(); peekClose(); }}>
          <div className="aa-present-h">
            <span>{clueIcon(peek)} {peek.title}{peek.person ? ` · ${peek.person}` : ''}</span>
            <button className="aa-close" onClick={(e) => { e.stopPropagation(); setPeek(null); }}>✕</button>
          </div>
          <p style={{ color: '#cfcabb', fontSize: '.88rem', lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0 }}>
            {peek.detail || peek.desc || peek.description || '(내용은 📓 사건 기록에서 열어 봐야 한다.)'}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '.78rem', margin: '12px 0 0' }}>
            탭하면 닫힙니다 · 들이대려면 카드를 짧게 누르세요
          </p>
        </div>
      )}
    </div>
  );
}
