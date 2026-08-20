// 보드게임 인쇄물 키트 — 주소만 열면 브라우저가 문서를 만들어 내려준다.
//   정적 호스팅(S3+CloudFront)이라 서버가 없다. 문서 생성기가 순수 JS라 그대로 브라우저에서 돌린다.
//   Node 판(npm run docs)과 같은 생성기·같은 정본을 쓰므로 결과물이 어긋나지 않는다.
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
};

// 브라우저에서는 그림이 사이트 루트에 있다 — Node 판처럼 상대경로를 붙이면 안 된다.
const docs = [
  ...genBoardDocs(data, { assetBase: '' }),
  { ...genTruth(data), spoiler: true },
];

const NOTE = {
  '보드_진행물.html': '시작 시트 · 라운드 트랙 · 이벤트 카드 2장',
  '보드_장소판.html': '현장 판(방마다 번호 자리) + 공개 단서',
  '보드_단서카드.html': '97장 — 앞면 내용·조합 안내 / 뒷면 번호. 양면 인쇄',
  '보드_인물카드.html': '6인 × 공개 프로필 / 비밀 시나리오. 따로 나눠 줄 것',
  '진상해설서.html': '정답이 들어 있다. 봉투에 넣어 두고 끝나기 전엔 열지 말 것',
};

const save = (d) => {
  const url = URL.createObjectURL(new Blob([d.html], { type: 'text/html;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = d.filename;
  document.body.appendChild(a); a.click(); a.remove();
  // 곧바로 해제하면 큰 파일이 저장되기 전에 끊긴다
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
};

const root = document.getElementById('board-root');
root.innerHTML = `
  <h1>보드게임 인쇄물</h1>
  <p class="sub">「새벽이슬 크라임씬」 오프라인 보드게임판 — 6명 · 진행자 없음 · 100~120분</p>
  <div class="how">
    <b>인쇄 요령</b>
    <ul>
      <li>내려받은 파일을 브라우저로 열고 <b>Ctrl+P</b> → <b>배경 그래픽 켜기</b>.
        안 켜면 장소 색과 번호 배경이 사라진다.</li>
      <li><b>보드_단서카드</b>는 <b>양면·짧은 쪽 넘김</b>. 뒷면을 좌우 뒤집어 만들어 뒀다.</li>
      <li><b>보드_장소판</b>은 A3 가로 권장. 나머지는 A4.</li>
    </ul>
  </div>
  <div class="list">${docs.map((d, i) => `
    <div class="row${d.spoiler ? ' spoil' : ''}">
      <div><div class="fn">${d.filename}</div><div class="nt">${NOTE[d.filename] || ''}</div></div>
      <button data-i="${i}">내려받기</button>
    </div>`).join('')}</div>
  <button class="all">전부 내려받기 (${docs.length}개)</button>
  <p class="foot">규칙은 저장소의 <code>docs/보드게임-룰북.md</code> 에 있다.</p>`;

root.querySelectorAll('button[data-i]').forEach((b) => {
  b.addEventListener('click', () => { save(docs[+b.dataset.i]); b.textContent = '내려받음 ✓'; });
});
// 한꺼번에 쏘면 브라우저가 뒤쪽을 막는다 — 간격을 두고 하나씩 내린다
root.querySelector('.all').addEventListener('click', async (e) => {
  e.target.disabled = true;
  for (const d of docs) { save(d); await new Promise((r) => setTimeout(r, 700)); }
  e.target.textContent = '전부 내려받음 ✓';
});
