// 단서 카드 QR 이 여는 화면 — 한 물건의 속을 통째로 보여 준다.
//
//   휴대폰·다이어리·성경책은 종이에 옮기면 여러 장으로 쪼개진다. 폰 하나가 카드 네 장이
//   되고 다이어리 하나가 세 장이 되니, 덱의 절반이 남의 신상으로 채워지고 한 사람의 폰을
//   다 읽으려면 네 번을 뽑아야 했다. 물건은 하나인데 카드만 늘어난 셈이다.
//
//   그래서 카드는 물건 하나에 한 장으로 두고, 속은 QR 뒤에 둔다. 폰을 손에 넣은 사람은
//   실제로 폰을 손에 넣은 것처럼 앱을 넘겨 가며 다 본다 — 대신 그 폰은 그 사람 것이다.
//
//   주소는 /clue#단서코드. CCTV·잠금 판과 같은 규칙이다(덱 번호가 바뀌어도 인쇄된 QR 이 산다).
import { evidenceMap as publicMap } from '../data/gameData.js';
import { mergeSecrets } from '../data/mergeSecrets.js';
import secrets from '@secrets';

const evidenceMap = mergeSecrets(publicMap, secrets);
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
const nl2br = (s) => esc(s).replace(/\n/g, '<br>');

window.addEventListener('hashchange', () => location.reload());

const root = document.getElementById('clue-root');
const code = decodeURIComponent(location.hash.replace(/^#/, '')).trim().toUpperCase();
const c = evidenceMap[code];

if (!c) {
  root.innerHTML = `<div class="box"><h1>단서 열람</h1>
    <p class="msg">카드의 QR 을 찍어서 들어와야 이 화면이 열립니다.</p>
    <p class="sub">주소 끝에 코드가 없거나(<code>${esc(code) || '없음'}</code>) 이 방식으로 여는 단서가 아닙니다.</p></div>`;
} else if (c.phone?.apps?.length) {
  renderPhone(c);
} else if (c.pages?.length) {
  renderPages(c);
} else {
  root.innerHTML = `<div class="box">
    <div class="hd"><div class="tt">${esc(c.title)}</div></div>
    <div class="body">${nl2br(c.detail || c.description || '')}</div></div>`;
}

// ── 휴대폰 — 앱을 넘겨 가며 본다 ─────────────────────────────────────────────
function renderPhone(cl) {
  const apps = cl.phone.apps;
  root.innerHTML = `<div class="box">
    <div class="hd"><div class="tt">${esc(cl.title)}</div>
      <div class="sb">앱을 눌러 넘겨 보세요</div></div>
    <div class="tabs">${apps.map((a, i) =>
      `<button class="tab${i === 0 ? ' on' : ''}" data-i="${i}">${esc(a.name || a.id)}</button>`).join('')}</div>
    <div id="app"></div>
    <p class="foot">이 화면을 본 사람은 당신뿐입니다. 무엇을 봤는지 말할지 말지는 당신이 정합니다.</p>
  </div>`;
  const show = (i) => {
    root.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', +b.dataset.i === i));
    document.getElementById('app').innerHTML = appHTML(apps[i]);
  };
  root.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => show(+b.dataset.i)));
  show(0);
}

function appHTML(a) {
  // 지워진 대화방은 여기서 보여 주지 않는다 — 그건 비밀번호를 넣어야 열리는 Q 카드의 몫이다.
  if (a.chats) {
    const live = a.chats.filter((ch) => !ch.deleted);
    const gone = a.chats.filter((ch) => ch.deleted);
    return live.map((ch) => `<div class="room"><div class="rn">${esc(ch.name)}</div>
      ${(ch.messages || []).map((m) => `<div class="ln"><b>${esc(m.who || '')}</b>${esc(m.text || '')}</div>`).join('')}
      </div>`).join('')
      + (gone.length ? `<div class="warn">🔒 지워진 대화방이 ${gone.length}개 있습니다.
        복구하려면 네 자리 숫자가 필요합니다 — <b>잠금 카드의 QR</b>을 찍으세요.</div>` : '');
  }
  if (a.searches) {
    return a.searches.map((x) => `<div class="room">
      <div class="rn">🔎 ${esc(x.query || x.title || '')}</div>
      ${x.title && x.query ? `<div class="ln"><b>${esc(x.title)}</b></div>` : ''}
      ${x.snippet ? `<div class="ln">${esc(x.snippet)}</div>` : ''}
      ${x.image ? `<img class="ph" src="${esc(x.image)}" alt="">` : ''}</div>`).join('');
  }
  if (a.photos) {
    return a.photos.map((p) => `<div class="room">
      <div class="rn">${esc(p.caption || '사진')}</div>
      ${p.image ? `<img class="ph" src="${esc(p.image)}" alt="">` : ''}</div>`).join('');
  }
  if (a.calls) {
    return `<div class="room">${a.calls.map((x) => `<div class="ln">
      <b>${esc(x.time || '')}</b>${esc(x.name || '')}
      — ${esc({ out: '발신', in: '수신', missed: '부재중' }[x.direction] || x.direction || '')}
      ${x.duration ? `(${esc(x.duration)})` : ''}</div>`).join('')}</div>`;
  }
  if (a.contacts) {
    return `<div class="room">${a.contacts.map((x) => `<div class="ln">
      <b>${esc(x.name || '')}</b>${x.who && x.who !== x.name ? esc(x.who) : ''}</div>`).join('')}</div>`;
  }
  return `<div class="msg">비어 있습니다.</div>`;
}

// ── 다이어리 · 성경책 — 쪽을 넘겨 가며 본다 ──────────────────────────────────
function renderPages(cl) {
  root.innerHTML = `<div class="box">
    <div class="hd"><div class="tt">${esc(cl.title)}</div>
      <div class="sb">${cl.pages.length}쪽 · 표시된 자리만 남아 있습니다</div></div>
    ${cl.detail ? `<p class="sub" style="margin-top:0">${nl2br(cl.detail)}</p>` : ''}
    ${cl.pages.map((p) => `<div class="room">
      <div class="rn">${esc(p.title || '')}</div>
      <div class="ln">${nl2br(p.content || '')}</div>
      ${p.image ? `<img class="ph" src="${esc(p.image)}" alt="">` : ''}</div>`).join('')}
    <p class="foot">이 화면을 본 사람은 당신뿐입니다. 무엇을 봤는지 말할지 말지는 당신이 정합니다.</p>
  </div>`;
}
