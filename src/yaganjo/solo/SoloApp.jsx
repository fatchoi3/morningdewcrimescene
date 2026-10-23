// ─────────────────────────────────────────────────────────────────────────────
// SoloApp — 솔로 추리게임의 루트. 세이브 상태·수사 단계·라우팅(허브/장면/심문)과
//   단서 확보/감식 배달 같은 오케스트레이션만 담당한다.
//   화면과 기능은 features/·ui/ 로 분리, 순수 규칙/상수는 lib/game.js, 콘텐츠는 content.js.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { loadSave, saveSave, defaultState, clearSave } from './soloStore.js';
import { cast, t } from '../../scenarios/yaganjo/cast.js';
import {
  locations, suspects, getClue, provider, soloContent,
  gamsikCodes, gamsikReady, startingClues, suspectIds,
} from './content.js';
import {
  STAGE_LABEL, STAGE_BANNER, SCENE_NEEDED, TRUST_MAX,
  computeStage, interrogatedCount, sceneClueCount, scoreCase, CONFRONT,
} from './lib/game.js';
import { pressOf, presentOn } from './interrogation.js';
import { HallNav } from './features/hub.jsx';
import { LoadingBar } from './art.jsx';
import { SceneView } from './features/scene.jsx';
import { CrossExamView, clueUsedAnywhere } from './features/interrogation.jsx';
import { ClueModal } from './features/clues.jsx';
import { CaseRecord } from './features/record.jsx';
import { CaseFileView } from './features/casefile.jsx';
import { StartScreen, BriefingVN, EventVN, EventVN2, EndingScreen } from './features/intro.jsx';
import { ConfrontView } from './features/confront.jsx';
import { TutorialCoach, TutorialFinale } from './features/tutorial.jsx';
import { AdminPanel } from './features/admin.jsx';
import { SheetOverlay } from './ui/overlays.jsx';
import { useDialog } from './ui/dialog.jsx';

export default function SoloApp() {
  const dlg = useDialog(); // 알림·확인·팝업 — window.alert/confirm 대신
  const [state, setState] = useState(() => loadSave() || defaultState());
  const [sceneId, setSceneId] = useState(null);
  const [suspectId, setSuspectId] = useState(null);
  const [modalCode, setModalCode] = useState(null);
  const [hubView, setHubView] = useState('main'); // 허브 뷰(main/floor1/pastor/lab) — 장면 진입 후 복귀 위치 보존
  const [toast, setToast] = useState(null);

  useEffect(() => { saveSave(state); }, [state]);

  const update = (patch) => setState((p) => ({ ...p, ...patch }));
  // 단서를 더할 땐 직전 목록 위에 합친다 — 오래된 화면이 부른 collect 가 그 사이 얻은 단서를 지우지 않게.
  //   (새벽이슬에서 여러 쪽 문서의 숨은 쪽을 보면 문서가 「안 조사」로 돌아간 일 — 같은 꼴을 미리 막는다)
  const addCollected = (set, patch = {}) => setState((p) => ({ ...p, ...patch, collected: [...new Set([...p.collected, ...set])] }));
  const collectedSet = useMemo(() => new Set(state.collected), [state.collected]);

  const showToast = (t, ms = 2400) => { setToast(t); setTimeout(() => setToast((cur) => (cur === t ? null : cur)), ms); };

  // 현재 수사 단계 — 진행도로만 열린다(1차 탐문 → 부검 소견 → 2차 심문).
  //   난이도로 전 구역을 미리 열던 옵션은 없앴다: 1장인데 폰·CCTV가 열려 2막 구조가 무너졌다.
  const progressStage = computeStage(state); // 진행도 기반(이벤트·감식 배달 판정용)
  const stage = state.admin ? 3 : progressStage; // 운영자(테스트) 모드만 전 구역 개방
  const [adminOpen, setAdminOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);   // 수첩(사건 기록) 오버레이
  const [casefileOpen, setCasefileOpen] = useState(false); // 범인 지목 오버레이
  // 창이 닫히거나 장면이 끝나는 그 탭이 뒤의 지도까지 눌러 엉뚱한 방에 들어갔다(10회차 둘 — 컷신 끝·수첩 접기 뒤).
  //   화면이 바뀐 직후 잠깐은 지도 입장을 받지 않는다(hub.jsx enter 가 본다).
  // 그리기 전에 찍는다 — useEffect 로는 닫는 탭 뒤따라오는 click 보다 늦어 새는 탭을 못 막았다(11회차 셋 다)
  useLayoutEffect(() => { window.__soloUiChangedAt = Date.now(); },
    [recordOpen, modalCode, casefileOpen, adminOpen, sceneId, suspectId, state.eventSeen, state.event2Seen, state.tutFinaleSeen]);
  const ALL_CODES = useMemo(() => provider.getAllClues().map((c) => c.code), []);
  // 3막 진행도·제출 준비도의 분모 — 콘텐츠에서 세어 온다(숫자를 손으로 적으면 데이터가 늘 때 어긋난다)
  const PHONE_CODES = useMemo(() => provider.getAllClues().filter((c) => c.phone).map((c) => c.code), []);
  const SPECIAL_CODES = useMemo(() => provider.getAllClues().filter((c) => c.type === '특수').map((c) => c.code), []);
  // 새 단계 개방 시 1회 배너 알림
  //   심문 도중엔 띄우지 않는다 — 대답 한가운데 긴 안내가 끼어들어 무엇을 해야 하는지 놓쳤다(2026-10-01). 나오면 띄우고 오래 둔다.
  useEffect(() => {
    if (!suspectId && stage > (state.stageSeen || 1)) { showToast(STAGE_BANNER[stage], 9000); update({ stageSeen: stage }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, suspectId]);

  // 감식 결과 도착 — 질식을 말하지 않는 셋(텀블러·약봉투·보온병)은 **맡기는 즉시**, 나머지는 2차 심문 때.
  //   보드판은 이벤트 ② 부터 감식 결과를 읽는다. 솔로가 전부 2차 부검과 같은 순간에 주면
  //   정본 §6-2 가 노린 「차민우가 먼저 자백하고 판이 『약 + 지게차 사고』로 끌려가는」 함정이
  //   한 번도 서지 않는다(2회차 시뮬레이션 O3). 흉기·랩·시신을 가리키는 감식은 그대로 2차 심문 때다.
  useEffect(() => {
    if (stage < 2) return;
    const pending = (state.labReq || []).filter((c) => !collectedSet.has(c) && gamsikReady(c, state.collected)
      && (stage >= 3 || soloContent.earlyLab.has(c)));
    if (!pending.length) return;
    const set = new Set(state.collected);
    pending.forEach((c) => set.add(c));
    soloContent.computeAutoUnlocked(set); // 특수 연쇄
    for (const g of gamsikCodes) if (!pending.includes(g) && !collectedSet.has(g)) set.delete(g); // 미의뢰 감식은 제외
    // 새로 온 결과는 수첩에 🆕 로 남긴다(labNew) — 알림만 뜨고 사라져, 결과를 안 읽은 채 지목까지 갔다(2026-10-08 7회차)
    addCollected(set, { labNew: [...new Set([...(state.labNew || []), ...pending])] });
    showToast(`🔬 감식 결과 ${pending.length}건 도착 — 수첩 📓 의 🆕 카드`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, state.labReq]);

  // 2차 부검 보충(텀블러) — 텀블러 감식을 받은 판에만, 2차 부검이 나온 뒤에 붙는다(5회차 #1).
  //   단계 3 에 텀블러 감식이 뒤늦게 들어와도 그때 붙는다.
  useEffect(() => {
    if (!state.event2Seen || !collectedSet.has('IJEO-08') || collectedSet.has(soloContent.autopsyTumblerCode)) return;
    collect(soloContent.autopsyTumblerCode);
    showToast('🩺 2차 부검 보충 — 텀블러 성분에 대한 소견이 사건 기록에 들어왔습니다');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.event2Seen, state.collected.length]);

  // 기록 대조 7장 — 보드판처럼 **2차 심문 + 심야조 명부(U4)** 가 갖춰지면 도착한다.
  //   명부에 그 밤 스물다섯의 사번이 있어야 본사 서버 조회가 된다(진행물 이벤트 ②).
  //   Q2 의 둘째 구간(6/3~7/28)은 여기서 주지 않는다 — 찢긴 두 달(AOBI-88)을 서장현에게 들이밀 때
  //   심문에서 들어온다(interrogation S1 p2two.soft). 저절로 오면 일곱 장 가운데 그의 것만 짚였다(3회차 #5).
  //   stage 가 아니라 **실제 진행도**로 판정한다 — 운영자 모드가 단계를 올려도 배달은 앞당기지 않는다.
  useEffect(() => {
    if (progressStage < 3 && !state.admin) return;
    const want = [];
    if (collectedSet.has(soloContent.recordGate)) {
      for (const c of soloContent.recordCodes) if (!collectedSet.has(c)) want.push(c);
    }
    if (!want.length) return;
    const set = new Set(state.collected);
    want.forEach((c) => set.add(c));
    soloContent.computeAutoUnlocked(set);
    for (const g of gamsikCodes) if (!collectedSet.has(g) && !(state.labReq || []).includes(g)) set.delete(g);
    // 알림은 카드 이름 그대로, 카드엔 🆕 — 「본사 서버 기록 대조」로 찾으면 0건이었다(카드는 「기록 대조 — ○○」, 14회차 셋 다)
    addCollected(set, { labNew: [...new Set([...(state.labNew || []), ...want])] });
    showToast(`🗂 「기록 대조 — ○○」 ${want.length}장 도착 — 수첩 📓 의 🆕 카드`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressStage, state.collected.length]);

  function collect(code) {
    if (collectedSet.has(code)) return { added: [] };
    const set = new Set(state.collected);
    set.add(code);
    const autos = soloContent.computeAutoUnlocked(set) || []; // set을 변형하며 특수/감식 연쇄 해금
    // 감식은 자동 수령하지 않는다 — 감식실에서 의뢰하면 2차 심문 때 결과 도착.
    const stripped = autos.filter((a) => gamsikCodes.has(a.code) && a.code !== code && !collectedSet.has(a.code));
    stripped.forEach((a) => set.delete(a.code));
    const kept = autos.filter((a) => !stripped.includes(a));
    addCollected(set);
    const c = getClue(code);
    const newSpecials = kept.filter((a) => a.code !== code && getClue(a.code)?.type === '특수');
    const extra = newSpecials.length
      ? ` · ⭐ 추리 단서 해금: ${newSpecials.map((a) => getClue(a.code)?.title || a.code).join(' · ')}`
      : '';
    // 이 단서(채취물)로 새로 '감식 의뢰 가능'해진 게 있으면 안내(감식 의뢰실로 유도)
    const gamsikNow = [...gamsikCodes].filter((g) => !collectedSet.has(g) && !gamsikReady(g, state.collected) && gamsikReady(g, [...set]));
    // 감식 의뢰실은 2단계에 열린다 — 1차에 이 안내를 띄우면 갈 수 없는 곳으로 보낸다
    const gextra = gamsikNow.length && stage >= 2 ? ' · 🔬 감식 의뢰 가능(감식 의뢰실에서 맡기세요)' : '';
    showToast(`단서 확보: ${c?.title || code}${extra}${gextra}`);
    // 첫 추리 단서 안내 — 막는 팝업이 아니라 길게 머무는 알림 한 줄로. 팝업은 단서 창 위에 뜨거나(창을 닫은 뒤로
    //   미뤄도) 다음 조사·수첩 넘김을 막았다(6·8·9회차 다섯 사람).
    if (newSpecials.length && !state.specialTutSeen) {
      const first = getClue(newSpecials[0].code);
      update({ specialTutSeen: true });
      showToast(`⭐ 추리 단서 「${first?.title || ''}」 — 관련 단서를 모으면 저절로 사건 기록에 등록됩니다. 📓 수첩과 질문지의 「📁 단서」에서 쓰세요`, 6500);
    }
    return { added: [code, ...kept.map((a) => a.code)] };
  }

  const goHub = () => { setSceneId(null); setSuspectId(null); update({ screen: 'hub' }); };

  // ── 시작 ────────────────────────────────────────────────────────────────
  if (state.screen === 'start') {
    return (
      <StartScreen started={state.started} continueCount={state.collected.length}
        onStart={() => { clearSave(); setState({ ...defaultState(), started: true, screen: 'briefing', collected: [...startingClues] }); }}
        onContinue={() => goHub()}
        onReset={() => { clearSave(); setState(defaultState()); }} />
    );
  }

  // ── 브리핑 (역전재판식 VN 시퀀스) ─────────────────────────────────────────
  if (state.screen === 'briefing') {
    return <BriefingVN onDone={() => goHub()} />;
  }

  // ── 엔딩 ────────────────────────────────────────────────────────────────
  if (state.screen === 'ending' && state.result) {
    return <EndingScreen result={state.result} onNewCase={() => { clearSave(); setState(defaultState()); }} />;
  }

  // ── 대질 — 범인을 맞혔으면 결말 전에 결정적 증거 한 장을 내민다(features/confront.jsx) ──
  //   내민 횟수(evTries)는 저장에 남긴다 — 새로고침으로 기회를 되살리지 못하게.
  if (state.screen === 'confront') {
    return (
      <ConfrontView clues={state.collected.map((c) => getClue(c)).filter((x) => x && x.type !== '방')}
        broke={state.broke?.[CONFRONT.culprit] || []}
        tries={state.casefile?.evTries || 0} lastCode={state.casefile?.evidence}
        onPresent={(code, n) => update({ casefile: { ...state.casefile, evidence: code, evTries: n } })}
        onHold={(code, ok) => update({ casefile: { ...state.casefile, evidence2: ok ? code : null, evHold: !!ok } })}
        onDone={(code) => {
          const cf = { ...state.casefile, evidence: code || state.casefile?.evidence || null };
          update({ casefile: cf, result: scoreCase(cf), screen: 'ending' });
        }} />
    );
  }

  // ── 중간 사건 — 1차 심문(6인)을 마치면 부검 소견이 도착한다 ────────────────
  if (!state.eventSeen && !state.admin && progressStage >= 2 && !suspectId) {
    // 컷신이 끝나면 지도로 — 마지막 심문을 한 방으로 돌아와 「2장」이 어디서 시작하는지 헷갈렸다(14회차)
    return <EventVN onDone={() => { setSceneId(null); setSuspectId(null); update({ eventSeen: true }); }} />;
  }

  // ── 2차 사건 — 모든 조사·1차 심문이 끝나(2차 개방) 정밀 부검 결과(LONS-62)가 도착 ──
  //   방 안에서도 띄운다 — 지도에서만 띄우자, 방으로 나와 인물을 다시 누르면 2차 부검 없이 2차 심문이 열렸다(14회차)
  if (state.eventSeen && !state.event2Seen && !state.admin && progressStage >= 3 && !suspectId) {
    return <EventVN2 hasTumbler={collectedSet.has('IJEO-08')} onDone={() => { collect(soloContent.autopsyCode); setSceneId(null); update({ event2Seen: true }); }} />;
  }

  // ── 메인(허브/장면/용의자) ────────────────────────────────────────────────
  // 튜토리얼 코치마크(첫 수사) — 수첩(사건 기록) → 종현방 문 → 소품 → 대화 순서로 유도
  // 튜토리얼 코치마크 — '지금 할 것' 하나만 밝히고 나머지는 막는다.
  //   중간에 가리킬 것이 없으면 플레이어가 딴 길로 새므로, 어느 화면에 있든 단계가 이어지게 둔다
  //   (수첩·단서 모달처럼 위에 덮이는 화면도 각자 안내를 갖는다).
  let coach = null;
  if (!state.tutorialSeen && !casefileOpen && !adminOpen) {
    // 첫 방은 진범의 칸(ROOM-A) — 새벽이슬판의 ROOM-JH 를 그대로 두면 안에 들어가도 「나가기」만 가리켰다
    const jhObjs = locations.rooms.find((l) => l.id === 'ROOM-A')?.objects || [];
    // 첫 심문에서 성공 반박을 해 보려면 그 단서가 손에 있어야 한다 — 그 물건부터 짚게 한다
    // (진범 서장현의 모순 중 첫 방 단서로 깨지는 것은 보고서 자백뿐이라 튜토리얼이 그리로 몰면 1분 만에 동기가 드러난다 —
    //   그래서 반응만 끌어내는 순찰 일지를 연습용으로 쓴다)
    const TUT_CODE = 'NUMF-40';
    const jhExamined = jhObjs.includes(TUT_CODE) ? collectedSet.has(TUT_CODE) : jhObjs.some((c) => collectedSet.has(c));
    // 단서 창이 먼저 — 수첩에서 단서 카드를 열면 말풍선이 여전히 「← 로」라 창 뒤의 ← 를 가리켰다(튜토리얼 1차)
    if (modalCode) coach = { sel: '.s-modal .mx', dim: false, text: recordOpen ? '다 봤으면 ✕ 로 닫고, 수첩은 ← 로 나가세요' : '단서를 확보했습니다. 아래로 끝까지 밀어 읽은 뒤 ✕ 로 닫으세요' };
    else if (recordOpen) coach = { sel: '.s-sheet-back', dim: false, text: '맨 위 「📋 사건 개요」를 읽었으면 ← 로 나가세요' };
    else if (suspectId) coach = null;      // 심문 안에서는 그 화면이 직접 안내한다(아래 CrossExamView)
    else if (!state.tutRecordDone) coach = { sel: '[data-tut="record-btn"]', text: '먼저 여기, 수첩을 눌러 사건 개요를 확인하세요' };
    else if (!sceneId) coach = { sel: '[data-tut="door"]', text: t('이제 지도에서 {{S1|을/를}} 눌러 찾아가세요') };
    else if (sceneId !== 'ROOM-A') coach = { sel: '.aa-dlg-act', text: t('먼저 {{S1}}부터 봅시다 — 나가기를 눌러 지도로') };
    else if (!jhExamined) coach = { sel: jhObjs.includes(TUT_CODE) ? `.aa-track .s-zone-wrap[data-code="${TUT_CODE}"] .s-zone` : ".aa-track .s-zone", text: '테두리가 빛나는 이 물건을 눌러 조사하세요' };
    // 배경에 인물이 그려진 방은 .s-talkzone, 떠 있는 스탠딩은 .s-figure — 둘 다 잡아야 한다
    //   (예전엔 .s-figure 만 봐서 종현방에선 코치마크가 통째로 사라졌다)
    else coach = { sel: '.s-talkzone, .s-figure', text: t('{{S1|을/를}} 눌러 이야기를 시작하세요') };
  }
  // 라벨·목표·단계표시는 '실제 진행도(progressStage)' 기준 — 가이드 모드가 단계를 3으로 올려도 1차엔 1차로 보이게
  const p2Count = (state.p2Met || []).filter((id) => suspectIds.includes(id)).length;
  const gamsikGot = [...gamsikCodes].filter((c) => collectedSet.has(c)).length;
  const phoneGot = PHONE_CODES.filter((c) => collectedSet.has(c)).length;
  const specialGot = SPECIAL_CODES.filter((c) => collectedSet.has(c)).length;
  // 3막은 재는 축이 다르다 — 현장 단서는 이미 채워진 뒤라 그대로 두면 분자가 분모를 넘고(C통로 10개/3),
  //   정작 남은 일(2차 심문·감식·폰)은 어디에도 안 보였다. 2막 표기도 목표치까지만 센다.
  const progressText = progressStage >= 3
    // ⭐ 도 센다 — 알림 한 줄로는 ⭐ 가 대질의 핵심이라는 걸 몰랐다(10회차)
    ? `2차 심문 ${p2Count}/${suspectIds.length} · ⭐ ${specialGot}/${SPECIAL_CODES.length} · 감식 ${gamsikGot}/${gamsikCodes.size} · 폰 ${phoneGot}/${PHONE_CODES.length}`
    : `용의자 심문 ${interrogatedCount(state)}/${suspectIds.length}`
      + (progressStage >= 2 ? ` · 현장 단서 ${Math.min(sceneClueCount(state), SCENE_NEEDED)}/${SCENE_NEEDED} · 감식 의뢰 ${Math.min((state.labReq || []).length, 1)}/1 · 그 뒤 심문 ${state.talkAfterLab ? 1 : 0}/1` : '');
  // 다음에 뭘 하면 단계가 열리는지 상시 안내(진행 막힘 방지)
  // 3장 — 아직 안 연 휴대폰·태블릿이 어느 방에 있는지 짚어 준다. 6회차 두 사람이 「폰 1/8」이라는 숫자만 보고
  //   조장 태블릿(2층 사무실)을 끝내 못 찾았다. 물건 이름은 말하지 않고 자리만 말한다.
  //   사람 사물함의 휴대폰은 찾기 쉬우니 「사물함 N곳」으로 묶고, 그 밖의 자리(태블릿이 있는 2층 사무실 등)만 이름을 댄다.
  const phoneLeftLocs = progressStage >= 3
    ? locations.all.filter((l) => (l.objects || []).some((c) => PHONE_CODES.includes(c) && !collectedSet.has(c)))
    : [];
  const isLocker = (l) => !l.showBody && suspects.some((x) => x.name === l.person);
  const lockerLeft = phoneLeftLocs.filter(isLocker).length;
  const shortLoc = (l) => (l.showBody ? 'C통로 현장' : l.id === 'ROOM-U' ? '2층 사무실' : l.label.split(' — ')[0]);
  const phoneLeftAt = [
    ...(lockerLeft ? [`사람 사물함 ${lockerLeft}곳`] : []),
    ...phoneLeftLocs.filter((l) => !isLocker(l)).map(shortLoc),
  ];
  const objective = progressStage < 2 ? `용의자 ${suspectIds.length}명을 모두 심문하면 사건이 전환됩니다`
    : progressStage < 3 ? `C통로 현장 단서 ${SCENE_NEEDED}개를 찾고 감식을 한 건 이상 맡긴 뒤(여러 건 맡겨도 된다), 한 사람을 더 심문하고 나오면 곧바로 2차 심문이 열립니다 — 둘러볼 곳은 그 전에`
    : '물증으로 2차 심문을 마친 뒤 범인을 지목하세요'
      + (phoneLeftAt.length ? ` — 아직 열지 않은 휴대폰·태블릿: ${phoneLeftAt.join(' · ')}` : '');
  const recordClues = state.collected.map((c) => getClue(c)).filter((x) => x && x.type !== '방');

  return (
    <>
      {suspectId ? (
          <CrossExamView key={suspectId} suspect={suspects.find((s) => s.id === suspectId)} state={state}
            phase={progressStage >= 3 ? 2 : 1}
            tutorialSeen={!!state.tutorialSeen} tutFinaleSeen={!!state.tutFinaleSeen} onTutorialSeen={() => update({ tutorialSeen: true })}
            onSkipTutorial={() => update({ tutorialSeen: true, tutFinaleSeen: true })}
            tutorialTarget={{ stId: 'night', code: 'NUMF-40' }}
            // 들은 말을 수첩 「대화 기록」에 남긴다 — 캐묻기로 나온 말은 넘기면 다시 볼 길이 없었다
            onLog={(e) => {
              const tl = { ...(state.talkLog || {}) };
              const cur = tl[suspectId] || [];
              const row = { ...e, phase: progressStage >= 3 ? 2 : 1 };
              if (cur.some((x) => x.q === row.q && x.a === row.a)) return; // 같은 말을 두 번 적지 않는다
              tl[suspectId] = [...cur, row].slice(-200);
              update({ talkLog: tl });
            }}
            onAsked={(stId) => { const a = { ...(state.askedQ || {}) }; a[suspectId] = [...new Set([...(a[suspectId] || []), stId])]; update({ askedQ: a }); }}
            onAskedClue={(code) => { const a = { ...(state.askedC || {}) }; a[suspectId] = [...new Set([...(a[suspectId] || []), code])]; update({ askedC: a }); }}
            onAskedTopic={(tid) => { const a = { ...(state.askedT || {}) }; a[suspectId] = [...new Set([...(a[suspectId] || []), tid])]; update({ askedT: a }); }}
            location={sceneId ? locations.all.find((l) => l.id === sceneId) : null}
            collectedClues={state.collected.map((c) => getClue(c)).filter((c) => c && c.type !== '방')}
            onOpenRecord={() => setRecordOpen(true)}
            onExit={() => {
              // 감식을 맡긴 뒤 심문을 한 번 마치고 나오면 2차 심문 조건 하나가 선다(4회차 #1)
              if ((state.labReq || []).length && sceneClueCount(state) >= SCENE_NEEDED && !state.talkAfterLab) update({ talkAfterLab: true });
              // 「03:24 2층에서 일지」를 들었는데 2층 사무실을 덜 봤으면 한 번 짚는다 — 11회차 셋 중 둘이 2층 사무실
              //   (감사 진술 초안·조장 태블릿)을 거의 안 열어 동기를 소거법으로 고르고 대질 정답에 못 닿았다.
              if (suspectId === 'S1' && stage >= 2 && !state.officeHintSeen && (state.askedQ?.S1 || []).includes('t0300')) {
                const office = locations.all.find((l) => l.id === 'ROOM-U');
                if (office && office.objects.some((c) => !collectedSet.has(c))) {
                  update({ officeHintSeen: true });
                  showToast('📌 수사 노트 — 그는 03:24에 2층 사무실에 있었다고 했다. 2층 사무실을 아직 다 둘러보지 않았다.', 6500);
                }
              }
              return sceneId ? setSuspectId(null) : goHub();
            }}
            onPress={(stId) => {
              const r = pressOf(suspectId, stId, state.stUnlocked?.[suspectId] || []); // 밝힌 뒤 말투(after)
              const pr = { ...(state.pressed || {}) };
              pr[suspectId] = [...new Set([...(pr[suspectId] || []), stId])];
              const patch = { pressed: pr };
              if (r.unlock) { const u = { ...(state.stUnlocked || {}) }; u[suspectId] = [...new Set([...(u[suspectId] || []), r.unlock])]; patch.stUnlocked = u; }
              update(patch);
              if (r.grants) collect(r.grants); // 대화로 증언 단서 확보
              return r; // 자식이 대사창에 결과 표시
            }}
            // silent=true: 「단서로 묻는다」로 고른 것 — 반응이 없어도 신뢰도를 깎지 않는다
            //   (화면엔 '딱히 물을 게 없다'는 중립 문구만 뜨는데 몰래 깎이면 억울하게 쫓겨난다)
            onPresent={(stId, code, silent = false) => {
              const confessed = (state.broke?.[suspectId] || []).some((e) => e.confess);
              const r = presentOn(suspectId, stId, code, confessed, state.stUnlocked?.[suspectId] || []);
              if (r.result === 'contradict') {
                const bk = { ...(state.broke || {}) };
                const cur = bk[suspectId] || [];
                if (!cur.some((e) => e.id === stId)) bk[suspectId] = [...cur, { id: stId, text: r.text, confess: !!r.confess, code }];
                const patch = { broke: bk };
                if (r.unlock) { const u = { ...(state.stUnlocked || {}) }; u[suspectId] = [...new Set([...(u[suspectId] || []), r.unlock])]; patch.stUnlocked = u; }
                update(patch);
              } else if (r.result === 'wrong' && !silent && !clueUsedAnywhere(code)) {
                const tr = { ...(state.trust || {}) };
                const t = Math.max(0, (tr[suspectId] ?? TRUST_MAX) - 1);
                // 문구에 없던 페널티를 암시하지 않는다 — 신뢰도는 여기서 곧바로 회복되고 쿨다운도 없어서,
                //   '정비'라는 말이 있으면 하지 않아도 될 일을 찾아 헤매게 된다.
                if (t <= 0) { tr[suspectId] = TRUST_MAX; update({ trust: tr }); setSuspectId(null); showToast('⚠ 신뢰를 잃어 심문이 중단되었습니다 — 다시 시도할 수 있습니다'); }
                else { tr[suspectId] = t; update({ trust: tr }); }
              }
              if (r.grants) collect(r.grants); // 추궁 성공으로 추리(특수) 단서 확보
              return r; // 자식이 컷인/대사창에 결과 표시
            }} />
        ) : sceneId ? (
          <SceneView location={locations.all.find((l) => l.id === sceneId)} collectedSet={collectedSet} stage={stage} state={state} phase={progressStage >= 3 ? 2 : 1}
            roomSuspect={suspects.find((s) => s.name === locations.all.find((l) => l.id === sceneId)?.person)}
            onOpenRecord={() => setRecordOpen(true)}
            lab={{
              stage,
              requested: (code) => (state.labReq || []).includes(code),
              ready: (code) => gamsikReady(code, state.collected),
              request: (code) => { update({ labReq: [...new Set([...(state.labReq || []), code])] }); showToast(soloContent.earlyLab.has(code) || stage >= 3 ? '🔬 감식 의뢰 접수 — 결과가 곧 도착합니다' : '🔬 감식 의뢰 접수 — 결과는 2차 심문이 열리면 도착합니다'); },
            }}
            // 3막 진행도는 '2차 심문을 몇 명과 했는가'로 잰다 — 열리는 질문 수가 인물마다 달라
            //   물어본 질문 수로는 셀 수 없다. 여기(대화 시작)가 유일한 심문 진입점이다.
            onTalk={(id) => {
              setSuspectId(id);
              if (progressStage >= 3 && !(state.p2Met || []).includes(id)) update({ p2Met: [...(state.p2Met || []), id] });
            }}
            onOpen={(code) => setModalCode(code)} onLockedToast={showToast}
            onBack={() => goHub()} />
        ) : (
          <HallNav locations={locations} stage={stage} progressStage={progressStage} collectedSet={collectedSet} state={state}
            recommendPerson={!state.tutorialSeen && state.tutRecordDone ? cast.S1.name : null}
            admin={state.admin} stageLabel={STAGE_LABEL[progressStage]} progressText={progressText} objective={objective}
            // 3막이 열리자마자(2차 심문 0회) 빨간 버튼이 까딱거리면 오탭 한 번에 수사가 끝난다 —
            //   절반 이상 재심문하기 전까지는 있되 눈에 덜 띄게 둔다.
            canAccuse={progressStage >= 3} accuseReady={p2Count >= Math.ceil(suspectIds.length / 2)}
            // 막는 단추처럼 읽혔다(「아직 이르다」, 2026-10-07 시험) — 지금도 누를 수 있다는 걸 먼저 말한다
            accuseNote={`지금도 지목할 수 있어요 · 2차 심문 ${p2Count}/${suspectIds.length}`}
            view={hubView} onView={setHubView} onEnter={(id) => setSceneId(id)} onToast={showToast}
            onOpenRecord={() => { setRecordOpen(true); if (!state.tutorialSeen && !state.tutRecordDone) update({ tutRecordDone: true }); }}
            onOpenMenu={() => setAdminOpen(true)}
            onAccuse={() => setCasefileOpen(true)} />
        )}

      {recordOpen && (
        <SheetOverlay title={`사건 기록 · 단서 ${recordClues.length}`} onClose={() => setRecordOpen(false)}>
          <CaseRecord clues={recordClues} fresh={state.labNew}
            onOpen={(code) => { setModalCode(code); if ((state.labNew || []).includes(code)) update({ labNew: state.labNew.filter((c) => c !== code) }); }}
            notes={state.notes} onNotes={(v) => update({ notes: v })}
            talkLog={state.talkLog} briefOpen={!state.tutorialSeen} />
        </SheetOverlay>
      )}
      {casefileOpen && (
        <SheetOverlay title="🔍 범인 지목" onClose={() => setCasefileOpen(false)}>
          <CaseFileView state={state} onPick={(cf) => update({ casefile: cf })}
            onConfirmLock={(who) => dlg.confirm({ title: '범인 확정', body: (
              <>
                <p><b>{who?.name}</b> — 이 사람으로 확정하면 바꿀 수 없습니다. 확정할까요?</p>
                {/* 제출 창에서야 경고가 떠, 되돌리기 쉬운 이 단계에선 몰랐다(11회차 둘) */}
                {(phoneGot * 2 < PHONE_CODES.length || specialGot * 2 < SPECIAL_CODES.length) && (
                  <p style={{ color: 'var(--danger)', fontWeight: 700 }}>⚠ 아직 안 본 것이 많아요 — 휴대폰 {phoneGot}/{PHONE_CODES.length} · ⭐ 추리 단서 {specialGot}/{SPECIAL_CODES.length}. 지목 뒤 대질에서 그를 그 자리에 묶을 한 장이 손에 없을 수 있습니다.</p>
                )}
              </>
            ), ok: '확정한다', cancel: '더 생각한다', tone: 'danger' })}
            // 제출은 되돌릴 수 없다(엔딩의 「새 사건」은 clearSave라 기록까지 사라진다) — 확인창에서
            //   '얼마나 조사하고 지목하는지'를 숫자로 보여준 뒤 물어본다.
            onSubmit={async () => {
              const pickName = suspects.find((s) => s.id === state.casefile?.culprit)?.name || '';
              const yes = await dlg.confirm({
                title: '사건 파일 제출',
                body: (
                  <>
                    <p><b>{pickName}</b> — 이 사람을 범인으로 지목합니다.</p>
                    <p style={{ fontSize: '.88rem', lineHeight: 1.7 }}>
                      수법 · {soloContent.caseKey.choiceMethods.find((m) => m.id === state.casefile?.method)?.label}<br />
                      동기 · {soloContent.caseKey.choiceMotives.find((m) => m.id === state.casefile?.motive)?.label}
                    </p>
                    {p2Count === 0 && (
                      <p style={{ color: 'var(--danger)', fontWeight: 700 }}>⚠ 아직 2차 심문을 한 명도 하지 않았어요. 물증으로 거짓말을 무너뜨리는 장면을 하나도 보지 않은 채 지목하게 됩니다.</p>
                    )}
                    {/* 휴대폰·⭐ 를 절반도 안 본 채 지목하면 대질에서 내밀 한 장이 없다 — 「폰 0/8 · ⭐ 3/8」 숫자만으로는
                        경고로 느끼지 못했다(10회차 둘). 어느 카드가 필요한지는 말하지 않는다. */}
                    {(phoneGot * 2 < PHONE_CODES.length || specialGot * 2 < SPECIAL_CODES.length) && (
                      <p style={{ color: 'var(--danger)', fontWeight: 700 }}>⚠ 아직 안 본 것이 많아요 — 휴대폰 {phoneGot}/{PHONE_CODES.length} · ⭐ 추리 단서 {specialGot}/{SPECIAL_CODES.length}. 지목 뒤 대질에서 그를 그 자리에 묶을 한 장이 손에 없을 수 있습니다.</p>
                    )}
                    <p>제출하면 사건이 종결되고 전말이 공개됩니다. <b>수사로 돌아올 수 없습니다.</b></p>
                    <p style={{ fontSize: '.82rem', color: 'var(--muted)', lineHeight: 1.7 }}>
                      지금까지 — 2차 심문 {p2Count}/{suspectIds.length}명 · 추리 단서 ⭐ {specialGot}/{SPECIAL_CODES.length}
                      {' · '}감식 {gamsikGot}/{gamsikCodes.size} · 폰 {phoneGot}/{PHONE_CODES.length}
                    </p>
                  </>
                ),
                ok: '제출한다', cancel: '더 조사한다', tone: 'danger',
              });
              if (!yes) return;
              setCasefileOpen(false);
              const cf = state.casefile || {};
              // 범인을 맞혔으면 결말 전에 대질 — 결정적 증거를 내민다. 틀렸으면 곧장 결말
              if (cf.culprit === CONFRONT.culprit) update({ submitted: true, screen: 'confront' });
              else update({ submitted: true, result: scoreCase(cf), screen: 'ending' });
            }} />
        </SheetOverlay>
      )}

      {modalCode && (
        <ClueModal code={modalCode} collectedSet={collectedSet} talkLog={state.talkLog}
          onClose={() => setModalCode(null)} onCollect={collect} onOpen={(c) => setModalCode(c)} />
      )}
      {/* 튜토리얼 중엔 아래로 — 위쪽 코치 말풍선(「✕ 로 닫으세요」)을 덮었다(2026-10-07 시험) */}
      {toast && <div className={`s-toast${!state.tutorialSeen ? ' low' : ''}`}>{toast}</div>}
      <LoadingBar />
      {coach && <TutorialCoach targetSel={coach.sel} text={coach.text} dim={coach.dim} onSkip={() => update({ tutorialSeen: true, tutFinaleSeen: true })} />}
      {state.tutorialSeen && !state.tutFinaleSeen && !suspectId && !modalCode && !recordOpen && !casefileOpen && (
        <TutorialFinale onClose={() => update({ tutFinaleSeen: true })} />
      )}
      {adminOpen && (
        <AdminPanel state={state} onClose={() => setAdminOpen(false)} onUpdate={update}
          onGoStart={() => { setAdminOpen(false); update({ screen: 'start' }); }}
          onCollectAll={async () => {
            const yes = await dlg.confirm({ title: '모든 단서 확보', body: '모든 단서가 사건 기록에 들어옵니다. 찾을 것이 남지 않아 사건이 사실상 끝납니다. 계속할까요?', ok: '확보', tone: 'danger' });
            if (!yes) return;
            update({ collected: [...new Set([...state.collected, ...ALL_CODES])] }); showToast('📦 모든 단서를 확보했습니다');
          }}
          // 비우기는 단서만 지우는 게 아니다 — computeStage 가 매번 재계산이라 3막이 2막으로 되돌아가고,
          //   2차 심문 연출로 받은 2차 부검 소견(AUTOPSY-2)은 unlockedBy 가 없어 event2Seen 을 함께 풀지 않으면 영영 못 받는다.
          onClearClues={async () => {
            const yes = await dlg.confirm({
              title: '단서 비우기',
              body: '확보한 단서를 모두 지웁니다. 진행 단계가 되돌아가고(3막 → 2막), 중간 사건으로 받은 단서는 그 사건을 다시 겪어야 돌아옵니다. 계속할까요?',
              ok: '비우기', tone: 'danger',
            });
            if (!yes) return;
            update({ collected: [...startingClues], event2Seen: false, p2Met: [] }); showToast('🧹 단서를 비웠습니다 — 진행 단계가 되돌아갑니다');
          }}
          onReset={async () => {
            const yes = await dlg.confirm({ title: '저장 초기화', body: '지금까지의 수사 기록이 모두 사라집니다. 계속할까요?', ok: '초기화', tone: 'danger' });
            if (yes) { clearSave(); setState(defaultState()); setAdminOpen(false); }
          }} />
      )}
    </>
  );
}
