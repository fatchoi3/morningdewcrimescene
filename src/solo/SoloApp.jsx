// ─────────────────────────────────────────────────────────────────────────────
// SoloApp — 솔로 추리게임의 루트. 세이브 상태·수사 단계·라우팅(허브/장면/심문)과
//   단서 확보/감식 배달 같은 오케스트레이션만 담당한다.
//   화면과 기능은 features/·ui/ 로 분리, 순수 규칙/상수는 lib/game.js, 콘텐츠는 content.js.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react';
import { loadSave, saveSave, defaultState, clearSave } from './soloStore.js';
import {
  locations, suspects, getClue, provider, soloContent,
  gamsikCodes, gamsikReady, startingClues, suspectIds,
} from './content.js';
import {
  STAGE_LABEL, STAGE_BANNER, SCENE_NEEDED, TRUST_MAX,
  computeStage, interrogatedCount, sceneClueCount, scoreCase,
} from './lib/game.js';
import { pressOf, presentOn } from './interrogation.js';
import { HallNav } from './features/hub.jsx';
import { SceneView } from './features/scene.jsx';
import { CrossExamView } from './features/interrogation.jsx';
import { ClueModal } from './features/clues.jsx';
import { CaseRecord } from './features/record.jsx';
import { CaseFileView } from './features/casefile.jsx';
import { StartScreen, BriefingVN, EventVN, EventVN2, EndingScreen } from './features/intro.jsx';
import { TutorialCoach, TutorialFinale } from './features/tutorial.jsx';
import { AdminPanel } from './features/admin.jsx';
import { SheetOverlay } from './ui/overlays.jsx';

export default function SoloApp() {
  const [state, setState] = useState(() => loadSave() || defaultState());
  const [sceneId, setSceneId] = useState(null);
  const [suspectId, setSuspectId] = useState(null);
  const [modalCode, setModalCode] = useState(null);
  const [hubView, setHubView] = useState('main'); // 허브 뷰(main/floor1/pastor/lab) — 장면 진입 후 복귀 위치 보존
  const [toast, setToast] = useState(null);

  useEffect(() => { saveSave(state); }, [state]);

  const update = (patch) => setState((p) => ({ ...p, ...patch }));
  const collectedSet = useMemo(() => new Set(state.collected), [state.collected]);

  const showToast = (t) => { setToast(t); setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 2400); };

  // 현재 수사 단계(가이드=전부 개방, 그 외=진행도 기반 자동 개방)
  const progressStage = computeStage(state); // 진행도 기반(이벤트·감식 배달 판정용)
  const stage = (state.admin || state.difficulty === 'guide') ? 3 : progressStage; // 운영자 모드=전 구역 개방
  const [adminOpen, setAdminOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);   // 수첩(사건 기록) 오버레이
  const [casefileOpen, setCasefileOpen] = useState(false); // 범인 지목 오버레이
  const ALL_CODES = useMemo(() => provider.getAllClues().map((c) => c.code), []);
  // 새 단계 개방 시 1회 배너 알림
  useEffect(() => {
    if (state.difficulty === 'guide') return;
    if (stage > (state.stageSeen || 1)) { showToast(STAGE_BANNER[stage]); update({ stageSeen: stage }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // 2차 심문 개방 시: 의뢰해 둔 감식 결과 일괄 도착
  useEffect(() => {
    if (stage < 3) return;
    const pending = (state.labReq || []).filter((c) => !collectedSet.has(c) && gamsikReady(c, state.collected));
    if (!pending.length) return;
    const set = new Set(state.collected);
    pending.forEach((c) => set.add(c));
    soloContent.computeAutoUnlocked(set); // 특수 연쇄
    for (const g of gamsikCodes) if (!pending.includes(g) && !collectedSet.has(g)) set.delete(g); // 미의뢰 감식은 제외
    update({ collected: [...set] });
    showToast(`🔬 감식 결과 ${pending.length}건 도착 — 수첩에서 확인하세요`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, state.labReq]);

  function collect(code) {
    if (collectedSet.has(code)) return { added: [] };
    const set = new Set(state.collected);
    set.add(code);
    const autos = soloContent.computeAutoUnlocked(set) || []; // set을 변형하며 특수/감식 연쇄 해금
    // 감식은 자동 수령하지 않는다 — 감식실에서 의뢰하면 2차 심문 때 결과 도착.
    const stripped = autos.filter((a) => gamsikCodes.has(a.code) && a.code !== code && !collectedSet.has(a.code));
    stripped.forEach((a) => set.delete(a.code));
    const kept = autos.filter((a) => !stripped.includes(a));
    update({ collected: [...set] });
    const c = getClue(code);
    const newSpecials = kept.filter((a) => a.code !== code && getClue(a.code)?.type === '특수');
    const extra = newSpecials.length
      ? ` · ⭐ 추리 단서 해금: ${newSpecials.map((a) => getClue(a.code)?.title || a.code).join(' · ')}`
      : '';
    showToast(`단서 확보: ${c?.title || code}${extra}`);
    return { added: [code, ...kept.map((a) => a.code)] };
  }

  const goHub = () => { setSceneId(null); setSuspectId(null); update({ screen: 'hub' }); };

  // ── 시작 ────────────────────────────────────────────────────────────────
  if (state.screen === 'start') {
    return (
      <StartScreen difficulty={state.difficulty} started={state.started} continueCount={state.collected.length}
        onSetDifficulty={(id) => update({ difficulty: id })}
        onStart={() => { clearSave(); setState({ ...defaultState(), difficulty: state.difficulty, started: true, screen: 'briefing', collected: [...startingClues] }); }}
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

  // ── 중간 사건 — 1차 심문(6인)을 마치면 부검 소견이 도착한다 ────────────────
  if (!state.eventSeen && !state.admin && progressStage >= 2 && !suspectId) {
    return <EventVN onDone={() => update({ eventSeen: true })} />;
  }

  // ── 2차 사건 — 모든 조사·1차 심문이 끝나(2차 개방) 정밀 부검 결과(LONS-62)가 도착 ──
  if (state.eventSeen && !state.event2Seen && !state.admin && progressStage >= 3 && !suspectId && !sceneId) {
    return <EventVN2 onDone={() => { collect('LONS-62'); update({ event2Seen: true }); }} />;
  }

  // ── 메인(허브/장면/용의자) ────────────────────────────────────────────────
  // 튜토리얼 코치마크(첫 수사) — 수첩(사건 기록) → 종현방 문 → 소품 → 대화 순서로 유도
  let coach = null;
  if (!state.tutorialSeen && !suspectId && !modalCode && !recordOpen && !casefileOpen && !adminOpen) {
    const jhObjs = locations.rooms.find((l) => l.id === 'ROOM-JH')?.objects || [];
    const jhExamined = jhObjs.some((c) => collectedSet.has(c));
    if (!state.tutRecordDone) coach = { sel: '[data-tut="record-btn"]', text: '먼저 여기, 수첩을 눌러 사건 개요를 확인하세요' };
    else if (!sceneId) coach = { sel: '[data-tut="door"]', text: '이제 종현방을 눌러 들어가세요' };
    else if (sceneId === 'ROOM-JH' && !jhExamined) coach = { sel: '.aa-track .s-zone', text: '빛나는 소품을 눌러 단서를 조사하세요' };
    else if (sceneId === 'ROOM-JH' && jhExamined) coach = { sel: '.s-figure', text: '인물을 눌러 이야기를 시작하세요' };
  }
  // 라벨·목표·단계표시는 '실제 진행도(progressStage)' 기준 — 가이드 모드가 단계를 3으로 올려도 1차엔 1차로 보이게
  const progressText = `용의자 심문 ${interrogatedCount(state)}/${suspectIds.length}` + (progressStage >= 2 ? ` · 현장 단서 ${sceneClueCount(state)}/${SCENE_NEEDED}` : '');
  // 다음에 뭘 하면 단계가 열리는지 상시 안내(진행 막힘 방지)
  const objective = progressStage < 2 ? `용의자 ${suspectIds.length}명을 모두 심문하면 사건이 전환됩니다`
    : progressStage < 3 ? `목사님 방(현장)에서 단서 ${SCENE_NEEDED}개를 찾으면 2차 심문이 열립니다`
    : '물증으로 2차 심문을 마친 뒤 범인을 지목하세요';
  const recordClues = state.collected.map((c) => getClue(c)).filter((x) => x && x.type !== '방');

  return (
    <>
      {suspectId ? (
          <CrossExamView key={suspectId} suspect={suspects.find((s) => s.id === suspectId)} state={state}
            phase={progressStage >= 3 ? 2 : 1}
            tutorialSeen={!!state.tutorialSeen} onTutorialSeen={() => update({ tutorialSeen: true })}
            onAsked={(stId) => { const a = { ...(state.askedQ || {}) }; a[suspectId] = [...new Set([...(a[suspectId] || []), stId])]; update({ askedQ: a }); }}
            location={sceneId ? locations.all.find((l) => l.id === sceneId) : null}
            collectedClues={state.collected.map((c) => getClue(c)).filter((c) => c && c.type !== '방')}
            onExit={() => (sceneId ? setSuspectId(null) : goHub())}
            onPress={(stId) => {
              const r = pressOf(suspectId, stId);
              const pr = { ...(state.pressed || {}) };
              pr[suspectId] = [...new Set([...(pr[suspectId] || []), stId])];
              const patch = { pressed: pr };
              if (r.unlock) { const u = { ...(state.stUnlocked || {}) }; u[suspectId] = [...new Set([...(u[suspectId] || []), r.unlock])]; patch.stUnlocked = u; }
              update(patch);
              if (r.grants) collect(r.grants); // 대화로 증언 단서 확보
              return r; // 자식이 대사창에 결과 표시
            }}
            onPresent={(stId, code) => {
              const confessed = (state.broke?.[suspectId] || []).some((e) => e.confess);
              const r = presentOn(suspectId, stId, code, confessed);
              if (r.result === 'contradict') {
                const bk = { ...(state.broke || {}) };
                const cur = bk[suspectId] || [];
                if (!cur.some((e) => e.id === stId)) bk[suspectId] = [...cur, { id: stId, text: r.text, confess: !!r.confess }];
                const patch = { broke: bk };
                if (r.unlock) { const u = { ...(state.stUnlocked || {}) }; u[suspectId] = [...new Set([...(u[suspectId] || []), r.unlock])]; patch.stUnlocked = u; }
                update(patch);
              } else if (r.result === 'wrong') {
                const tr = { ...(state.trust || {}) };
                const t = Math.max(0, (tr[suspectId] ?? TRUST_MAX) - 1);
                if (t <= 0) { tr[suspectId] = TRUST_MAX; update({ trust: tr }); setSuspectId(null); showToast('⚠ 신뢰도가 바닥났습니다 — 잠시 정비 후 다시 심문하세요'); }
                else { tr[suspectId] = t; update({ trust: tr }); }
              }
              if (r.grants) collect(r.grants); // 추궁 성공으로 추리(특수) 단서 확보
              return r; // 자식이 컷인/대사창에 결과 표시
            }} />
        ) : sceneId ? (
          <SceneView location={locations.all.find((l) => l.id === sceneId)} collectedSet={collectedSet} stage={stage}
            roomSuspect={suspects.find((s) => s.name === locations.all.find((l) => l.id === sceneId)?.person)}
            collectedClues={state.collected.map((c) => getClue(c)).filter((c) => c && c.type !== '방')}
            lab={{
              stage,
              requested: (code) => (state.labReq || []).includes(code),
              ready: (code) => gamsikReady(code, state.collected),
              request: (code) => { update({ labReq: [...new Set([...(state.labReq || []), code])] }); showToast('🔬 감식 의뢰 접수 — 결과는 2차 심문이 열리면 도착합니다'); },
            }}
            onTalk={(id) => setSuspectId(id)}
            onOpen={(code) => setModalCode(code)} onLockedToast={showToast}
            onBack={() => goHub()} />
        ) : (
          <HallNav locations={locations} stage={stage} progressStage={progressStage} collectedSet={collectedSet}
            recommendPerson={!state.tutorialSeen && state.tutRecordDone ? '최종현' : null}
            admin={state.admin} stageLabel={STAGE_LABEL[progressStage]} progressText={progressText} objective={objective} canAccuse={progressStage >= 3}
            view={hubView} onView={setHubView} onEnter={(id) => setSceneId(id)} onToast={showToast}
            onOpenRecord={() => { setRecordOpen(true); if (!state.tutorialSeen && !state.tutRecordDone) update({ tutRecordDone: true }); }}
            onOpenMenu={() => setAdminOpen(true)}
            onAccuse={() => setCasefileOpen(true)} />
        )}

      {recordOpen && (
        <SheetOverlay title={`사건 기록 · 단서 ${recordClues.length}`} onClose={() => setRecordOpen(false)}>
          <CaseRecord clues={recordClues} onOpen={(code) => setModalCode(code)} notes={state.notes} onNotes={(v) => update({ notes: v })} />
        </SheetOverlay>
      )}
      {casefileOpen && (
        <SheetOverlay title="🔍 범인 지목" onClose={() => setCasefileOpen(false)}>
          <CaseFileView state={state} onPick={(sid) => update({ casefile: { culprit: sid } })}
            onSubmit={() => { setCasefileOpen(false); update({ submitted: true, result: scoreCase(state.casefile || {}), screen: 'ending' }); }} />
        </SheetOverlay>
      )}

      {modalCode && (
        <ClueModal code={modalCode} collectedSet={collectedSet} difficulty={state.difficulty}
          onClose={() => setModalCode(null)} onCollect={collect} onOpen={(c) => setModalCode(c)} />
      )}
      {toast && <div className="s-toast">{toast}</div>}
      {coach && <TutorialCoach targetSel={coach.sel} text={coach.text} dim={coach.dim} onSkip={() => update({ tutorialSeen: true, tutFinaleSeen: true })} />}
      {state.tutorialSeen && !state.tutFinaleSeen && !suspectId && !modalCode && !recordOpen && !casefileOpen && (
        <TutorialFinale onClose={() => update({ tutFinaleSeen: true })} />
      )}
      {adminOpen && (
        <AdminPanel state={state} onClose={() => setAdminOpen(false)} onUpdate={update}
          onGoStart={() => { setAdminOpen(false); update({ screen: 'start' }); }}
          onCollectAll={() => { update({ collected: [...new Set([...state.collected, ...ALL_CODES])] }); showToast('📦 모든 단서를 확보했습니다'); }}
          onClearClues={() => { update({ collected: [...startingClues] }); showToast('🧹 단서를 비웠습니다'); }}
          onReset={() => { if (window.confirm('저장을 초기화할까요?')) { clearSave(); setState(defaultState()); setAdminOpen(false); } }} />
      )}
    </>
  );
}
