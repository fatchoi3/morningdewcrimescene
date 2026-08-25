// 2층 평면도 위에 한 인물의 시간순 동선을 번호·화살표로 그리는 SVG 빌더.
// 좌표는 CctvModal/SIAH-72와 동일한 viewBox(0 0 400 280) 기준.
import { esc } from './render.mjs';

const ROOMS = [
  { x: 55, y: 45, w: 95, h: 70, label: '한다영', lx: 102, ly: 84 },
  { x: 150, y: 45, w: 95, h: 70, label: '한소미', lx: 197, ly: 84 },
  { x: 245, y: 45, w: 90, h: 70, label: '서지안', lx: 290, ly: 84 },
  { x: 335, y: 12, w: 63, h: 80, label: '목사님', lx: 366, ly: 55, victim: true },
  { x: 55, y: 172, w: 95, h: 73, label: '최종현', lx: 102, ly: 212 },
  { x: 150, y: 172, w: 95, h: 73, label: '문세린', lx: 197, ly: 212 },
  { x: 245, y: 172, w: 90, h: 73, label: '강지후', lx: 290, ly: 212 },
];

/**
 * person 의 시간순 동선을 그린 평면도 SVG.
 * points: [{time, x, y}] (시간순). color: 인물 색.
 */
export function personMovementSVG(person, color, points) {
  // 마커 겹침 분산 — 이전 점들과 너무 가까우면 아래로 밀어 표시
  const placed = [];
  const nodes = points.map((p, i) => {
    let nx = p.x, ny = p.y, bump = 0;
    while (placed.some((q) => Math.hypot(q.nx - nx, q.ny - ny) < 18) && bump < 6) { ny += 18; bump++; }
    const node = { ...p, nx, ny, n: i + 1 };
    placed.push(node);
    return node;
  });

  // 방 사각형 + 라벨 (본인 방은 색 강조)
  const rooms = ROOMS.map((r) => {
    const fill = r.label === person ? `${color}26` : (r.victim ? '#fdeaea' : '#f3f1ec');
    const stroke = r.label === person ? color : (r.victim ? '#cc9999' : '#cfc8ba');
    return `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="${r.label === person ? 2 : 1.2}"/>` +
      `<text x="${r.lx}" y="${r.ly}" text-anchor="middle" font-size="11" font-weight="700" fill="#444">${r.label}</text>`;
  }).join('');

  // 동선 화살표 (연속 점, 거리가 충분할 때만)
  const segs = nodes.slice(1).map((n, i) => {
    const a = nodes[i];
    if (Math.hypot(n.nx - a.nx, n.ny - a.ny) < 8) return '';
    return `<line x1="${a.nx}" y1="${a.ny}" x2="${n.nx}" y2="${n.ny}" stroke="${color}" stroke-width="2" stroke-dasharray="5 3" marker-end="url(#ah-${person})" opacity="0.85"/>`;
  }).join('');

  // 번호 노드 + 시각 라벨
  const marks = nodes.map((n) =>
    `<g>` +
    `<circle cx="${n.nx}" cy="${n.ny}" r="11" fill="${color}" stroke="#fff" stroke-width="2"/>` +
    `<text x="${n.nx}" y="${n.ny + 4}" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">${n.n}</text>` +
    `<text x="${n.nx}" y="${n.ny + 24}" text-anchor="middle" font-size="9" font-weight="700" fill="${color}">${esc(n.time)}</text>` +
    `</g>`).join('');

  return `<svg class="flowmap" viewBox="0 0 400 290" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(person)} 동선">
  <defs><marker id="ah-${person}" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="${color}"/></marker></defs>
  <rect class="hall" x="55" y="122" width="287" height="38" fill="#eef1f5" stroke="#cfd6df"/>
  <line x1="342" y1="92" x2="342" y2="262" stroke="#c2cad6" stroke-width="2"/>
  <text x="356" y="205" transform="rotate(90 356 205)" font-size="9" fill="#9aa4b2">1층 가는 길</text>
  ${rooms}
  <circle cx="47" cy="141" r="8" fill="#11151c" stroke="#888" stroke-width="2"/>
  <text x="47" y="162" text-anchor="middle" font-size="8.5" fill="#a06ec8">CCTV</text>
  ${segs}
  ${marks}
</svg>`;
}
