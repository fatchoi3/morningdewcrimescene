// ─────────────────────────────────────────────────────────────────────────────
// features/hub — T자 복도 네비게이션(허브). 실사 배경 + 핫스팟.
//   main : 인물 방 6개 · 오른쪽→목사방 · 왼쪽→1층
//   pastor : 복도 끝 목사님 방(현장) · floor1 : CCTV·소지품 · lab : 감식 의뢰실
// ─────────────────────────────────────────────────────────────────────────────
import { stageHint } from '../lib/game.js';
import { locationAlerts, alertReason } from '../lib/alerts.js';
import { getClue } from '../content.js';
import { HallBg } from '../art.jsx';
import { cast } from '../../data/cast.js';

// main.jpg 위 방문 위치(%): 좌벽 근→원, 우벽 근→원 (배경 16:9를 16:9 무대에 cover)
// person 은 방 데이터와 맞춰야 하는 조회 키라 cast 에서 이름을 뽑는다.
const HALL_DOORS = [
  { person: cast.S1.name, x: 14, y: 58 },
  { person: cast.S6.name, x: 30, y: 55 },
  { person: cast.S2.name, x: 38, y: 53 },
  { person: cast.S4.name, x: 62, y: 53 },
  { person: cast.S3.name, x: 70.5, y: 55 },
  { person: cast.S5.name, x: 86.5, y: 58 },
];

function HallHot({ x, y, icon, label, sub, locked, tone, recommend, alert, alertTitle, onClick }) {
  return (
    <button className={`hall-hot${locked ? ' locked' : ''}${tone ? ' ' + tone : ''}`}
      data-tut={recommend ? 'door' : undefined}
      style={{ left: `${x}%`, top: `${y}%` }} onClick={onClick}>
      {/* 알림 배지 — 그 방에 아직 볼 것/물어볼 것이 남아 있을 때 */}
      {!locked && alert > 0 && <span className="s-alert" title={alertTitle}>!</span>}
      <span className="hall-hot-ic">{locked ? '🔒' : icon}</span>
      <span className="hall-hot-plate">{label}</span>
      {sub && <span className="hall-hot-sub">{sub}</span>}
    </button>
  );
}

export function HallNav({ locations, stage, progressStage, collectedSet, state, recommendPerson, admin, stageLabel, progressText, objective, canAccuse, view, onView, onEnter, onToast, onOpenRecord, onOpenMenu, onAccuse }) {
  // 각 장소에 '남은 거리'가 있으면 알림 배지를 띄운다(복도에서 어디로 갈지 바로 보이게)
  const alertsOf = (loc) => locationAlerts(loc, state || {}, stage, progressStage >= 3 ? 2 : 1);
  const roomByPerson = (person) => locations.rooms.find((l) => l.person === person);
  const pastor = locations.rooms.find((l) => l.person === '목사');
  const tool = (id) => locations.all.find((l) => l.id === id);
  const cctv = tool('LOC-CCTV'), lab = tool('LOC-LAB');

  const subOf = (loc, isCrime) => {
    if (loc.stage > stage) return isCrime ? '통제 중' : loc.stage === 2 ? '사건 후 개방' : '2차 개방';
    if (loc.kind !== 'room') return '열람';
    // 휴대폰은 2차 심문(stage 3)에 해금 — 그 전엔 방 탐색 진척도에서 제외
    const reach = loc.objects.filter((c) => stage >= 3 || !getClue(c)?.phone);
    const total = reach.length, got = reach.filter((c) => collectedSet.has(c)).length;
    return total > 0 && got === total ? '✓ 탐색완료' : `단서 ${got}/${total}`;
  };
  const enter = (loc, isCrime) => {
    if (!loc) return;
    if (loc.stage > stage) { onToast(isCrime ? '🚧 목사님 방은 경찰 통제 중입니다 — 부검 소견이 나오면 개방됩니다' : stageHint(loc.stage)); return; }
    onEnter(loc.id);
  };
  const here = view === 'main' ? '숙소 2층 복도 — 인물들의 방'
    : view === 'pastor' ? '복도 끝 — 목사님 방 (사건 현장)'
    : view === 'floor1' ? '1층 — CCTV 열람실'
    : '건물 밖 — 감식 의뢰실';

  return (
    <div className="aa-fs">
      <div className="hall-fit">
          <HallBg name={view} />

          {view === 'main' && HALL_DOORS.map((d) => {
            const loc = roomByPerson(d.person);
            if (!loc) return null;
            const a = alertsOf(loc);
            return <HallHot key={d.person} x={d.x} y={d.y} icon="🚪" label={loc.label}
              sub={subOf(loc, false)} locked={loc.stage > stage}
              alert={a.total} alertTitle={`${loc.label} — ${alertReason(a)}`}
              recommend={recommendPerson === d.person} onClick={() => enter(loc, false)} />;
          })}
          {view === 'main' && (
            <button className="hall-cctv" style={{ left: '50%', top: '20%' }} aria-label="복도 CCTV"
              onClick={() => onToast('복도 끝에 CCTV가 있다. 확인하려면 1층 CCTV 열람실로 가야겠다.')}>📹</button>
          )}
          {view === 'pastor' && pastor && (
            <HallHot x={50} y={50} icon="⚰️" tone="crime" label={pastor.label}
              sub={subOf(pastor, true)} locked={pastor.stage > stage}
              alert={alertsOf(pastor).total} alertTitle={`${pastor.label} — ${alertReason(alertsOf(pastor))}`}
              onClick={() => enter(pastor, true)} />
          )}
          {view === 'floor1' && cctv && (
            <HallHot x={50} y={52} icon="📹" label={cctv.label} sub={subOf(cctv)} locked={cctv.stage > stage}
              alert={alertsOf(cctv).total} alertTitle={`${cctv.label} — ${alertReason(alertsOf(cctv))}`}
              onClick={() => enter(cctv)} />
          )}
          {view === 'lab' && lab && (
            <HallHot x={43} y={56} icon="🔬" label={lab.label} sub={subOf(lab)} locked={lab.stage > stage}
              alert={alertsOf(lab).total} alertTitle={`${lab.label} — ${alertReason(alertsOf(lab))}`}
              onClick={() => enter(lab)} />
          )}
      </div>

      {/* 복도 위 HUD — 단계 안내(좌) + 수첩·메뉴(우) */}
      <div className="hall-hud">
        <div className="hall-hud-chip"><b>🔎 {stageLabel}</b><span>{progressText}</span>{objective && <span className="hall-objective">🎯 {objective}</span>}</div>
        <div className="hall-hud-btns">
          {admin && <span className="s-admin-chip">ADMIN</span>}
          <button data-tut="record-btn" className="hall-hud-btn" title="수첩(사건 기록)" onClick={onOpenRecord}>📓</button>
          <button className="hall-hud-btn" title="메뉴" onClick={onOpenMenu}>⚙</button>
        </div>
      </div>

      <div className="hall-here">📍 {here}</div>

      {canAccuse && view === 'main' && (
        <button className="hall-accuse" onClick={onAccuse}>🔍 범인 지목하기</button>
      )}

      <div className="hall-nav-row">
        {view === 'main' ? <>
          <button className="hall-arrow" onClick={() => stage < 2 ? onToast('아직 그쪽에 갈 일은 없어 보인다. 먼저 인물들의 방을 둘러보고 이야기부터 나눠보자.') : onView('floor1')}>
            {(alertsOf(cctv).total + alertsOf(lab).total) > 0 && <span className="s-alert" title="1층 쪽에 볼 것이 남아 있다">!</span>}◀ 왼쪽 · 1층</button>
          <button className="hall-arrow" onClick={() => stage < 2 ? onToast('아직 목사님 방에 갈 필요는 없다. 지금은 인물들부터 만나보자.') : onView('pastor')}>
            {alertsOf(pastor).total > 0 && <span className="s-alert" title="목사님 방에 볼 것이 남아 있다">!</span>}오른쪽 · 목사님 방 ▶</button>
        </> : view === 'floor1' ? <>
          <button className="hall-arrow" onClick={() => onView('main')}>◀ 복도로</button>
          {lab && <button className="hall-arrow" onClick={() => onView('lab')}>
            {alertsOf(lab).total > 0 && <span className="s-alert" title="감식 의뢰실에 처리할 것이 있다">!</span>}감식 의뢰실 ▶</button>}
        </> : <>
          <button className="hall-arrow" onClick={() => onView(view === 'lab' ? 'floor1' : 'main')}>◀ {view === 'lab' ? '1층으로' : '복도로'}</button>
          <span />
        </>}
      </div>
    </div>
  );
}
