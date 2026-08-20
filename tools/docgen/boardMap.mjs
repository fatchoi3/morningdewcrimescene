// 장소 판 — 사건 현장(숙소 2층)을 위에서 내려다본 큰 판 하나.
//   좌표는 floorplan.mjs / CctvModal(SIAH-72) 과 같은 viewBox(0 0 400 290) 를 쓴다.
//   따로 그리면 CCTV 동선과 방 위치가 어긋나므로, 정본 좌표를 그대로 가져와 확대한다.
//
//   방마다 카드를 올려 둘 자리(슬롯)를 표시한다. 참가자는 이 판 위에서 말을 옮기고,
//   자기가 선 방의 카드 더미에서 2장을 가져간다.

// floorplan.mjs 의 ROOMS 와 같은 값 — 저쪽은 동선용이라 라벨 좌표까지 묶여 있어 여기서 다시 적는다.
//   (한쪽을 고치면 다른 쪽도 고쳐야 한다. 값이 어긋나면 CCTV 동선이 엉뚱한 방을 지난다.)
export const MAP_ROOMS = [
  { id: 'SR', x: 55, y: 45, w: 95, h: 70, label: '이사랑의 방', color: '#a32d2d' },
  { id: 'HJ', x: 150, y: 45, w: 95, h: 70, label: '이현지의 방', color: '#7a4f9f' },
  { id: 'HW', x: 245, y: 45, w: 90, h: 70, label: '박희원의 방', color: '#8a5a2b' },
  { id: 'PS', x: 335, y: 12, w: 63, h: 80, label: '목사님의 방', color: '#1f1f1f', victim: true },
  { id: 'JH', x: 55, y: 172, w: 95, h: 73, label: '최종현의 방', color: '#2f6f4f' },
  { id: 'GH', x: 150, y: 172, w: 95, h: 73, label: '이가현의 방', color: '#b07d1a' },
  { id: 'EJ', x: 245, y: 172, w: 90, h: 73, label: '윤은재의 방', color: '#3a5f9f' },
];

// 제미나이가 그린 평면도(1200x896) 위에서 각 방이 차지하는 자리 — 픽셀에서 벽선을 찾아 잰 값이다.
//   그림은 1200x896 이지만 %로 두어야 인쇄 크기를 바꿔도 이름표가 따라간다.
const ART = { w: 1200, h: 896 };
const pct = (x, y) => ({ left: (x / ART.w * 100).toFixed(2) + '%', top: (y / ART.h * 100).toFixed(2) + '%' });
export const ART_SPOTS = [
  { id: 'SR', label: '이사랑의 방', color: '#a32d2d', ...pct(193, 235) },
  { id: 'HJ', label: '이현지의 방', color: '#7a4f9f', ...pct(458, 235) },
  { id: 'HW', label: '박희원의 방', color: '#8a5a2b', ...pct(708, 235) },
  { id: 'PS', label: '목사님의 방', color: '#1f1f1f', ...pct(1002, 235) },
  { id: 'JH', label: '최종현의 방', color: '#2f6f4f', ...pct(200, 675) },
  { id: 'GH', label: '이가현의 방', color: '#b07d1a', ...pct(484, 675) },
  { id: 'EJ', label: '윤은재의 방', color: '#3a5f9f', ...pct(779, 675) },
];

/** 제미나이 그림을 깔고 그 위에 이름표를 얹은 장소 판 HTML. 그림이 흐려도 글자는 벡터라 선명하다. */
export function illustratedMapHTML(counts = {}, src = '../../../../public/images/board/2층평면.png') {
  const chip = (s) => `<div class="spot" style="left:${s.left};top:${s.top}">
    <div class="pin" style="background:${s.color}">${s.label}${counts[s.id] != null ? ` · ${counts[s.id]}장` : ''}</div>
  </div>`;
  const note = (x, y, text, color) => {
    const p = pct(x, y);
    return `<div class="spot" style="left:${p.left};top:${p.top}">
      <div class="note" style="color:${color};border-color:${color}">${text}</div></div>`;
  };
  return `<div class="art">
    <img src="${src}" alt="숙소 2층 평면">
    ${ART_SPOTS.map(chip).join('')}
    ${note(600, 448, '복 도', '#5b6472')}
    ${note(114, 451, 'CCTV — 복도만 촬영', '#7b4fa0')}
    ${note(1035, 700, '1층 계단', '#5b6472')}
  </div>`;
}

// ── AI 그림 프롬프트 ─────────────────────────────────────────────────────────
//   손으로 적으면 그림과 판의 방 위치가 어긋난다. 좌표에서 바로 문장을 만든다.
//   글자는 빼라고 못박는다 — 한글은 이미지 모델이 거의 항상 뭉갠다. 이름표는 SVG 로 덧씌운다.
//   제미나이 입력창은 줄바꿈이 곧 전송이라 반드시 한 줄이어야 한다.
const NINTH = (r) => {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const col = cx < 150 ? 'left' : cx < 250 ? 'center' : 'right';
  const row = cy < 110 ? 'top' : cy > 165 ? 'bottom' : 'middle';
  return `${row}-${col}`;
};
export function boardMapPrompt() {
  const rooms = MAP_ROOMS.filter((r) => !r.victim)
    .map((r) => `a small bedroom at ${NINTH(r)}`).join(', ');
  return [
    'Top-down architectural floor plan illustration, straight bird eye view, of the second floor of a Korean church retreat lodge from the early 2000s.',
    `Layout: ${rooms}.`,
    'One larger corner room at the far top-right, set slightly higher than the others, is the pastor room.',
    'A single wide horizontal corridor runs across the middle and connects every room; all doors open onto this corridor.',
    'A stairwell going down is at the right end of the corridor.',
    'One small wall-mounted security camera is at the left end of the corridor, aimed along the corridor only.',
    'Each bedroom has a single bed, a desk, a wardrobe and a window on the outer wall.',
    'Warm muted colors, soft natural light, clean flat vector illustration with subtle paper texture, thin dark outlines, tabletop board game map style.',
    'Absolutely no text, no letters, no numbers, no labels anywhere in the image.',
    'Wide landscape composition, 4:3, the whole floor fits inside the frame with a small margin.',
  ].join(' ');
}

/**
 * 2층 전체 평면 장소 판 SVG.
 * counts: { 방id: 카드수 } — 각 방에 몇 장이 놓이는지 판에 찍어 준다.
 * scale: 인쇄 배율(1 = viewBox 그대로). A3 가로로 뽑으면 3 정도가 알맞다.
 */
export function boardMapSVG(counts = {}, { showCounts = true } = {}) {
  const room = (r) => {
    const cx = r.x + r.w / 2;
    const n = counts[r.id];
    return `
    <g>
      <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="3"
            fill="${r.victim ? '#fdeaea' : '#faf8f4'}" stroke="${r.color}" stroke-width="1.6"/>
      <rect x="${r.x}" y="${r.y}" width="${r.w}" height="9" fill="${r.color}"/>
      <text x="${cx}" y="${r.y + 6.8}" text-anchor="middle" font-size="6.2" font-weight="700" fill="#fff">${r.label}</text>
      ${showCounts && n != null ? `<text x="${cx}" y="${r.y + r.h / 2 + 3}" text-anchor="middle"
        font-size="7.5" font-weight="700" fill="${r.color}" opacity="0.9">${n}장</text>` : ''}
    </g>`;
  };

  // 시설 두 곳은 2층 평면 밖이다 — 실제로 1층·외부라, 판 아래에 따로 칸을 둔다.
  const facility = (x, label, color, n, note) => `
    <g>
      <rect x="${x}" y="256" width="120" height="30" rx="3" fill="#f4f2ee" stroke="${color}" stroke-width="1.4"/>
      <rect x="${x}" y="256" width="120" height="8.5" fill="${color}"/>
      <text x="${x + 60}" y="262.4" text-anchor="middle" font-size="6" font-weight="700" fill="#fff">${label}</text>
      <text x="${x + 60}" y="274" text-anchor="middle" font-size="5.6" fill="${color}">${note}</text>
      ${n != null ? `<text x="${x + 60}" y="282" text-anchor="middle" font-size="6.2" font-weight="700" fill="${color}">${n}장</text>` : ''}
    </g>`;

  return `<svg viewBox="0 0 400 292" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="사건 현장 장소 판">
  <rect x="0" y="0" width="400" height="292" fill="#fffdf9"/>
  <!-- 복도 — 방들이 여기로 열린다. CCTV 는 복도만 비춘다(방 안은 사각). -->
  <rect x="55" y="122" width="287" height="38" fill="#eef1f5" stroke="#cfd6df"/>
  <text x="198" y="145" text-anchor="middle" font-size="7" fill="#8a94a4" letter-spacing="2">복 도</text>
  <line x1="342" y1="92" x2="342" y2="248" stroke="#c2cad6" stroke-width="2"/>
  <text x="356" y="200" transform="rotate(90 356 200)" font-size="6" fill="#9aa4b2">1층 가는 길</text>
  <!-- 복도 끝 CCTV — 진입·퇴장은 못 잡는다. 문 앞이 사각이라는 것이 이 사건의 전제다. -->
  <circle cx="47" cy="141" r="6" fill="#11151c" stroke="#888" stroke-width="1.6"/>
  <text x="47" y="156" text-anchor="middle" font-size="5.4" fill="#a06ec8">CCTV</text>
  <text x="47" y="163" text-anchor="middle" font-size="4.4" fill="#9aa4b2">복도만 촬영</text>
  ${MAP_ROOMS.map(room).join('')}
  ${facility(55, 'CCTV 열람실', '#2b6b73', counts.CC, '4라운드 뒤 개방')}
  ${facility(190, '감식실', '#5a5a5a', counts.LB, '채취물 제출 전용')}
  <text x="330" y="274" text-anchor="middle" font-size="5.6" fill="#6b6760">두 곳은 2층이 아니다 —</text>
  <text x="330" y="282" text-anchor="middle" font-size="5.6" fill="#6b6760">이동만 하고 방은 비운다</text>
</svg>`;
}
