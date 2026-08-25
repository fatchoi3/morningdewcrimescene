// V 카드 QR 이 여는 화면 — 그 카드 한 장에 해당하는 CCTV 컷 하나만 보여 준다.
//   보드게임판은 오프라인이지만, 복도 동선만은 그림으로 봐야 알리바이를 따질 수 있다.
//   카드마다 QR 이 달라 자기가 가진 컷만 열린다 — 카드 없이 주소만 알아도 다른 컷은 못 본다.
//
//   평면도와 동선 계산은 앱판(CctvModal)과 같은 것을 쓴다. 예전에는 여기서만 직선으로 이어
//   벽과 방을 뚫고 지나갔고, 인물이 움직이지도 않아 "누가 어디서 어디로 갔는지"가 읽히지 않았다.
//
//   주소는 /cctv#단서코드. 번호(V8)가 아니라 코드(PKIN-42)를 쓰는 이유는, 덱 번호가 바뀌어도
//   QR 이 그대로 살아 있게 하기 위해서다.
import { evidenceMap } from '../data/gameData.js';
import { routePoints, markerMotion, blindFade } from '../shared/cctvGeom.js';

const NS = 'http://www.w3.org/2000/svg';
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
const cctv = evidenceMap['SIAH-72']?.cctv?.timeline || [];

// 코드 → { 컷, 그 컷의 인물 전부 }
//   같은 컷에 둘이 함께 찍힌 장면이 있다(동반 등장). 내 카드가 가리키는 사람만 그리면
//   "혼자 지나갔다"로 읽혀 버리므로, 컷에 있는 사람은 다 그리되 이름은 내 사람만 밝힌다.
const find = (code) => {
  for (const t of cctv) {
    const mine = (t.people || []).find((p) => p.unlocks === code);
    if (mine) return { t, mine };
  }
  return null;
};

// 2층 평면도 — CctvModal 과 같은 좌표(0 0 400 280). 여기서 바꾸면 앱판과 어긋난다.
const PLAN = `
  <rect x="0" y="0" width="400" height="280" fill="#11151c"/>

  <polygon points="47,141 334,124 334,158" fill="#a56ec828" stroke="#b482d28c" stroke-width="1"/>

  ${[[55, 45, 95, 70], [150, 45, 95, 70], [245, 45, 90, 70],
     [55, 172, 95, 73], [150, 172, 95, 73], [245, 172, 90, 73]]
    .map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#161d27" stroke="#2c3a4c"/>`).join('')}
  <rect x="334" y="12" width="52" height="80" rx="3" fill="#2a1a1a" stroke="#7a4444"/>
  <rect x="343" y="86" width="30" height="9" rx="2" fill="#3aa0e6"/>

  <rect x="55" y="122" width="279" height="38" fill="#1b2430" stroke="#33445a"/>
  <rect x="334" y="92" width="52" height="166" fill="#1b2430" stroke="#33445a"/>
  <text x="360" y="196" text-anchor="middle" font-size="8" fill="#8a98aa">1층 가는 길</text>
  <path d="M360 204 l0 24 m-6 -8 l6 8 l6 -8" stroke="#8a98aa" stroke-width="2" fill="none"
    stroke-linecap="round" stroke-linejoin="round"/>

  <rect x="18" y="119" width="13" height="44" rx="1" fill="#2b3442"/>
  <text x="24" y="112" text-anchor="middle" font-size="7" fill="#6b7a8d">벽</text>
  <rect x="386" y="12" width="12" height="246" rx="1" fill="#2b3442"/>

  ${[[88, 118], [183, 118], [276, 118], [88, 157], [183, 157], [276, 157]]
    .map(([x, y]) => `<rect x="${x}" y="${y}" width="30" height="7" fill="#4a5a6e"/>`).join('')}

  ${[['한다영', 102], ['한소미', 197], ['서지안', 290]]
    .map(([n, x]) => `<text x="${x}" y="84" text-anchor="middle" font-size="10" fill="#7f8ea3">${n}</text>`).join('')}
  ${[['최종현', 102], ['문세린', 197], ['강지후', 290]]
    .map(([n, x]) => `<text x="${x}" y="212" text-anchor="middle" font-size="10" fill="#7f8ea3">${n}</text>`).join('')}
  <text x="360" y="55" text-anchor="middle" font-size="10" fill="#c98b8b">목사님</text>

  <circle cx="47" cy="141" r="10" fill="#11151c" stroke="#e6e9ef" stroke-width="2"/>
  <circle cx="47" cy="141" r="3.5" fill="#e6e9ef"/>
  <text x="47" y="166" text-anchor="middle" font-size="7" fill="#c9d2de">CCTV</text>`;

// 목사방 진입로로 갈수록 동선이 흐려진다 — 방에 들어갔는지는 이 화면으로 알 수 없다.
const DEFS = `<defs>
  <marker id="ah" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto-start-reverse">
    <path d="M0,0 L7,3 L0,6 Z" fill="#ffd24a"/></marker>
  <linearGradient id="fadeGrad" x1="0" y1="92" x2="0" y2="124" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>
  <mask id="fade" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="280">
    <rect x="0" y="0" width="400" height="280" fill="#fff"/>
    <rect x="334" y="0" width="66" height="280" fill="url(#fadeGrad)"/></mask>
</defs>`;

window.addEventListener('hashchange', () => location.reload());

const root = document.getElementById('cctv-root');
const code = decodeURIComponent(location.hash.replace(/^#/, '')).trim().toUpperCase();
const hit = code && find(code);

if (!hit) {
  root.innerHTML = `<div class="box">
    <h1>CCTV 열람</h1>
    <p class="msg">카드의 QR 을 찍어서 들어와야 그 장면이 열립니다.</p>
    <p class="sub">주소 끝에 단서 코드가 없거나(<code>${esc(code) || '없음'}</code>)
      CCTV 장면이 아닌 코드입니다.</p></div>`;
} else {
  const { t, mine } = hit;
  const people = t.people || [];
  const meet = t.meet;

  // 동선 — 복도를 따라 꺾어 간다. 만남점이 있으면 거기를 경유한다.
  const paths = people.filter((p) => p.arrow).map((p) => {
    const pts = routePoints(p.arrow, meet);
    return `<polyline points="${pts.map((q) => `${q.x},${q.y}`).join(' ')}"
      fill="none" stroke="#ffd24a" stroke-width="2.5" stroke-dasharray="6 4"
      stroke-linejoin="round" stroke-linecap="round" opacity=".9"
      marker-end="url(#ah)"${p.arrow.round ? ' marker-start="url(#ah)"' : ''}/>`;
  }).join('');

  // 인물 — 동선을 따라 움직인다. 정지 화면이면 어느 방향으로 간 것인지 읽히지 않는다.
  const markers = people.map((p) => {
    const isMine = p.unlocks === code;
    const label = isMine ? (p.who || '인물') : (p.who || '');
    const dot = `<circle r="${isMine ? 9 : 8}" fill="${isMine ? '#ffd24a' : '#8fa3bb'}"
        stroke="#11151c" stroke-width="2"/>
      <text y="${isMine ? 3.5 : 3}" text-anchor="middle" font-size="9" font-weight="700"
        fill="#11151c">${isMine ? '!' : ''}</text>
      <text y="${isMine ? 24 : 23}" text-anchor="middle" font-size="8.5"
        fill="#e6e9ef" stroke="#11151c" stroke-width="2.6" paint-order="stroke"
        >${esc(label)}</text>`;
    if (!p.arrow) return `<g transform="translate(${p.x},${p.y})">${dot}</g>`;
    const m = markerMotion(p.arrow, meet);
    const f = blindFade(routePoints(p.arrow, meet), m);
    return `<g>${dot}
      <animateMotion dur="${m.dur}s" repeatCount="indefinite" calcMode="linear"
        keyPoints="${m.keyPoints}" keyTimes="${m.keyTimes}" path="${m.d}"/>
      <animate attributeName="opacity" dur="${m.dur}s" repeatCount="indefinite"
        calcMode="linear" values="${f.values}" keyTimes="${f.keyTimes}"/>
    </g>`;
  }).join('');

  root.innerHTML = `<div class="box">
    <div class="hd"><span class="tm">${esc(t.time)}</span><span class="lo">${esc(t.location || '2층 복도')}</span></div>
    <svg viewBox="0 0 400 280" xmlns="${NS}" class="plan">
      ${DEFS}${PLAN}
      <g mask="url(#fade)">${paths}</g>
      ${markers}
    </svg>
    <div class="who">${esc(mine.look || '')}</div>
    <div class="scene">${esc(t.scene || '')}</div>
    <p class="warn">복도만 찍힌다. <b>방 안으로 들어갔는지는 이 화면으로 알 수 없다.</b><br>
      목사님 방 쪽으로 갈수록 동선이 흐려지는 것은 그 때문이다.</p>
  </div>`;
}
