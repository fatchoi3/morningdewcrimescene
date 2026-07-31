// ─────────────────────────────────────────────────────────────────────────────
// SoloApp — 솔로 추리게임의 루트. 세이브 상태·수사 단계·라우팅(허브/장면/심문)과
//   단서 확보/감식 배달 같은 오케스트레이션만 담당한다.
//   화면과 기능은 features/·ui/ 로 분리, 순수 규칙/상수는 lib/game.js, 콘텐츠는 content.js.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react';
import { loadSave, saveSave, defaultState, clearSave } from './soloStore.js';
import { cast, t } from '../data/cast.js';
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
  const collectedSet = useMemo(() => new Set(state.collected), [state.collected]);

  const showToast = (t) => { setToast(t); setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 2400); };

  // 현재 수사 단계 — 진행도로만 열린다(1차 탐문 → 부검 소견 → 2차 심문).
  //   난이도로 전 구역을 미리 열던 옵션은 없앴다: 1장인데 폰·CCTV가 열려 2막 구조가 무너졌다.
  const progressStage = computeStage(state); // 진행도 기반(이벤트·감식 배달 판정용)
  const stage = state.admin ? 3 : progressStage; // 운영자(테스트) 모드만 전 구역 개방
  const [adminOpen, setAdminOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);   // 수첩(사건 기록) 오버레이
  const [casefileOpen, setCasefileOpen] = useState(false); // 범인 지목 오버레이
  const ALL_CODES = useMemo(() => provider.getAllClues().map((c) => c.code), []);
  // 3막 진행도·제출 준비도의 분모 — 콘텐츠에서 세어 온다(숫자를 손으로 적으면 데이터가 늘 때 어긋난다)
  const PHONE_CODES = useMemo(() => provider.getAllClues().filter((c) => c.phone).map((c) => c.code), []);
  const SPECIAL_CODES = useMemo(() => provider.getAllClues().filter((c) => c.type === '특수').map((c) => c.code), []);
  // 새 단계 개방 시 1회 배너 알림
  useEffect(() => {
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
    // 이 단서(채취물)로 새로 '감식 의뢰 가능'해진 게 있으면 안내(감식 의뢰실로 유도)
    const gamsikNow = [...gamsikCodes].filter((g) => !collectedSet.has(g) && !gamsikReady(g, state.collected) && gamsikReady(g, [...set]));
    // 감식 의뢰실은 2단계에 열린다 — 1차에 이 안내를 띄우면 갈 수 없는 곳으로 보낸다
    const gextra = gamsikNow.length && stage >= 2 ? ' · 🔬 감식 의뢰 가능(감식 의뢰실에서 맡기세요)' : '';
    showToast(`단서 확보: ${c?.title || code}${extra}${gextra}`);
    // 첫 추리 단서 안내 — 공용 팝업으로
    if (newSpecials.length && !state.specialTutSeen) {
      const first = getClue(newSpecials[0].code);
      update({ specialTutSeen: true });
      dlg.popup({
        title: '⭐ 추리 단서를 얻었어요!',
        body: (
          <>
            <p>단서들을 엮어 추리 단서 <b>「{first?.title}」</b>가 밝혀졌습니다.</p>
            <p>이런 <b>추리 단서(⭐)</b>는 방에서 줍는 게 아니라, 관련 단서를 모으면 <b>자동으로 사건 기록에 등록</b>돼요.</p>
            <p>화면 오른쪽 위의 <b>📓 수첩(사건 기록)</b>에서 확인하고, 심문 질문지의 <b>「📁 단서」</b> 칸에서 물어보세요.</p>
          </>
        ),
      });
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
  // 튜토리얼 코치마크 — '지금 할 것' 하나만 밝히고 나머지는 막는다.
  //   중간에 가리킬 것이 없으면 플레이어가 딴 길로 새므로, 어느 화면에 있든 단계가 이어지게 둔다
  //   (수첩·단서 모달처럼 위에 덮이는 화면도 각자 안내를 갖는다).
  let coach = null;
  if (!state.tutorialSeen && !casefileOpen && !adminOpen) {
    const jhObjs = locations.rooms.find((l) => l.id === 'ROOM-JH')?.objects || [];
    const jhExamined = jhObjs.some((c) => collectedSet.has(c));
    if (recordOpen) coach = { sel: '.s-sheet-back', text: '사건 개요를 봤으면 ← 로 나가세요' };
    else if (modalCode) coach = { sel: '.s-modal .mx', text: '단서를 확보했습니다. ✕ 로 닫고 계속하세요' };
    else if (suspectId) coach = null;      // 심문 안에서는 그 화면이 직접 안내한다(아래 CrossExamView)
    else if (!state.tutRecordDone) coach = { sel: '[data-tut="record-btn"]', text: '먼저 여기, 수첩을 눌러 사건 개요를 확인하세요' };
    else if (!sceneId) coach = { sel: '[data-tut="door"]', text: t('이제 {{S1.short}}방을 눌러 들어가세요') };
    else if (sceneId !== 'ROOM-JH') coach = { sel: '.aa-dlg-act', text: t('먼저 {{S1.short}}방부터 봅시다 — 나가기를 눌러 복도로') };
    else if (!jhExamined) coach = { sel: '.aa-track .s-zone', text: '테두리가 빛나는 물건을 눌러 단서를 조사하세요' };
    // 배경에 인물이 그려진 방은 .s-talkzone, 떠 있는 스탠딩은 .s-figure — 둘 다 잡아야 한다
    //   (예전엔 .s-figure 만 봐서 종현방에선 코치마크가 통째로 사라졌다)
    else coach = { sel: '.s-talkzone, .s-figure', text: t('{{S1.short}}을 눌러 이야기를 시작하세요') };
  }
  // 라벨·목표·단계표시는 '실제 진행도(progressStage)' 기준 — 가이드 모드가 단계를 3으로 올려도 1차엔 1차로 보이게
  const p2Count = (state.p2Met || []).filter((id) => suspectIds.includes(id)).length;
  const gamsikGot = [...gamsikCodes].filter((c) => collectedSet.has(c)).length;
  const phoneGot = PHONE_CODES.filter((c) => collectedSet.has(c)).length;
  const specialGot = SPECIAL_CODES.filter((c) => collectedSet.has(c)).length;
  // 3막은 재는 축이 다르다 — 현장 단서는 이미 채워진 뒤라 그대로 두면 분자가 분모를 넘고(목사방 13개/3),
  //   정작 남은 일(2차 심문·감식·폰)은 어디에도 안 보였다. 2막 표기도 목표치까지만 센다.
  const progressText = progressStage >= 3
    ? `2차 심문 ${p2Count}/${suspectIds.length} · 감식 ${gamsikGot}/${gamsikCodes.size} · 폰 ${phoneGot}/${PHONE_CODES.length}`
    : `용의자 심문 ${interrogatedCount(state)}/${suspectIds.length}`
      + (progressStage >= 2 ? ` · 현장 단서 ${Math.min(sceneClueCount(state), SCENE_NEEDED)}/${SCENE_NEEDED}` : '');
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
            onSkipTutorial={() => update({ tutorialSeen: true, tutFinaleSeen: true })}
            onAsked={(stId) => { const a = { ...(state.askedQ || {}) }; a[suspectId] = [...new Set([...(a[suspectId] || []), stId])]; update({ askedQ: a }); }}
            onAskedClue={(code) => { const a = { ...(state.askedC || {}) }; a[suspectId] = [...new Set([...(a[suspectId] || []), code])]; update({ askedC: a }); }}
            onAskedTopic={(tid) => { const a = { ...(state.askedT || {}) }; a[suspectId] = [...new Set([...(a[suspectId] || []), tid])]; update({ askedT: a }); }}
            location={sceneId ? locations.all.find((l) => l.id === sceneId) : null}
            collectedClues={state.collected.map((c) => getClue(c)).filter((c) => c && c.type !== '방')}
            onOpenRecord={() => setRecordOpen(true)}
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
            // silent=true: 「단서로 묻는다」로 고른 것 — 반응이 없어도 신뢰도를 깎지 않는다
            //   (화면엔 '딱히 물을 게 없다'는 중립 문구만 뜨는데 몰래 깎이면 억울하게 쫓겨난다)
            onPresent={(stId, code, silent = false) => {
              const confessed = (state.broke?.[suspectId] || []).some((e) => e.confess);
              const r = presentOn(suspectId, stId, code, confessed);
              if (r.result === 'contradict') {
                const bk = { ...(state.broke || {}) };
                const cur = bk[suspectId] || [];
                if (!cur.some((e) => e.id === stId)) bk[suspectId] = [...cur, { id: stId, text: r.text, confess: !!r.confess }];
                const patch = { broke: bk };
                if (r.unlock) { const u = { ...(state.stUnlocked || {}) }; u[suspectId] = [...new Set([...(u[suspectId] || []), r.unlock])]; patch.stUnlocked = u; }
                update(patch);
              } else if (r.result === 'wrong' && !silent) {
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
              request: (code) => { update({ labReq: [...new Set([...(state.labReq || []), code])] }); showToast('🔬 감식 의뢰 접수 — 결과는 2차 심문이 열리면 도착합니다'); },
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
            // 제출은 되돌릴 수 없다(엔딩의 「새 사건」은 clearSave라 기록까지 사라진다) — 확인창에서
            //   '얼마나 조사하고 지목하는지'를 숫자로 보여준 뒤 물어본다.
            onSubmit={async () => {
              const pickName = suspects.find((s) => s.id === state.casefile?.culprit)?.name || '';
              const yes = await dlg.confirm({
                title: '사건 파일 제출',
                body: (
                  <>
                    <p><b>{pickName}</b> — 이 사람을 범인으로 지목합니다.</p>
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
              update({ submitted: true, result: scoreCase(state.casefile || {}), screen: 'ending' });
            }} />
        </SheetOverlay>
      )}

      {modalCode && (
        <ClueModal code={modalCode} collectedSet={collectedSet}
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
          onCollectAll={async () => {
            const yes = await dlg.confirm({ title: '모든 단서 확보', body: '모든 단서가 사건 기록에 들어옵니다. 찾을 것이 남지 않아 사건이 사실상 끝납니다. 계속할까요?', ok: '확보', tone: 'danger' });
            if (!yes) return;
            update({ collected: [...new Set([...state.collected, ...ALL_CODES])] }); showToast('📦 모든 단서를 확보했습니다');
          }}
          // 비우기는 단서만 지우는 게 아니다 — computeStage 가 매번 재계산이라 3막이 2막으로 되돌아가고,
          //   중간 사건으로 받은 LONS-62 는 unlockedBy 가 비어 있어 event2Seen 을 함께 풀지 않으면 영영 못 받는다.
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
