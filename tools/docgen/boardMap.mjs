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
      <rect x="${r.x + 8}" y="${r.y + 18}" width="${r.w - 16}" height="${r.h - 30}" rx="2.5"
            fill="none" stroke="${r.color}" stroke-width="0.9" stroke-dasharray="4 3" opacity="0.75"/>
      <text x="${cx}" y="${r.y + r.h / 2 + 2}" text-anchor="middle" font-size="6" fill="${r.color}" opacity="0.85">단서 카드를 여기에</text>
      ${showCounts && n != null ? `<text x="${cx}" y="${r.y + r.h - 6}" text-anchor="middle"
        font-size="6.4" font-weight="700" fill="${r.color}">${n}장</text>` : ''}
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
