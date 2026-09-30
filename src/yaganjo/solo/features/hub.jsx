// ─────────────────────────────────────────────────────────────────────────────
// features/hub — 센터 지도(허브). GH로지스 3센터를 비스듬히 내려다본 지도 한 장에
//   여섯이 그날 밤 일하던 자리에 서 있고, 공용 공간·관제실·C통로 현장·조장 사물함이 제자리에 있다.
//   예전의 「탈의실 앞 복도 + 인물의 칸」은 칸이 무엇인지(사물함인지 방인지) 애매했다 — 사람은 자리에,
//   사물함은 탈의실(남·여)에 둔다. 인물을 누르면 그 사람의 사물함·압수 소지품으로 들어가 심문한다.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { locationAlerts, alertReason } from '../lib/alerts.js';
import { getClue } from '../content.js';
import { StandingFigure } from '../art.jsx';
import { cast } from '../../../scenarios/yaganjo/cast.js';
import { CenterMap, mapAt } from './centerMap.jsx';

// 그날 밤 각자 있던 자리(정본 §15-1 · 배치표 VEVM-47). 서장현은 2층 사무실, 셋은 B구역 랙 사이 통로,
//   흐엉은 D구역 반품 작업대 앞, 임기석은 배터리실. person 은 방 데이터와 맞춰야 하는 조회 키라 cast 에서 뽑는다.
const PERSON_SPOTS = [
  { sid: 'S1', person: cast.S1.name, at: mapAt(6, 16, { floor: 2 }) },
  { sid: 'S2', person: cast.S2.name, at: mapAt(47, 45.5) },
  { sid: 'S3', person: cast.S3.name, at: mapAt(60, 50.2) },
  { sid: 'S5', person: cast.S5.name, at: mapAt(71, 40.5) },
  { sid: 'S4', person: cast.S4.name, at: mapAt(104.5, 51) },
  { sid: 'S6', person: cast.S6.name, at: mapAt(52.6, 23) },
];
// 공용 공간 — 지도 위 이름은 짧게(방 안 제목은 원래 이름 그대로)
const COMMON_SPOTS = [
  { id: 'ROOM-W', icon: '☕', label: '휴게실 · 흡연장', at: mapAt(9.5, 53.5, { lift: 2.4 }) },
  { id: 'ROOM-N', icon: '🔋', label: '충전소', at: mapAt(36, 22.5) },
  { id: 'ROOM-U', icon: '🗄', label: '2층 사무실', at: mapAt(19, 13, { floor: 2 }) },
  { id: 'ROOM-V', icon: '📹', label: '관제실 열람대', at: mapAt(34.5, 13, { floor: 2 }) },
  { id: 'ROOM-J', icon: '🚪', label: '갈림 · D구역 · 뒷문', at: mapAt(92.5, 42) },
];
const BOSS_AT = mapAt(5.4, 39.5, { lift: 2.4 });
const CRIME_AT = mapAt(95.1, 13);
const LAB_AT = mapAt(62, 66);
const CAM_L1 = mapAt(17.8, 34.6);

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

// 인물 — 지도 위에 작게 서 있는 전신. 발끝이 그 자리에 오도록 그림 높이만큼 위로 올린다.
const FIG_H = 58;
function PersonPin({ at, sid, name, sub, locked, recommend, alert, alertKey = 0, alertTitle, onClick }) {
  return (
    <button className={`map-person${locked ? ' locked' : ''}`} data-tut={recommend ? 'door' : undefined}
      style={{ left: `${at.x}%`, top: `calc(${at.y}% - var(--fig-h, ${FIG_H}px))` }} onClick={onClick} aria-label={`${name} — ${sub}`}>
      {!locked && alert > 0 && (
        <span className="s-alert" title={alertTitle} style={alertKey > 0 ? undefined : ALERT_SOFT}>{alertKey > 0 ? alertKey : '!'}</span>
      )}
      <span className="map-person-fig"><StandingFigure sid={sid} person={name} height={FIG_H} fallbackSize={40} /></span>
      <span className="hall-hot-plate">{name}</span>
      {sub && <span className="hall-hot-sub">{sub}</span>}
    </button>
  );
}

// 지목까지 몇 단계 — 단서가 쌓이면 「끝이 안 보인다」는 말을 들었다(2026-09-30 시험). 장 셋 + 지목.
const STEP_NAMES = ['1장 탐문', '2장 점검', '3장 추궁', '지목'];
function Steps({ at }) {
  return (
    <span className="hall-steps" aria-label={`지목까지 ${Math.max(0, 4 - at)}단계`}>
      {STEP_NAMES.map((n, i) => <i key={n} className={i + 1 < at ? 'done' : i + 1 === at ? 'now' : ''}>{n}</i>)}
    </span>
  );
}
// 방에 들어갔다 나오면 지도·복도가 처음 자리로 돌아가 매번 다시 밀어야 했다 — 마지막 자리를 기억한다
const LAST_SCROLL = {};

export function HallNav({ locations, stage, progressStage, collectedSet, state, recommendPerson, admin, stageLabel, progressText, objective, canAccuse, accuseReady, accuseNote, onEnter, onToast, onOpenRecord, onOpenMenu, onAccuse }) {
  // 각 장소에 '남은 거리'가 있으면 알림 배지를 띄운다(지도에서 어디로 갈지 바로 보이게)
  const alertsOf = (loc) => locationAlerts(loc, state || {}, stage, progressStage >= 3 ? 2 : 1);
  // 배지 관련 props 한 묶음 — 한 문패에 total·key·사유를 따로 계산하면 alertsOf 를 세 번 돈다
  const alertProps = (loc) => { const a = alertsOf(loc); return { alert: a.total, alertKey: a.key, alertTitle: `${loc.label} — ${alertReason(a)}` }; };
  const roomByPerson = (person) => locations.rooms.find((l) => l.person === person);
  const crime = locations.rooms.find((l) => l.showBody);
  const tool = (id) => locations.all.find((l) => l.id === id);
  const lab = tool('LOC-LAB');
  // 조장 사물함 — 조장 소유지만 현장이 아니라 남자 탈의실의 사물함이다.
  const bossLocker = locations.rooms.find((l) => l.person === '조장' && !l.showBody);
  const commons = COMMON_SPOTS.map((c) => ({ ...c, loc: tool(c.id) })).filter((c) => c.loc);

  // 열쇠가 있어야 여는 곳(조장 사물함) — 단계가 열려도 그 열쇠를 쥐기 전에는 못 들어간다
  const keyLocked = (loc) => !!loc.lockedBy && !collectedSet.has(loc.lockedBy);
  const subOf = (loc, isCrime) => {
    if (loc.stage > stage) return isCrime ? '통제 중' : loc.stage === 2 ? '사건 후 개방' : '2차 개방';
    if (keyLocked(loc)) return '자물쇠';
    // inner 가 있는 시설(CCTV 열람실)도 진척을 보여준다 — 열람대 하나만 세면 첫 진입에 '✓ 탐색완료'가
    //   되는데, 정작 2·3막 모순 대부분은 그 안의 컷들이라 화면이 '다 봤다'고 거짓말을 하게 된다.
    const counted = loc.kind === 'room' || loc.kind === 'cctv' || loc.inner ? [...loc.objects, ...(loc.inner || [])] : null;
    if (!counted) return '열람';
    // 휴대폰은 2차 심문(stage 3)에 해금 — 그 전엔 방 탐색 진척도에서 제외
    const reach = counted.filter((c) => stage >= 3 || !getClue(c)?.phone);
    const total = reach.length, got = reach.filter((c) => collectedSet.has(c)).length;
    return total > 0 && got === total ? '✓ 탐색완료' : `단서 ${got}/${total}`;
  };
  const enter = (loc, isCrime) => {
    if (!loc) return;
    if (loc.stage > stage) {
      onToast(isCrime ? '🚧 C통로는 경찰 통제 중입니다 — 현장 감식이 끝나면 개방됩니다'
        : '아직 그쪽에 갈 일은 없어 보입니다. 먼저 여섯 사람부터 만나 보세요.');
      return;
    }
    if (keyLocked(loc)) { onToast(loc.lockedMsg || '🔒 잠겨 있다'); return; }
    onEnter(loc.id);
  };

  // 폰 세로에서는 가로 지도를 화면 높이에 맞춰 크게 깔고 좌우로 밀어 본다(방 화면과 같다).
  //   「밀어서 둘러보기」 안내는 3초 뒤 사라지므로, 그쪽에 더 볼 것이 남아 있는 동안은 가장자리 화살표를 띄운다.
  //   처음에는 서쪽 끝(2층 사무실·탈의실)부터 — 이야기가 거기서 시작한다.
  const camRef = useRef(null);
  const [edge, setEdge] = useState({ l: false, r: false });
  // 「지도 전체 보기」 — 지도를 화면 너비에 맞춰 통째로 보여 준다(누가 어디 있는지 한눈에)
  const [overview, setOverview] = useState(false);
  const syncEdge = () => {
    const cam = camRef.current;
    if (!cam) return;
    const max = cam.scrollWidth - cam.clientWidth;
    setEdge({ l: cam.scrollLeft > 8, r: cam.scrollLeft < max - 8 });
    if (!overview) LAST_SCROLL[scrollKey] = cam.scrollLeft;
  };
  const scrollKey = 'map';
  useEffect(() => {
    const cam = camRef.current;
    if (cam && !overview && LAST_SCROLL[scrollKey] != null) cam.scrollLeft = LAST_SCROLL[scrollKey];
    syncEdge();
    window.addEventListener('resize', syncEdge);
    return () => window.removeEventListener('resize', syncEdge);
  }, [overview]);
  const pannable = edge.l || edge.r;
  const pan = (dir) => camRef.current?.scrollBy({ left: dir * camRef.current.clientWidth * 0.6, behavior: 'smooth' });
  return (
    <div className="aa-fs">
      <div className={`hall-cam${overview ? ' overview' : ''}`} ref={camRef} onScroll={syncEdge}>
      <div className="hall-fit">
          <CenterMap crimeOpen={crime ? crime.stage <= stage : undefined} />

          {PERSON_SPOTS.map((d) => {
            const loc = roomByPerson(d.person);
            if (!loc) return null;
            return <PersonPin key={d.person} at={d.at} sid={d.sid} name={d.person}
              sub={subOf(loc, false)} locked={loc.stage > stage} {...alertProps(loc)}
              recommend={recommendPerson === d.person} onClick={() => enter(loc, false)} />;
          })}
          {bossLocker && (
            <HallHot x={BOSS_AT.x} y={BOSS_AT.y} icon="🗄" label="조장 사물함"
              sub={subOf(bossLocker, false)} locked={bossLocker.stage > stage || keyLocked(bossLocker)} {...alertProps(bossLocker)}
              onClick={() => enter(bossLocker, false)} />
          )}
          <button className="hall-cctv" style={{ left: `${CAM_L1.x}%`, top: `${CAM_L1.y}%` }} aria-label="탈의실 입구 카메라"
            onClick={() => onToast('탈의실 입구 위에 카메라가 하나 있다(L-1). 남·여 탈의실 모두 이 입구 하나로 드나든다. 녹화는 관제실 열람대에서 볼 수 있다.')}>📹</button>
          {commons.map((c) => (
            <HallHot key={c.id} x={c.at.x} y={c.at.y} icon={c.icon} label={c.label}
              sub={subOf(c.loc, false)} locked={c.loc.stage > stage} {...alertProps(c.loc)}
              onClick={() => enter(c.loc, false)} />
          ))}
          {crime && (
            <HallHot x={CRIME_AT.x} y={CRIME_AT.y} icon="⚠️" tone="crime" label="C통로 현장"
              sub={subOf(crime, true)} locked={crime.stage > stage} {...alertProps(crime)}
              onClick={() => enter(crime, true)} />
          )}
          {lab && (
            <HallHot x={LAB_AT.x} y={LAB_AT.y} icon="🔬" label="감식 의뢰실" sub={subOf(lab)} locked={lab.stage > stage}
              {...alertProps(lab)} onClick={() => enter(lab)} />
          )}
      </div>
      </div>
      {!overview && <div className="hall-swipe-hint" aria-hidden="true">← 밀어서 둘러보기 →</div>}
      {!overview && edge.l && <button className="hall-pan l" aria-label="서쪽 더 보기" onClick={() => pan(-1)}>‹</button>}
      {!overview && edge.r && <button className="hall-pan r" aria-label="동쪽 더 보기" onClick={() => pan(1)}>›</button>}
      {(pannable || overview) && (
        <button className="view-toggle hall" onClick={() => setOverview((v) => !v)}>{overview ? '🔍 크게 보기' : '🗺 지도 전체 보기'}</button>
      )}

      {/* 지도 위 HUD — 단계 안내(좌) + 수첩·메뉴(우) */}
      <div className="hall-hud">
        <div className="hall-hud-chip"><b>🔎 {stageLabel}</b><span>{progressText}</span>{objective && <span className="hall-objective">🎯 {objective}</span>}<Steps at={Math.min(4, progressStage || 1)} /></div>
        <div className="hall-hud-btns">
          {admin && <span className="s-admin-chip">ADMIN</span>}
          <button data-tut="record-btn" className="hall-hud-btn" title="수첩(사건 기록)" onClick={onOpenRecord}>📓</button>
          <MenuButton onOpen={onOpenMenu} />
        </div>
      </div>

      {/* 2차 심문이 어느 정도 쌓이기 전엔 까딱임을 멈춘다 — 3막 첫 순간부터 시선을 끌면
          아직 아무것도 캐묻지 않은 채로 사건이 끝나 버린다 */}
      {canAccuse && (
        <button className="hall-accuse" style={accuseReady ? undefined : { animation: 'none', opacity: 0.6 }}
          onClick={onAccuse}>🔍 범인 지목하기{!accuseReady && accuseNote ? <small>{accuseNote}</small> : null}</button>
      )}
    </div>
  );
}
