// 단서 카드 QR 이 여는 화면 — 한 물건의 속을 통째로 보여 준다.
//
//   휴대폰·다이어리·성경책은 종이에 옮기면 여러 장으로 쪼개진다. 폰 하나가 카드 네 장이
//   되고 다이어리 하나가 세 장이 되니, 덱의 절반이 남의 신상으로 채워지고 한 사람의 폰을
//   다 읽으려면 네 번을 뽑아야 했다. 물건은 하나인데 카드만 늘어난 셈이다.
//
//   그래서 카드는 물건 하나에 한 장으로 두고, 속은 QR 뒤에 둔다. 폰을 손에 넣은 사람은
//   실제로 폰을 손에 넣은 것처럼 앱을 넘겨 가며 다 본다 — 대신 그 폰은 그 사람 것이다.
//
//   [잠긴 것도 이 안에서 연다]
//   예전에는 지워진 대화방마다 잠금 카드(Q)를 따로 찍어 두고 「그 카드를 찾아 QR 을 찍으세요」로
//   보냈다. 폰을 손에 쥔 사람이 폰을 두고 다른 카드를 찾으러 가야 했고, 종이만 다섯 장 늘었다.
//   실제 폰이 그렇듯 잠긴 방은 폰 안에서 숫자를 넣어 연다 — 솔로판과 같은 방식이다.
//   잠근 것은 카드가 아니라 숫자이므로, 폰을 탁자에 펴 둬도 숫자를 아는 사람만 연다.
import { evidenceMap as publicMap } from '../data/gameData.js';
import { mergeSecrets } from '../data/mergeSecrets.js';
import secrets from '@secrets';

const evidenceMap = mergeSecrets(publicMap, secrets);
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
const nl2br = (s) => esc(s).replace(/\n/g, '<br>');
const norm = (s) => String(s || '').replace(/[\s-]/g, '').toUpperCase();

window.addEventListener('hashchange', () => location.reload());

// 앱 목록 → 앱 → (대화 앱이면) 대화방. 뒤로 가기가 한 단계씩 올라간다.
const APP_ICON = { contacts: '📇', kakao: '💬', sms: '✉️', calls: '📞', browser: '🌐', photos: '🖼️', gallery: '🖼️', messages: '✉️' };
const isChat = (t) => t === 'kakao' || t === 'sms';
// 폰마다 복구 비번의 출처가 다르다. 세 번 틀린 사람에게만 알려 준다 — 난이도를 미리 낮추지 않는다.
// 네 자리마다 나온 곳이 다르다. 셋을 한 문장으로 뭉뚱그리면 한 대는 없는 곳을 가리킨다.
const RECOVER_HINT = {
  'LWUY-33': '생일이 아닙니다 — 목사님 일기장을 끝까지 넘겨, 잊은 적 없다는 기념일을 찾아보세요',
  'YJWR-74': '생일이 아닙니다 — 교단에 낸 그 수료증의 발급번호, 그 뒤 네 자리입니다. 수료증 사진은 목사님 휴대폰 사진첩에 있습니다',
};
const recoverHint = () => RECOVER_HINT[code] || '상대의 생일 네 자리 — 그 사람의 다이어리를 찾아보세요';

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
} else if (c.wallet?.items?.length) {
  renderWallet(c);
} else {
  root.innerHTML = `<div class="box">
    <div class="hd"><div class="tt">${esc(c.title)}</div></div>
    ${c.image ? `<img class="ph" src="${esc(c.image)}" alt="">` : ''}
    <div class="body">${nl2br(c.detail || c.description || '')}</div></div>`;
}

// ── 휴대폰 ───────────────────────────────────────────────────────────────────
function renderPhone(cl) {
  const apps = cl.phone.apps || [];
  const st = { app: null, chat: null, opened: false, fails: 0, look: null };
  const answer = secrets.recover?.[code];

  const draw = () => {
    const a = st.app != null ? apps.find((x) => x.id === st.app) : null;
    const title = a && isChat(a.type) && st.chat != null
      ? (a.chats?.[st.chat]?.name || a.name) : (a?.name || a?.type || '');
    root.innerHTML = `<div class="box">
      <div class="phone">
        <div class="pbar"><span>9:41</span><span>•••• 📶 🔋</span></div>
        ${a ? `<div class="pnav">
            <button class="pback" data-act="back">‹</button>
            <span class="pnt">${esc(title)}</span>
            <button class="pback" data-act="home">🏠</button>
          </div>
          <div class="pscr">${appHTML(a, st)}</div>`
        : `<div class="pscr phome">
            <div class="pown">📱 ${esc(cl.phone.owner || cl.title)}</div>
            <div class="psub">앱을 눌러 확인하세요</div>
            <div class="pgrid">${apps.map((x) => `<button class="pic" data-app="${esc(x.id)}">
              <span class="picb">${APP_ICON[x.type] || '📱'}</span>
              <span class="picl">${esc(x.name || x.type)}</span></button>`).join('')}</div>
          </div>`}
      </div>
      <p class="foot">이 화면을 본 사람은 당신뿐입니다. 무엇을 봤는지 말할지 말지는 당신이 정합니다.</p>
    </div>`;

    root.querySelectorAll('[data-app]').forEach((b) => b.addEventListener('click', () => {
      st.app = b.dataset.app; st.chat = null; draw();
    }));
    root.querySelectorAll('[data-chat]').forEach((b) => b.addEventListener('click', () => {
      st.chat = +b.dataset.chat; draw();
    }));
    const act = (name, fn) => root.querySelectorAll(`[data-act="${name}"]`).forEach((b) => b.addEventListener('click', fn));
    act('home', () => { st.app = null; st.chat = null; draw(); });
    act('back', () => {
      if (a && isChat(a.type) && st.chat != null) st.chat = null;
      else { st.app = null; st.chat = null; }
      draw();
    });

    // 톡서랍 복구 — 맞으면 그 자리에서 열린다. 이 폰을 다시 잠그는 길은 없다.
    const pw = root.querySelector('#pw');
    if (pw) {
      const go = () => {
        if (answer && norm(pw.value) === norm(answer)) { st.opened = true; st.fails = 0; }
        else st.fails += 1;
        draw();
        if (!st.opened) root.querySelector('#pw')?.focus();
      };
      root.querySelector('#pwgo')?.addEventListener('click', go);
      pw.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      pw.focus();
    }
    // 진위조회 — 발급번호를 넣어야 결과가 나온다. 번호는 수료증 사진 안에 있다.
    const lk = root.querySelector('#lk');
    if (lk) {
      const go = () => {
        const want = secrets.lookups?.[code]?.answer;
        st.look = (want && norm(lk.value) === norm(want)) ? 'ok' : 'no';
        draw();
        if (st.look !== 'ok') root.querySelector('#lk')?.focus();
      };
      root.querySelector('#lkgo')?.addEventListener('click', go);
      lk.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      lk.focus();
    }
  };
  draw();

  function appHTML(a, s) {
    if (isChat(a.type)) return chatHTML(a, s);
    if (a.type === 'browser' || a.searches || a.lookup) return browserHTML(a, s);
    if (a.photos) return a.photos.map((p) => `<div class="room">
      <div class="rn">${esc(p.caption || '사진')}</div>
      ${p.image ? `<img class="ph" src="${esc(p.image)}" alt="">` : ''}</div>`).join('');
    if (a.calls) return `<div class="klist">${a.calls.map((x) => `<div class="krow call ${esc(x.direction || 'in')}">
      <span class="kav">${esc({ out: '↗', in: '↙', missed: '✕' }[x.direction] || '·')}</span>
      <span class="kbody"><span class="kname">${esc(x.name || '')}</span>
      <span class="kprev">${esc({ out: '발신', in: '수신', missed: '부재중' }[x.direction] || '')}
        ${x.time ? `· ${esc(x.time)}` : ''}${x.duration ? ` · ${esc(x.duration)}` : ''}</span></span></div>`).join('')}</div>`;
    if (a.contacts) return `<div class="klist">${a.contacts.map((x) => `<div class="krow">
      <span class="kav">${esc((x.name || '?').slice(0, 1))}</span>
      <span class="kbody"><span class="kname">${esc(x.name || '')}</span>
      ${x.who && x.who !== x.name ? `<span class="kprev">${esc(x.who)}</span>` : ''}</span></div>`).join('')}</div>`;
    return `<div class="msg">비어 있습니다.</div>`;
  }

  // 카카오톡 — 목록에서 방을 고르고, 방에서는 말풍선으로 읽는다.
  function chatHTML(a, s) {
    const chats = a.chats || [];
    if (s.chat == null) {
      return `<div class="klist">${chats.map((ch, i) => {
        const locked = ch.deleted && !s.opened;
        const last = (ch.messages || [])[(ch.messages || []).length - 1];
        return `<button class="krow" data-chat="${i}">
          <span class="kav">${esc((ch.name || '?').replace(/\s.*$/, '').slice(0, 1))}</span>
          <span class="kbody">
            <span class="kname">${esc(ch.name)}${ch.deleted
              ? `<em class="ktag">${locked ? '삭제됨' : '복원됨'}</em>` : ''}</span>
            <span class="kprev">${locked ? '🔒 삭제된 대화 — 복구가 필요합니다' : esc(last?.text || '')}</span>
          </span></button>`;
      }).join('')}</div>`;
    }
    const ch = chats[s.chat];
    if (!ch) return `<div class="msg">대화방이 없습니다.</div>`;
    if (ch.deleted && !s.opened) {
      return `<div class="krec">
        <div class="krl">🔒 삭제된 대화</div>
        <div class="krd">톡서랍 복구 비밀번호 <b>네 자리</b>를 넣으면 이 대화가 되살아납니다.</div>
        <div class="pad"><input id="pw" type="tel" inputmode="numeric" maxlength="4"
          autocomplete="off" placeholder="0000"><button id="pwgo">복구</button></div>
        ${s.fails ? `<div class="err">맞지 않습니다.</div>` : ''}
        ${s.fails >= 3 ? `<div class="khint">힌트 — ${esc(recoverHint())}</div>` : ''}
        <div class="knote">숫자는 <b>다른 단서 안에 적혀 있습니다.</b>
          그것을 가진 사람이 알려 줄지 말지는 그 사람이 정합니다.</div>
      </div>`;
    }
    return `${ch.deleted ? '<div class="ok">톡서랍에서 복구되었습니다</div>' : ''}
      <div class="kchat">${(ch.messages || []).map((m) => `
        <div class="kmsg ${m.from === 'me' ? 'me' : 'them'}">
          ${m.from !== 'me' ? `<span class="kwho">${esc(m.who || ch.name || '')}</span>` : ''}
          <span class="kbub">${esc(m.text || '')}</span>
          ${m.time ? `<span class="ktime">${esc(m.time)}</span>` : ''}
        </div>`).join('')}</div>`;
  }

  // 인터넷 — 검색 기록과, 폰 주인이 열어 두었던 조회 화면.
  function browserHTML(a, s) {
    const lu = a.lookup;
    const res = secrets.lookups?.[code]?.result;
    return (a.searches || []).map((x) => `<div class="room">
        <div class="rn">🔎 ${esc(x.query || x.title || '')}</div>
        ${x.title && x.query ? `<div class="ln"><b>${esc(x.title)}</b></div>` : ''}
        ${x.snippet ? `<div class="ln">${esc(x.snippet)}</div>` : ''}
        ${x.image ? `<img class="ph" src="${esc(x.image)}" alt="">` : ''}</div>`).join('')
      + (lu ? `<div class="room lk">
        <div class="rn">🔒 ${esc(lu.site || '조회')}</div>
        <div class="ln" style="opacity:.7">${esc(lu.url || '')}</div>
        ${lu.desc ? `<div class="ln">${esc(lu.desc)}</div>` : ''}
        ${s.look === 'ok' && res ? `<div class="ok">조회 완료</div>
            <div class="room"><div class="rn">${esc(res.title || '')}</div>
              ${(res.lines || []).map((l) => `<div class="ln">${esc(l)}</div>`).join('')}</div>`
          : `<div class="pad"><label>${esc(lu.label || '발급번호')}</label>
              <input id="lk" type="text" autocomplete="off" maxlength="12"
                placeholder="${esc(lu.placeholder || '')}"><button id="lkgo">조회</button></div>
            ${s.look === 'no' ? `<div class="err">${esc(lu.notFound || '조회되지 않습니다.')}</div>` : ''}`}
      </div>` : '');
  }
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

// ── 지갑 — 안에 든 것을 하나씩 꺼내 본다 ─────────────────────────────────────
//   카드에는 물건 이름과 한 줄 설명까지만 적혀 있다. 사진은 여기서만 보인다 —
//   그 한 장 때문에 덱 전체를 컬러로 뽑던 것을 QR 로 옮겼다.
//   detail 은 안 쓴다 — 「눌러서 확인할 수 있다」는 앱판 조작 안내라, 네 가지가 이미
//   다 펼쳐져 있는 이 화면에서는 누를 것이 없다.
function renderWallet(cl) {
  root.innerHTML = `<div class="box">
    <div class="hd"><div class="tt">${esc(cl.title)}</div>
      <div class="sb">${cl.wallet.items.length}가지가 들어 있습니다</div></div>
    ${cl.wallet.items.map((it) => `<div class="room">
      <div class="rn">${esc(it.label || '')}</div>
      <div class="ln">${nl2br(it.detail || it.value || '')}</div>
      ${it.image ? `<img class="ph" src="${esc(it.image)}" alt="">` : ''}</div>`).join('')}
    <p class="foot">이 화면을 본 사람은 당신뿐입니다. 무엇을 봤는지 말할지 말지는 당신이 정합니다.</p>
  </div>`;
}
