import { useEffect, useMemo, useState } from 'react';
import { soloContent } from './soloContent.js';
import { visibleStatements, pressOf, presentOn, relatedCodes, introOf } from './interrogation.js';
import { loadSave, saveSave, defaultState, clearSave } from './soloStore.js';
import { SceneBg, Avatar, BriefingArt, EndingArt, CorridorBg } from './art.jsx';
import { DialogueBox, CommandBar } from './vn.jsx';

const { briefing, suspects, victim, locations, caseKey, provider, clueIcon, getClue, crimeSceneCodes, suspectIds, gamsikCodes, gamsikReady } = soloContent;

// 수사 단계 — 자동 개방(퍼즐/탐정). 가이드는 처음부터 전부 개방.
//   1 = 1차 탐문(인물 방·1차 심문) → [중간 사건: 부검 소견] →
//   2 = 전면 조사(목사방·CCTV·휴대폰·감식 의뢰) →
//   3 = 2차 심문(감식 결과 도착, 새 증언 개방, 사건 파일 제출)
const STAGE_LABEL = { 1: '1차 탐문 · 인물 방과 심문', 2: '전면 조사 · 현장·CCTV·휴대폰', 3: '2차 심문 · 물증으로 추궁' };
const STAGE_BANNER = {
  2: '🔓 살인 사건 전환 — 목사님 방·CCTV·휴대폰·감식 의뢰실이 열렸습니다',
  3: '🔬 2차 심문 개방 — 감식 결과가 도착했고, 용의자들의 새 증언이 열렸습니다',
};
const SCENE_NEEDED = 3; // 단계 2→3: 목사방 현장 단서 이만큼 확보
const TRUST_MAX = 5;    // 신뢰도(HP)

function interrogatedCount(state) {
  const pressed = state.pressed || {}, broke = state.broke || {};
  // 추궁했거나(증언 눌러봄) 증거로 모순을 잡았으면 '심문함'으로 인정
  return suspectIds.filter((id) => (pressed[id] || []).length >= 1 || (broke[id] || []).length >= 1).length;
}
function sceneClueCount(state) {
  const got = new Set(state.collected || []);
  return crimeSceneCodes.filter((c) => got.has(c)).length;
}
// 진행도로부터 도달 단계 계산(단조 증가)
function computeStage(state) {
  if (interrogatedCount(state) < suspectIds.length) return 1;   // 6인 모두 심문해야 중간점검
  if (sceneClueCount(state) < SCENE_NEEDED) return 2;           // 현장 조사해야 2부(폰)
  return 3;
}
const stageHint = (locStage) => locStage === 2
  ? `🔒 1차 심문 후 개방 — 용의자 ${suspectIds.length}명을 모두 심문하세요`
  : locStage === 3
    ? `🔒 2차 심문 때 개방 — 목사님 방(현장)에서 단서 ${SCENE_NEEDED}개를 찾으세요`
    : '🔒 잠김';

const DIFFS = [
  { id: 'guide', name: '가이드', desc: '단서가 술술 열리고 비번 힌트도 보입니다. 부담 없이.' },
  { id: 'puzzle', name: '퍼즐', desc: '비번·연결을 스스로 풀어야 열립니다. 추리게임다운 도전.' },
  { id: 'detective', name: '탐정', desc: '힌트 최소. 모든 걸 스스로 엮어야 합니다.' },
];

// 장면 종류별 '표면 앵커' — 배경 가구/바닥에 맞춰 배치(깊을수록 s 작게).
//   x,y = 화면 % (하단 대사창을 피해 y≤70), s = 원근 배율. index로 결정적 매핑 → 늘 같은 자리.
//   인물이 있는 방은 우측(78%~)을 인물 자리로 비워둠.
const ANCHORS = {
  room: [
    { x: 15, y: 62, s: 1.06 }, { x: 70, y: 55, s: 1.0 }, { x: 39, y: 26, s: 0.68 }, { x: 45, y: 68, s: 1.04 },
    { x: 20, y: 31, s: 0.72 }, { x: 60, y: 66, s: 1.0 }, { x: 30, y: 56, s: 0.9 }, { x: 55, y: 42, s: 0.8 },
    { x: 24, y: 45, s: 0.84 }, { x: 66, y: 34, s: 0.74 }, { x: 50, y: 60, s: 0.96 }, { x: 12, y: 48, s: 0.85 },
  ],
  crime: [
    { x: 52, y: 50, s: 1.0 }, { x: 33, y: 63, s: 1.05 }, { x: 71, y: 60, s: 1.03 }, { x: 21, y: 47, s: 0.85 },
    { x: 60, y: 40, s: 0.78 }, { x: 44, y: 66, s: 1.04 }, { x: 82, y: 50, s: 0.9 }, { x: 15, y: 61, s: 1.0 },
    { x: 38, y: 37, s: 0.75 }, { x: 75, y: 35, s: 0.72 }, { x: 28, y: 55, s: 0.9 }, { x: 64, y: 55, s: 0.95 },
  ],
  cctv: [
    { x: 22, y: 30, s: 0.8 }, { x: 44, y: 30, s: 0.8 }, { x: 66, y: 31, s: 0.8 }, { x: 33, y: 52, s: 0.9 },
    { x: 55, y: 52, s: 0.9 }, { x: 77, y: 42, s: 0.82 }, { x: 20, y: 52, s: 0.88 }, { x: 50, y: 66, s: 1.0 },
    { x: 70, y: 64, s: 1.0 },
  ],
  lab: [
    { x: 24, y: 55, s: 0.95 }, { x: 40, y: 53, s: 0.92 }, { x: 56, y: 52, s: 0.9 }, { x: 70, y: 52, s: 0.9 },
    { x: 32, y: 66, s: 1.0 }, { x: 60, y: 64, s: 1.0 }, { x: 82, y: 57, s: 0.9 }, { x: 16, y: 59, s: 0.95 },
  ],
  phone: [
    { x: 20, y: 57, s: 0.95 }, { x: 37, y: 56, s: 0.95 }, { x: 54, y: 56, s: 0.95 }, { x: 71, y: 56, s: 0.95 },
    { x: 86, y: 57, s: 0.95 }, { x: 30, y: 68, s: 1.02 }, { x: 62, y: 68, s: 1.02 },
  ],
  common: [
    { x: 18, y: 52, s: 1.0 }, { x: 82, y: 52, s: 1.0 }, { x: 35, y: 44, s: 0.85 }, { x: 65, y: 44, s: 0.85 },
    { x: 50, y: 60, s: 1.05 }, { x: 26, y: 38, s: 0.72 }, { x: 74, y: 38, s: 0.72 }, { x: 50, y: 34, s: 0.66 },
  ],
};
const anchorKind = (loc) => (loc.showBody || loc.person === '목사') ? 'crime' : (ANCHORS[loc.kind] ? loc.kind : 'room');
const posFor = (loc, i) => { const a = ANCHORS[anchorKind(loc)]; return a[i % a.length]; };

const REVEAL = {
  order: ['S4', 'S5', 'S3', 'S6', 'S1', 'S2'],
  people: {
    S4: { role: '진범 · 직접 살해', text: '위조 수료증이 들통날 위기에 몰리자 응급약을 가짜로 바꾸고, 결국 베개로 목사를 질식시켰다. 끝까지 부인한다.' },
    S5: { role: '가담 · 라벨 교체', text: '빚과 횡령이 드러날 위기에, 최종현의 보충제 라벨을 바꿔 요힘빈을 먹게 했다. 죽일 생각까진 없었다.' },
    S3: { role: '가담 · 사인 무관', text: '동생을 지키려 목사 텀블러에 수면제를 탔다. 하지만 목사는 그 텀블러를 마시기 전에 죽었다 — 사인과 무관.' },
    S6: { role: '증거 인멸', text: '파혼·숨긴 비밀을 지키려, 이미 죽어 있던 목사의 폰 기록(톡서랍)을 지우고 신고를 늦췄다. 살인과는 무관.' },
    S1: { role: '무고', text: '자기가 준 음료 때문일까 떨었지만, 라벨을 바꾼 건 이사랑, 죽인 건 박희원. 도구로 이용됐을 뿐이다.' },
    S2: { role: '무고', text: '찬양곡 갈등으로 언쟁은 있었으나 질식과 무관. "내가 나올 때 목사는 멀쩡했다"는 증언이 오히려 단서.' },
  },
  essence: '여섯 사람이 각자 다른 이유로, 서로 모르게, 같은 날 같은 사람을 노렸다. 실제로 목사를 죽인 건 박희원의 베개였지만, 그 죽음을 만든 건 목사가 무심코 건드린 여섯 사람의 얽힌 원한 전부였다.',
};

// 그날의 진실 — 시간 순(엔딩 공개용)
const TIMELINE = [
  ['전날 밤', '이사랑이 언니의 송금 내역을 발견해 오해를 풀고, 횡령 위기를 이현지에게 고백.'],
  ['당일 아침', '목사가 찬조금 미입금을 발견 → 이사랑 면담, 수련회 후 재정 점검 예고.'],
  ['10:00', '최종현·목사 등산 출발 (방·복도가 한동안 빔).'],
  ['10:10~12', '박희원이 설하정 6알을 비타민으로 바꿔치기. 진짜 약은 자기 요일별 약통에 숨김.'],
  ['10:20', '이현지가 목사 텀블러에 졸피뎀 투입.'],
  ['10:25', '이사랑이 최종현 방에서 요힘빈↔단백질 라벨을 교체.'],
  ['12:40', '최종현이 (바뀐) "단백질" 음료를 목사에게 전달.'],
  ['12:41~45', '윤은재가 목사방에서 언쟁(손목 멍). 나올 때 목사는 멀쩡·음료 미복용.'],
  ['~12:50', '목사가 요힘빈 음료를 마심 → 컨디션 악화.'],
  ['13:10', '협심증 발작. 가짜 약을 눈치채고 품속 진짜 설하정 복용 후 안정.'],
  ['13:15', '박희원이 유리창으로 "실패"라 판단 → 진입 → 베개로 질식 (직접 사인).'],
  ['13:20', '이가현이 발견 → 이미 사망. 목사 폰 톡서랍(0419) 기록 삭제.'],
  ['13:31', '이가현이 119 신고 (진입~신고 공백이 의심을 부름).'],
];

const norm = (s) => String(s ?? '').trim().replace(/\s/g, '').toUpperCase();

export default function SoloApp() {
  const [state, setState] = useState(() => loadSave() || defaultState());
  const [sceneId, setSceneId] = useState(null);
  const [suspectId, setSuspectId] = useState(null);
  const [modalCode, setModalCode] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { saveSave(state); }, [state]);

  const update = (patch) => setState((p) => ({ ...p, ...patch }));
  const collectedSet = useMemo(() => new Set(state.collected), [state.collected]);

  const showToast = (t) => { setToast(t); setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 2400); };

  // 현재 수사 단계(가이드=전부 개방, 그 외=진행도 기반 자동 개방)
  const progressStage = computeStage(state); // 진행도 기반(이벤트·감식 배달 판정용)
  const stage = state.difficulty === 'guide' ? 3 : progressStage;
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
    showToast(`단서 확보: ${c?.title || code}${kept.length ? ` (+특수 ${kept.length})` : ''}`);
    return { added: [code, ...kept.map((a) => a.code)] };
  }

  const goHub = (tab) => { setSceneId(null); setSuspectId(null); update({ screen: 'hub', hubTab: tab || state.hubTab || 'places' }); };

  // ── 시작 ────────────────────────────────────────────────────────────────
  if (state.screen === 'start') {
    return (
      <div className="solo-wrap">
        <div className="s-start">
          <div className="s-eye">Crime Scene · Solo</div>
          <div className="s-title">{briefing.title}</div>
          <div className="s-sub">{briefing.subtitle}</div>
          <div className="s-section-t">난이도</div>
          <div className="s-diff">
            {DIFFS.map((d) => (
              <button key={d.id} className={state.difficulty === d.id ? 'on' : ''} onClick={() => update({ difficulty: d.id })}>
                <div className="dname">{d.name}</div>
                <div className="ddesc">{d.desc}</div>
              </button>
            ))}
          </div>
          <button className="s-btn" onClick={() => update({ started: true, screen: 'briefing' })}>수사 시작</button>
          {state.collected.length > 0 && (
            <button className="s-link" style={{ marginTop: 14 }} onClick={() => goHub()}>이어하기 (단서 {state.collected.length})</button>
          )}
          {state.started && (
            <button className="s-link" style={{ marginTop: 6, color: '#8a8880' }} onClick={() => { clearSave(); setState(defaultState()); }}>처음부터 다시</button>
          )}
        </div>
      </div>
    );
  }

  // ── 브리핑 (역전재판식 VN 시퀀스) ─────────────────────────────────────────
  if (state.screen === 'briefing') {
    return <BriefingVN onDone={() => goHub('places')} />;
  }

  // ── 엔딩 ────────────────────────────────────────────────────────────────
  if (state.screen === 'ending' && state.result) {
    const r = state.result;
    return (
      <div className="solo-wrap">
        <div className="s-body" style={{ paddingTop: 24 }}>
          <EndingArt good={r.culpritRight} />
          <div className="s-score">
            <div className="s-eye">사건 종결</div>
            <div className="big">{r.total} / {r.max}</div>
            <div style={{ color: r.culpritRight ? 'var(--ok)' : 'var(--danger)', fontWeight: 800, marginTop: 6 }}>
              {r.culpritRight ? '✓ 진범을 정확히 지목했습니다' : '✗ 진범을 놓쳤습니다'}
            </div>
            <div style={{ color: 'var(--muted)', marginTop: 6 }}>{r.grade}</div>
            <div style={{ marginTop: 10, fontSize: '.9rem', color: '#cfcabb' }}>진범 <b style={{ color: '#fff' }}>박희원</b> · 직접 사인 <b style={{ color: '#fff' }}>베개 질식</b></div>
          </div>
          <div className="s-reveal">
            <h2 style={{ textAlign: 'center' }}>사건의 전말</h2>
            {REVEAL.order.map((id) => {
              const s = suspects.find((x) => x.id === id);
              return (
                <div key={id} style={{ marginTop: 16 }}>
                  <h3>{s?.name} <span className="role">— {REVEAL.people[id].role}</span></h3>
                  <p style={{ lineHeight: 1.8 }}>{REVEAL.people[id].text}</p>
                </div>
              );
            })}
            <h3 style={{ borderBottom: '1px solid var(--line)', paddingBottom: 6, marginTop: 24 }}>🕰 그날의 진실 — 시간 순</h3>
            <div className="s-timeline">
              {TIMELINE.map(([t, d], i) => (
                <div className="s-tl2-row" key={i}>
                  <div className="s-tl2-t">{t}</div>
                  <div className="s-tl2-d">{d}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#0f0e0c', border: '1px solid var(--gold)', borderRadius: 12, padding: 18, marginTop: 22 }}>
              <div className="s-eye" style={{ color: 'var(--gold)' }}>사건의 본질</div>
              <p style={{ lineHeight: 1.9, marginBottom: 0 }}>{REVEAL.essence}</p>
            </div>
          </div>
          <div style={{ textAlign: 'center', margin: '24px 0' }}>
            <button className="s-btn ghost" onClick={() => goHub('casefile')}>사건 파일 다시 보기</button>
            <button className="s-btn" style={{ marginLeft: 8 }} onClick={() => { clearSave(); setState(defaultState()); }}>새 사건</button>
          </div>
        </div>
      </div>
    );
  }

  // ── 중간 사건 — 1차 심문(6인)을 마치면 부검 소견이 도착한다 ────────────────
  if (!state.eventSeen && progressStage >= 2 && !suspectId) {
    return <EventVN onDone={() => update({ eventSeen: true })} />;
  }

  // ── 메인(허브/장면/용의자) ────────────────────────────────────────────────
  const topH = sceneId ? (locations.all.find((l) => l.id === sceneId)?.label)
    : suspectId ? '용의자 심문'
    : state.hubTab === 'notebook' ? '수사 수첩'
    : state.hubTab === 'casefile' ? '사건 파일'
    : '현장';

  return (
    <div className="solo-wrap">
      <div className="s-top">
        {(sceneId || suspectId) ? (
          <button className="s-back" onClick={suspectId ? () => setSuspectId(null) : () => goHub()}>← 뒤로</button>
        ) : (
          <button className="s-back" onClick={() => update({ screen: 'start' })}>≡</button>
        )}
        <div className="s-h">{topH}</div>
        <div className="s-count">단서 {state.collected.length}</div>
      </div>

      <div className="s-body">
        {suspectId ? (
          <CrossExamView key={suspectId} suspect={suspects.find((s) => s.id === suspectId)} state={state}
            phase={stage >= 3 ? 2 : 1}
            location={sceneId ? locations.all.find((l) => l.id === sceneId) : null}
            collectedClues={state.collected.map((c) => getClue(c)).filter((c) => c && c.type !== '방')}
            onExit={() => (sceneId ? setSuspectId(null) : goHub('places'))}
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
              const r = presentOn(suspectId, stId, code);
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
              return r; // 자식이 컷인/대사창에 결과 표시
            }} />
        ) : sceneId ? (
          <SceneView location={locations.all.find((l) => l.id === sceneId)} collectedSet={collectedSet}
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
        ) : state.hubTab === 'notebook' ? (
          <NotebookView state={state} onNotes={(v) => update({ notes: v })} onOpen={(code) => setModalCode(code)} />
        ) : state.hubTab === 'casefile' ? (
          <CaseFileView state={state} stageLocked={state.difficulty !== 'guide' && stage < 3} stageLabel={STAGE_LABEL[stage]}
            onSet={(sid, field, val) => update({ casefile: { ...(state.casefile || {}), [sid]: { ...(state.casefile?.[sid] || {}), [field]: val } } })}
            onSubmit={() => update({ submitted: true, result: scoreCase(state.casefile || {}), screen: 'ending' })} />
        ) : (
          <>
            <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', margin: '4px 0 6px' }}>
              <div style={{ fontWeight: 800, color: 'var(--gold)' }}>🔎 {STAGE_LABEL[stage]}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 3 }}>
                용의자 심문 {interrogatedCount(state)}/{suspectIds.length}
                {stage >= 2 ? ` · 현장 단서 ${sceneClueCount(state)}/${SCENE_NEEDED}` : ''}
                {' · '}
                {stage === 1 ? '다음: 6명 모두 1차 심문하면 사건이 움직입니다'
                  : stage === 2 ? `다음: 목사님 방 단서 ${SCENE_NEEDED}개 확보 시 2차 심문 개방 — 감식 의뢰를 잊지 마세요`
                  : '2차 심문: 새 증언을 추궁하고, 다 모였으면 사건 파일을 제출하세요'}
              </div>
            </div>
            <div className="s-section-t">숙소 복도 — 문을 눌러 들어가기</div>
            <div className="s-hall">
              <CorridorBg />
              <div className="s-hall-sign">🏢 수련회 숙소 · 인물들의 방</div>
              <div className="s-doors">
                {locations.rooms.map((l) => {
                  const locked = l.stage > stage;
                  const isCrime = l.person === '목사';
                  return <DoorCard key={l.id} loc={l} collectedSet={collectedSet} locked={locked} isCrime={isCrime}
                    onClick={locked
                      ? () => showToast(isCrime ? '🚧 목사님 방은 경찰 통제 중입니다 — 부검 소견이 나오면 개방됩니다' : stageHint(l.stage))
                      : () => setSceneId(l.id)} />;
                })}
              </div>
            </div>
            <div className="s-section-t">조사 시설</div>
            <div className="s-hall">
              <CorridorBg />
              <div className="s-doors">
                {locations.tools.map((l) => {
                  const locked = l.stage > stage;
                  return <DoorCard key={l.id} loc={l} collectedSet={collectedSet} locked={locked}
                    onClick={locked ? () => showToast(stageHint(l.stage)) : () => setSceneId(l.id)} />;
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 하단 탭바 */}
      <div className="s-tabs">
        {[['places', '🗺️', '현장'], ['notebook', '📓', '수첩'], ['casefile', '📂', '사건파일']].map(([id, ic, nm]) => (
          <button key={id} className={!sceneId && !suspectId && state.hubTab === id ? 'on' : ''} onClick={() => goHub(id)}>
            <span className="ti">{ic}</span>{nm}
          </button>
        ))}
      </div>

      {modalCode && (
        <ClueModal code={modalCode} collectedSet={collectedSet} difficulty={state.difficulty}
          onClose={() => setModalCode(null)} onCollect={collect} onOpen={(c) => setModalCode(c)} />
      )}
      {toast && <div className="s-toast">{toast}</div>}
    </div>
  );
}

// 채점 — caseKey.answers 대비 role/method/motive 일치 카운트
function scoreCase(casefile) {
  const ans = caseKey.answers;
  let total = 0; const max = Object.keys(ans).length * 3;
  const per = {};
  for (const [id, a] of Object.entries(ans)) {
    const g = casefile[id] || {};
    const rc = g.role === a.role, mc = g.method === a.method, oc = g.motive === a.motive;
    per[id] = { role: rc, method: mc, motive: oc };
    total += (rc ? 1 : 0) + (mc ? 1 : 0) + (oc ? 1 : 0);
  }
  const culpritRight = casefile.S4?.role === '진범';
  const pct = total / max;
  const grade = pct >= 0.9 ? '명탐정' : pct >= 0.7 ? '유능한 수사관' : pct >= 0.4 ? '견습 수사관' : '재수사가 필요합니다';
  return { total, max, per, culpritRight, grade };
}

// ── 장소 카드 ─────────────────────────────────────────────────────────────
// ── 복도의 문(장소 진입) ───────────────────────────────────────────────────
function DoorCard({ loc, collectedSet, locked, isCrime, onClick }) {
  const total = loc.objects.length;
  const got = loc.objects.filter((c) => collectedSet.has(c)).length;
  const done = !locked && total > 0 && got === total;
  const icon = loc.kind === 'room' ? (isCrime ? '⚰️' : '🚪')
    : loc.kind === 'cctv' ? '📹' : loc.kind === 'phone' ? '📱' : loc.kind === 'lab' ? '🔬' : '🚶';
  return (
    <button className={`s-door${locked ? ' locked' : ''}${isCrime ? ' crime' : ''}`} onClick={onClick}>
      <div className="s-door-body">
        <span className="s-door-icon">{locked ? '🔒' : icon}</span>
        <span className="s-door-handle" />
        {isCrime && locked && <span className="s-door-tape" />}
      </div>
      <div className="s-door-plate">{loc.label}</div>
      <div className="s-door-stat">
        {locked ? (isCrime ? '통제 중' : loc.stage === 2 ? '사건 후 개방' : '2차 개방')
          : loc.kind === 'room' ? (done ? '✓ 탐색완료' : `단서 ${got}/${total}`)
          : '열람'}
      </div>
    </button>
  );
}

// ── 브리핑 (역전재판식 VN 시퀀스) ─────────────────────────────────────────
function BriefingVN({ onDone }) {
  const beats = [
    { loc: '프롤로그', text: briefing.subtitle },
    ...briefing.lines.map((l) => ({ text: l })),
    { text: '당신은 수사관이다. 현장을 조사하고 용의자를 심문해, 누가·어떻게·왜 죽였는지 밝혀라.' },
  ];
  const [i, setI] = useState(0);
  const beat = beats[Math.min(i, beats.length - 1)];
  const last = i >= beats.length - 1;
  return (
    <div className="aa-fs">
      <div className="aa-stage"><BriefingArt fill /></div>
      <div className="aa-loc-chip">사건 브리핑 · {victim.name}({victim.age})</div>
      <DialogueBox location={beat.loc} text={beat.text}
        onAdvance={() => { if (last) onDone(); else setI((n) => n + 1); }}
        hint={last ? '▶ 현장으로' : `${i + 1}/${beats.length} · 탭하여 다음`} />
      <CommandBar items={[{ icon: '⏭', label: '건너뛰기', onClick: onDone }]} />
    </div>
  );
}

// ── 중간 사건 — 1차 심문 완료 후 부검 소견 도착(살인 전환) 연출 ───────────────
function EventVN({ onDone }) {
  const beats = [
    { loc: '무전', text: '"…수사관님, 국과수입니다. 김호치 목사 1차 부검 소견이 나왔습니다."' },
    { loc: '부검 소견', text: '"사인은 단순 심장 발작이 아닙니다. 코와 입 주변의 압박흔, 안면의 점상출혈 — 질식 소견입니다."' },
    { loc: '수사 전환', text: '단순 발작사가 아니다. 사건은 지금부로 살인 사건으로 전환된다.' },
    { text: '통제 중이던 목사님 방이 개방되었다. 압수했던 CCTV 원본과 관계자 휴대폰도 열람할 수 있다.' },
    { text: '감식반이 합류했다. 채취물을 가져가면 감식 의뢰실에서 분석을 맡길 수 있다 — 단, 결과가 나오기까지는 시간이 걸린다.' },
    { text: '…낮의 진술들을 물증으로 검증할 차례다. 거짓말은 반드시 무너진다.' },
  ];
  const [i, setI] = useState(0);
  const beat = beats[Math.min(i, beats.length - 1)];
  const last = i >= beats.length - 1;
  return (
    <div className="aa-fs">
      <div className="aa-stage" style={{ background: 'radial-gradient(120% 100% at 50% 0%, #2a1214 0%, #140a0c 55%, #07050a 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 40% at 50% 30%, #c0585822, transparent 70%)', animation: 'aablink 2.2s ease-in-out infinite' }} />
      </div>
      <div className="aa-loc-chip" style={{ color: '#e07a7a', borderColor: '#e07a7a44' }}>🚨 중간 사건 · 부검 소견</div>
      <DialogueBox location={beat.loc} text={beat.text}
        onAdvance={() => { if (last) onDone(); else setI((n) => n + 1); }}
        hint={last ? '▶ 전면 조사 시작' : `${i + 1}/${beats.length} · 탭하여 다음`} />
      <CommandBar items={[{ icon: '⏭', label: '건너뛰기', onClick: onDone }]} />
    </div>
  );
}

// ── 장면(역전재판식 풀블리드: 조사/이야기/이동 + 법정기록) ────────────────────
function SceneView({ location, collectedSet, roomSuspect, collectedClues, lab, onTalk, onOpen, onLockedToast, onBack }) {
  const [examine, setExamine] = useState(true);
  const [record, setRecord] = useState(false);
  if (!location) return null;
  return (
    <div className="aa-fs">
      <div className="aa-stage"><SceneBg location={location} /></div>
      <div className="aa-loc-chip">🔦 {location.label}</div>

      {examine && location.showBody && (
        <button className="s-zone body" style={{ left: '50%', top: '46%', '--s': 1.1 }} onClick={() => onOpen('__body__')} aria-label="시신 조사">
          <span className="s-zone-ground" />
          <span className="s-zone-glow" />
          <span className="s-zone-lab">시신</span>
        </button>
      )}
      {examine && location.objects.map((code, i) => {
        const c = getClue(code); if (!c) return null;
        const have = collectedSet.has(code);
        const p = posFor(location, i);
        const isGamsik = c.type === '감식';
        const req = isGamsik && lab ? lab.requested(code) : false;
        const zoneLab = have ? c.title
          : isGamsik && lab ? (req ? '🔬 분석 중…' : lab.ready(code) ? '🔬 감식 의뢰' : '채취물 필요')
          : '조사';
        return (
          <button key={code} className={`s-zone${have ? ' have' : ''}${req && !have ? ' req' : ''}`} style={{ left: `${p.x}%`, top: `${p.y}%`, '--s': p.s }}
            aria-label={zoneLab}
            onClick={() => {
              if (isGamsik && !have) {
                // 감식은 '의뢰 → 2차 심문 때 결과' 흐름 (2차 개방 후엔 즉시 결과)
                if (!lab || !lab.ready(code)) { onLockedToast('🧪 채취물이 부족합니다 — 관련 실물 단서를 먼저 확보하세요'); return; }
                if (lab.stage >= 3) { onOpen(code); return; }
                if (req) { onLockedToast('🔬 분석 중입니다 — 2차 심문이 열리면 결과가 도착합니다'); return; }
                lab.request(code); return;
              }
              onOpen(code);
            }}>
            <span className="s-zone-ground" />
            <span className="s-zone-glow" />
            {have && <span className="s-zone-check">✓</span>}
            <span className="s-zone-lab">{zoneLab}</span>
          </button>
        );
      })}

      {roomSuspect && onTalk && (
        <button className="s-figure" onClick={() => onTalk(roomSuspect.id)}>
          <Avatar person={roomSuspect.name} image={roomSuspect.image} size={76} />
          <span className="s-figure-lab">💬 {roomSuspect.name}</span>
        </button>
      )}

      <DialogueBox location={location.label}
        text={examine ? ('그림 속 빛나는 곳을 눌러 조사하자.' + (roomSuspect ? ' 인물과 이야기할 수도 있다.' : '')) : '무엇을 할까?'} />

      <CommandBar items={[
        { icon: '🔍', label: '조사한다', active: examine, onClick: () => setExamine((e) => !e) },
        roomSuspect && { icon: '💬', label: '이야기한다', onClick: () => onTalk(roomSuspect.id) },
        { icon: '📁', label: '법정기록', onClick: () => setRecord(true) },
        { icon: '🚶', label: '이동한다', onClick: onBack },
      ]} />

      {record && (
        <div className="aa-record">
          <button className="aa-close" onClick={() => setRecord(false)}>✕</button>
          <h3>법정기록 · 확보한 단서 ({collectedClues.length})</h3>
          {collectedClues.length === 0
            ? <p style={{ color: 'var(--muted)' }}>아직 확보한 단서가 없습니다. 현장을 조사하세요.</p>
            : <div className="s-grid">
                {collectedClues.map((c) => (
                  <button key={c.code} className="s-card" onClick={() => { setRecord(false); onOpen(c.code); }}>
                    <div className="ck">{clueIcon(c)}</div>
                    <div className="cn" style={{ fontSize: '.85rem' }}>{c.title}</div>
                    <div className="cm">{c.person}</div>
                  </button>
                ))}
              </div>}
        </div>
      )}
    </div>
  );
}

function BodyNote({ body }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 12 }}>
      <button className="s-btn ghost sm" onClick={() => setOpen((o) => !o)}>🛏 {body.label || '시신'} 상세 {open ? '▲' : '▼'}</button>
      {open && <p className="s-detail" style={{ marginTop: 8, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: 12 }}>{body.detail}</p>}
    </div>
  );
}

// ── 단서 열람 모달 ─────────────────────────────────────────────────────────
function ClueModal({ code, collectedSet, difficulty, onClose, onCollect, onOpen }) {
  const isBody = code === '__body__';
  const c = isBody ? null : getClue(code);
  const [page, setPage] = useState(0);

  // 열람 시 확보(신규면 수집 + 특수 연쇄)
  useEffect(() => { if (!isBody && !collectedSet.has(code)) onCollect(code); /* eslint-disable-next-line */ }, [code]);

  if (isBody) {
    return <Shell title="시신" onClose={onClose}><p className="s-detail">침대 위에서 숨진 채 발견되었습니다. 얼굴에 눌린 자국 · 협심증 발작 직후 정황. 성분·접촉흔은 개별 감식으로 확인하세요.</p></Shell>;
  }
  if (!c) return <Shell title="?" onClose={onClose}><p>단서를 찾을 수 없습니다.</p></Shell>;

  const tag = c.type && c.type !== '보통' ? <span className="s-tag">{c.type}</span> : null;
  const person = c.person && c.person !== '공용' ? <span className="s-tag">{c.person}</span> : null;

  // 페이지형
  if (Array.isArray(c.pages) && c.pages.length) {
    const pg = c.pages[Math.min(page, c.pages.length - 1)];
    if (pg?.unlocks && !collectedSet.has(pg.unlocks)) onCollect(pg.unlocks);
    return (
      <Shell title={<>{c.title}{tag}{person}</>} onClose={onClose}>
        {pg.image && <img src={pg.image} alt="" />}
        <div style={{ fontWeight: 800, marginBottom: 6 }}>{pg.title}</div>
        <div className="s-detail">{pg.content}</div>
        <div className="s-pager">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← 이전</button>
          <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{page + 1} / {c.pages.length}</span>
          <button disabled={page >= c.pages.length - 1} onClick={() => setPage((p) => p + 1)}>다음 →</button>
        </div>
      </Shell>
    );
  }

  // CCTV형
  if (c.cctv) {
    return (
      <Shell title={<>{c.title}{tag}</>} onClose={onClose}>
        {c.detail && <p className="s-detail" style={{ marginBottom: 10 }}>{c.detail}</p>}
        {(c.cctv.timeline || []).map((t, i) => (
          <div className="s-tl-row" key={i}>
            <div className="s-tl-t">{t.time || t.label || ''}</div>
            <div style={{ flex: 1 }}>
              <div>{t.desc || t.caption || t.note || ''}</div>
              {(t.people || []).filter((p) => p.unlocks).map((p, j) => (
                <button key={j} className="s-person-btn" disabled={collectedSet.has(p.unlocks)}
                  onClick={() => onCollect(p.unlocks)}>
                  {collectedSet.has(p.unlocks) ? '✓ ' : '❓ '}{p.label || p.name || '인물 확인'}
                </button>
              ))}
            </div>
          </div>
        ))}
      </Shell>
    );
  }

  // 폰형
  if (c.phone) {
    return <PhoneModal code={code} clue={c} collectedSet={collectedSet} difficulty={difficulty} onClose={onClose} />;
  }

  // 기본형(이미지 + 상세/설명)
  return (
    <Shell title={<>{c.title}{tag}{person}</>} onClose={onClose}>
      {c.image && <img src={c.image} alt="" />}
      <div className="s-detail">{c.detail || c.description || '특별한 설명이 없습니다.'}</div>
      {Array.isArray(c.unlockedBy) && c.unlockedBy.length > 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '.78rem', marginTop: 10 }}>🔗 연관 단서를 모으면 새로운 사실이 드러날 수 있습니다.</p>
      )}
    </Shell>
  );
}

function Shell({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="s-modal-ov" onClick={onClose}>
      <div className="s-modal" onClick={(e) => e.stopPropagation()}>
        <div className="s-modal-h"><div className="mt">{title}</div><button className="mx" onClick={onClose}>✕</button></div>
        <div className="s-modal-b">{children}</div>
      </div>
    </div>
  );
}

// ── 폰 모달 ────────────────────────────────────────────────────────────────
function PhoneModal({ code, clue, difficulty, onClose }) {
  const apps = clue.phone.apps || [];
  const [appId, setAppId] = useState(apps[0]?.id || null);
  const [recovered, setRecovered] = useState(false);
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [lookup, setLookup] = useState('');
  const [lookupRes, setLookupRes] = useState(null);
  const app = apps.find((a) => a.id === appId) || apps[0];
  const recoverProtected = provider.isRecoverProtected(code);

  const tryRecover = async () => {
    const ok = await provider.verifyRecover(code, pw);
    if (ok) { setRecovered(true); setMsg(''); } else setMsg('비밀번호가 맞지 않습니다.');
  };
  const tryLookup = async () => {
    const res = await provider.verifyLookup(code, lookup);
    setLookupRes(res.ok ? (res.result || '조회 결과가 확인되었습니다.') : (app?.lookup?.notFound || '조회되지 않습니다.'));
  };

  return (
    <Shell title={<>{clue.title}<span className="s-tag">휴대폰</span></>} onClose={onClose}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {apps.map((a) => (
          <button key={a.id} className="s-btn sm ghost" style={appId === a.id ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : {}} onClick={() => setAppId(a.id)}>{a.name || a.type}</button>
        ))}
      </div>

      {app?.type === 'contacts' && (
        <div>{(app.contacts || []).map((ct, i) => (<div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}>📇 {ct.name}</div>))}</div>
      )}

      {app?.type === 'photos' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {(app.photos || []).map((ph, i) => (
            <div key={i}>{ph.image && <img src={ph.image} alt="" />}<div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{ph.caption}</div></div>
          ))}
        </div>
      )}

      {app?.type === 'browser' && (
        <div>
          {(app.searches || []).map((s, i) => (
            <div key={i} style={{ marginBottom: 10 }}><div style={{ color: 'var(--gold)' }}>🔍 {s.query}</div><div style={{ fontWeight: 700 }}>{s.title}</div><div style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{s.snippet}</div></div>
          ))}
          {app.lookup && (
            <div style={{ background: 'var(--panel2)', border: '1px solid var(--line)', borderRadius: 10, padding: 12, marginTop: 8 }}>
              <div style={{ fontWeight: 700 }}>{app.lookup.site}</div>
              <div style={{ color: 'var(--muted)', fontSize: '.82rem', margin: '4px 0 8px' }}>{app.lookup.desc}</div>
              <div className="s-pw">
                <input value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder={app.lookup.placeholder || app.lookup.label} />
                <button className="s-btn sm" onClick={tryLookup}>조회</button>
              </div>
              {lookupRes && <p style={{ marginTop: 8, color: 'var(--gold)' }}>{lookupRes}</p>}
            </div>
          )}
        </div>
      )}

      {app?.type === 'kakao' && (
        <div>
          {(app.chats || []).map((ch, i) => {
            const hidden = ch.deleted && recoverProtected && !recovered;
            return (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>💬 {ch.name}{ch.deleted && <span className="s-tag" style={{ color: 'var(--danger)' }}>{recoverProtected && !recovered ? '삭제됨' : '복원됨'}</span>}</div>
                {hidden ? (
                  <div className="s-locked" style={{ background: 'var(--panel2)', borderRadius: 8 }}>
                    <div style={{ color: 'var(--muted)', fontSize: '.85rem' }}>🔒 삭제된 대화 — 톡서랍 복구 비밀번호 필요</div>
                    {difficulty === 'guide' && <div style={{ fontSize: '.75rem', color: 'var(--gold)', marginTop: 4 }}>힌트: {provider.debugSecret ? '' : ''}상대의 생일 4자리(다이어리에서)</div>}
                    <div className="s-pw"><input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="복구 비밀번호 4자리" /><button className="s-btn sm" onClick={tryRecover}>복구</button></div>
                    {msg && <div style={{ color: 'var(--danger)', fontSize: '.8rem', marginTop: 6 }}>{msg}</div>}
                  </div>
                ) : (
                  (ch.messages || []).map((m, j) => (
                    <div key={j} style={{ textAlign: m.from === 'me' ? 'right' : 'left', margin: '3px 0' }}>
                      <span style={{ display: 'inline-block', background: m.from === 'me' ? '#3a3320' : 'var(--panel2)', borderRadius: 10, padding: '6px 10px', maxWidth: '80%', fontSize: '.88rem' }}>{m.text}</span>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}

// ── 수사 수첩 ──────────────────────────────────────────────────────────────
function NotebookView({ state, onNotes, onOpen }) {
  const clues = state.collected.map((code) => getClue(code)).filter(Boolean);
  const byType = {};
  clues.forEach((c) => { (byType[c.type || '보통'] ||= []).push(c); });
  return (
    <>
      <div className="s-section-t">확보한 단서 ({clues.length})</div>
      {clues.length === 0 && <p style={{ color: 'var(--muted)' }}>아직 단서가 없습니다. 현장을 조사하세요.</p>}
      {Object.entries(byType).map(([t, list]) => (
        <div key={t} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '.78rem', color: 'var(--muted)', margin: '6px 0' }}>{t} · {list.length}</div>
          <div className="s-grid">
            {list.map((c) => (
              <button key={c.code} className="s-card" onClick={() => onOpen(c.code)}>
                <div className="ck">{clueIcon(c)}</div>
                <div className="cn" style={{ fontSize: '.9rem' }}>{c.title}</div>
                <div className="cm">{c.person}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="s-section-t">메모</div>
      <textarea value={state.notes} onChange={(e) => onNotes(e.target.value)} placeholder="추리 메모를 자유롭게 적으세요…"
        style={{ width: '100%', minHeight: 120, background: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 10, padding: 12, fontFamily: 'inherit', fontSize: '.95rem' }} />
    </>
  );
}

// ── 사건 파일(최종 제출) ───────────────────────────────────────────────────
function CaseFileView({ state, stageLocked, stageLabel, onSet, onSubmit }) {
  const submitted = state.submitted && state.result;
  const per = state.result?.per || {};
  const filledAll = suspects.every((s) => { const g = state.casefile?.[s.id]; return g?.role && g?.method && g?.motive; });
  return (
    <>
      <div className="s-section-t">사건 파일 — 인물별로 판정하세요</div>
      <p style={{ color: 'var(--muted)', fontSize: '.84rem', marginTop: 0 }}>각 용의자의 <b>역할·한 일·동기</b>를 고르세요. 제출하면 채점되고 전말이 공개됩니다.</p>
      {suspects.map((s) => {
        const g = state.casefile?.[s.id] || {};
        const v = per[s.id];
        const cls = submitted ? (v && v.role && v.method && v.motive ? ' correct' : ' wrong') : '';
        return (
          <div key={s.id} className={`s-cf-row${cls}`}>
            <div className="s-cf-name">{s.name} <span className="s-tag">{s.occupation}</span></div>
            <div className="s-cf-field">
              <label>역할</label>
              <select value={g.role || ''} disabled={submitted} onChange={(e) => onSet(s.id, 'role', e.target.value)}>
                <option value="">선택…</option>
                {caseKey.roles.map((r) => (<option key={r} value={r}>{r}</option>))}
              </select>
            </div>
            <div className="s-cf-field">
              <label>한 일(결정적 행위)</label>
              <select value={g.method || ''} disabled={submitted} onChange={(e) => onSet(s.id, 'method', e.target.value)}>
                <option value="">선택…</option>
                {caseKey.methods.map((m) => (<option key={m.id} value={m.id}>{m.label}</option>))}
              </select>
            </div>
            <div className="s-cf-field">
              <label>동기</label>
              <select value={g.motive || ''} disabled={submitted} onChange={(e) => onSet(s.id, 'motive', e.target.value)}>
                <option value="">선택…</option>
                {caseKey.motives.map((m) => (<option key={m.id} value={m.id}>{m.label}</option>))}
              </select>
            </div>
            {submitted && v && (
              <div className="s-verdict">
                <span className={v.role ? 'c' : 'w'}>{v.role ? '✓' : '✗'} 역할</span>{' · '}
                <span className={v.method ? 'c' : 'w'}>{v.method ? '✓' : '✗'} 행위</span>{' · '}
                <span className={v.motive ? 'c' : 'w'}>{v.motive ? '✓' : '✗'} 동기</span>
              </div>
            )}
          </div>
        );
      })}
      {!submitted && (
        <div style={{ textAlign: 'center', margin: '18px 0' }}>
          {stageLocked ? (
            <div style={{ color: 'var(--muted)', fontSize: '.85rem', lineHeight: 1.7 }}>🔒 2부(전면 공개)까지 조사를 마쳐야 제출할 수 있습니다.<br />현재 단계: <b>{stageLabel}</b></div>
          ) : (
            <button className="s-btn" disabled={!filledAll} style={!filledAll ? { opacity: 0.5 } : {}} onClick={onSubmit}>
              {filledAll ? '사건 파일 제출 →' : '모든 인물을 채워주세요'}
            </button>
          )}
        </div>
      )}
    </>
  );
}

// ── 용의자 심문 (방 안에서 대화하며 반대신문) ────────────────────────────────
//   방 배경을 그대로 두고 인물과 마주 서서 대화한다(별도 페이지 X).
//   증언을 한 토막씩 대사창에 띄우고(◀▶), 추궁/증거제시로 모순을 잡는다.
//   증거 제시 목록은 '이 인물과 관련 있는 단서'로만 좁힌다. 대화(추궁)로 증언 단서 확보.
function CrossExamView({ suspect, location, state, collectedClues, phase = 1, onPress, onPresent, onExit }) {
  const [idx, setIdx] = useState(0);
  // 대사창 오버라이드: { text, kind } — 진입 시 인사말(1차/2차 다름)부터
  const [line, setLine] = useState(() => (suspect ? { text: introOf(suspect.id, phase), kind: 'intro' } : null));
  const [picker, setPicker] = useState(false);
  const [cutin, setCutin] = useState(null); // 모순! 컷인
  const [record, setRecord] = useState(false);
  const [shake, setShake] = useState(false);

  const sid = suspect?.id;
  const collected = state.collected || [];
  const unlocked = state.stUnlocked?.[sid] || [];
  const broke = state.broke?.[sid] || [];
  const trust = state.trust?.[sid] ?? TRUST_MAX;
  const statements = sid ? visibleStatements(sid, collected, unlocked, phase) : [];
  const brokeOf = (id) => broke.find((e) => e.id === id);
  const confessed = broke.some((e) => e.confess);

  const total = statements.length;
  const safeIdx = total ? Math.min(idx, total - 1) : 0;
  const cur = total ? statements[safeIdx] : null;
  const bk = cur ? brokeOf(cur.id) : null;

  // 이 인물과 관련 있는 '증거'만 제시 목록에 노출(모순·반응 코드 + 인물 소속 단서, 증언은 제외)
  const rel = sid ? relatedCodes(sid) : new Set();
  const isRelated = (c) => c.type !== '증언' && (rel.has(c.code) || c.person === suspect?.name);
  const presentable = collectedClues.filter(isRelated);

  if (!suspect) return null;

  const nav = (d) => { setLine(null); setPicker(false); setIdx((i) => total ? (Math.min(i, total - 1) + d + total) % total : 0); };

  const doPress = () => {
    if (!cur) return;
    setPicker(false);
    const r = onPress(cur.id) || {};
    let extra = '';
    if (r.grants) { const t = getClue(r.grants); if (t) extra = `\n🗣 증언 확보 — ${t.title}`; }
    setLine({ text: (r.text || '…') + extra, kind: 'press' });
  };

  const doPresent = (code) => {
    if (!cur) return;
    setPicker(false);
    const r = onPresent(cur.id, code) || {};
    if (r.result === 'contradict') {
      setCutin('모순!');
      setTimeout(() => setCutin((c) => (c === '모순!' ? null : c)), 1300);
      setLine({ text: (r.text || '') + (r.confess ? '\n⚖️ …(관여를 인정합니다.)' : ''), kind: 'break' });
    } else if (r.result === 'soft') {
      setLine({ text: r.text || '', kind: 'soft' });
    } else {
      setShake(true); setTimeout(() => setShake(false), 480);
      setLine({ text: '그건 저와는 상관없는 물건이잖아요. 왜 저한테…', kind: 'wrong' });
    }
  };

  const dlgText = line ? line.text
    : cur ? cur.text
    : '…(지금은 더 들을 말이 없다. 단서를 모으거나 수사가 진행되면 새 증언이 열린다.)';
  const dlgLoc = line
    ? (line.kind === 'break' ? '❗ 모순을 짚었다' : line.kind === 'wrong' ? '심기가 불편하다' : line.kind === 'intro' ? (phase >= 2 ? '2차 심문' : '심문 시작') : '추궁')
    : (bk ? '✅ 모순을 잡은 증언' : `${suspect.name}의 증언`);
  const dlgHint = line ? '탭하여 계속 ▶'
    : total ? `증언 ${safeIdx + 1}/${total}${bk ? ' · 이미 모순을 짚음' : ' · ◀ ▶ 로 넘기기'}` : '';

  return (
    <div className={`aa-fs${shake ? ' aa-shake' : ''}`}>
      <div className="aa-stage">
        {location ? <SceneBg location={location} />
          : <div className="aa-court" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 50% 0%, #1a2233 0%, #0a0e16 60%, #05070b 100%)' }} />}
      </div>
      <div className="aa-loc-chip">⚖️ {location?.label ? `${location.label} · ` : ''}{suspect.name} {phase >= 2 ? '2차 심문' : '심문'}</div>
      <div className="aa-hp" title="신뢰도">
        <span style={{ color: '#e8706e' }}>{'♥'.repeat(trust)}</span><span style={{ opacity: .28 }}>{'♡'.repeat(TRUST_MAX - trust)}</span>
      </div>

      <div className="aa-room-fig">
        {confessed && <div className="aa-court-tag">⚖️ 관여 자백</div>}
        <Avatar person={suspect.name} image={suspect.image} size={160} />
        <div className="aa-court-name">{suspect.name}<span> · {suspect.occupation}</span></div>
      </div>

      {!line && total > 1 && (
        <div className="aa-tnav">
          <button onClick={() => nav(-1)} aria-label="이전 증언">◀</button>
          <span>{safeIdx + 1} / {total}</span>
          <button onClick={() => nav(1)} aria-label="다음 증언">▶</button>
        </div>
      )}

      {cutin && <div className="aa-cutin"><span>{cutin}</span></div>}

      <DialogueBox location={dlgLoc} speaker={line ? suspect.name : null} text={dlgText}
        onAdvance={line ? () => setLine(null) : undefined} hint={dlgHint} />

      <CommandBar items={[
        { icon: '🔎', label: '추궁', onClick: doPress },
        !bk && { icon: '📁', label: '증거 제시', active: picker, onClick: () => { setLine(null); setPicker((p) => !p); } },
        { icon: '📑', label: '법정기록', onClick: () => { setPicker(false); setRecord(true); } },
        { icon: '↩', label: '돌아가기', onClick: onExit },
      ]} />

      {picker && !bk && (
        <div className="aa-present">
          <div className="aa-present-h">
            <span>이 증언에 들이댈 증거 — <b>{suspect.name}</b> 관련</span>
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
          <h3>법정기록 · 확보한 단서 ({collectedClues.length})</h3>
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
