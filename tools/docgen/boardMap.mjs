// 장소 판 — 사건 현장(숙소 2층)을 위에서 내려다본 큰 판 하나.
//   그림은 public/images/board/2층평면.png (AI 로 그린 것). 그 위에 방 이름과 단서 번호를
//   벡터로 얹는다 — 그림 해상도가 낮아도 글자·번호는 선명하게 인쇄된다.
//
//   방 상자 좌표는 그림에서 벽선을 찾아 잰 값이다(명암 프로파일). 그림을 새로 뽑으면 다시 재야 한다.

const ART = { w: 1200, h: 896 };
const pctX = (x) => (x / ART.w * 100).toFixed(2) + '%';
const pctY = (y) => (y / ART.h * 100).toFixed(2) + '%';

// 판 위의 방 — [x0,y0,x1,y1]. letter 는 단서 번호의 앞글자(A1, A2 …).
//   순서는 판을 읽는 순서(위 왼쪽→오른쪽, 아래 왼쪽→오른쪽)라 참가자가 헤매지 않는다.
export const ART_ROOMS = [
  { id: 'SR', letter: 'A', label: '이사랑의 방', color: '#a32d2d', box: [62, 86, 324, 384] },
  { id: 'HJ', letter: 'B', label: '이현지의 방', color: '#7a4f9f', box: [336, 86, 579, 384] },
  { id: 'HW', letter: 'C', label: '박희원의 방', color: '#8a5a2b', box: [590, 86, 825, 384] },
  { id: 'PS', letter: 'D', label: '목사님의 방', color: '#1f1f1f', box: [868, 49, 1137, 391] },
  { id: 'JH', letter: 'E', label: '최종현의 방', color: '#2f6f4f', box: [62, 512, 337, 837] },
  { id: 'GH', letter: 'F', label: '이가현의 방', color: '#b07d1a', box: [348, 512, 619, 837] },
  { id: 'EJ', letter: 'G', label: '윤은재의 방', color: '#3a5f9f', box: [634, 512, 924, 837] },
];

/**
 * 그림 판 HTML. counts[id] 만큼 방 안에 번호 마커를 깐다.
 *   마커는 '단서가 거기 있다'는 표시가 아니라 '몇 번 카드를 집을지 고르는 자리'다 —
 *   그림 속 가구와 맞출 필요가 없고, 맞추려 들면 방마다 개수가 달라 배치가 깨진다.
 */
export function illustratedMapHTML(counts = {}, src) {
  const room = (r) => {
    const [x0, y0, x1, y1] = r.box;
    const n = counts[r.id] || 0;
    // 이름표는 방 위쪽에 붙이고, 번호는 그 아래를 격자로 채운다
    const cols = n > 8 ? 4 : n > 3 ? 3 : Math.max(1, n);
    const rows = Math.ceil(n / cols);
    const gx0 = x0 + 16, gx1 = x1 - 16, gy0 = y0 + 74, gy1 = y1 - 16;
    const cw = (gx1 - gx0) / cols, ch = Math.min((gy1 - gy0) / Math.max(1, rows), 62);
    const marks = Array.from({ length: n }, (_, i) => {
      const c = i % cols, rw = Math.floor(i / cols);
      const cx = gx0 + cw * (c + 0.5), cy = gy0 + ch * (rw + 0.5);
      return `<div class="mk" style="left:${pctX(cx)};top:${pctY(cy)};border-color:${r.color};color:${r.color}">${r.letter}${i + 1}</div>`;
    }).join('');
    return `<div class="rm" style="left:${pctX(x0)};top:${pctY(y0)};width:${pctX(x1 - x0)};height:${pctY(y1 - y0)}">
      <div class="rmName" style="background:${r.color}">${r.label} · ${r.letter}1~${r.letter}${n}</div>
    </div>${marks}`;
  };
  const note = (x, y, text, color) =>
    `<div class="note" style="left:${pctX(x)};top:${pctY(y)};color:${color};border-color:${color}">${text}</div>`;
  const band = (x0, x1, y0, y1, style) => `<div class="zone" style="left:${pctX(x0)};top:${pctY(y0)};
    width:${pctX(x1 - x0)};height:${pctY(y1 - y0)};${style}"></div>`;

  return `<div class="art">
    <img src="${src}" alt="숙소 2층 평면">
    ${band(100, 875, 391, 505, 'background:#a56ec826;border:0.5mm solid #8a5fae99')}
    ${band(875, 1155, 391, 860, 'background:repeating-linear-gradient(45deg,#c9403a1f 0 3mm,#c9403a38 3mm 6mm);border:0.5mm dashed #c9403aaa')}
    ${ART_ROOMS.map(room).join('')}
    ${note(470, 448, 'CCTV 촬영 범위 — 복도만', '#7b4fa0')}
    ${note(1015, 430, '사각 — 목사님 방 문 앞', '#c9403a')}
  </div>`;
}
