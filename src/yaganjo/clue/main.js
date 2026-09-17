// ─────────────────────────────────────────────────────────────────────────────
// 「야간조」 — 카드 QR 이 여는 화면. 기기 한 대의 속을 통째로 보여 준다.
//
//   주소는 /yaganjo-clue#<단서코드>. 해시로 단서를 고른다.
//   새벽이슬의 src/clue/main.js 와 같은 자리이고 같은 규칙이다 — 번호가 바뀌어도
//   종이에 인쇄된 QR 이 살아 있도록, 카드에는 코드만 싣고 화면은 여기서 그린다.
//
//   이 화면이 맡는 것은 여덟 대다.
//     폰 여섯   A6 · B5 · C6 · D6 · E6 · F5
//     조장 폰   X10
//     조장 태블릿 T1                     ← 이 판에서 가장 중요한 한 장
//   그 밖의 코드(수첩 X3 의 pages, Q 기록 대조 일곱 …)로 들어와도 읽을 수 있게 둔다.
//   V 카메라 14장은 /yaganjo-cctv 가 맡는다.
//
//   ── 잠긴 폰은 이 안에서 연다 ─────────────────────────────────────────────
//   보드판에서 잠긴 폰 다섯(A6 1207 · C6 0314 · D6 0512 · E6 0302 · X10 0519)은
//   네 자리를 다른 카드에서 구해 와야 열린다. 그 압박이 이 판의 절반이다.
//   그래서 폰을 찍으면 **잠금 화면이 먼저** 뜬다. 잠근 것은 카드가 아니라 숫자이므로,
//   폰을 탁자에 펴 둬도 숫자를 아는 사람만 연다 — 알려 줄지 말지가 곧 게임이 된다.
//
//   정답 네 자리는 콘텐츠에 없다. `phone.lock` 은 「몇 자리인가 · 힌트가 있는가」까지고,
//   답은 비밀팩의 `phoneLocks[코드]` 에만 있다. mergeSecrets 의 주입 경로는
//   passwords/recover/lookups 셋뿐이라(기존 파일이므로 고치지 않는다) 이 한 가지는
//   여기서 비밀팩을 직접 읽는다. 번들은 이 진입점 것만 갈라지므로 새어 나가지 않는다.
//
//   ── 태블릿 T1 은 두 단계다 ───────────────────────────────────────────────
//   ① 목록 화면은 **잠금 없이** 열린다. 전표가 날짜순으로 뜨고 **상태 칸이 비어 있다.**
//   ② 오른쪽 위 「관리자 조회」를 누르면 **사번과 네 자리를 다시 묻는다.** 둘을 넣어야
//      취소선 세 줄과 조회 로그 세 줄이 뜬다 — 마지막 줄이 03:24 다.
//   누르지 않으면 상태 칸은 비어 있을 뿐이다. 그래서 뒤에 누군가 「전표가 취소돼 있던데요」
//   라고 말하면, 그는 자기가 눌렀다고 말한 것이 된다. 이 두 단계가 그 장치의 전부다.
//
//   ── 비밀팩 별칭 ──────────────────────────────────────────────────────────
//   '@yaganjo-secrets' 다. '@secrets/yaganjo' 는 쓸 수 없다 — Vite 의 별칭 매칭이
//   접두사 일치라 기존 '@secrets' 가 먼저 낚아채 없는 경로로 바꾼다(dp-architecture §2).
//   이 별칭은 vite.config.js 에 한 줄이 필요하다. 그 수정은 제안으로만 남겼다.
// ─────────────────────────────────────────────────────────────────────────────
import { evidenceMap as publicMap } from '../../scenarios/yaganjo/index.js';
import { mergeSecrets } from '../../data/mergeSecrets.js';
import secrets from '@yaganjo-secrets';

// 공개 콘텐츠 + 비밀팩. passwords → clue.password, lookups → browser 앱의 lookup 으로
// 들어간다(mergeSecrets). phoneLocks 는 그 셋 밖이라 아래에서 secrets 를 직접 읽는다.
export const evidenceMap = mergeSecrets(publicMap, secrets);

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
const nl2br = (s) => esc(s).replace(/\n/g, '<br>');
// 숫자·글자만 남긴다. 사번 '30112' + 네 자리 '0519' 와 비밀팩의 '30112-0519' 가 같아진다.
const normNum = (s) => String(s ?? '').replace(/[^0-9A-Za-z]/g, '').toUpperCase();
// 사람이 띄어쓰기를 어떻게 하든 같은 품목으로 읽히게 한다(전표 줄 대조용).
const squash = (s) => String(s ?? '').replace(/[\s·.,\-—「」()]/g, '');

const isChat = (t) => t === 'kakao' || t === 'sms';
const APP_ICON = {
  contacts: '📇', kakao: '💬', sms: '✉️', calls: '📞',
  browser: '🌐', photos: '🖼️', gallery: '🖼️', messages: '✉️',
};

// 모듈 안에서 공유하는 두 가지. render() 가 채운다.
let root = null;
let code = '';

// ── 라우팅 ───────────────────────────────────────────────────────────────────
export function codeFromHash(hash) {
  const raw = hash != null ? hash : (typeof location === 'undefined' ? '' : location.hash);
  return decodeURIComponent(String(raw).replace(/^#/, '')).trim().toUpperCase();
}

export function render(el, wanted) {
  root = el;
  code = String(wanted || '').trim().toUpperCase();
  const c = evidenceMap[code];

  if (!c) return renderMissing();
  // 방(ROOM-*)은 앱 전용 항목이라 종이 카드가 없다 — QR 이 여기로 올 일이 없다.
  if (c.type === '방') return renderNotHere(c);
  // 감식 결과는 비번이 가린다. 카드에 QR 이 없더라도 코드를 손으로 넣어 여는 길은 막는다.
  if (c.type === '감식') return renderGamsik(c);
  if (c.phone?.apps?.length) return renderDevice(c);
  if (c.pages?.length) return renderPages(c);
  return renderPlain(c);
}

function renderMissing() {
  html(`<div class="box"><h1>단서 열람</h1>
    <p class="msg">카드의 QR 을 찍어서 들어와야 이 화면이 열립니다.</p>
    <p class="sub">주소 끝에 코드가 없거나(<code>${esc(code) || '없음'}</code>)
      이 방식으로 여는 단서가 아닙니다.</p></div>`);
}

function renderNotHere(c) {
  html(`<div class="box"><h1>${esc(c.title || '장소')}</h1>
    <p class="msg">이 코드는 카드가 아니라 <b>장소</b>입니다. QR 로 여는 화면이 없습니다.</p>
    <p class="sub">보드판에서는 더미를 집어 드는 일이 곧 장소를 뒤지는 일입니다.</p></div>`);
}

// ── 기본 — 제목 · 사진 · 본문 ────────────────────────────────────────────────
function renderPlain(c) {
  html(`<div class="box">
    <div class="hd"><div class="tt">${esc(c.title)}</div>
      ${c.description ? `<div class="sb">${esc(c.description)}</div>` : ''}</div>
    ${imgHTML(c.image)}
    <div class="body">${nl2br(c.detail || c.description || '')}</div>
    <p class="foot">${SOLO_FOOT}</p></div>`);
}

// ── 쪽을 넘겨 가며 본다 — 수첩(X3) · 검은 화면(V11) 같은 것 ──────────────────
function renderPages(c) {
  html(`<div class="box">
    <div class="hd"><div class="tt">${esc(c.title)}</div>
      <div class="sb">${c.pages.length}쪽 · 표시된 자리만 남아 있습니다</div></div>
    ${c.detail ? `<p class="sub" style="margin-top:0">${nl2br(c.detail)}</p>` : ''}
    ${c.pages.map((p) => `<div class="room">
      <div class="rn">${esc(p.title || '')}</div>
      <div class="ln">${nl2br(p.content || '')}</div>
      ${imgHTML(p.image)}</div>`).join('')}
    <p class="foot">${SOLO_FOOT}</p></div>`);
}

// ── 감식 결과 — 진행자가 비번을 준다 ─────────────────────────────────────────
//   localProvider.isGamsikProtected 와 같은 판정이다. 비밀팩에 비번이 없으면 가리지
//   않는다 — 가려 두면 진행자에게도 여는 길이 없어 감식이 통째로 죽는다.
function renderGamsik(c) {
  const want = c.password;
  const st = { open: !want, fail: false };
  const draw = () => {
    html(`<div class="box">
      <div class="hd"><div class="tt">${esc(c.title)}</div>
        <div class="sb">감식 결과 · ${want ? '진행자가 주는 비밀번호로 엽니다' : '비밀번호가 걸려 있지 않습니다'}</div></div>
      ${st.open
        ? `${imgHTML(c.image)}<div class="body">${nl2br(c.detail || c.description || '')}</div>`
        : `<div class="pad">
             <label>감식 결과 열람 비밀번호</label>
             <input id="gp" type="text" autocomplete="off" maxlength="16" placeholder="">
             <button id="gpgo">열기</button>
           </div>
           ${st.fail ? '<div class="err">맞지 않습니다.</div>' : ''}
           <p class="knote">이 비밀번호는 진행자가 가지고 있습니다. 보드판에서
             「그 결과를 다른 사람이 소리 내어 읽는다」가 있던 자리입니다.</p>`}
      ${st.open ? `<p class="foot">${SOLO_FOOT}</p>` : ''}</div>`);
    const inp = root.querySelector('#gp');
    if (inp) {
      const go = () => {
        if (normNum(inp.value) === normNum(want)) { st.open = true; st.fail = false; }
        else st.fail = true;
        draw();
        if (!st.open) root.querySelector('#gp')?.focus();
      };
      root.querySelector('#gpgo')?.addEventListener('click', go);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      inp.focus();
    }
  };
  draw();
}

// ── 기기 — 폰 일곱과 태블릿 한 대 ────────────────────────────────────────────
function renderDevice(c) {
  const apps = c.phone.apps || [];
  const lock = c.phone.lock || null;
  const digits = Number(lock?.digits) || 4;
  const want = secrets?.phoneLocks?.[code];  // 정답 네 자리는 비밀팩에만 있다
  // 태블릿은 전표 목록이 접히지 않게 넓게 편다. 기기 종류를 알리는 필드가 콘텐츠에
  // 없어 주인 이름으로 가린다(phone.device 같은 필드가 생기면 그쪽이 낫다).
  const wide = /태블릿/.test(String(c.phone.owner || c.title || ''));
  const foot = wide ? TABLET_FOOT : SOLO_FOOT;

  const st = {
    unlocked: !lock,                                  // 잠금 없는 기기는 바로 열린다
    entry: '', fails: 0,
    app: apps.length === 1 ? apps[0].id : null,       // 앱이 하나면 그 화면이 곧 기기 화면이다
    chat: null,
    admin: false, look: null, lookErr: '',
  };

  const draw = () => {
    if (!st.unlocked) return drawLock();
    return drawHome();
  };

  // ① 잠금 화면 — 네 자리. 키보드를 띄우지 않고 키패드를 직접 그린다.
  function drawLock() {
    const dots = Array.from({ length: digits }, (_, i) =>
      `<span class="dot${i < st.entry.length ? ' on' : ''}"></span>`).join('');
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']
      .map((k) => (k === '' ? '<span></span>'
        : `<button class="key${k === '⌫' ? ' fn' : ''}" data-k="${esc(k)}">${esc(k)}</button>`)).join('');
    html(`<div class="box">
      <div class="phone">
        <div class="pbar"><span>9:41</span><span>•••• 📶 🔋</span></div>
        <div class="pscr lock">
          <div class="lki">🔒</div>
          <div class="lkt">${esc(c.phone.owner || c.title)}</div>
          <div class="lkd">${digits}자리를 넣으세요.</div>
          ${lock.hint ? `<div class="lkh">힌트 — ${esc(lock.hint)}</div>` : ''}
          <div class="dots${st.fails && !st.entry ? ' bad' : ''}">${dots}</div>
          ${st.fails ? `<div class="err">맞지 않습니다. (${st.fails}회)</div>` : ''}
          ${want ? '' : `<div class="warn">이 기기의 잠금 번호가 비밀팩에 없습니다 —
            <code>phoneLocks['${esc(code)}']</code>. 진행자에게 알려 주세요.</div>`}
          <div class="keys">${keys}</div>
          ${st.fails >= 3 ? `<p class="knote">숫자는 <b>다른 단서 안에 적혀 있습니다.</b>
            그것을 가진 사람이 알려 줄지 말지는 그 사람이 정합니다.</p>` : ''}
        </div>
      </div>
      <p class="foot">${foot}</p></div>`);

    root.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.k;
      if (k === '⌫') { st.entry = st.entry.slice(0, -1); draw(); return; }
      if (st.entry.length >= digits) return;
      st.entry += k;
      if (st.entry.length === digits) {
        // 자릿수를 채우면 그 자리에서 판정한다. 실제 폰이 그렇다.
        if (want && normNum(st.entry) === normNum(want)) { st.unlocked = true; st.fails = 0; }
        else st.fails += 1;
        st.entry = '';
      }
      draw();
    }));
  }

  // ② 기기 화면 — 앱 목록 / 앱 / (대화 앱이면) 대화방
  function drawHome() {
    const a = st.app != null ? apps.find((x) => x.id === st.app) : null;
    const title = a && isChat(a.type) && st.chat != null
      ? (a.chats?.[st.chat]?.name || a.name) : (a?.name || a?.type || '');
    const many = apps.length > 1;
    // 돌아갈 데가 있을 때만 ‹ 를 그린다. 앱이 하나인 태블릿은 목록이 곧 첫 화면이라
    // 뒤로 갈 곳이 없다 — 눌러도 아무 일이 없는 단추를 두지 않는다.
    const canBack = st.admin || (a && isChat(a.type) && st.chat != null) || many;
    html(`<div class="box${wide ? ' wide' : ''}">
      <div class="phone">
        <div class="pbar"><span>9:41</span><span>•••• 📶 🔋</span></div>
        ${a ? `<div class="pnav">
            ${canBack ? '<button class="pback" data-act="back">‹</button>' : '<span style="width:26px"></span>'}
            <span class="pnt">${esc(title)}</span>
            ${many ? '<button class="pback" data-act="home">🏠</button>' : '<span style="width:26px"></span>'}
          </div>
          <div class="pscr">${appHTML(a)}</div>`
        : `<div class="pscr phome">
            <div class="pown">📱 ${esc(c.phone.owner || c.title)}</div>
            <div class="psub">앱을 눌러 확인하세요</div>
            <div class="pgrid">${apps.map((x) => `<button class="pic" data-app="${esc(x.id)}">
              <span class="picb">${APP_ICON[x.type] || '📱'}</span>
              <span class="picl">${esc(x.name || x.type)}</span></button>`).join('')}</div>
          </div>`}
      </div>
      <p class="foot">${foot}</p></div>`);

    root.querySelectorAll('[data-app]').forEach((b) => b.addEventListener('click', () => {
      st.app = b.dataset.app; st.chat = null; st.admin = false; draw();
    }));
    root.querySelectorAll('[data-chat]').forEach((b) => b.addEventListener('click', () => {
      st.chat = Number(b.dataset.chat); draw();
    }));
    const act = (name, fn) => root.querySelectorAll(`[data-act="${name}"]`)
      .forEach((b) => b.addEventListener('click', fn));
    act('home', () => { st.app = null; st.chat = null; st.admin = false; draw(); });
    act('back', () => {
      if (st.admin) st.admin = false;                                   // 관리자 조회 → 목록
      else if (a && isChat(a.type) && st.chat != null) st.chat = null;  // 대화방 → 대화 목록
      else if (many) { st.app = null; st.chat = null; }                 // 앱 → 앱 목록
      draw();
    });
    // 「관리자 조회」 — 목록에서 이 단추를 눌러야 두 번째 단계가 시작된다.
    act('admin', () => { st.admin = true; st.lookErr = ''; draw(); });
    bindLookup(a);
  }

  function appHTML(a) {
    if (isChat(a.type)) return chatHTML(a);
    if (a.type === 'browser' || a.searches || a.lookup) return listHTML(a);
    if (a.photos) return photosHTML(a);
    if (a.calls) return callsHTML(a);
    if (a.contacts) return contactsHTML(a);
    return '<div class="msg">비어 있습니다.</div>';
  }

  // 대화 — 목록에서 방을 고르고, 방에서는 말풍선으로 읽는다.
  function chatHTML(a) {
    const chats = a.chats || [];
    const kind = a.type === 'sms' ? 'sms' : 'kakao';
    if (st.chat == null) {
      return `<div class="klist">${chats.map((ch, i) => {
        // 야간조에는 지워진 대화가 없다(비밀팩의 recover 가 비어 있다). 그래도 열어 두지
        // 않는다 — 나중에 한 방이라도 deleted 로 들어오면 복구 수단 없이 새어 버린다.
        const locked = ch.deleted && !secrets?.recover?.[code];
        const last = (ch.messages || [])[(ch.messages || []).length - 1];
        return `<button class="krow ${kind}" ${locked ? '' : `data-chat="${i}"`}>
          <span class="kav">${locked ? '🔒' : esc((ch.name || '?').replace(/\s.*$/, '').slice(0, 1))}</span>
          <span class="kbody">
            <span class="kname">${esc(ch.name)}${ch.deleted ? '<em class="ktag">삭제됨</em>' : ''}</span>
            <span class="kprev">${locked ? '삭제된 대화 — 이 판에는 복구 수단이 없습니다' : esc(last?.text || '')}</span>
          </span></button>`;
      }).join('')}</div>`;
    }
    const ch = chats[st.chat];
    if (!ch) return '<div class="msg">대화방이 없습니다.</div>';
    return `<div class="kchat ${kind}">${(ch.messages || []).map((m) => `
      <div class="kmsg ${m.from === 'me' ? 'me' : 'them'}">
        ${m.from !== 'me' ? `<span class="kwho">${esc(m.who || ch.name || '')}</span>` : ''}
        <span class="kbub">${esc(m.text || '')}</span>
        ${m.time ? `<span class="ktime">${esc(m.time)}</span>` : ''}
      </div>`).join('')}</div>`;
  }

  function callsHTML(a) {
    const ICON = { out: '↗', in: '↙', missed: '✕' };
    const LABEL = { out: '발신', in: '수신', missed: '부재중' };
    return `<div class="klist">${(a.calls || []).map((x) => `
      <div class="krow call ${esc(x.direction || 'in')}">
        <span class="kav">${esc(ICON[x.direction] || '·')}</span>
        <span class="kbody"><span class="kname">${esc(x.name || '')}</span>
        <span class="kprev">${esc(LABEL[x.direction] || '')}${x.time ? ` · ${esc(x.time)}` : ''}${x.duration ? ` · ${esc(x.duration)}` : ''}</span>
        </span></div>`).join('')}</div>`;
  }

  function contactsHTML(a) {
    return `<div class="klist">${(a.contacts || []).map((x) => `
      <div class="krow">
        <span class="kav">${esc((x.name || '?').slice(0, 1))}</span>
        <span class="kbody"><span class="kname">${esc(x.name || '')}</span>
        ${x.who && x.who !== x.name ? `<span class="kprev">${esc(x.who)}</span>` : ''}</span>
      </div>`).join('')}</div>`;
  }

  // 사진 — 휴지통을 따로 둔다. A6 의 「최근 삭제된 항목」이 그 칸이다.
  function photosHTML(a) {
    const ps = a.photos || [];
    // 휴지통이라는 사실은 아래 칸 제목이 한 번만 말한다 — 장마다 되풀이하지 않는다.
    const one = (p) => `<div class="room">
      <div class="rn">사진</div>
      ${imgHTML(p.image)}
      <div class="pcap">${p.deleted && p.image ? '<b>[복구된 사진]</b> ' : ''}${esc(p.caption || '')}</div>
    </div>`;
    const live = ps.filter((p) => !p.deleted).map(one).join('');
    const trash = ps.filter((p) => p.deleted);
    return live + (trash.length
      ? `<div class="psec">🗑️ 휴지통 · 최근 삭제된 항목</div>${trash.map(one).join('')}`
      : '');
  }

  // ── 태블릿 T1 — 목록(①)과 관리자 조회(②) ────────────────────────────────
  function listHTML(a) {
    const lu = a.lookup;                       // mergeSecrets 가 answer·result 를 여기에 넣는다
    if (st.admin && lu) return adminHTML(lu);
    const res = st.look === 'ok' ? lu?.result : null;
    const cancels = res ? cancelLines(res.lines) : [];
    // 단추 이름은 콘텐츠에서 딴다 — 'GH로지스 자재관리 · 관리자 조회' 의 끝 토막.
    const btn = String(lu?.site || '조회').split('·').pop().trim().slice(0, 12) || '조회';
    const rows = (a.searches || []).map((x) => {
      const status = res ? matchCancel(x, cancels) : null;
      const [head, tail] = splitStatus(x.snippet || '');
      return `<div class="slip${status ? ' cx' : ''}">
        <div class="slipq">${esc(x.query || x.title || '')}</div>
        ${head ? `<div class="slipd">${esc(head)}</div>` : ''}
        ${status ? `<div class="slipst">${esc(status)}</div>`
                 : (tail ? `<div class="slipst">${esc(tail)}</div>` : '')}
        ${imgHTML(x.image)}</div>`;
    }).join('');
    // 위쪽 줄에는 건수와 단추만 둔다 — 앱 이름은 바로 위 제목 줄이 이미 달고 있다.
    return `${lu ? `<div class="slipbar">
        <span class="sliptt">${(a.searches || []).length}건</span>
        <button class="admbtn" data-act="admin">${esc(btn)}</button></div>` : ''}
      ${res ? '<div class="ok">조회 완료 — 상태 칸이 채워졌습니다.</div>' : ''}
      ${rows}
      ${res ? logHTML(res) : ''}`;
  }

  // 사번과 네 자리를 다시 묻는다. 한 칸이 아니라 두 칸인 것이 보드판의 문면이다.
  function adminHTML(lu) {
    // 라벨과 자리표시는 콘텐츠가 가진 것을 쪼개 쓴다 —
    //   label '관리자 사번 + 네 자리' · placeholder '예: 00000-0000'
    const parts = String(lu.label || '관리자 사번 + 네 자리').split('+').map((s) => s.trim()).filter(Boolean);
    const ph = String(lu.placeholder || '').replace(/^[^:]*:\s*/, '').split('-');
    return `<div class="adm">
      <div class="rn">🔒 ${esc(lu.site || '관리자 조회')}</div>
      ${lu.url ? `<div class="ln" style="opacity:.7">${esc(lu.url)}</div>` : ''}
      ${lu.desc ? `<div class="ln" style="margin-top:10px">${esc(lu.desc)}</div>` : ''}
      <div class="admrow pad" style="margin-top:18px">
        <label>${esc(parts[0] || '관리자 사번')}</label>
        <input id="emp" type="tel" inputmode="numeric" maxlength="8" autocomplete="off"
          data-1p-ignore data-lpignore="true" placeholder="${esc(ph[0] || '')}">
      </div>
      <div class="admrow pad">
        <label>${esc(parts[1] || '네 자리')}</label>
        <input id="pin4" type="tel" inputmode="numeric" maxlength="4" autocomplete="off"
          data-1p-ignore data-lpignore="true" placeholder="${esc(ph[1] || '0000')}">
        <button id="lkgo">조회</button>
      </div>
      ${st.lookErr ? `<div class="err">${esc(st.lookErr)}</div>` : ''}
      <p class="knote">조회한 계정과 시각은 로그에 남습니다.
        연 사람과 라운드를 <b>사건 기록판</b>에 적으세요.</p>
    </div>`;
  }

  function bindLookup(a) {
    if (!a || !st.admin) return;
    const emp = root.querySelector('#emp');
    const pin = root.querySelector('#pin4');
    if (!emp || !pin) return;
    const want = a.lookup?.answer;             // 비밀팩의 lookups[코드].answer
    const go = () => {
      if (!want) {
        st.lookErr = `조회 정답이 비밀팩에 없습니다 — lookups['${code}'].answer. 진행자에게 알려 주세요.`;
        draw(); return;
      }
      if (normNum(emp.value + pin.value) === normNum(want)) {
        st.look = 'ok'; st.admin = false; st.lookErr = '';
      } else {
        st.lookErr = a.lookup?.notFound || '조회되지 않습니다.';
      }
      draw();
      root.querySelector('#emp')?.focus();
    };
    root.querySelector('#lkgo')?.addEventListener('click', go);
    [emp, pin].forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); }));
    emp.focus();
  }

  draw();
}

// ── 전표 줄 대조 ─────────────────────────────────────────────────────────────
// 비밀팩의 result.lines 가 문장을 정한다. 형태를 강요하지 않고, 「취소」가 들어간 줄만
// 골라 「품목 — 상태」로 쪼갠다. 못 쪼개면 목록에는 긋지 않고 로그 칸에만 남는다.
export function cancelLines(lines = []) {
  return lines
    .map((l) => String(l))
    .filter((l) => l.includes('취소'))
    .map((l) => {
      const i = l.indexOf('—');
      return i === -1 ? { head: '', status: l.trim() }
        : { head: l.slice(0, i).trim(), status: l.slice(i + 1).trim() };
    })
    .filter((x) => x.head);
}

// 전표 한 줄이 취소 줄과 같은 품목인가. 같으면 그 줄의 상태 문구를 돌려준다.
export function matchCancel(row, cancels) {
  const hay = squash(`${row?.query || ''} ${row?.title || ''} ${row?.snippet || ''}`);
  const hit = (cancels || []).find((c) => c.head && hay.includes(squash(c.head)));
  return hit ? hit.status : null;
}

// '… · 상태 (비어 있음)' 을 본문과 상태 칸으로 가른다. 상태 칸이 비어 있다는 것이
// 이 카드의 내용이므로, 한 덩어리 문장으로 흘려 두지 않고 따로 세운다.
export function splitStatus(snippet) {
  const s = String(snippet || '');
  const i = s.lastIndexOf('상태');
  if (i === -1) return [s, ''];
  return [s.slice(0, i).replace(/[\s·]+$/, ''), s.slice(i).trim()];
}

function logHTML(res) {
  return `<div class="log">
    <div class="rn">${esc(res.title || '조회 결과')}</div>
    ${(res.lines || []).map((l) => `<div class="logln${String(l).includes('취소') ? ' strike' : ''}">${esc(l)}</div>`).join('')}
  </div>`;
}

// ── 잔일 ─────────────────────────────────────────────────────────────────────
const SOLO_FOOT = '이 화면을 본 사람은 당신뿐입니다. 무엇을 봤는지 말할지 말지는 당신이 정합니다.';
const TABLET_FOOT = '판 옆에 펴 두는 화면입니다. 「관리자 조회」를 연 사람과 라운드를 사건 기록판에 적으세요.';

function imgHTML(src) {
  return src ? `<img class="ph" data-fallback="1" src="${esc(src)}" alt="">` : '';
}

// innerHTML 을 한자리에서 갈아 끼우고, 아직 없는 사진은 자리만 남긴다.
// 자산이 들어오기 전에는 경로 98곳이 전부 깨진 이미지로 뜬다 — 설명 줄이 곧 내용이므로
// 깨진 아이콘 대신 빈 자리를 둔다.
function html(markup) {
  root.innerHTML = markup;
  root.querySelectorAll?.('img[data-fallback]').forEach((im) => {
    im.addEventListener('error', () => {
      const box = im.ownerDocument.createElement('div');
      box.className = 'phx';
      box.textContent = '사진 자리 (이미지 준비 중)';
      im.replaceWith(box);
    });
  });
}

// ── 기동 ─────────────────────────────────────────────────────────────────────
// 해시만 바뀌면 모듈이 다시 돌지 않는다. 한 화면에서 다음 카드를 찍는 경우를 위해 새로 읽는다.
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => location.reload());
}
if (typeof document !== 'undefined') {
  const el = document.getElementById('clue-root');
  if (el) render(el, codeFromHash());
}
