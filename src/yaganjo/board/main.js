// ─────────────────────────────────────────────────────────────────────────────
// 「야간조」 보드게임 인쇄물 키트 — 주소만 열면 브라우저가 문서를 만들어 ZIP 으로 내려준다.
//
//   정적 호스팅(S3+CloudFront)이라 서버가 없다. 문서 생성기가 순수 JS라 그대로 브라우저에서 돌린다.
//   Node 판(node tools/docgen/yaganjo/buildY.mjs)과 **같은 생성기 · 같은 정본**을 쓴다.
//
//   ── 같은 정본, 두 경로 ────────────────────────────────────────────────────
//   야간조의 산문 355KB 는 docs/야간조-보드게임/*.md 에 있다. docs/ 는 public/ 이 아니라
//   서빙되지 않으므로 fetch 로는 못 읽는다. 그래서 `?raw` 로 빌드 시점에 번들에 넣는다.
//
//     Node    : readFileSync('docs/야간조-보드게임/카드.md', 'utf8')   ← buildY.mjs
//     브라우저: import cardsMd from '…/카드.md?raw'                     ← 이 파일
//
//   읽는 방법이 둘일 뿐 정본은 하나다. 바인딩 이름만 ASCII 로 두고 경로는 한글 그대로다 —
//   경로를 ASCII 로 바꾸려면 docs/ 의 파일 이름을 바꿔야 하고, 그러면 정본이 둘이 된다.
//
//   ── 이 페이지가 새벽이슬 board.html 과 다른 것 ────────────────────────────
//   ① genBoardDocs 대신 genYaganjoDocs — 마크다운 묶음을 인자로 하나 더 받는다.
//   ② 인쇄 순서·요령·README 가 야간조의 것(진행물 → 룰북 → 카드 → 인물시트 → 해설서).
//      셋 다 tools/docgen/yaganjo/index.mjs 에서 가져온다. Node 판과 글자까지 같아야
//      「웹으로 뽑은 키트」와 「명령으로 뽑은 키트」가 다른 말을 하지 않는다.
//   ③ 야간조 문서의 그림 경로가 **절대경로**(`/images/yaganjo/…`)다. 새벽이슬 판은
//      생성기가 `./images/…` 로 뽑아 ZIP 에 그대로 넣었지만, 여기서는 반대로
//      ZIP 에 넣을 때 상대경로로 바꾼다(아래 toZipHtml).
//   ④ 생성기가 스스로 잡아낸 경고(제작 주석 누출 · QR 누락 · 인쇄 함정)를 화면에 띄운다.
//      onWarn 을 console 로만 흘려 보내면 아무도 안 본 채로 종이가 나온다.
// ─────────────────────────────────────────────────────────────────────────────
import JSZip from 'jszip';
import { genYaganjoDocs, DOC_ORDER, DOC_NOTES, KIT_README } from '../../../tools/docgen/yaganjo/index.mjs';
import yaganjo from '../../scenarios/yaganjo/index.js';
import { CARD_COUNT } from '../../scenarios/yaganjo/cards.js';

// 정본 마크다운 다섯. 바인딩 이름은 ASCII, 경로는 한글 그대로.
import cardsMd from '../../../docs/야간조-보드게임/카드.md?raw';
import rulebookMd from '../../../docs/야간조-보드게임/룰북.md?raw';
import sheetsMd from '../../../docs/야간조-보드게임/진행물.md?raw';
import personsMd from '../../../docs/야간조-보드게임/인물시트.md?raw';
import truthMd from '../../../docs/야간조-보드게임/진상해설서.md?raw';

const mdSources = { cards: cardsMd, rulebook: rulebookMd, sheets: sheetsMd, persons: personsMd, truth: truthMd };

// Node 의 buildY.mjs 와 같은 합성. 시나리오 객체가 이미 evidenceMap·cast·config 를 들고 있다.
const data = {
  ...yaganjo,
  recover: yaganjo.secrets?.recover || {},   // 인물 시트의 「내 폰 번호」
};

// 인물 시트 장수 — 용의자 여섯 + 형사(재해조사관) 한 장. 세어서 쓴다.
//   숫자를 글로 적어 두면 캐스팅이 바뀐 날 README 만 옛말을 한다.
const PERSON_SHEETS = (yaganjo.suspects?.length || 0) + (yaganjo.investigator ? 1 : 0);

// ── QR 이 가리킬 주소 ────────────────────────────────────────────────────────
// 카드의 QR 은 `<주소>/yaganjo-clue#<코드>` 로 간다. **종이는 되돌릴 수 없다** —
// 개발 서버에서 뽑으면 109장에 localhost 가 박힌 채로 인쇄되고, 그 자리에서는 아무도 모른다.
// 그래서 로컬에서 열었을 때만 config 의 운영 주소로 돌린다. 어느 쪽이든 화면에 적어 둔다.
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'];
const isLocal = location.protocol === 'file:'
  || LOCAL_HOSTS.includes(location.hostname)
  || location.hostname.endsWith('.local');
const configUrl = (yaganjo.config?.siteUrl || '').replace(/\/$/, '');
const siteUrl = isLocal && configUrl ? configUrl : location.origin;

// 그림을 받아 올 뿌리. VITE_BASE 로 하위 경로에 배포되면 `/images/…` 가 그대로는 없다.
const ASSET_ROOT = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '');

let docs = [], sorted = [];
const warnings = [];

// 인쇄 순서대로 번호를 붙인다 — 파일 목록만 봐도 뭘 먼저 뽑을지 알 수 있게.
//   순서표는 생성기가 가진 것을 그대로 쓴다. 여기 없는 문서는 버리지 않고 뒤에 붙인다.
const ORDER = DOC_ORDER;
const NOTE = DOC_NOTES;
const rank = (f) => { const i = ORDER.indexOf(f); return i < 0 ? ORDER.length : i; };
const SPOIL = '보드_야간조_진상해설서.html';

// ZIP 안 「읽어보세요.txt」 — Node 판과 같은 본문(KIT_README) 뒤에 이번에 실제로 만든
//   문서 목록을 덧붙인다. 목록과 장수는 글로 적지 않고 결과물에서 센다.
const readmeOf = (list) => `${KIT_README}
[이 키트에 든 것]
${list.map((d, i) => `- ${String(i + 1).padStart(2, '0')}_${d.filename} — ${NOTE[d.filename] || ''}`).join('\n')}

- 카드 ${CARD_COUNT}장 · 인물 시트 ${PERSON_SHEETS}장(용의자 여섯 + 형사 하나)
- 7인이면 형사(재해조사관) 시트를 함께 나눠 주고, 6인이면 그 한 장만 빼세요.
- 진상해설서에는 정답이 들어 있습니다. 봉투에 넣어 두고 끝나기 전엔 열지 마세요.
- 🔒 카드의 QR 은 ${siteUrl} 로 갑니다.
`;

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const root = document.getElementById('board-root');

// 생성이 비동기라 초기화를 함수로 감싼다(최상위 await 는 빌드 타깃이 막는다).
async function init() {
  docs = await genYaganjoDocs(mdSources, data, {
    assetBase: '.',
    siteUrl,
    onWarn: (m) => warnings.push(m),
  });
  sorted = [...docs].sort((a, b) => rank(a.filename) - rank(b.filename));

  root.innerHTML = `
  <h1>보드게임 인쇄물</h1>
  <p class="sub">「야간조」 오프라인 보드게임판 — 6명(7인 가능) · 진행자 없음 · 두 시간 안팎</p>
  <button class="all">전체 ZIP 내려받기</button>
  <div class="prog" hidden><div class="bar"><i></i></div><div class="pmsg">준비 중…</div></div>
  <div class="qrhost">🔒 카드의 QR 은 <code>${esc(siteUrl)}/yaganjo-clue#…</code> 로 갑니다.
    ${isLocal && configUrl
      ? '지금은 로컬에서 열었으므로 <b>운영 주소</b>로 박았습니다 — 종이는 되돌릴 수 없습니다.'
      : '이 주소로 종이에 박힙니다. 다른 곳에 배포할 판이면 그 주소에서 뽑으세요.'}</div>
  ${warnings.length ? `<div class="warn"><b>생성기가 잡아낸 것 ${warnings.length}건</b><ul>${
    warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
  <div class="how">
    <b>인쇄 요령</b>
    <ul>
      <li>ZIP 을 풀고 HTML 을 브라우저로 열어 <b>Ctrl+P</b> → <b>배경 그래픽 켜기</b>.
        안 켜면 더미 색과 번호 배경이 사라진다.</li>
      <li><b>카드</b>는 <b>${CARD_COUNT}장</b>, 63×88mm 3×3. <b>양면 · 긴 쪽 넘김</b>으로 뽑는다.
        세로 판이라 뒷면을 행마다 좌우로 뒤집어 뒀다 — 짧은 쪽으로 넘기면 앞뒤가 어긋난다.</li>
      <li><b>인물 시트</b>는 <b>${PERSON_SHEETS}장</b>(용의자 여섯 + 형사 하나). 반대로
        <b>양면 · 짧은 쪽 넘김</b>이다. 가로 판이라 그렇다. 가운데를 세로로 접으면 네 면짜리 책자가 된다.
        <b>7인이면 형사(재해조사관) 시트를 포함</b>하고, 6인이면 그 한 장만 뺀다.</li>
      <li><b>진상해설서</b>에는 정답이 들어 있다. <b>봉투에 넣어 두고</b> 끝나기 전엔 열지 않는다.</li>
      <li>전부 <b>A4</b>다. 🔒 카드의 QR 은 폰·태블릿 화면으로 가니 인터넷이 되는 자리에서 한다.</li>
      <li><code>images/</code> 폴더는 HTML 과 같은 자리에 둘 것. 옮기면 그림이 깨진다.</li>
    </ul>
  </div>
  <div class="list">${sorted.map((d, i) => `
    <div class="row${d.filename === SPOIL ? ' spoil' : ''}">
      <div><div class="fn">${String(i + 1).padStart(2, '0')}_${esc(d.filename)}</div>
        <div class="nt">${esc(NOTE[d.filename] || '')}</div></div>
      <button class="one" data-i="${i}">개별</button>
    </div>`).join('')}</div>
  <p class="foot">규칙은 저장소의 <code>docs/야간조-보드게임/룰북.md</code> 에 있다.
    명령으로 뽑으려면 <code>node tools/docgen/yaganjo/buildY.mjs</code>.</p>`;

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

  // ZIP 안에서는 HTML 옆에 images/ 폴더가 놓인다 — 절대경로(/images/…)로 두면 압축을 풀어
  //   로컬에서 열었을 때 그림이 전부 깨진다. 넣을 때 './images/…' 로 바꾸고 폴더째 같이 넣는다.
  //   (개별 내려받기는 사이트에서 바로 열 것을 전제로 절대경로가 낫다 — 그쪽은 손대지 않는다.)
  //   오늘 야간조 문서는 그림이 0장이다(카드는 산문 + QR). 센터 평면도가 들어오는 날을
  //   대비해 절대·상대 두 표기를 다 잡는다 — 그때 이 자리를 다시 여는 일이 없게.
  const toZipHtml = (html) => html.replaceAll('"/images/', '"./images/');
  const IMG_IN_DOC = /src="\.?\/(images\/[^"]+)"/g;

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
      const folder = zip.folder('야간조-보드게임');
      folder.file('읽어보세요.txt', readmeOf(sorted));
      sorted.forEach((d, i) => folder.file(`${String(i + 1).padStart(2, '0')}_${d.filename}`, toZipHtml(d.html)));

      // 문서가 실제로 참조하는 그림만 모은다 — 정본 전체를 넣으면 쓰지도 않을 것까지 딸려 온다.
      const want = new Set();
      for (const d of sorted) for (const m of d.html.matchAll(IMG_IN_DOC)) want.add(m[1]);
      const list = [...want];
      let done = 0, got = 0;
      setProg(0, list.length, `그림 ${list.length}개 모으는 중…`);
      for (const p of list) {
        try {
          const res = await fetch(`${ASSET_ROOT}/${p}`);
          // 정적 호스팅은 없는 파일에 index.html 을 200 으로 돌려주기도 한다.
          //   그걸 그대로 넣으면 .jpg 라는 이름의 HTML 이 ZIP 에 들어앉는다.
          const ct = res.headers.get('content-type') || '';
          if (res.ok && !/^text\/html/i.test(ct)) { folder.file(p, await res.blob()); got++; }
        } catch { /* 한 장 빠져도 나머지는 쓸 수 있게 넘어간다 */ }
        setProg(++done, list.length, `그림 ${done}/${list.length}`);
      }

      setProg(1, 1, '압축하는 중…');
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' },
        (m) => setProg(m.percent, 100, `압축 ${Math.round(m.percent)}%`));
      saveBlob(blob, '야간조-보드게임.zip');
      const miss = list.length - got;
      setProg(1, 1, `완료 — ${(blob.size / 1024 / 1024).toFixed(1)}MB`
        + (miss > 0 ? ` · 그림 ${miss}장을 못 받았다(문서는 그대로 쓸 수 있다)` : ''));
      btn.textContent = '내려받음 ✓';
    } catch (err) {
      setProg(0, 1, '실패: ' + err.message);
      btn.disabled = false;
    }
  });
}

init().catch((e) => {
  root.innerHTML = `<h1>인쇄물을 만들지 못했습니다</h1><p class="sub">${esc(e.message)}</p>`;
});
