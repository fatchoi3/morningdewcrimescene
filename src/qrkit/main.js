// QR판(오프라인 QR 게임) 인쇄물 키트 — 주소만 열면 브라우저가 문서를 만들어 ZIP 으로 내려준다.
//   보드게임 키트(src/board/main.js)와 같은 방식이다. 생성기는 Node 판(npm run docs)과 같은 파일을 쓰고,
//   그 안의 './loadData.mjs' 는 vite.config.js 의 docgen-browser 플러그인이 브라우저판으로 바꿔 문다.
//   이 문서들은 그림을 따로 싣지 않는다(QR 은 SVG 로 본문에 들어 있다) — ZIP 에 images/ 가 없다.
import JSZip from 'jszip';
import { victim } from '../data/gameData.js';
import { genQRDocs } from '../../tools/docgen/genQR.mjs';
import { genPlaceGuide } from '../../tools/docgen/genPlace.mjs';
import { genAllRefSheets } from '../../tools/docgen/genRefSheets.mjs';
import { genResultSheet } from '../../tools/docgen/genResult.mjs';
import { genTruth } from '../../tools/docgen/genTruth.mjs';

// 인쇄 순서대로 번호를 붙인다. 여기 없는 문서는 버리지 않고 뒤에 붙인다.
const ORDER = ['QR_부착표.html', 'QR_인쇄시트.html', '단서배치_귀속가이드.html', '결과제출지.html'];
const rank = (f) => {
  const i = ORDER.indexOf(f);
  if (i >= 0) return i;
  if (f.startsWith('배우레퍼런스_')) return ORDER.length;
  if (f === '진상해설서.html') return ORDER.length + 2;
  return ORDER.length + 1;
};
const NOTE = {
  'QR_부착표.html': '단서 코드마다 무엇에·어디에 붙이는지 적은 표. 뒤의 인쇄 시트에서 같은 코드를 잘라 붙인다. A4 세로',
  'QR_인쇄시트.html': '잘라 붙이는 QR — 게임 접속 QR 과 단서 QR. 단계 → 인물 순으로 묶여 있다. A4 세로 · 흑백으로 뽑아도 된다',
  '단서배치_귀속가이드.html': '인물별 단서표 · 특수 단서 조합표 · CCTV 귀속 · 일정표 · 방 배치도 · 준비 체크리스트. 운영자용. A4 세로',
  '결과제출지.html': '한 장에 두 벌 — 가운데 점선으로 잘라 쓴다. A4 가로',
  '진상해설서.html': '정답이 들어 있다. 봉투에 넣어 두고 끝나기 전엔 열지 말 것',
};
const noteOf = (f) => NOTE[f] || (f.startsWith('배우레퍼런스_') ? `${f.slice(7, -5)} 역 배우 시트 — 본인에게만 따로 준다. A4 세로` : '');

const README = `새벽이슬 크라임씬 — QR판(오프라인) 인쇄물
참가자는 폰으로 QR 을 찍어 단서를 얻습니다. 운영자가 미리 QR 을 물건·현장에 붙여 둡니다.

[인쇄 요령]
- HTML 을 브라우저로 열고 Ctrl+P.
- "배경 그래픽" 을 켜세요. 안 켜면 인물 색과 표 배경이 사라집니다.
- 결과제출지 는 A4 가로입니다. 나머지는 A4 세로.
- QR_인쇄시트 는 흑백으로 뽑아도 됩니다. 잘라서 QR_부착표 에 적힌 자리에 붙이세요.

[주의]
- 진상해설서 에는 정답이 들어 있습니다. 봉투에 넣어 두고 끝나기 전엔 열지 마세요.
- 배우레퍼런스 는 각자에게 따로 나눠 주세요. 다른 사람의 비밀이 들어 있습니다.
- 단서배치_귀속가이드 는 운영자만 봅니다.
`;

const root = document.getElementById('board-root');

const saveBlob = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  // 곧바로 해제하면 큰 파일이 저장되기 전에 끊긴다
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

// QR 생성이 비동기라 초기화를 함수로 감싼다(최상위 await 는 빌드 타깃이 막는다).
async function init() {
  const docs = [...(await genQRDocs()), genPlaceGuide(), ...genAllRefSheets(), genResultSheet(), genTruth({ victim })];
  const sorted = [...docs].sort((a, b) => rank(a.filename) - rank(b.filename));
  const name = (d, i) => `${String(i + 1).padStart(2, '0')}_${d.filename}`;
  root.innerHTML = `
  <h1>QR판 인쇄물</h1>
  <p class="sub">「새벽이슬 크라임씬」 오프라인 QR 게임 — 참가자는 폰으로 QR 을 찍어 단서를 얻는다</p>
  <button class="all">전체 ZIP 내려받기</button>
  <div class="prog" hidden><div class="bar"><i></i></div><div class="pmsg">준비 중…</div></div>
  <div class="how">
    <b>인쇄 요령</b>
    <ul>
      <li>ZIP 을 풀고 HTML 을 브라우저로 열어 <b>Ctrl+P</b> → <b>배경 그래픽 켜기</b>.</li>
      <li><b>QR 인쇄시트</b>는 흑백으로 뽑아도 된다. 잘라서 <b>QR 부착표</b>에 적힌 자리에 붙인다.</li>
      <li><b>결과제출지</b>는 <b>A4 가로</b>. 나머지는 A4 세로.</li>
      <li><b>배우레퍼런스</b>는 본인에게만, <b>단서배치 가이드</b>는 운영자만 본다.</li>
    </ul>
  </div>
  <div class="list">${sorted.map((d, i) => `
    <div class="row${d.filename === '진상해설서.html' ? ' spoil' : ''}">
      <div><div class="fn">${name(d, i)}</div>
        <div class="nt">${noteOf(d.filename)}</div></div>
      <button class="one" data-i="${i}">개별</button>
    </div>`).join('')}</div>
  <p class="foot">보드게임판 인쇄물은 <a href="/board-kit">/board-kit</a> 에 따로 있다.</p>`;

  const prog = root.querySelector('.prog');
  const bar = root.querySelector('.bar i');
  const pmsg = root.querySelector('.pmsg');
  const setProg = (done, total, msg) => {
    prog.hidden = false;
    bar.style.width = total ? `${Math.round(done / total * 100)}%` : '0%';
    pmsg.textContent = msg;
  };

  root.querySelectorAll('button.one').forEach((b) => {
    b.addEventListener('click', () => {
      const d = sorted[+b.dataset.i];
      saveBlob(new Blob([d.html], { type: 'text/html;charset=utf-8' }), d.filename);
      b.textContent = '받음 ✓';
    });
  });

  root.querySelector('.all').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      const zip = new JSZip();
      const folder = zip.folder('새벽이슬-크라임씬-QR판');
      folder.file('읽어보세요.txt', README);
      sorted.forEach((d, i) => folder.file(name(d, i), d.html));
      setProg(0, 100, '압축하는 중…');
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' },
        (m) => setProg(m.percent, 100, `압축 ${Math.round(m.percent)}%`));
      saveBlob(blob, '새벽이슬-크라임씬-QR판.zip');
      setProg(1, 1, `완료 — ${(blob.size / 1024).toFixed(0)}KB`);
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
