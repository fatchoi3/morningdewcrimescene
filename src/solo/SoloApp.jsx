import { useEffect, useMemo, useState } from 'react';
import { soloContent } from './soloContent.js';
import { introOf, visibleStatements, pressOf, presentOn } from './interrogation.js';
import { loadSave, saveSave, defaultState, clearSave } from './soloStore.js';
import { SceneBg, Avatar, BriefingArt, EndingArt } from './art.jsx';

const { briefing, suspects, victim, locations, caseKey, provider, clueIcon, getClue, crimeSceneCodes, suspectIds } = soloContent;

// 수사 단계 — 자동 개방(퍼즐/탐정). 가이드는 처음부터 전부 개방.
const STAGE_LABEL = { 1: '1부 · 탐문', 2: '중간점검 · 현장 조사', 3: '2부 · 전면 공개' };
const STAGE_BANNER = {
  2: '🔓 중간점검 개방 — 목사님 방·감식실·CCTV가 열렸습니다',
  3: '🔓 2부 개방 — 압수한 휴대폰이 모두 열렸습니다',
};
const SCENE_NEEDED = 3; // 단계 2→3: 목사방 현장 단서 이만큼 확보
const TRUST_MAX = 5;    // 신뢰도(HP)

function interrogatedCount(state) {
  const pressed = state.pressed || {};
  return suspectIds.filter((id) => (pressed[id] || []).length >= 1).length;
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
  ? `🔒 중간점검에 열림 — 용의자 ${suspectIds.length}명을 모두 심문하세요`
  : locStage === 3
    ? `🔒 2부에 열림 — 목사님 방(현장)에서 단서 ${SCENE_NEEDED}개를 찾으세요`
    : '🔒 잠김';

const DIFFS = [
  { id: 'guide', name: '가이드', desc: '단서가 술술 열리고 비번 힌트도 보입니다. 부담 없이.' },
  { id: 'puzzle', name: '퍼즐', desc: '비번·연결을 스스로 풀어야 열립니다. 추리게임다운 도전.' },
  { id: 'detective', name: '탐정', desc: '힌트 최소. 모든 걸 스스로 엮어야 합니다.' },
];

// 장면 핫스팟 위치(스캐터) — index 기반 결정적 배치
const HOT = [
  { x: 24, y: 36 }, { x: 52, y: 30 }, { x: 78, y: 38 }, { x: 34, y: 58 },
  { x: 63, y: 55 }, { x: 20, y: 76 }, { x: 47, y: 79 }, { x: 75, y: 74 },
  { x: 88, y: 58 }, { x: 12, y: 56 }, { x: 50, y: 70 }, { x: 38, y: 42 },
];
const posFor = (i) => HOT[i % HOT.length];

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
  const stage = state.difficulty === 'guide' ? 3 : computeStage(state);
  // 새 단계 개방 시 1회 배너 알림
  useEffect(() => {
    if (state.difficulty === 'guide') return;
    if (stage > (state.stageSeen || 1)) { showToast(STAGE_BANNER[stage]); update({ stageSeen: stage }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function collect(code) {
    if (collectedSet.has(code)) return { added: [] };
    const set = new Set(state.collected);
    set.add(code);
    const autos = soloContent.computeAutoUnlocked(set) || []; // set을 변형하며 특수/감식 연쇄 해금
    update({ collected: [...set] });
    const c = getClue(code);
    showToast(`단서 확보: ${c?.title || code}${autos.length ? ` (+특수 ${autos.length})` : ''}`);
    return { added: [code, ...autos.map((a) => a.code)] };
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

  // ── 브리핑 ──────────────────────────────────────────────────────────────
  if (state.screen === 'briefing') {
    return (
      <div className="solo-wrap">
        <div className="s-body" style={{ paddingTop: 24 }}>
          <BriefingArt />
          <div className="s-eye" style={{ textAlign: 'center', marginTop: 14 }}>사건 브리핑</div>
          <h1 style={{ textAlign: 'center', marginTop: 6 }}>사건 개요</h1>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 14, margin: '16px 0' }}>
            <Avatar person={victim.name} image={victim.image} size={72} />
            <div>
              <div style={{ fontWeight: 800 }}>{victim.name} <span className="s-tag">피해자 · {victim.age}세</span></div>
              <div style={{ color: 'var(--muted)', fontSize: '.85rem', marginTop: 4 }}>{victim.occupation}</div>
            </div>
          </div>
          {briefing.lines.map((l, i) => (<p key={i} style={{ lineHeight: 1.8 }}>{l}</p>))}
          <p style={{ color: 'var(--muted)', fontSize: '.85rem', marginTop: 12 }}>단서를 모으고 용의자를 심문한 뒤, [사건 파일]에서 인물별로 누가·어떻게·왜 했는지 제출하면 채점과 함께 전말이 공개됩니다.</p>
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button className="s-btn" onClick={() => goHub('places')}>현장으로 →</button>
          </div>
        </div>
      </div>
    );
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

  // ── 메인(허브/장면/용의자) ────────────────────────────────────────────────
  const topH = sceneId ? (locations.all.find((l) => l.id === sceneId)?.label)
    : suspectId ? '용의자 심문'
    : state.hubTab === 'suspects' ? '용의자'
    : state.hubTab === 'notebook' ? '수사 수첩'
    : state.hubTab === 'casefile' ? '사건 파일'
    : '현장';

  return (
    <div className="solo-wrap">
      <div className="s-top">
        {(sceneId || suspectId) ? (
          <button className="s-back" onClick={() => goHub()}>← 뒤로</button>
        ) : (
          <button className="s-back" onClick={() => update({ screen: 'start' })}>≡</button>
        )}
        <div className="s-h">{topH}</div>
        <div className="s-count">단서 {state.collected.length}</div>
      </div>

      <div className="s-body">
        {sceneId ? (
          <SceneView location={locations.all.find((l) => l.id === sceneId)} collectedSet={collectedSet}
            roomSuspect={suspects.find((s) => s.name === locations.all.find((l) => l.id === sceneId)?.person)}
            onTalk={(id) => { setSceneId(null); setSuspectId(id); }}
            onOpen={(code) => setModalCode(code)} onLockedToast={showToast} difficulty={state.difficulty} />
        ) : suspectId ? (
          <CrossExamView suspect={suspects.find((s) => s.id === suspectId)} state={state}
            collectedClues={state.collected.map((c) => getClue(c)).filter((c) => c && c.type !== '방')}
            onPress={(stId) => {
              const r = pressOf(suspectId, stId);
              const pr = { ...(state.pressed || {}) };
              pr[suspectId] = [...new Set([...(pr[suspectId] || []), stId])];
              const patch = { pressed: pr };
              if (r.unlock) { const u = { ...(state.stUnlocked || {}) }; u[suspectId] = [...new Set([...(u[suspectId] || []), r.unlock])]; patch.stUnlocked = u; }
              update(patch);
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
                showToast('❗모순을 잡았습니다!');
              } else if (r.result === 'soft') {
                showToast(r.text.length > 42 ? r.text.slice(0, 40) + '…' : r.text);
              } else {
                const t = Math.max(0, (state.trust ?? TRUST_MAX) - 1);
                if (t <= 0) { update({ trust: TRUST_MAX }); setSuspectId(null); showToast('⚠ 신뢰도가 바닥났습니다 — 잠시 정비 후 다시 심문하세요'); }
                else { update({ trust: t }); showToast(`관계없는 증거입니다. (신뢰도 -1 · 남은 ${t})`); }
              }
            }} />
        ) : state.hubTab === 'suspects' ? (
          <>
            <div className="s-section-t">용의자 6인 — 탭하여 심문</div>
            <div className="s-grid">
              {suspects.map((s) => (
                <button key={s.id} className="s-card" onClick={() => { setSuspectId(s.id); }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}><Avatar person={s.name} image={s.image} size={48} /></div>
                  <div className="cn">{s.name}</div>
                  <div className="cm">{s.occupation}</div>
                  {state.broke?.[s.id]?.length ? <span className="cbadge">모순 {state.broke[s.id].length}</span> : null}
                </button>
              ))}
            </div>
          </>
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
                {stage === 1 ? '다음: 6명 모두 심문하면 현장·감식·CCTV 개방'
                  : stage === 2 ? '다음: 목사방에서 단서를 모으면 휴대폰 개방'
                  : '모든 장소가 개방되었습니다'}
              </div>
            </div>
            <div className="s-section-t">현장 · 장소</div>
            <div className="s-grid">
              {locations.rooms.map((l) => {
                const locked = l.stage > stage;
                return <LocCard key={l.id} loc={l} collectedSet={collectedSet} locked={locked}
                  onClick={locked ? () => showToast(stageHint(l.stage)) : () => setSceneId(l.id)} />;
              })}
            </div>
            <div className="s-section-t">조사 시설</div>
            <div className="s-grid">
              {locations.tools.map((l) => {
                const locked = l.stage > stage;
                return <LocCard key={l.id} loc={l} collectedSet={collectedSet} locked={locked}
                  onClick={locked ? () => showToast(stageHint(l.stage)) : () => setSceneId(l.id)} />;
              })}
            </div>
          </>
        )}
      </div>

      {/* 하단 탭바 */}
      <div className="s-tabs">
        {[['places', '🗺️', '현장'], ['suspects', '🧑', '용의자'], ['notebook', '📓', '수첩'], ['casefile', '📂', '사건파일']].map(([id, ic, nm]) => (
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
function LocCard({ loc, collectedSet, locked, onClick }) {
  const total = loc.objects.length;
  const got = loc.objects.filter((c) => collectedSet.has(c)).length;
  const icon = loc.kind === 'room' ? (loc.person === '목사' ? '⚰️' : '🚪') : loc.kind === 'cctv' ? '📹' : loc.kind === 'phone' ? '📱' : loc.kind === 'lab' ? '🔬' : '📍';
  return (
    <button className="s-card" onClick={onClick} style={locked ? { opacity: 0.55, borderStyle: 'dashed' } : null}>
      <div className="ck">{locked ? '🔒' : icon}</div>
      <div className="cn">{loc.label}</div>
      {locked
        ? <div className="cm">{loc.stage === 2 ? '중간점검에 열림' : '2부에 열림'}</div>
        : <div className="cm">단서 {got}/{total}</div>}
      {!locked && got === total && total > 0 ? <span className="cbadge">탐색 완료</span> : null}
    </button>
  );
}

// ── 장면(포인트앤클릭) ─────────────────────────────────────────────────────
function SceneView({ location, collectedSet, roomSuspect, onTalk, onOpen, onLockedToast, difficulty }) {
  if (!location) return null;
  return (
    <>
      <div className="s-scene" style={{ background: '#0b0d12' }}>
        <SceneBg location={location} />
        <div className="s-scene-hint">🔦 {location.label} — 빛나는 지점을 눌러 조사{roomSuspect ? ' · 인물을 눌러 심문' : ''}{location.showBody ? ' · 🛏 시신 확인' : ''}</div>
        {roomSuspect && onTalk && (
          <button className="s-figure" onClick={() => onTalk(roomSuspect.id)}>
            <Avatar person={roomSuspect.name} image={roomSuspect.image} size={76} />
            <span className="s-figure-lab">{roomSuspect.name} · 심문</span>
          </button>
        )}
        {location.showBody && (
          <div className="s-hot" style={{ left: '50%', top: '20%' }} onClick={() => onOpen('__body__')}>
            <div className="dot" style={{ borderColor: '#c06868', background: '#2a1414' }}>🛏</div>
            <div className="lab">시신</div>
          </div>
        )}
        {location.objects.map((code, i) => {
          const c = getClue(code); if (!c) return null;
          const have = collectedSet.has(code);
          const p = posFor(i);
          return (
            <div key={code} className={`s-hot${have ? ' have' : ''}`} style={{ left: `${p.x}%`, top: `${p.y}%` }}
              onClick={() => {
                if (c.type === '감식' && !have) { onLockedToast('아직 분석 결과가 없습니다 — 관련 단서를 더 찾으세요'); return; }
                onOpen(code);
              }}>
              <div className="dot">{have ? '✓' : clueIcon(c)}</div>
              <div className="lab">{have ? c.title : '???'}</div>
            </div>
          );
        })}
      </div>
      {location.showBody && location.body && <BodyNote body={location.body} />}
    </>
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

// ── 용의자 심문 ────────────────────────────────────────────────────────────
function CrossExamView({ suspect, state, collectedClues, onPress, onPresent }) {
  const [presentFor, setPresentFor] = useState(null); // 증거 제시 대상 증언 id
  if (!suspect) return null;
  const sid = suspect.id;
  const collected = state.collected || [];
  const unlocked = state.stUnlocked?.[sid] || [];
  const pressed = state.pressed?.[sid] || [];
  const broke = state.broke?.[sid] || [];
  const trust = state.trust ?? TRUST_MAX;
  const statements = visibleStatements(sid, collected, unlocked);
  const brokeOf = (id) => broke.find((e) => e.id === id);
  const confessed = broke.some((e) => e.confess);

  return (
    <>
      <div className="s-dossier">
        <Avatar person={suspect.name} image={suspect.image} size={64} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{suspect.name} <span className="s-tag">{suspect.age}세</span></div>
          <div style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{suspect.occupation}</div>
        </div>
        <div title="신뢰도" style={{ fontSize: '1.05rem', letterSpacing: 1, whiteSpace: 'nowrap' }}>
          <span style={{ color: '#e06a6a' }}>{'♥'.repeat(trust)}</span><span style={{ opacity: 0.3 }}>{'♡'.repeat(TRUST_MAX - trust)}</span>
        </div>
      </div>
      <p style={{ lineHeight: 1.7, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: 12, fontStyle: 'italic', color: '#cfcabb' }}>“{introOf(sid)}”</p>

      <div className="s-section-t">증언 — 추궁하거나 증거를 들이대세요</div>
      {statements.map((v) => {
        const bk = brokeOf(v.id);
        const wasPressed = pressed.includes(v.id);
        const pr = wasPressed ? pressOf(sid, v.id) : null;
        return (
          <div key={v.id} className="s-stmt" style={bk ? { borderColor: 'var(--gold)' } : null}>
            <div className="s-stmt-t">{bk ? '✅ ' : '💬 '}“{v.text}”</div>
            {pr && <div className="s-stmt-press">↳ {pr.text}</div>}
            {bk && <div className="s-stmt-break">{bk.text}{bk.confess ? ' ⚖️ (자백)' : ''}</div>}
            <div className="s-stmt-btns">
              <button className="s-btn ghost sm" onClick={() => onPress(v.id)}>🔎 추궁</button>
              {!bk && <button className="s-btn ghost sm" onClick={() => setPresentFor(presentFor === v.id ? null : v.id)}>📁 증거 제시</button>}
            </div>
            {presentFor === v.id && !bk && (
              collectedClues.length === 0
                ? <div style={{ color: 'var(--muted)', fontSize: '.82rem', marginTop: 8 }}>제시할 단서가 없습니다. 현장을 먼저 조사하세요.</div>
                : <div className="s-grid" style={{ marginTop: 8 }}>
                    {collectedClues.map((c) => (
                      <button key={c.code} className="s-card" onClick={() => { onPresent(v.id, c.code); setPresentFor(null); }}>
                        <div className="ck">{clueIcon(c)}</div>
                        <div className="cn" style={{ fontSize: '.82rem' }}>{c.title}</div>
                      </button>
                    ))}
                  </div>
            )}
          </div>
        );
      })}

      {confessed && (
        <div className="s-qa" style={{ borderColor: 'var(--danger)', marginTop: 12 }}>
          <div className="q">⚖️ 자백 확보</div>
          <div>이 인물의 관여를 자백받았습니다. [사건 파일]에 반영하세요.</div>
        </div>
      )}
      <p style={{ color: 'var(--muted)', fontSize: '.78rem', marginTop: 14 }}>💡 진술을 추궁하고, 모순되는 증거를 제시해 “모순!”을 잡으세요. 관련 단서를 더 모으면 새 증언이 열립니다. (엉뚱한 증거는 신뢰도 −1)</p>
    </>
  );
}
