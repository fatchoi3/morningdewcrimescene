// Q 카드 QR 이 여는 화면 — 숫자를 넣어야 열리는 것 하나를 보여 준다.
//   앱판에는 톡서랍 복구·진위조회라는 상호작용이 있는데 종이에는 넣을 화면이 없다.
//   그 화면만 떼어 내 QR 뒤에 둔다. 잠근 것은 카드가 아니라 숫자이므로, 카드를 탁자에
//   펴 둬도 숫자를 아는 사람만 연다 — 그 사람이 알려 줄지 말지가 곧 게임이 된다.
//
//   주소는 /unlock#단서코드. CCTV 판과 같은 규칙이다(번호가 바뀌어도 인쇄된 QR 이 살아 있게).
import { evidenceMap as publicMap } from '../data/gameData.js';
import { mergeSecrets } from '../data/mergeSecrets.js';
import secrets from '@secrets';

const evidenceMap = mergeSecrets(publicMap, secrets);
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));

// 잠긴 것 — 화면마다 '무엇을 묻는지'와 '맞으면 무엇을 보여 주는지'가 다르다.
const LOCKS = {
  'LWUY-33': { kind: 'chat', title: '목사님 휴대폰', sub: '카카오톡 톡서랍 복구' },
  'QIVS-92': { kind: 'chat', title: '한다영 휴대폰', sub: '카카오톡 톡서랍 복구' },
  'HUOX-80': { kind: 'chat', title: '한소미 휴대폰', sub: '카카오톡 톡서랍 복구' },
  CERT: { kind: 'lookup', of: 'LWUY-33', title: '대한성문장로회 총회', sub: '수료증 진위조회' },
  // 필적 대조는 사람마다 카드가 따로 있다(HAND1~). 화면에서 고르는 게 아니라, 그 사람의
  //   다이어리를 손에 넣은 사람이 그 카드의 QR 을 찍는다 — 대조하려면 글씨 표본이 있어야 한다는
  //   당연한 조건이 카드로 강제된다. 목록에서 고르게 하면 표본 없이 일곱 명을 다 돌려 볼 수 있다.
  HAND: { kind: 'hand', of: 'TUBE-22', title: '필적 대조', sub: '통 라벨의 글씨는 누구 것인가' },
};

// 주소의 해시만 바뀌면 모듈이 다시 안 돈다. QR 로 들어올 땐 새로 로드되지만,
//   한 화면에서 다음 카드를 찍는 경우를 위해 다시 그린다.
window.addEventListener('hashchange', () => location.reload());

const root = document.getElementById('unlock-root');
const code = decodeURIComponent(location.hash.replace(/^#/, '')).trim().toUpperCase();
// HAND1 ~ HANDn — 뒤의 숫자가 대조할 사람의 순번이다.
const handAt = /^HAND(\d+)$/.exec(code);
const lock = handAt ? { ...LOCKS.HAND, one: +handAt[1] - 1 } : LOCKS[code];

if (!lock) {
  root.innerHTML = `<div class="box"><h1>잠긴 자료</h1>
    <p class="msg">카드의 QR 을 찍어서 들어와야 이 화면이 열립니다.</p>
    <p class="sub">주소 끝에 코드가 없거나(<code>${esc(code) || '없음'}</code>) 잠금 대상이 아닙니다.</p></div>`;
} else if (lock.kind === 'hand') {
  // 필적 대조는 숫자가 아니라 '누구와 맞춰 볼까'를 고르는 일이다. 고른 뒤에야 결과가 나온다 —
  //   일곱 결과를 한꺼번에 보여 주면 일치하는 사람이 첫눈에 드러나 대조가 아니라 정답 공개가 된다.
  const opts = evidenceMap[lock.of]?.handwriting?.options || [];
  const o = opts[lock.one];
  if (!o) {
    root.innerHTML = `<div class="box"><h1>필적 대조</h1>
      <p class="msg">이 카드가 가리키는 사람이 없습니다.</p></div>`;
  } else {
    const sample = evidenceMap[o.requires];
    root.innerHTML = `<div class="box">
      <div class="hd"><div class="tt">${esc(o.who)} 의 글씨와 대조</div>
        <div class="sb">${esc(lock.sub)}</div></div>
      <p class="sub" style="margin-top:0">대조하려면 <b>${esc(sample?.title || o.who + ' 의 손글씨가 있는 카드')}</b>가
        손에 있어야 합니다. 없으면 여기서 멈추세요 — 표본 없이 나온 결과는 근거가 되지 않습니다.</p>
      <div class="room"><div class="rn">대조 결과</div>
        <div class="ln">${esc(o.result || '')}</div></div>
      <p class="foot">이 화면을 본 사람은 당신뿐입니다. 무엇을 봤는지 말할지 말지는 당신이 정합니다.<br>
        다른 사람과 맞춰 보려면 <b>그 사람의 대조 카드</b>를 찾아 찍으세요.</p>
    </div>`;
  }
} else {
  const isChat = lock.kind === 'chat';
  const answer = isChat ? secrets.recover?.[code] : secrets.lookups?.[lock.of]?.answer;
  const label = isChat ? '네 자리 숫자' : '발급번호';
  const ph = isChat ? '0000' : '0000-0000';

  root.innerHTML = `<div class="box">
    <div class="hd"><div class="tt">${esc(lock.title)}</div><div class="sb">${esc(lock.sub)}</div></div>
    <div class="pad">
      <label for="pw">${label}</label>
      <input id="pw" type="${isChat ? 'tel' : 'text'}" inputmode="${isChat ? 'numeric' : 'text'}"
        autocomplete="off" placeholder="${ph}" ${isChat ? 'maxlength="4"' : 'maxlength="12"'}>
      <button id="go">열기</button>
      <div class="err" id="err" hidden>맞지 않습니다.</div>
    </div>
    <div id="out"></div>
    <p class="foot">이 화면을 본 사람은 당신뿐입니다. 무엇을 봤는지 말할지 말지는 당신이 정합니다.</p>
  </div>`;

  const norm = (s) => String(s || '').replace(/[\s-]/g, '').toUpperCase();
  const show = () => {
    const out = document.getElementById('out');
    document.querySelector('.pad').hidden = true;
    out.innerHTML = isChat ? chatHTML(code) : lookupHTML(lock.of);
  };
  const tryOpen = () => {
    const v = document.getElementById('pw').value;
    if (answer && norm(v) === norm(answer)) show();
    else { const e = document.getElementById('err'); e.hidden = false; setTimeout(() => { e.hidden = true; }, 2000); }
  };
  document.getElementById('go').addEventListener('click', tryOpen);
  document.getElementById('pw').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryOpen(); });
  document.getElementById('pw').focus();
}

// 복구된 대화방 — 지워졌던 것만 보여 준다. 안 지워진 대화는 이미 카드에 인쇄돼 있다.
function chatHTML(c) {
  const app = (evidenceMap[c]?.phone?.apps || []).find((a) => a.chats);
  const gone = (app?.chats || []).filter((ch) => ch.deleted);
  if (!gone.length) return `<div class="msg">복구할 대화방이 없습니다.</div>`;
  return `<div class="ok">복구되었습니다 — 대화방 ${gone.length}개</div>` + gone.map((ch) => `
    <div class="room"><div class="rn">${esc(ch.name)}<span>삭제됨 · 복구</span></div>
      ${(ch.messages || []).map((m) => `<div class="ln"><b>${esc(m.who || '')}</b>${esc(m.text || '')}</div>`).join('')}
    </div>`).join('');
}

function lookupHTML(of) {
  const r = secrets.lookups?.[of]?.result;
  if (!r) return `<div class="msg">조회 결과가 없습니다.</div>`;
  return `<div class="ok">조회 완료</div>
    <div class="room"><div class="rn">${esc(r.title)}</div>
      ${(r.lines || []).map((l) => `<div class="ln">${esc(l)}</div>`).join('')}</div>`;
}
