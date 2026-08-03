// ─────────────────────────────────────────────────────────────────────────────
// features/hub — T자 복도 네비게이션(허브). 실사 배경 + 핫스팟.
//   main : 인물 방 6개 · 오른쪽→목사방 · 왼쪽→1층
//   pastor : 복도 끝 목사님 방(현장) · floor1 : CCTV·소지품 · lab : 감식 의뢰실
// ─────────────────────────────────────────────────────────────────────────────
import { useRef } from 'react';
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

// 모순이 남은 방만 붉게 — 잡담·주울 것만 남은 방은 호박색 '!'. solo.css 는 이 파일 소관이 아니라 인라인으로 둔다.
//   .s-alert 의 붉은 후광·맥동까지 덮어써야 색 구분이 온전히 읽힌다(글자도 어둡게 — 흰 '!'는 대비가 없다).
const ALERT_SOFT = {
  background: 'linear-gradient(180deg,#e8c76b,#b8912c)', borderColor: '#fff7e2',
  color: '#2a2114', boxShadow: '0 0 0 2px #00000059, 0 0 10px #e8c76b8c', animation: 'none',
};

function HallHot({ x, y, icon, label, sub, locked, tone, recommend, alert, alertKey = 0, alertTitle, onClick }) {
  return (
    <button className={`hall-hot${locked ? ' locked' : ''}${tone ? ' ' + tone : ''}`}
      data-tut={recommend ? 'door' : undefined}
      style={{ left: `${x}%`, top: `${y}%` }} onClick={onClick}>
      {/* 알림 배지 — 그 방에 아직 볼 것/물어볼 것이 남아 있을 때.
          모순이 남은 방은 그 개수를 붉게, 잡담·주울 것만 남은 방은 호박색 '!' —
          잡담까지 합산한 한 덩어리 숫자로는 어디부터 갈지 고를 수가 없다. */}
      {!locked && alert > 0 && (
        <span className="s-alert" title={alertTitle} style={alertKey > 0 ? undefined : ALERT_SOFT}>
          {alertKey > 0 ? alertKey : '!'}
        </span>
      )}
      <span className="hall-hot-ic">{locked ? '🔒' : icon}</span>
      <span className="hall-hot-plate">{label}</span>
      {sub && <span className="hall-hot-sub">{sub}</span>}
    </button>
  );
}

// ⚙ 운영자 메뉴 — 안에 '모든 단서 확보/비우기'가 있어 오탭 한 번이 곧 사고다.
//   수첩(📓) 바로 옆 42px 자리에서 떼어내고, 꾹 눌러야(600ms) 열리게 한다.
//   개발 빌드로 숨기지는 않는다 — 처음 화면·저장 초기화로 돌아가는 유일한 통로라서.
function MenuButton({ onOpen }) {
  const timer = useRef(null);
  const cancel = () => { clearTimeout(timer.current); timer.current = null; };
  return (
    <button className="hall-hud-btn" title="운영자 메뉴 — 길게 누르세요" aria-label="운영자 메뉴 — 길게 누르세요"
      style={{ marginLeft: 24, opacity: 0.5, userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'manipulation' }}
      onPointerDown={() => { cancel(); timer.current = setTimeout(onOpen, 600); }}
      onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}>⚙</button>
  );
}

export function HallNav({ locations, stage, progressStage, collectedSet, state, recommendPerson, admin, stageLabel, progressText, objective, canAccuse, accuseReady, view, onView, onEnter, onToast, onOpenRecord, onOpenMenu, onAccuse }) {
  // 각 장소에 '남은 거리'가 있으면 알림 배지를 띄운다(복도에서 어디로 갈지 바로 보이게)
  const alertsOf = (loc) => locationAlerts(loc, state || {}, stage, progressStage >= 3 ? 2 : 1);
  // 배지 관련 props 한 묶음 — 한 문패에 total·key·사유를 따로 계산하면 alertsOf 를 세 번 돈다
  const alertProps = (loc) => { const a = alertsOf(loc); return { alert: a.total, alertKey: a.key, alertTitle: `${loc.label} — ${alertReason(a)}` }; };
  const roomByPerson = (person) => locations.rooms.find((l) => l.person === person);
  const pastor = locations.rooms.find((l) => l.person === '목사');
  const tool = (id) => locations.all.find((l) => l.id === id);
  const cctv = tool('LOC-CCTV'), lab = tool('LOC-LAB');

  const subOf = (loc, isCrime) => {
    if (loc.stage > stage) return isCrime ? '통제 중' : loc.stage === 2 ? '사건 후 개방' : '2차 개방';
    // inner 가 있는 시설(CCTV 열람실)도 진척을 보여준다 — 열람대 하나만 세면 첫 진입에 '✓ 탐색완료'가
    //   되는데, 정작 2·3막 모순 대부분은 그 안의 컷들이라 화면이 '다 봤다'고 거짓말을 하게 된다.
    const counted = loc.kind === 'room' || loc.inner ? [...loc.objects, ...(loc.inner || [])] : null;
    if (!counted) return '열람';
    // 휴대폰은 2차 심문(stage 3)에 해금 — 그 전엔 방 탐색 진척도에서 제외
    const reach = counted.filter((c) => stage >= 3 || !getClue(c)?.phone);
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
            return <HallHot key={d.person} x={d.x} y={d.y} icon="🚪" label={loc.label}
              sub={subOf(loc, false)} locked={loc.stage > stage} {...alertProps(loc)}
              recommend={recommendPerson === d.person} onClick={() => enter(loc, false)} />;
          })}
          {view === 'main' && (
            <button className="hall-cctv" style={{ left: '50%', top: '20%' }} aria-label="복도 CCTV"
              onClick={() => onToast('복도 끝에 CCTV가 있다. 확인하려면 1층 CCTV 열람실로 가야겠다.')}>📹</button>
          )}
          {view === 'pastor' && pastor && (
            <HallHot x={50} y={50} icon="⚰️" tone="crime" label={pastor.label}
              sub={subOf(pastor, true)} locked={pastor.stage > stage} {...alertProps(pastor)}
              onClick={() => enter(pastor, true)} />
          )}
          {view === 'floor1' && cctv && (
            <HallHot x={50} y={52} icon="📹" label={cctv.label} sub={subOf(cctv)} locked={cctv.stage > stage}
              {...alertProps(cctv)} onClick={() => enter(cctv)} />
          )}
          {view === 'lab' && lab && (
            <HallHot x={43} y={56} icon="🔬" label={lab.label} sub={subOf(lab)} locked={lab.stage > stage}
              {...alertProps(lab)} onClick={() => enter(lab)} />
          )}
      </div>

      {/* 복도 위 HUD — 단계 안내(좌) + 수첩·메뉴(우) */}
      <div className="hall-hud">
        <div className="hall-hud-chip"><b>🔎 {stageLabel}</b><span>{progressText}</span>{objective && <span className="hall-objective">🎯 {objective}</span>}</div>
        <div className="hall-hud-btns">
          {admin && <span className="s-admin-chip">ADMIN</span>}
          <button data-tut="record-btn" className="hall-hud-btn" title="수첩(사건 기록)" onClick={onOpenRecord}>📓</button>
          <MenuButton onOpen={onOpenMenu} />
        </div>
      </div>

      <div className="hall-here">📍 {here}</div>

      {/* 2차 심문이 어느 정도 쌓이기 전엔 까딱임을 멈춘다 — 3막 첫 순간부터 시선을 끌면
          아직 아무것도 캐묻지 않은 채로 사건이 끝나 버린다 */}
      {canAccuse && view === 'main' && (
        <button className="hall-accuse" style={accuseReady ? undefined : { animation: 'none', opacity: 0.6 }}
          onClick={onAccuse}>🔍 범인 지목하기</button>
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
