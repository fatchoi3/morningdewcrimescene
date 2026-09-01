// 보드게임 인쇄물 키트 — 주소만 열면 브라우저가 문서를 만들어 ZIP 으로 내려준다.
//   정적 호스팅(S3+CloudFront)이라 서버가 없다. 문서 생성기가 순수 JS라 그대로 브라우저에서 돌린다.
//   Node 판(npm run docs)과 같은 생성기·같은 정본을 쓰므로 결과물이 어긋나지 않는다.
import JSZip from 'jszip';
import { evidenceMap as publicMap, victim, suspects } from '../data/gameData.js';
import { mergeSecrets } from '../data/mergeSecrets.js';
import secrets from '@secrets';
import { genBoardDocs } from '../../tools/docgen/genBoard.mjs';
import { genTruth } from '../../tools/docgen/genTruth.mjs';

// Node 의 loadData.mjs 와 같은 합성. 저쪽은 fs 로 비밀팩을 찾지만 여기선 별칭이 이미 골라 준다.
const evidenceMap = mergeSecrets(publicMap, secrets);
const data = {
  victim, suspects,
  allClues: Object.entries(evidenceMap).map(([code, v]) => ({ code, ...v })),
  recover: secrets.recover || {},   // 인물 시트의 「내 폰 번호」
};

// ZIP 안에서는 HTML 옆에 images/ 폴더가 놓인다 — 절대경로(/images/…)로 두면 압축을 풀어
//   로컬에서 열었을 때 그림이 전부 깨진다. './images/…' 로 뽑아 폴더째 같이 넣는다.
let docs = [], sorted = [];

// 인쇄 순서대로 번호를 붙인다 — 파일 목록만 봐도 뭘 먼저 뽑을지 알 수 있게.
//   여기 없는 문서는 버리지 않고 뒤에 붙인다. 예전에는 이 목록에 없으면 조용히 빠졌고,
//   문서를 새로 떼어 냈을 때 웹 키트에서만 그 종이가 통째로 사라졌다.
const ORDER = ['보드_진행물.html', '보드_배치와트랙.html', '보드_장소판.html',
  '보드_단서카드.html', '보드_인물카드.html', '진상해설서.html'];
const rank = (f) => { const i = ORDER.indexOf(f); return i < 0 ? ORDER.length : i; };
const NOTE = {
  '보드_진행물.html': '먼저 이렇게 뽑습니다(뽑는 사람이 제일 먼저 볼 면) · 여기서부터 · 이 종이는 무엇인가 · 브리핑 · 기본 규칙 3면 · 사건 기록판 · 이벤트 카드. A4 세로',
  '보드_배치와트랙.html': '탁자에 이렇게 놓습니다 · 라운드 트랙. A3 세로 2면 — 판 옆에 계속 펴 둡니다',
  '보드_장소판.html': '현장 판(숙소 2층) · CCTV 열람실 · 감식실 + 공개 「목사님 일정표」. A3 세로 4면',
  '보드_단서카드.html': '카드 97장(방 56 · CCTV 16 · 감식 10 · 특수 8 · 필적 7). 사진은 전부 QR 이라 흑백으로 뽑아도 됩니다. 양면 · 긴 쪽 넘김',
  '보드_인물카드.html': '한 사람에 A4 가로 두 장(형사만 한 장). 양면 · 짧은 쪽 넘김으로 뽑아 안쪽이 마주 보게 세로로 접습니다 — 바깥은 겉면·이름표·백지뿐입니다. 7인용 형사 장은 여섯이면 빼세요',
  '진상해설서.html': '정답이 들어 있다. 봉투에 넣어 두고 끝나기 전엔 열지 말 것',
};


const README = `새벽이슬 크라임씬 — 보드게임 인쇄물
6명 · 진행자 없음 · 두 시간 안팎 (토론에는 제한 시간이 없습니다)

[인쇄 요령]
- HTML 을 브라우저로 열고 Ctrl+P.
- "배경 그래픽" 을 반드시 켜세요. 안 켜면 장소 색과 번호 배경이 사라집니다.
- 보드_단서카드 는 양면 · 긴 쪽 넘김으로 뽑으세요.
  세로 판이라 뒷면을 행마다 좌우로 뒤집어 뒀습니다 — 짧은 쪽으로 넘기면 앞뒤가 어긋납니다.
  사진을 전부 QR 로 돌렸으므로 흑백으로 뽑아도 됩니다.
- 보드_인물카드 는 반대로 양면 · 짧은 쪽 넘김입니다. 가로 판이라 그렇습니다.
  한 사람에 두 장이고, 두 장 다 안쪽이 마주 보게 접습니다 — 그래야 비밀이 바깥을 보지 않습니다.
  뽑아서 가운데를 세로로 접으면 네 면짜리 책자가 됩니다.
- 보드_장소판 과 보드_배치와트랙 은 A3 세로입니다. 나머지는 A4.

[주의]
- 진상해설서 에는 정답이 들어 있습니다. 봉투에 넣어 두고 끝나기 전엔 열지 마세요.
- 보드_인물카드 는 각자에게 따로 나눠 주세요. 접힌 안쪽은 본인만 봅니다.

[폴더]
- images/ 는 카드 그림입니다. HTML 과 같은 자리에 두어야 그림이 나옵니다.
`;

const root = document.getElementById('board-root');

// QR 생성이 비동기라 초기화를 함수로 감싼다(최상위 await 는 빌드 타깃이 막는다).
async function init() {
  docs = [...(await genBoardDocs(data, { assetBase: '.', siteUrl: location.origin })), genTruth(data)];
  sorted = [...docs].sort((a, b) => rank(a.filename) - rank(b.filename));
  root.innerHTML = `
  <h1>보드게임 인쇄물</h1>
  <p class="sub">「새벽이슬 크라임씬」 오프라인 보드게임판 — 6명 · 진행자 없음 · 두 시간 안팎</p>
  <button class="all">전체 ZIP 내려받기</button>
  <div class="prog" hidden><div class="bar"><i></i></div><div class="pmsg">준비 중…</div></div>
  <div class="how">
    <b>인쇄 요령</b>
    <ul>
      <li>ZIP 을 풀고 HTML 을 브라우저로 열어 <b>Ctrl+P</b> → <b>배경 그래픽 켜기</b>.
        안 켜면 장소 색과 번호 배경이 사라진다.</li>
      <li><b>단서카드</b>는 <b>양면 · 긴 쪽 넘김</b>. 세로 판이라 뒷면을 행마다 좌우로 뒤집어 뒀다 —
        짧은 쪽으로 넘기면 앞뒤가 어긋난다.</li>
      <li><b>인물카드</b>는 반대로 <b>양면 · 짧은 쪽 넘김</b>. 가로 판이라 그렇다.</li>
      <li><b>장소판</b>과 <b>배치와트랙</b>은 <b>A3 세로</b>. 나머지는 A4.</li>
      <li><code>images/</code> 폴더는 HTML 과 같은 자리에 둘 것. 옮기면 그림이 깨진다.</li>
    </ul>
  </div>
  <div class="list">${sorted.map((d, i) => `
    <div class="row${d.filename === '진상해설서.html' ? ' spoil' : ''}">
      <div><div class="fn">${String(i + 1).padStart(2, '0')}_${d.filename}</div>
        <div class="nt">${NOTE[d.filename] || ''}</div></div>
      <button class="one" data-i="${i}">개별</button>
    </div>`).join('')}</div>
  <p class="foot">규칙은 저장소의 <code>docs/보드게임-룰북.md</code> 에 있다.</p>`;

  const prog = root.querySelector('.prog');
  const bar = root.querySelector('.bar i');
  const pmsg = root.querySelector('.pmsg');
  const setProg = (done, total, msg) => {
  prog.hidden = false;
  bar.style.width = total ? `${Math.round(done / total * 100)}%` : '0%';
  pmsg.textContent = msg;
};

const saveBlob = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  // 곧바로 해제하면 큰 파일이 저장되기 전에 끊긴다
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

// 개별 HTML 은 사이트에서 바로 열 것을 전제로 절대경로가 낫다 — ZIP 판과 달리 폴더가 없다.
  root.querySelectorAll('button.one').forEach((b) => {
  b.addEventListener('click', () => {
    const d = sorted[+b.dataset.i];
    saveBlob(new Blob([d.html.replaceAll('"./images/', '"/images/')], { type: 'text/html;charset=utf-8' }), d.filename);
    b.textContent = '받음 ✓';
  });
});

  root.querySelector('.all').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  btn.disabled = true;
  try {
    const zip = new JSZip();
    const folder = zip.folder('새벽이슬-크라임씬-보드게임');
    folder.file('읽어보세요.txt', README);
    sorted.forEach((d, i) => folder.file(`${String(i + 1).padStart(2, '0')}_${d.filename}`, d.html));

    // 문서가 실제로 참조하는 그림만 모은다 — 정본 전체를 넣으면 쓰지도 않을 것까지 딸려 온다.
    const want = new Set();
    for (const d of sorted) for (const m of d.html.matchAll(/src="\.(\/images\/[^"]+)"/g)) want.add(m[1]);
    const list = [...want];
    let done = 0;
    setProg(0, list.length, `그림 ${list.length}개 모으는 중…`);
    for (const p of list) {
      try {
        const res = await fetch(p);
        if (res.ok) folder.file('images' + p.slice('/images'.length), await res.blob());
      } catch { /* 한 장 빠져도 나머지는 쓸 수 있게 넘어간다 */ }
      setProg(++done, list.length, `그림 ${done}/${list.length}`);
    }

    setProg(1, 1, '압축하는 중…');
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' },
      (m) => setProg(m.percent, 100, `압축 ${Math.round(m.percent)}%`));
    saveBlob(blob, '새벽이슬-크라임씬-보드게임.zip');
    setProg(1, 1, `완료 — ${(blob.size / 1024 / 1024).toFixed(1)}MB`);
    btn.textContent = '내려받음 ✓';
  } catch (err) {
    setProg(0, 1, '실패: ' + err.message);
    btn.disabled = false;
  }
});
}

init().catch((e) => {
  root.innerHTML = `<h1>인쇄물을 만들지 못했습니다</h1><p class="sub">${e.message}</p>`;
});
