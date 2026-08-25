// CCTV 동선 계산 — 앱(솔로·오프라인)과 보드판 QR 화면이 함께 쓴다.
//   두 곳이 따로 그리면 같은 컷이 서로 다른 길로 움직인다. 실제로 보드판은 직선으로 이어
//   벽과 방을 뚫고 지나갔다. 평면도 좌표(0 0 400 280)와 이 계산은 한곳에서만 관리한다.

/**
 * routeArrow — 직선 대신 복도를 따라가는 꺾인 경로(맨해튼 경로)를 만든다.
 * 평면도: 가로 복도 중심선 y≈141, 오른쪽 세로 통로(목사방·1층) 중심선 x≈360.
 * 방/통로 끝점을 복도 중심선까지 끌어낸 뒤 복도를 따라 잇는다 → 벽·방을 뚫지 않음.
 */
export function routeArrow(from, to) {
  const Y = 141;   // 가로 복도 중심선
  const SX = 360;  // 세로 통로(목사방·1층) 중심선
  const lead = (p) => (p.x >= 334
    ? [{ x: p.x, y: p.y }, { x: SX, y: p.y }, { x: SX, y: Y }]   // 통로/목사방/1층 → 세로통로 → 복도
    : [{ x: p.x, y: p.y }, { x: p.x, y: Y }]);                    // 방/복도 → 복도 중심선
  const pts = [...lead(from), ...lead(to).reverse()];
  return pts.filter((p, i) => i === 0 || p.x !== pts[i - 1].x || p.y !== pts[i - 1].y);
}

/* 경로 점들 → SVG path d 문자열 */
export const toPathD = (pts) => pts.map((pt, j) => `${j ? 'L' : 'M'}${pt.x} ${pt.y}`).join(' ');
/* 폴리라인 총 길이 */
export const polyLen = (pts) => pts.reduce((s, pt, j) => (j ? s + Math.hypot(pt.x - pts[j - 1].x, pt.y - pts[j - 1].y) : 0), 0);

/* 동선 점들 — meet(만남점)이 있으면 from→meet→to로 잇는다 */
export function routePoints(arrow, meet) {
  if (!meet) return routeArrow(arrow.from, arrow.to);
  const a = routeArrow(arrow.from, meet);
  const b = routeArrow(meet, arrow.to);
  return a.concat(b.slice(1));
}

/**
 * 마커 모션(path d + keyPoints/keyTimes/dur) 계산.
 *  - meet 있음(동반 컷): 컷 전체가 같은 dur(5s)로 움직여 동시 출발·만남점 동시 통과를 보장.
 *      만남점은 동선 길이 비율(frac) 위치에 오며 항상 t=0.5에 통과한다.
 *  - round(양방향): 끝점에서 동선을 따라 시작점으로 되돌아온다(왕복).
 *  - 단방향: 끝점 도착 후 다음 루프에서 시작점으로 즉시 점프(뿅 — 되짚어 오지 않음).
 */
export function markerMotion(arrow, meet) {
  const SPEED = 60, END_DWELL = 1;
  if (meet) {
    const a = routeArrow(arrow.from, meet);
    const b = routeArrow(meet, arrow.to);
    const frac = Math.round((polyLen(a) / ((polyLen(a) + polyLen(b)) || 1)) * 1000) / 1000;
    return { d: toPathD(a.concat(b.slice(1))), dur: 5, keyPoints: `0;${frac};1;1`, keyTimes: '0;0.5;0.9;1' };
  }
  const pts = routeArrow(arrow.from, arrow.to);
  const d = toPathD(pts);
  const move = polyLen(pts) / SPEED;
  if (arrow.round) {
    const total = 2 * move + END_DWELL;
    const t1 = Math.round((move / total) * 1000) / 1000;
    const t2 = Math.round(((move + END_DWELL) / total) * 1000) / 1000;
    return { d, dur: Math.min(12, Math.max(3, Math.round(total * 10) / 10)), keyPoints: '0;1;1;0', keyTimes: `0;${t1};${t2};1` };
  }
  const total = move + END_DWELL;
  const t1 = Math.round((move / total) * 1000) / 1000;
  return { d, dur: Math.min(9, Math.max(3, Math.round(total * 10) / 10)), keyPoints: '0;1;1', keyTimes: `0;${t1};1` };
}

/**
 * CCTV 사각(목사방) 가시성.
 * 카메라 시야 콘은 가로 복도(y≈141)뿐 — 우측 세로 통로 위쪽 끝(목사방)은 잡히지 않는다.
 *  · 복도/방문 앞(x ≤ VICTIM_X) → 항상 보임
 *  · 세로 통로라도 복도 합류부(y ≥ VIS_Y) → 보임 (※ 1층 방향 동선은 그대로 포착)
 *  · 목사방 쪽(위)으로 올라갈수록 → 스르르 사라짐, 내려오면 스르륵 다시 보임
 */
const VICTIM_X = 334;   // 세로 통로(목사방·1층) 시작 x
const VIS_Y = 124;      // 복도 상단(시야 콘 끝) — 이보다 아래는 보임
const HID_Y = 92;       // 목사방 입구 — 이보다 위는 완전히 사각
export function opacityAt(x, y) {
  if (x <= VICTIM_X) return 1;          // 카메라 시야(복도·방문 앞)
  if (y >= VIS_Y) return 1;             // 통로 합류부 — 1층 방향 포함 보임
  if (y <= HID_Y) return 0;             // 목사방 안쪽 — 사각
  return Math.round(((y - HID_Y) / (VIS_Y - HID_Y)) * 100) / 100;  // 진입로 — 스르르
}

/**
 * blindFade — 마커가 동선을 따라 움직이는 동안의 opacity 애니메이션(values/keyTimes)을 만든다.
 * markerMotion과 같은 시간축(dur·keyTimes·keyPoints)을 공유하도록, 시간 tau를 촘촘히 샘플링해
 * 그 순간의 경로 위치(x,y)를 구하고 opacityAt으로 투명도를 매긴다(왕복·만남점 모두 자연 대응).
 */
export function blindFade(pts, m) {
  const kp = m.keyPoints.split(';').map(Number);
  const kt = m.keyTimes.split(';').map(Number);
  let total = 0; const cum = [0];
  for (let i = 1; i < pts.length; i++) { total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); cum.push(total); }
  const frac = cum.map((d) => (total ? d / total : 0));
  const posAt = (f) => {
    if (f <= 0) return pts[0];
    if (f >= 1) return pts[pts.length - 1];
    for (let i = 1; i < pts.length; i++) {
      if (f <= frac[i]) {
        const t = (f - frac[i - 1]) / ((frac[i] - frac[i - 1]) || 1);
        return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t };
      }
    }
    return pts[pts.length - 1];
  };
  const tToFrac = (tau) => {
    if (tau <= kt[0]) return kp[0];
    for (let i = 1; i < kt.length; i++) {
      if (tau <= kt[i]) {
        const t = (tau - kt[i - 1]) / ((kt[i] - kt[i - 1]) || 1);
        return kp[i - 1] + (kp[i] - kp[i - 1]) * t;
      }
    }
    return kp[kp.length - 1];
  };
  const N = 36;
  const values = []; const times = [];
  for (let s = 0; s <= N; s++) {
    const tau = s / N;
    const pos = posAt(tToFrac(tau));
    values.push(opacityAt(pos.x, pos.y));
    times.push(Math.round(tau * 1000) / 1000);
  }
  return { values: values.join(';'), keyTimes: times.join(';') };
}
