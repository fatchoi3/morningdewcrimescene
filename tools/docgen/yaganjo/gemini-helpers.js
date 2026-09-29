// ─────────────────────────────────────────────────────────────────────────────
// 제미나이 그림 탭(gemini.google.com/images)에 주입해 한 장씩 뽑아 내려받는 도우미.
//   이 파일 전문을 그 탭의 페이지 안에서 실행한 뒤:
//     window.__bg = [[키, 저장경로, 프롬프트], ...]
//     window.__runList5(window.__bg.map(([k, , p]) => [k, p]), '16:9', 'bg-')
//   진행은 window.__listDone. 한 장마다 새 방을 연다(같은 방이면 앞 그림을 고쳐 그린다).
//   세션이 끊기면 도우미가 사라진다 — 그때 이 파일을 다시 넣는다.
// ─────────────────────────────────────────────────────────────────────────────
window.__sleep = (ms) => new Promise((r) => setTimeout(r, ms));
window.__box = () => document.querySelector('rich-textarea [contenteditable="true"]');
window.__put = async (t) => { const b = window.__box(); if (!b) return 'no-box'; b.focus(); document.execCommand('selectAll', false, null); document.execCommand('insertText', false, t); await window.__sleep(400); return (b.innerText || '').length; };
// 「공유 및 내보내기」에도 「보내기」가 들어 있다 — 대화방 안에서는 그 단추를 먼저 집어 전송이 안 됐다
window.__sendBtn = () => [...document.querySelectorAll('button')].find((b) => /^(메시지 )?보내기$|^Send( message)?$/i.test((b.getAttribute('aria-label') || '').trim()) && !b.disabled) || null;
window.__ratioBtn = () => [...document.querySelectorAll('button')].find((b) => /가로세로 비율/.test(((b.getAttribute('aria-label') || '') + ' ' + (b.innerText || '')))) || null;
// 비율 칩이 글자 없이 그려질 때가 있다 — 그땐 aria-label(「가로세로 비율, 16:9」)에서 읽는다
window.__ratioNow = () => { const b = window.__ratioBtn(); if (!b) return null; const t = (b.innerText || '').replace(/\s+/g, ' ').trim(); if (/\d+:\d+/.test(t)) return t.match(/\d+:\d+/)[0]; const a = (b.getAttribute('aria-label') || '').match(/\d+:\d+/); return a ? a[0] : t; };
window.__limit = () => /한도가 재설정|한도|초과|나중에 다시/.test(document.body.innerText.slice(-3000));
window.__imgs = () => [...document.querySelectorAll('generated-image img')].filter((x) => x.naturalWidth >= 400);
window.__modelNow = () => { const b = [...document.querySelectorAll('button')].find((x) => /Flash|Pro/.test(x.innerText || '') && x.getBoundingClientRect().width > 0); return b ? b.innerText.trim() : null; };
window.__modelWait = async () => { for (let i = 0; i < 12; i++) { const m = window.__modelNow(); if (m) return m; await window.__sleep(250); } return null; };
// 산문 대신 그림을 받으려면 첫머리를 이렇게 연다
window.__PREFIX = '이 사진을 만들어 줘. ';

// 새 그림 방 — 왼쪽 「이미지」 링크를 눌러 연다(페이지를 새로 읽지 않아 도우미가 살아 있다)
window.__fresh = async function () {
  const a = [...document.querySelectorAll('a[href="/images"]')].pop();
  if (!a) return 'no-link';
  a.click();
  for (let i = 0; i < 80; i++) {
    await window.__sleep(250);
    if (window.__box() && !/\/app\//.test(location.pathname)) { await window.__sleep(800); return 'ok'; }
  }
  return 'timeout';
};

// 한 장 — 보내고 그림이 뜰 때까지 기다린다
window.__one2 = async function (text, sec) {
  await window.__put(text);
  await window.__sleep(700);
  const b = window.__sendBtn();
  if (!b) return { err: 'no-send' };
  b.click();
  const until = (sec || 220) * 4;
  for (let i = 0; i < until; i++) {
    await window.__sleep(250);
    if (window.__imgs().length) { await window.__sleep(2500); return { ok: true }; }
    const tail = document.body.innerText.slice(-4000);
    if (/지원해 드릴 수 없|생성 요청은 지원|안전 가이드라인|도와드릴 수는 없|도와드릴 수 없/.test(tail)) return { err: 'refused' };
    if (/한도가 재설정/.test(tail)) return { err: 'limit' };
  }
  // 시간이 넘으면 돌던 생성을 멈춘다 — 안 멈추면 보내기 단추가 안 돌아와 뒤의 것이 전부 「no-send」로 빠진다
  await window.__stopGen();
  return { err: 'timeout' };
};
window.__stopGen = async () => { const s = [...document.querySelectorAll('button')].find((b) => /대답 생성 중지/.test(b.getAttribute('aria-label') || '')); if (s) { s.click(); await window.__sleep(2000); } return !!s; };

// 캔버스로 옮겨 내려받는다(blob 을 fetch 하면 막힌다)
window.__dump = async (name) => {
  const im = window.__imgs(); const out = [];
  for (let i = 0; i < im.length; i++) {
    const x = im[i];
    const c = document.createElement('canvas');
    c.width = x.naturalWidth; c.height = x.naturalHeight;
    c.getContext('2d').drawImage(x, 0, 0);
    let url;
    try { url = c.toDataURL('image/png'); } catch (e) { out.push('TAINTED'); continue; }
    const a = document.createElement('a');
    a.href = url; a.download = name + (im.length > 1 ? '-' + (i + 1) : '') + '.png';
    document.body.appendChild(a); a.click(); a.remove();
    await window.__sleep(900); out.push(a.download);
  }
  return out;
};

// 목록을 차례로 — 비율이 다르거나 모델이 Lite 로 떨어지면 멈춘다, 한도에 걸리면 멈춘다
window.__runList5 = async function (list, ratio, prefix) {
  const done = []; window.__listDone = done;
  for (const [key, text] of list) {
    const nav = await window.__fresh();
    if (nav !== 'ok') { done.push({ key, err: 'nav:' + nav }); break; }
    if (window.__ratioNow() !== ratio) { done.push({ key, err: 'ratio:' + window.__ratioNow() }); break; }
    const m = await window.__modelWait();
    if (m && /Lite/.test(m)) { done.push({ key, err: 'model:' + m }); break; }
    const r = await window.__one2(window.__PREFIX + text, 150);
    if (!r.ok) { done.push({ key, err: r.err }); if (r.err === 'limit') break; continue; }
    let fl = []; try { fl = await window.__dump((prefix || 'y-') + key); } catch (e) { fl = ['ERR']; }
    done.push({ key, ok: true, f: fl }); await window.__sleep(1500);
  }
  done.push({ key: '__END__' });
};
'helpers ok';
