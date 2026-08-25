// V 카드 QR 이 여는 화면 — 그 카드 한 장에 해당하는 CCTV 컷 하나만 보여 준다.
//   보드게임판은 오프라인이지만, 복도 동선만은 그림으로 봐야 알리바이를 따질 수 있다.
//   카드마다 QR 이 달라 자기가 가진 컷만 열린다 — 카드 없이 주소만 알아도 다른 컷은 못 본다.
//
//   주소는 /cctv#단서코드. 번호(V8)가 아니라 코드(PKIN-42)를 쓰는 이유는, 덱 번호가 바뀌어도
//   QR 이 그대로 살아 있게 하기 위해서다.
import { evidenceMap } from '../data/gameData.js';

const V = 'viewBox', NS = 'http://www.w3.org/2000/svg';
const cctv = evidenceMap['SIAH-72']?.cctv?.timeline || [];

// 코드 → { 컷, 인물 }
const find = (code) => {
  for (const t of cctv) {
    for (const p of (t.people || [])) if (p.unlocks === code) return { t, p };
  }
  return null;
};

// 2층 평면도 — CctvModal 과 같은 좌표(0 0 400 280). 여기서 바꾸면 앱판과 어긋난다.
const PLAN = `
  <rect x="0" y="0" width="400" height="280" fill="#11151c"/>
  <rect x="55" y="122" width="279" height="38" fill="#1b2430" stroke="#33445a"/>
  <rect x="334" y="92" width="52" height="166" fill="#1b2430" stroke="#33445a"/>
  ${[[55, 45, 95, 70], [150, 45, 95, 70], [245, 45, 90, 70],
     [55, 172, 95, 73], [150, 172, 95, 73], [245, 172, 90, 73]]
    .map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#161d27" stroke="#2c3a4c"/>`).join('')}
  <rect x="334" y="12" width="52" height="80" rx="3" fill="#2a1a1a" stroke="#7a4444"/>
  <text x="360" y="56" text-anchor="middle" font-size="10" fill="#c98b8b">목사님</text>
  ${[['한다영', 102], ['한소미', 197], ['서지안', 290]]
    .map(([n, x]) => `<text x="${x}" y="84" text-anchor="middle" font-size="10" fill="#7f8ea3">${n}</text>`).join('')}
  ${[['최종현', 102], ['문세린', 197], ['강지후', 290]]
    .map(([n, x]) => `<text x="${x}" y="212" text-anchor="middle" font-size="10" fill="#7f8ea3">${n}</text>`).join('')}
  <circle cx="47" cy="141" r="6" fill="#0a0d12" stroke="#a06ec8" stroke-width="2"/>
  <text x="47" y="160" text-anchor="middle" font-size="7" fill="#a06ec8">CCTV</text>
  <polygon points="47,141 334,124 334,158" fill="#a56ec81f" stroke="#8a5fae66"/>
  <text x="360" y="200" text-anchor="middle" font-size="8" fill="#67788d">1층</text>`;

// 주소의 해시만 바뀌면 모듈이 다시 안 돈다. QR 로 들어올 땐 새로 로드되지만,
//   한 화면에서 다음 카드를 찍는 경우를 위해 다시 그린다.
window.addEventListener('hashchange', () => location.reload());

const root = document.getElementById('cctv-root');
const code = decodeURIComponent(location.hash.replace(/^#/, '')).trim().toUpperCase();
const hit = code && find(code);

if (!hit) {
  root.innerHTML = `<div class="box">
    <h1>CCTV 열람</h1>
    <p class="msg">카드의 QR 을 찍어서 들어와야 그 장면이 열립니다.</p>
    <p class="sub">주소 끝에 단서 코드가 없거나(<code>${code || '없음'}</code>)
      CCTV 장면이 아닌 코드입니다.</p></div>`;
} else {
  const { t, p } = hit;
  const a = p.arrow;
  root.innerHTML = `<div class="box">
    <div class="hd"><span class="tm">${t.time}</span><span class="lo">${t.location || '2층 복도'}</span></div>
    <svg ${V}="0 0 400 280" xmlns="${NS}" class="plan">
      ${PLAN}
      <defs><marker id="ah" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto">
        <path d="M0,0 L7,3 L0,6 Z" fill="#ffd24a"/></marker></defs>
      ${a ? `<line x1="${a.from.x}" y1="${a.from.y}" x2="${a.to.x}" y2="${a.to.y}"
        stroke="#ffd24a" stroke-width="2.4" stroke-dasharray="6 4" marker-end="url(#ah)" opacity=".95"/>` : ''}
      <circle cx="${p.x}" cy="${p.y}" r="9" fill="#ffd24a" stroke="#11151c" stroke-width="2"/>
      <text x="${p.x}" y="${p.y + 3.5}" text-anchor="middle" font-size="9" font-weight="700" fill="#11151c">?</text>
    </svg>
    <div class="who">${p.look || ''}</div>
    <div class="scene">${t.scene || ''}</div>
    <p class="warn">복도만 찍힌다. <b>방 안으로 들어갔는지는 이 화면으로 알 수 없다.</b></p>
  </div>`;
}
