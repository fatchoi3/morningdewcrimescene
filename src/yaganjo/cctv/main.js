// ─────────────────────────────────────────────────────────────────────────────
// 야간조 — V 카드 QR 이 여는 카메라 열람 화면.
//
//   주소는 /yaganjo-cctv#<단서코드>. 카드 번호(V3)가 아니라 코드(JPAD-03)를 쓴다.
//   덱 번호가 바뀌어도 이미 인쇄된 QR 이 살아 있게 하기 위해서다(새벽이슬 /cctv 와 같은 규칙).
//
//   ── 새벽이슬 판을 그대로 베끼지 않는 이유 ─────────────────────────────────
//   src/cctv/main.js 는 SIAH-72.cctv.timeline 을 읽어 2층 평면도 위에 ❓ 인물 마커를
//   찍고 동선을 애니메이션으로 끌고 간다. 야간조에는 그 게임이 성립하지 않는다.
//
//     ① 얼굴이 안 남는다. 여섯 대 중 얼굴이 식별되는 것은 G-1 정문 한 대뿐이고,
//        그것이 이 판의 물리 법칙이다. people[].who 로 사람을 찍어 두면 규칙이 깨진다.
//     ② 동선이 아니라 계수다. M-2 다섯 장은 「시각 · 방향 · 무엇」 세 칸의 로그이고,
//        화살표로 옮기면 세는 일이 사라진다. 세는 일이 사라지면 S1 이 죽는다.
//     ③ 없는 것이 단서다. C-3 의 검은 화면과 G-1 의 빈 게이트는 「아무 일도 없었다」가
//        아니라 정확히 그 반대 뜻이다. 빈 timeline 을 그린 평면도는 그것을 못 그린다.
//
//   그래서 여기서 그리는 것은 **통행 기록표**이고, 평면도는 「그 카메라가 어디에 붙어
//   무엇을 보는가」를 말하는 **도면**으로만 곁들인다.
//
//   ── 누계를 표시하지 않는다 ────────────────────────────────────────────────
//   이 파일 어디에도 행을 세거나 합계를 내는 코드가 없다. 표에 행 번호도 없고
//   합계 줄도 없다. 보드 룰북의 「세는 것은 앉은 사람의 일이다」가 화면에서도 규칙이다.
//   (카드 자신의 description — 「여덟 줄. 사람 둘, 지게차 여섯」 — 은 정본 데이터라
//    그대로 띄운다. 이 화면이 새로 세는 것이 없다는 뜻이다.)
//
//   ── 무엇을 번들에 넣는가 ──────────────────────────────────────────────────
//   clues-camera.js(V 14장)와 cast 만 가져온다. 시나리오 객체(src/scenarios/yaganjo/
//   index.js)를 통째로 import 하면 **비밀팩과 109장 전량**이 이 페이지 청크에 실린다.
//   V 카드만 가진 사람이 다른 더미의 코드까지 손에 넣는 길을 만들지 않는다.
//   같은 이유로 cards.js(카드번호 ↔ 코드 109행 사상표)도 import 하지 않는다 — 그 표가
//   실리면 감식·특수 코드를 읽어 /yaganjo-clue 로 바로 열 수 있다.
// ─────────────────────────────────────────────────────────────────────────────
import { cluesCamera } from '../../data/yaganjo/clues-camera.js';
import { cast } from '../../scenarios/yaganjo/cast.js';
import { resolveTokens } from '../../data/tokens.js';
import { withAssetBase } from '../../data/assets.js';

// gameData.js 와 같은 순서·같은 헬퍼다 — 토큰을 풀고, 배포 base 를 자산 경로에 붙인다.
const CLUES = withAssetBase(resolveTokens(cluesCamera, cast));

// V1…V14 의 순서. clues-camera.js 가 보드 순서대로 쓰여 있고 그 순서가 곧 카드 번호다
// (dp-mapping.md §11 발급표 70~83행). 사상표를 import 하지 않는 대신 여기서 센다.
//   ※ tools/audit/yaganjo.mjs 가 `codeOf('V'+n) === CODES[n-1]` 을 전량 대조하면
//     이 가정이 깨지는 날 빌드가 아니라 점검에서 걸린다.
const CODES = Object.keys(CLUES);
const boardNoOf = (code) => {
  const i = CODES.indexOf(code);
  return i < 0 ? null : `V${i + 1}`;
};

const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

// ─────────────────────────────────────────────────────────────────────────────
// 카메라 여섯 — 도면 위의 자리와 화각.
//
//   값의 출처는 docs/야간조.md §1-3 · §1-4 · §9 와 docs/야간조-자료/평면도.html 이고,
//   좌표는 그 도면(1m = 8px)을 1m = 3.5px 로 다시 뜬 것이다. 단서 본문은 여기 없다 —
//   본문은 전부 clues-camera.js 가 정본이고, 이 표에는 「어디에 붙어 어디를 보는가」만 있다.
//
//   at    도면 위 카메라 자리                fov   화각(부채꼴). 수직 화각이면 null
//   spot  수직 화각의 원 [cx, cy, r]         label 기호 글자를 놓을 자리
//   lens  화면 머리에 한 줄로 붙는 카메라 성격
// ─────────────────────────────────────────────────────────────────────────────
const CAMERAS = {
  'G-1': {
    name: '정문',
    at: [151.6, 227], label: [151.6, 241],
    fov: 'M151.6 227 L106 217 L106 237 Z',
    lens: '눈높이에서 게이트 정면을 본다. 출입 통제용이라 조명이 밝고, 여섯 대 가운데 얼굴이 식별되는 유일한 카메라다.',
  },
  'M-1': {
    name: '주통로 서',
    at: [100, 115], label: [100, 109],
    fov: 'M100 117 L212 111 L212 147 Z',
    lens: '주통로 서쪽 천장에서 통로를 길게 본다. 사람과 지게차를 구분하고 방향을 남기지만 멀어서 얼굴은 남지 않는다.',
  },
  'M-2': {
    name: '자동문',
    at: [303.5, 129], label: [288, 124],
    fov: null, spot: [310, 129, 8.5],
    lens: '문 위 천장에서 수직으로 내려다본다. 위에서 보니 안전모와 어깨만 남는다 — 사람인지 지게차인지, 동인지 서인지까지다.',
  },
  'L-1': {
    name: '탈의실 입구',
    at: [79, 147], label: [79, 141],
    fov: 'M79 147 L49 155 L70 167 Z',
    lens: '문 위에 달렸다. 사물함 도난을 보려고 단 것이라 드나든 것과 방향만 남고 탈의실 안은 보이지 않는다.',
  },
  'C-3': {
    name: '갈림',
    at: [362.5, 122], label: [372, 121],
    fov: 'M362.5 122 L349 36 L376 36 Z',
    lens: '갈림의 랙 기둥 2.4m 높이에 붙어 북쪽을 본다. C통로 전체와 D구역 입구가 한 화면에 들어오고, D 안쪽 작업대는 들어오지 않는다.',
  },
  'W-1': {
    name: '출고 리프트',
    at: [144.6, 58.1], label: [148, 64],
    fov: 'M144.6 58.1 L106 47 L118 32 Z',
    lens: '리프트 하단에 달렸다. 무엇이 몇 매 올라갔는지를 보려고 단 것이라 파렛트와 지게차가 찍히고 사람은 곁다리로 들어온다.',
  },
};

// '[CCTV] M-2 자동문 23:03~00:25' → { camId:'M-2', cam, span:'23:03~00:25' }
function parseTitle(title) {
  const m = /^\[CCTV\]\s*([A-Z]-\d)\s*(.*)$/.exec(String(title || ''));
  if (!m) return { camId: null, cam: null, span: String(title || '') };
  const camId = m[1];
  const cam = CAMERAS[camId] || null;
  let rest = m[2].trim();
  if (cam && rest.startsWith(cam.name)) rest = rest.slice(cam.name.length).trim();
  return { camId, cam, span: rest };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1층 도면 — 사진이 아니라 도면이다.
//
//   GH로지스 3센터 1층: 동서 120m × 남북 60m. 1m = 3.5px 로 그렸다.
//   미터 값이 화면에서 읽혀야 알리바이가 서므로, 축척 막대와 치수 둘을 함께 그린다.
//     자동문 → 갈림 15m  (x 310 → 362.5 = 52.5px)
//     갈림  → 현장 20m  (y 122 → 52   = 70px)
//   C통로는 갈림에서 북쪽 25m(87.5px) 막다른 길이고 출구가 갈림 하나뿐이다.
//
//   진상에 속하는 것은 그리지 않는다 — 지게차가 간 길, 누가 무엇을 가렸는가,
//   카메라 없는 곳의 목록. 그건 평면도.html(집필용)에만 있고 여기 오지 않는다.
// ─────────────────────────────────────────────────────────────────────────────
const rect = (x, y, w, h, fill, stroke) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="${fill}" stroke="${stroke}" stroke-width=".9"/>`;
const room = (x, y, w, h) => rect(x, y, w, h, '#141c25', '#2f3d4d');
const aisle = (x, y, w, h) => rect(x, y, w, h, '#17190f', '#54492a');
const rackArea = (x, y, w, h) => rect(x, y, w, h, '#121820', '#28333f');
const tx = (x, y, t, cls = 'yp-rn', anchor = 'middle') =>
  `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${t}</text>`;

function planSvg(activeId) {
  const cams = Object.keys(CAMERAS)
    .map((id) => {
      const c = CAMERAS[id];
      const on = id === activeId;
      const [cx, cy] = c.at;
      const [lx, ly] = c.label;
      const shade = on
        ? (c.fov
            ? `<path d="${c.fov}" fill="#e8b23a" fill-opacity=".14" stroke="#e8b23a" stroke-opacity=".45" stroke-width=".8"/>`
            : `<circle cx="${c.spot[0]}" cy="${c.spot[1]}" r="${c.spot[2]}" fill="#e8b23a" fill-opacity=".16" stroke="#e8b23a" stroke-opacity=".5" stroke-width=".8"/>`)
        : '';
      const dot = on
        ? `<circle cx="${cx}" cy="${cy}" r="5.4" fill="#e8b23a" stroke="#0d1218" stroke-width="1.4"/>
           <circle cx="${cx}" cy="${cy}" r="1.9" fill="#0d1218"/>`
        : `<circle cx="${cx}" cy="${cy}" r="3.4" fill="#26313d" stroke="#46586c" stroke-width="1"/>`;
      return `${shade}${dot}${tx(lx, ly, id, on ? 'yp-ci yp-on' : 'yp-ci')}`;
    })
    .join('');

  return `<svg viewBox="0 0 480 272" xmlns="http://www.w3.org/2000/svg" class="plan"
    role="img" aria-label="GH로지스 3센터 1층 평면도 — 카메라 여섯 대의 자리">
  <style>
    .yp-rn { font: 700 9.2px 'Malgun Gothic','Noto Sans KR',sans-serif; fill: #94a3b5; }
    .yp-rt { font: 600 7.6px 'Malgun Gothic','Noto Sans KR',sans-serif; fill: #6a7887; }
    .yp-zn { font: 700 8px 'Malgun Gothic','Noto Sans KR',sans-serif; fill: #55616e; letter-spacing: .1em; }
    .yp-dim{ font: 700 7.6px sans-serif; fill: #7a9ab8; }
    .yp-ci { font: 800 8px sans-serif; fill: #728394; }
    .yp-ci.yp-on { fill: #e8b23a; }
    .yp-hot{ fill: #c05c55; }
  </style>

  <rect x="0" y="0" width="480" height="272" fill="#0e131a"/>
  ${tx(170, 19, '← 서쪽 2/3', 'yp-zn')}
  ${tx(384, 19, '동쪽 1/3 →', 'yp-zn')}
  ${tx(456, 19, '↑ 북', 'yp-rt', 'end')}

  <!-- 외벽 · 동서를 가르는 벽과 그 사이의 자동문 하나 -->
  <rect x="30" y="24" width="420" height="210" fill="none" stroke="#54626f" stroke-width="1.8"/>
  <line x1="310" y1="24" x2="310" y2="122" stroke="#54626f" stroke-width="1.8"/>
  <line x1="310" y1="136" x2="310" y2="234" stroke="#54626f" stroke-width="1.8"/>
  <line x1="310" y1="122" x2="310" y2="136" stroke="#3a86c8" stroke-width="3.4"/>

  <!-- 주통로 — 벽이 없는 열린 통로. 바닥 보행선만 있다 -->
  ${aisle(94.8, 115, 215.2, 28)}
  ${tx(200, 133, '주 통 로', 'yp-rn')}
  ${tx(312, 150, '자동문', 'yp-rt')}

  <!-- 서쪽 -->
  ${room(35.3, 30.1, 61.3, 40.3)}${tx(66, 53, '입고 도크')}
  ${room(102.6, 30.1, 42, 30.6)}${tx(123.6, 43, '출고')}${tx(123.6, 53, '리프트')}
  ${room(121.9, 76.5, 61.3, 38.5)}${tx(152.5, 94, '충전소')}${tx(152.5, 105, '지게차 주차', 'yp-rt')}
  ${room(188.4, 80, 51.6, 35)}${tx(214.2, 101, '배터리실')}
  <line x1="198" y1="115" x2="228" y2="115" stroke="#3a86c8" stroke-width="2.6"/>
  ${rackArea(251.4, 45.9, 54.3, 69.1)}${tx(278.5, 79, 'A구역')}${tx(278.5, 90, '집품 랙', 'yp-rt')}
  ${room(35.3, 74.8, 56, 40.3)}${tx(63.3, 96, '계단')}${tx(63.3, 107, '↑ 2층', 'yp-rt')}
  ${room(35.3, 150, 56, 34.1)}${tx(63.3, 172, '탈의실')}
  <line x1="48" y1="150" x2="78" y2="150" stroke="#3a86c8" stroke-width="2.6"/>
  ${room(35.3, 190.3, 56, 35)}${tx(63.3, 212, '휴게실')}
  ${room(101.8, 220, 45.5, 14)}${tx(124.5, 231, '정문')}
  <line x1="61.5" y1="234" x2="61.5" y2="243.6" stroke="#54626f" stroke-width=".9" stroke-dasharray="3 2.5"/>
  <rect x="35.3" y="243.6" width="52.5" height="21.9" rx="1.5" fill="#0d1218" stroke="#54626f"
    stroke-width=".9" stroke-dasharray="4 3"/>
  ${tx(61.5, 255, '흡연장')}${tx(61.5, 264, '건물 밖', 'yp-rt')}
  ${rackArea(170, 153.5, 135.6, 56.9)}${tx(237.8, 179, 'B구역')}${tx(237.8, 190, '집품 랙', 'yp-rt')}

  <!-- 동쪽 — 갈림에서 북쪽이 C통로, 남쪽이 D구역 -->
  ${aisle(310, 122, 65, 14)}${tx(322, 131, '갈림')}
  ${aisle(350.3, 34.5, 24.5, 87.5)}
  <text x="362.5" y="100" class="yp-rn" text-anchor="middle" transform="rotate(-90 362.5 100)">C통로</text>
  ${rackArea(325.8, 34.5, 24.5, 80.5)}
  <text x="338" y="76" class="yp-rt" text-anchor="middle" transform="rotate(-90 338 76)">랙 3단</text>
  ${rackArea(374.8, 34.5, 24.5, 80.5)}
  <text x="387" y="76" class="yp-rt" text-anchor="middle" transform="rotate(-90 387 76)">랙 1단</text>
  <rect x="374.8" y="46" width="12" height="12" fill="#4a3f21" stroke="#6d5d31" stroke-width=".9"/>
  <rect x="356" y="46" width="16" height="12" fill="#8a7440" stroke="#b39a5c" stroke-width=".9"
    transform="rotate(-14 364 52)"/>
  <text x="362.5" y="57" text-anchor="middle" style="font:800 14px sans-serif;fill:#b8534c">✕</text>
  ${tx(362.5, 69, '현장', 'yp-rn yp-hot')}
  ${rackArea(362.5, 152, 65.6, 5.3)}${rackArea(362.5, 160, 65.6, 5.3)}
  ${room(324.9, 171, 120.8, 54.3)}${tx(352, 201, 'D구역')}
  ${room(375.6, 178, 42, 14.9)}${tx(396.6, 188, '반품 작업대', 'yp-rt')}
  <line x1="450" y1="195.5" x2="450" y2="214.8" stroke="#3a86c8" stroke-width="3.4"/>
  ${tx(444, 208, '뒷문', 'yp-rt', 'end')}

  <!-- 치수 둘 · 축척 -->
  <g stroke="#3f5a75" stroke-width=".9" fill="none">
    <line x1="310" y1="145" x2="362.5" y2="145"/>
    <line x1="310" y1="142" x2="310" y2="148"/><line x1="362.5" y1="142" x2="362.5" y2="148"/>
    <line x1="408" y1="52" x2="408" y2="122"/>
    <line x1="405" y1="52" x2="411" y2="52"/><line x1="405" y1="122" x2="411" y2="122"/>
    <line x1="300" y1="250" x2="335" y2="250" stroke="#4f6b87" stroke-width="1.4"/>
    <line x1="300" y1="246.5" x2="300" y2="253.5"/><line x1="335" y1="246.5" x2="335" y2="253.5"/>
  </g>
  ${tx(344, 141, '15m', 'yp-dim')}
  ${tx(412, 90, '20m', 'yp-dim', 'start')}
  ${tx(317.5, 262, '10m', 'yp-dim')}
  ${tx(452, 262, '120m × 60m', 'yp-dim', 'end')}

  ${cams}
</svg>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 본문 — 문단과 「통행 기록 블록」을 가른다.
//
//   detail 은 빈 줄로 문단이 갈리고, 문단 안의 줄바꿈이 로그 한 줄이다.
//   **모든 줄이 시각으로 시작하는 문단**만 표로 그린다. 그 밖은 문단 그대로 둔다.
//   그래서 데이터가 늘거나 줄어도 이 파일을 고칠 일이 없다 — 표의 내용을 여기 적지 않는다.
// ─────────────────────────────────────────────────────────────────────────────
const TIME_LINE = /^(\d{1,2}:\d{2}(?:~\d{1,2}:\d{2})?)(?:\s+(.*))?$/;
const DIR_WHAT = /^([동서])\s*·\s*(사람|지게차)$/;

// 시각으로 시작한다고 다 로그 줄은 아니다. V1 의 첫 문단이 「22:30 전후로 게이트
// 리더기에 사원증이 스물다섯 번 찍힌다. …」로 시작하는데, 그건 산문이다.
// 로그 줄의 뒷부분은 짧고(실측 최대 26자) 문장 마침표가 없다.
const LOG_REST_MAX = 40;
function isLogLine(line) {
  const m = TIME_LINE.exec(line);
  if (!m) return false;
  const rest = (m[2] || '').trim();
  return rest.length <= LOG_REST_MAX && !rest.includes('.');
}

// '00:53 입 · 00:56 출' 처럼 한 줄에 두 건이 있으면 나눈다.
// '23:03 동 · 사람' 은 나누지 않는다 — 뒤쪽이 시각으로 시작하지 않는다.
function splitEvents(line) {
  const parts = line.split(' · ').map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1 && parts.every(isLogLine)) return parts;
  return [line];
}

function parseRow(str) {
  const m = TIME_LINE.exec(str);
  if (!m) return null;
  const time = m[1];
  const rest = (m[2] || '').trim();
  const dw = DIR_WHAT.exec(rest);
  return dw ? { time, dir: dw[1], what: dw[2] } : { time, text: rest };
}

function parseBlocks(detail) {
  return String(detail || '')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      // 기록표는 목록이다 — 줄이 하나뿐인 문단은 표로 만들지 않는다.
      if (lines.length < 2 || !lines.every(isLogLine)) return { kind: 'text', block };
      const rows = [];
      for (const line of lines) for (const ev of splitEvents(line)) {
        const row = parseRow(ev);
        if (row) rows.push(row);
      }
      return rows.length ? { kind: 'log', rows } : { kind: 'text', block };
    });
}

const paras = (text) =>
  String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');

// 방향은 도면과 같은 방향으로 읽힌다 — 동이 오른쪽, 서가 왼쪽.
const dirCell = (d) =>
  d === '동'
    ? '<span class="dir">동 <b>→</b></span>'
    : '<span class="dir"><b>←</b> 서</span>';

function logTable(rows) {
  const three = rows.every((r) => r.dir);
  if (three) {
    const body = rows
      .map(
        (r) =>
          `<tr><td class="t">${esc(r.time)}</td><td class="d">${dirCell(r.dir)}</td>` +
          `<td class="w"><span class="chip ${r.what === '지게차' ? 'lift' : 'person'}">${esc(r.what)}</span></td></tr>`
      )
      .join('');
    return `<table class="log"><thead><tr><th>시각</th><th>방향</th><th>무엇</th></tr></thead>
      <tbody>${body}</tbody></table>`;
  }
  const body = rows
    .map((r) => {
      const text = r.dir ? `${r.dir} · ${r.what}` : r.text;
      return `<tr><td class="t">${esc(r.time)}</td><td>${esc(text) || '—'}</td></tr>`;
    })
    .join('');
  return `<table class="log"><thead><tr><th>시각</th><th>기록</th></tr></thead>
    <tbody>${body}</tbody></table>`;
}

// 화면 캡처. public/images/yaganjo/ 가 아직 없어 거의 다 실패한다 —
// 깨진 아이콘 대신 자리표시로 떨어지게 두고, 그 자리가 비어도 글은 읽힌다.
const shot = (src, alt) =>
  src ? `<figure class="shot"><img src="${esc(src)}" alt="${esc(alt || '')}" loading="lazy"></figure>` : '';

function wireShots(scope) {
  scope.querySelectorAll('.shot img').forEach((img) => {
    img.addEventListener('error', () => {
      const fig = img.closest('.shot');
      if (!fig) return;
      fig.classList.add('miss');
      fig.textContent = '화면 캡처 준비 중';
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// C-3 의 검은 화면 — 꽝처럼 보이지만 꽝이 아니다.
//
//   00:30~04:11 의 세 시간 사십일 분을 **실제로 검은 화면으로 보여 준다.** 구석의
//   시각만 흐르고 소리는 없다. 그 텅 빈 시간을 눈으로 견디는 것이 이 카드의 내용이고,
//   끝까지 흐르면 04:11 의 세 초가 붙는다.
//
//   검은 화면 페이지의 image 는 일부러 모니터 **배경**으로만 얹는다. 파일이 없으면
//   검은 바탕이 그대로 남는데, 그것이 곧 맞는 그림이다.
// ─────────────────────────────────────────────────────────────────────────────
const isBlackPage = (page) => String(page?.title || '').includes('검은 화면');

const MIN0 = 30;  // 00:30
const MIN1 = 251; // 04:11
const PLAY_MS = 18000;

const clock = (min) => {
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  const s = Math.floor((min % 1) * 60);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

function blackScreen(camId, page) {
  return `<div class="mon" id="mon">
      ${page.image ? `<img id="monimg" src="${esc(page.image)}" alt="">` : ''}
      <span class="ov tag">${esc(camId || '')}</span>
      <span class="ov rec" id="rec">● REC</span>
      <span class="ov aud">소리 없음</span>
      <span class="ov tc" id="tc">${clock(MIN0)}</span>
    </div>
    <div class="bar"><i id="bar"></i></div>
    <div class="ctl">
      <button type="button" id="play">재생</button>
      <button type="button" id="skip">04:11 로 건너뛰기</button>
      <span class="hintx">00:30 → 04:11 · 3시간 41분</span>
    </div>`;
}

function wireBlackScreen(scope, onEnd) {
  const tc = scope.querySelector('#tc');
  const bar = scope.querySelector('#bar');
  const rec = scope.querySelector('#rec');
  const play = scope.querySelector('#play');
  const skip = scope.querySelector('#skip');
  const monimg = scope.querySelector('#monimg');
  if (!tc || !bar || !play || !skip) return;

  // 캡처가 없으면 그냥 검은 바탕이 남는다 — 그것이 맞는 그림이다.
  monimg?.addEventListener('error', () => monimg.remove());

  let raf = 0;
  let running = false;

  const paint = (p) => {
    tc.textContent = clock(MIN0 + (MIN1 - MIN0) * p);
    bar.style.width = `${(p * 100).toFixed(2)}%`;
  };

  const finish = () => {
    running = false;
    cancelAnimationFrame(raf);
    paint(1);
    rec?.classList.remove('on');
    play.disabled = true;
    skip.disabled = true;
    play.textContent = '재생 끝';
    onEnd();
  };

  const start = () => {
    if (running) return;
    running = true;
    play.textContent = '재생 중';
    play.disabled = true;
    rec?.classList.add('on');
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / PLAY_MS);
      paint(p);
      if (p >= 1) return finish();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  play.addEventListener('click', start);
  skip.addEventListener('click', finish);

  // 움직임을 줄여 달라고 한 사람에게는 저절로 흐르지 않는다. 단추는 그대로 남는다.
  const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  paint(0);
  if (!calm) start();
}

// ─────────────────────────────────────────────────────────────────────────────
// 그리기
// ─────────────────────────────────────────────────────────────────────────────
window.addEventListener('hashchange', () => location.reload());

const root = document.getElementById('cctv-root');

// QR 리더가 주소를 한 번 더 인코딩해 보내는 일이 있다. 망가진 % 열이 와도
// decodeURIComponent 가 던지는 것으로 화면이 백지가 되면 안 된다 — 안내문으로 떨어뜨린다.
const rawHash = location.hash.replace(/^#/, '');
let code = '';
try {
  code = decodeURIComponent(rawHash).trim().toUpperCase();
} catch {
  code = rawHash.trim().toUpperCase();
}
const clue = code ? CLUES[code] : null;

if (!clue) {
  root.innerHTML = `<div class="box">
    <h1>카메라 열람</h1>
    <p class="msg">카드의 QR 을 찍어서 들어와야 그 기록이 열립니다.</p>
    <p class="sub">주소 끝에 단서 코드가 없거나(<code>${esc(code) || '없음'}</code>)
      카메라(V) 카드가 아닌 코드입니다. 다른 카드의 QR 은 각자 자기 화면으로 갑니다.</p>
  </div>`;
} else {
  const { camId, cam, span } = parseTitle(clue.title);
  const boardNo = boardNoOf(code);
  const pages = Array.isArray(clue.pages) ? clue.pages : [];
  const blackIdx = pages.findIndex(isBlackPage);
  const black = blackIdx >= 0 ? pages[blackIdx] : null;
  const after = black ? pages.filter((_, i) => i !== blackIdx) : [];

  // 본문 — 검은 화면 카드는 모니터가 본문을 대신하고, 나머지는 detail 을 문단·표로 푼다.
  let body = '';
  let hasLog = false;
  if (black) {
    body =
      blackScreen(camId, black) +
      `<div class="body">${paras(black.content)}</div>` +
      (after.length
        ? `<section class="after" id="after" hidden>` +
          after
            .map(
              (p) =>
                `<h2>${esc(p.title || '')}</h2>${shot(p.image, p.title)}` +
                `<div class="body">${paras(p.content)}</div>`
            )
            .join('') +
          `</section>`
        : '');
  } else {
    body = parseBlocks(clue.detail)
      .map((b) => {
        if (b.kind !== 'log') return `<div class="body">${paras(b.block)}</div>`;
        hasLog = true;
        return logTable(b.rows);
      })
      .join('');
    body += shot(clue.image, clue.title);
    // detail 없이 pages 만 있는 카드가 생기면 그것도 읽히게 둔다.
    body += pages
      .map(
        (p) =>
          `<section class="after"><h2>${esc(p.title || '')}</h2>${shot(p.image, p.title)}` +
          `<div class="body">${paras(p.content)}</div></section>`
      )
      .join('');
  }

  const foot = [
    hasLog
      ? '<b>세는 것은 앉은 사람의 일이다.</b> 이 화면은 누계를 세어 주지 않고, 다른 카드의 기록을 함께 놓아 주지도 않는다.'
      : '',
    '이 QR 은 이 한 컷만 연다. 다른 시간대는 그 카드의 QR 로 열린다.',
  ]
    .filter(Boolean)
    .join('<br>');

  root.innerHTML = `<div class="box">
    <div class="hd">
      <span class="cam">${esc(camId || 'CCTV')}</span>
      <span class="cname">${esc(cam ? cam.name : '')}</span>
      <span class="span">${esc(span)}</span>
      ${boardNo ? `<span class="cardno">${esc(boardNo)}</span>` : ''}
    </div>
    ${cam ? `<p class="lens">${esc(cam.lens)}</p>` : ''}
    <div class="planwrap">${planSvg(camId)}</div>
    <p class="planfoot">
      <span class="swipe" id="swipe" hidden>← 도면은 가로로 밀어서 봅니다 · </span>
      위에서 본 <b>도면</b>이다 — 사진이 아니라 치수가 맞는다(1m = 3.5px).<br>
      자동문 → 갈림 <b>15m</b> · 갈림 → 현장 <b>20m</b> ·
      C통로는 갈림에서 북쪽 <b>25m 막다른 길</b>이고 출구는 갈림 하나다.<br>
      B 작업 위치 → 자동문 <b>30m</b> · 충전소 → 자동문 <b>45m</b>.
      동서를 오가는 길은 <b>자동문 하나</b>뿐이고, 카메라는 <b>이 여섯 대가 전부</b>다.
    </p>
    ${clue.description ? `<p class="desc">${esc(clue.description)}</p>` : ''}
    ${body}
    <p class="foot">${foot}</p>
  </div>`;

  // 좁은 화면에서는 도면이 가로로 넘친다. 글자를 읽을 수 있는 크기로 두는 대가다.
  // 지금 보는 카메라가 화면 밖에 있으면 스크롤을 그쪽으로 옮겨 둔다 — QR 을 찍는 사람은 대개 폰이다.
  const wrap = root.querySelector('.planwrap');
  const svgEl = wrap && wrap.querySelector('svg.plan');
  const camAt = CAMERAS[camId];
  if (wrap && svgEl) {
    const w = svgEl.getBoundingClientRect().width;
    if (w > wrap.clientWidth + 1) {
      const hint = root.querySelector('#swipe');
      if (hint) hint.hidden = false;
      if (camAt) wrap.scrollLeft = Math.max(0, (camAt.at[0] / 480) * w - wrap.clientWidth / 2);
    }
  }

  wireShots(root);
  if (black) {
    const panel = root.querySelector('#after');
    wireBlackScreen(root, () => {
      if (panel) panel.hidden = false;
    });
  }
}
