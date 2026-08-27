// 판 밖 시설 두 곳 — 감식실과 CCTV 열람실.
//
//   지금까지 이 둘은 「상자에 넣어 두었다가 이벤트가 열리면 꺼내는 카드 더미」였다. 2층 평면도에는
//   없는 곳이라 탁자 위에서 아무 자리도 갖지 못했고, 어디에 무엇을 놓는지도 말로만 정했다.
//   방을 하나씩 그려 주면 그 자리가 생긴다 — 채취물은 여기 내려놓고, 결과는 저기서 집는다.
//
//   [그림과 글자를 섞지 않는다]
//   2층 평면도와 같은 방식이다. 그림은 분위기만 만들고, 번호·시각·구역은 전부 그 위에 벡터로
//   얹는다. 카드 번호가 바뀌어도 그림을 다시 뽑을 필요가 없고, 그림 해상도가 낮아도 글자는 선명하다.
//   특히 CCTV 는 모니터 위치를 그림에 맞추려 들면 그림을 새로 뽑을 때마다 좌표를 다시 재야 한다 —
//   모니터 자체를 벡터로 그리고 그림은 뒤에 깔기만 한다.

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));

// 「[CCTV 장면] 13:13~21 서지안」 → { time, who }
const cutOf = (title = '') => {
  const m = String(title).match(/\[CCTV 장면\]\s*(\S+)\s*(.*)$/);
  return m ? { time: m[1], who: m[2].trim() } : { time: '', who: '' };
};
// 「10:50~52」·「12:00~12:25」가 섞여 있어 시작 시각으로만 정렬한다.
const startOf = (t) => String(t).split('~')[0];

/**
 * CCTV 열람실 — 모니터 벽. 한 대가 한 장면이고, 시간 순서로 늘어선다.
 *   시각을 미리 적어 두는 것은 실제 열람에 가깝기 때문이다. 눈먼 뽑기로 화면을 고르는 일은 없다.
 *   대신 「무엇이 찍혔는가」는 카드를 집어야 안다 — 판이 알려 주는 것은 언제·누구까지다.
 */
export function cctvRoomHTML(cards, unitNo, personColor, src) {
  const rows = cards
    .map((c) => ({ no: unitNo(c), ...cutOf(c.title) }))
    .sort((a, b) => startOf(a.time).localeCompare(startOf(b.time)));
  const mon = (r) => `<div class="mon">
    <div class="monScr"><span class="monNo">${esc(r.no)}</span>
      <span class="monTm">${esc(r.time)}</span></div>
    <div class="monDot" style="background:${personColor(r.who) || '#5a6270'}"></div>
  </div>`;
  return `<div class="art art-room">
    <img src="${src}" alt="CCTV 열람실">
    <div class="monWall">${rows.map(mon).join('')}</div>
  </div>
  <p class="muted">모니터는 <b>시간 순서</b>로 놓여 있습니다. 아래의 색점은 <b>그 장면에 찍힌 사람</b>입니다 —
    카드 뒷면의 색점과 같습니다. <b>무엇이 찍혔는지는 카드를 집어야 압니다.</b></p>`;
}

/**
 * 감식실 — 낸 자리와 읽는 자리가 눈에 보여야 한다.
 *   「라운드 끝에 감식실 옆에 내려놓는다」를 말로만 정해 두면 매번 어디였는지를 다시 묻게 된다.
 */
export function labRoomHTML(results, unitNo, src) {
  const slot = (n) => `<div class="labSlot"><span>${n}</span></div>`;
  return `<div class="art art-room">
    <img src="${src}" alt="감식실">
    <div class="labZones">
      <div class="labZone labIn">
        <div class="labTt">🔬 채취물을 여기 내려놓습니다</div>
        <div class="labRow">${[1, 2, 3, 4, 5, 6].map(slot).join('')}</div>
        <div class="labSub">라운드 <b>끝</b>에, <b>앞면으로</b>. 조사 행동을 쓰지 않습니다 ·
          사람마다 한 라운드에 한 장</div>
      </div>
      <div class="labZone labOut">
        <div class="labTt">결과는 여기서 집습니다 — <b>낸 사람 아닌 이가</b></div>
        <div class="labRow">${results.map((c) => slot(esc(unitNo(c)))).join('')}</div>
        <div class="labSub">다음 라운드 <b>시작</b>에 소리 내어 읽습니다 · 읽은 뒤 그 카드는 읽은 사람이 갖습니다<br>
          <b>⚖</b> 가 붙은 결과는 카드에 적힌 사람이 읽을 수 없습니다</div>
      </div>
    </div>
  </div>`;
}

// 두 방의 그림 위에 얹는 것들의 모양. 장소 판 CSS 에 함께 실린다.
export const ROOM_CSS = `
  .art-room { border-radius: 2mm; overflow: hidden; }
  .art-room img { filter: brightness(0.82); }
  /* CCTV — 모니터 벽. 그림 위에 겹쳐 4열로 세운다. */
  /* CCTV실 그림의 모니터 벽 자리 — 위 19% / 오른 12% / 아래 30% / 왼 13% */
  .monWall { position: absolute; inset: 19% 12% 30% 13%; display: grid;
             grid-template-columns: repeat(4, 1fr); gap: 1.6mm; }
  .mon { background: #0d1116f2; border: 0.5mm solid #4a5a6e; border-radius: 1.2mm;
         padding: 1mm 0.8mm 0.8mm; display: flex; flex-direction: column;
         align-items: center; justify-content: center; gap: 1mm;
         box-shadow: inset 0 0 3mm #7fd4ff22; }
  .monScr { display: flex; flex-direction: column; align-items: center; gap: 0.6mm; }
  .monNo { font-size: 13pt; font-weight: 800; color: #cfe9ff; letter-spacing: .02em; }
  .monTm { font-size: 8.4pt; font-weight: 700; color: #7fd4ff; }
  .monDot { width: 3.6mm; height: 3.6mm; border-radius: 50%;
            border: 0.4mm solid #ffffffaa; }
  /* 감식실 — 내는 자리와 읽는 자리. */
  /* 감식실 그림의 작업대 자리 — 가운데 아래쪽에 두 구역을 나란히 */
  .labZones { position: absolute; inset: 46% 7% 6%; display: grid;
              grid-template-columns: 1fr 1fr; gap: 4mm; }
  .labZone { background: #f7f4ecec; border: 0.7mm solid #2f2b24; border-radius: 2.4mm;
             padding: 3.4mm 3mm; display: flex; flex-direction: column; gap: 2.4mm; }
  .labIn { border-color: #265a66; }
  .labOut { border-color: #5a5a5a; }
  .labTt { font-size: 11pt; font-weight: 800; }
  .labRow { display: flex; flex-wrap: wrap; gap: 2mm; }
  .labSlot { width: 15mm; height: 21mm; border: 0.5mm dashed #8a8375; border-radius: 1.4mm;
             background: #fffdf8; display: flex; align-items: center; justify-content: center;
             font-size: 10pt; font-weight: 800; color: #8a8375; }
  .labSub { font-size: 8pt; color: #4a453c; line-height: 1.5; margin-top: auto; }
`;
