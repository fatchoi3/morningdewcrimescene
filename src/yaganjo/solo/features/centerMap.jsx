// ─────────────────────────────────────────────────────────────────────────────
// features/centerMap — GH로지스 3센터를 비스듬히 내려다본 지도(허브 배경).
//   좌표는 정본 평면도(docs/야간조-자료/평면도.png, §15-1)를 미터로 옮긴 것이다.
//   x = 서→동(0~120m), y = 북→남(0~60m, 건물 밖 흡연장·감식은 70m까지), z = 높이.
//   2층은 계단(S)으로만 오르는 별도 층이라, 건물 위 허공에 떠 있는 판으로 따로 그린다.
//   핫스팟 위치는 mapAt() 으로 같은 투영을 거쳐 % 로 받는다 — 그림과 버튼이 어긋나지 않는다.
// ─────────────────────────────────────────────────────────────────────────────
const W = 1600, H = 900;
const K = 10.4, SX = 2.6, KY = 8.4, KZ = 7.2, OX = 92, OY = 262;
// 2층 판 — 1층보다 크게(가로 1.25배) 그려야 버튼 셋이 겹치지 않는다. 계단 위 허공에 띄운다.
const F2 = { k: 13, ox: 430, oy: 40, ky: 7.4 };

export const P = (x, y, z = 0) => [OX + x * K + y * SX, OY + y * KY - z * KZ];
const P2 = (x, y) => [F2.ox + x * F2.k + y * SX, F2.oy + y * F2.ky];
/** 1층·2층 좌표 → 지도 위 % 위치(핫스팟용) */
export function mapAt(x, y, { floor = 1, lift = 0 } = {}) {
  const [sx, sy] = floor === 2 ? P2(x, y) : P(x, y, lift);
  return { x: (sx / W) * 100, y: (sy / H) * 100 };
}

const pts = (arr) => arr.map((p) => p.join(',')).join(' ');
const quad = (x0, y0, x1, y1, z = 0) => [P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)];

// 세운 상자 — 카메라는 남서쪽 위에 있으므로 보이는 옆면은 남쪽(앞)과 서쪽이다.
function Prism({ x0, y0, x1, y1, h, top, front, side, stroke = '#00000066' }) {
  return (
    <g>
      <polygon points={pts([P(x0, y0, 0), P(x0, y1, 0), P(x0, y1, h), P(x0, y0, h)])} fill={side} stroke={stroke} strokeWidth="1" />
      <polygon points={pts([P(x0, y1, 0), P(x1, y1, 0), P(x1, y1, h), P(x0, y1, h)])} fill={front} stroke={stroke} strokeWidth="1" />
      <polygon points={pts(quad(x0, y0, x1, y1, h))} fill={top} stroke={stroke} strokeWidth="1" />
    </g>
  );
}
// 랙 여러 줄 — 긴 상자를 간격 두고 늘어놓는다
function Racks({ x0, x1, ys, d = 1.6, h = 4.2, tone = 'steel' }) {
  const c = tone === 'c' ? { top: '#5a4a3a', front: '#3c3128', side: '#2e261f' } : { top: '#3e4c5c', front: '#28323e', side: '#1f2730' };
  return ys.map((y) => <Prism key={y} x0={x0} y0={y} x1={x1} y1={y + d} h={h} {...c} />);
}
function Zone({ x0, y0, x1, y1, fill, stroke = '#5b708a', dash, z = 0 }) {
  return <polygon points={pts(quad(x0, y0, x1, y1, z))} fill={fill} stroke={stroke} strokeWidth="1.6" strokeDasharray={dash} />;
}
function Label({ x, y, z = 0, children, size = 17, color = '#9fb2c6', weight = 700, anchor = 'middle' }) {
  const [sx, sy] = P(x, y, z);
  return <text x={sx} y={sy} fontSize={size} fill={color} fontWeight={weight} textAnchor={anchor}
    style={{ letterSpacing: '.04em', paintOrder: 'stroke', stroke: '#0a0e14', strokeWidth: 4, strokeLinejoin: 'round' }}>{children}</text>;
}

export function CenterMap({ crimeOpen }) {
  const f2 = (x0, y0, x1, y1) => pts([P2(x0, y0), P2(x1, y0), P2(x1, y1), P2(x0, y1)]);
  const f2Label = (x, y, t, size = 17, color = '#b9c8d8') => {
    const [sx, sy] = P2(x, y);
    return <text x={sx} y={sy} fontSize={size} fill={color} fontWeight="700" textAnchor="middle"
      style={{ letterSpacing: '.04em', paintOrder: 'stroke', stroke: '#0a0e14', strokeWidth: 4 }}>{t}</text>;
  };
  // 계단 S 위 → 2층 판으로 오르는 점선
  const [sx1, sy1] = P(9.5, 20, 0);
  const [sx2, sy2] = P2(8, 17);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}>
      <defs>
        <radialGradient id="cmNight" cx="50%" cy="55%" r="75%">
          <stop offset="0%" stopColor="#141c26" /><stop offset="100%" stopColor="#06080c" />
        </radialGradient>
        <pattern id="cmGrid" width="26" height="26" patternUnits="userSpaceOnUse">
          <path d="M26 0H0V26" fill="none" stroke="#1b2633" strokeWidth="1" />
        </pattern>
        <radialGradient id="cmCrime" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e0574f" stopOpacity=".55" /><stop offset="100%" stopColor="#e0574f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#cmNight)" />
      <rect width={W} height={H} fill="url(#cmGrid)" opacity=".55" />

      {/* 바닥 — 서쪽 2/3 와 동쪽 1/3 */}
      <Zone x0={0} y0={0} x1={80} y1={60} fill="#18212c" stroke="#6b819c" />
      <Zone x0={80} y0={0} x1={120} y1={60} fill="#151c25" stroke="#6b819c" />
      {/* 건물 밖 — 흡연장(점선) */}
      <Zone x0={1.5} y0={62} x1={16.5} y1={69} fill="#10151c" stroke="#4a5a6e" dash="6 5" />
      <Label x={9} y={67.2} size={15} color="#7f93a8">흡연장</Label>

      {/* 북벽·동벽 — 먼 쪽 벽만 세운다(가까운 벽은 안을 가린다) */}
      <Prism x0={0} y0={-1} x1={120} y1={0} h={3} top="#2a3746" front="#1c2530" side="#18202a" />
      <Prism x0={120} y0={-1} x1={121} y1={60} h={3} top="#2a3746" front="#1c2530" side="#18202a" />
      {/* 동서 칸막이 — 자동문(M2) 자리만 비운다 */}
      <Prism x0={79.6} y0={0} x1={80.4} y1={26.5} h={3} top="#33445a" front="#222d3a" side="#1d2632" />
      <Prism x0={79.6} y0={33.5} x1={80.4} y1={60} h={3} top="#33445a" front="#222d3a" side="#1d2632" />

      {/* 주통로 — 벽 없는 열린 통로, 바닥 보행선만 */}
      <Zone x0={18.5} y0={26.5} x1={80} y1={33.5} fill="#2a2b22" stroke="#b8963e" dash="10 6" />
      <Label x={48} y={31.4} size={16} color="#c9ae6a">주 통 로</Label>
      {/* 자동문 M2 · 갈림 J */}
      <Zone x0={80} y0={27} x1={98} y1={33} fill="#1f2430" stroke="#6b819c" />
      <Label x={83.5} y={36.6} size={14} color="#9fb2c6">자동문</Label>
      <Label x={93} y={36.6} size={14} color="#9fb2c6">갈림</Label>

      {/* 서쪽 방들 — 계단 · 탈의실(남·여) · 휴게실 · 정문 */}
      <Zone x0={1.5} y0={1.7} x1={18.9} y1={13.1} fill="#1d2733" />
      <Label x={10.2} y={8.4} size={15}>입고 도크</Label>
      <Zone x0={20.7} y0={1.7} x1={32.7} y1={10.4} fill="#1d2733" />
      <Label x={26.7} y={7} size={15}>출고 리프트</Label>
      <Prism x0={1.5} y0={14.4} x1={17.5} y1={26} h={1.2} top="#26323f" front="#1b242e" side="#161e27" />
      <Label x={9.5} y={23} z={1.2} size={15}>계단 → 2층</Label>
      <Prism x0={1.5} y0={35.9} x1={9.3} y1={45.8} h={2.4} top="#2b3644" front="#1e2731" side="#18202a" />
      <Prism x0={9.7} y0={35.9} x1={17.5} y1={45.8} h={2.4} top="#33303f" front="#24212e" side="#1c1a25" />
      <Label x={5.4} y={45.2} z={2.4} size={12}>남 탈의실</Label>
      <Label x={13.6} y={45.2} z={2.4} size={12}>여 탈의실</Label>
      <Prism x0={1.5} y0={47.4} x1={17.5} y1={57.5} h={2.4} top="#2e3a2e" front="#1f281f" side="#192019" />
      <Label x={2.6} y={49.6} z={2.4} size={13} anchor="start">휴게실</Label>
      <Zone x0={20.5} y0={56} x1={33.5} y1={60} fill="#2a3240" />
      <Label x={27} y={59.2} size={13}>정문</Label>

      {/* 충전소 · 배터리실 · A구역 */}
      <Zone x0={26.2} y0={14.9} x1={43.8} y1={26} fill="#1e2a26" stroke="#5f8a7a" />
      <Label x={27.2} y={17.6} size={15} color="#8fc0ad" anchor="start">충전소</Label>
      {/* 배터리실은 안에 사람이 앉아 있으므로 지붕 없이 바닥만 — 뒷벽만 세운다 */}
      <Prism x0={45.2} y0={15.4} x1={60} y1={15.9} h={2.6} top="#2a3a36" front="#1c2825" side="#17211e" />
      <Zone x0={45.2} y0={15.9} x1={60} y1={26} fill="#1b2a27" stroke="#5f8a7a" />
      <Label x={46.2} y={18} size={14} color="#8fc0ad" anchor="start">배터리실</Label>
      <Racks x0={64} x1={78.4} ys={[7, 10.4, 13.8, 17.2, 20.6, 24]} />
      <Label x={71.2} y={5.6} size={15}>A구역</Label>
      {/* B구역 — 사람이 많은 곳. 랙 안쪽이라 통로가 안 보인다 */}
      <Racks x0={40.5} x1={78.4} ys={[37.2, 42.2, 47.2, 51.6]} />
      <Label x={76} y={57.6} size={15} anchor="end">B구역 집품</Label>

      {/* 동쪽 — C통로(막다른 25m) · D구역 반품 · 뒷문 */}
      <Prism x0={84.4} y0={3.3} x1={91.2} y1={27} h={5.4} top="#5a4a3a" front="#3c3128" side="#2e261f" />
      <Prism x0={99} y0={3.3} x1={106} y1={27} h={5.4} top="#5a4a3a" front="#3c3128" side="#2e261f" />
      <Zone x0={91.4} y0={3.3} x1={98.8} y1={27} fill={crimeOpen ? '#3a2a1c' : '#241c16'} stroke="#e4c14e" dash="8 5" />
      <Label x={95.1} y={2.2} size={15} color="#e4c14e">C통로</Label>
      {crimeOpen !== undefined && (() => { const [cx, cy] = P(95.1, 12); return <circle cx={cx} cy={cy} r="46" fill="url(#cmCrime)" />; })()}
      <Racks x0={95.2} x1={114} ys={[36, 38.2]} d={1.3} h={3.2} />
      <Prism x0={98.9} y0={44} x1={110.9} y1={48.2} h={1.1} top="#4a5260" front="#30363f" side="#272c34" />
      <Label x={86} y={57.4} size={15} anchor="start">D구역 반품</Label>
      {(() => { const [a, b] = [P(120, 49), P(120, 54)]; return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#4a8fd8" strokeWidth="6" />; })()}
      <Label x={116} y={52.5} size={13} anchor="end">뒷문</Label>

      {/* 방위·축척 */}
      <text x={W - 40} y={H - 24} fontSize="15" fill="#6d8095" textAnchor="end" fontWeight="700">↑ 북 · 동서 120m</text>

      {/* 2층 — 계단으로만 오른다 */}
      <line x1={sx1} y1={sy1} x2={sx2} y2={sy2} stroke="#8fa3b8" strokeWidth="2" strokeDasharray="5 6" />
      <polygon points={f2(0, 0, 60, 22)} fill="#1a2330" stroke="#8fa3b8" strokeWidth="1.8" />
      <polygon points={f2(0, 22, 60, 23.4)} fill="#0d1218" opacity=".7" />
      <polygon points={f2(0.8, 0.8, 59.2, 6.4)} fill="#1f2a38" stroke="#5b708a" strokeWidth="1.2" />
      {f2Label(30, 5, '포장 라인 · 출고 도크', 14, '#8fa3b8')}
      <polygon points={f2(0.8, 7.6, 25, 21.2)} fill="#232f3e" stroke="#5b708a" strokeWidth="1.2" />
      <polygon points={f2(26, 7.6, 43, 21.2)} fill="#232f3e" stroke="#5b708a" strokeWidth="1.2" />
      <polygon points={f2(44, 7.6, 59.2, 21.2)} fill="#1f2a38" stroke="#5b708a" strokeWidth="1.2" />
      {f2Label(12.9, 10.4, '사무실', 14)}
      {f2Label(34.5, 10.4, '관제실', 14)}
      {f2Label(51.6, 15.6, '출고 도크', 13, '#8fa3b8')}
      {(() => { const [x, y] = P2(1, -1.4); return <text x={x} y={y} fontSize="16" fill="#cfd9e4" fontWeight="800">2층</text>; })()}
    </svg>
  );
}
