// ─────────────────────────────────────────────────────────────────────────────
// tools/playtest/play.mjs — 에이전트가 솔로 게임을 「사람처럼」 손으로 해 보게 하는 조종 도구.
//   플레이어마다 따로 떨어진 폰 크기(390x844) 브라우저를 띄운다(프로필이 달라 진행 기록이 섞이지 않는다).
//   start 가 플레이어별 상주 조종기(serve)를 띄우고, 나머지 명령은 그 조종기에 말을 건다.
//   (예전엔 명령마다 브라우저에 다시 붙었는데, 붙을 때 화면 크기를 다시 맞추느라 페이지가 새로 읽혀
//    방에 들어가도 다음 명령에선 지도로 돌아가 있었다 — 2026-09-30 첫 시험이 통째로 무효가 됐다.)
//
//   node tools/playtest/play.mjs <이름> start <주소>     브라우저를 띄우고 그 주소를 연다
//   node tools/playtest/play.mjs <이름> look             화면 사진 + 누를 수 있는 것 목록 + 보이는 글
//   node tools/playtest/play.mjs <이름> click <번호>      look 목록의 번호를 누른다
//   node tools/playtest/play.mjs <이름> tap <x> <y>       화면의 그 점을 누른다(사진 좌표)
//   node tools/playtest/play.mjs <이름> swipe <left|right|up|down>  그림을 손가락으로 민다
//   node tools/playtest/play.mjs <이름> pinch <in|out>   두 손가락으로 오므리기/벌리기
//   node tools/playtest/play.mjs <이름> type <글>         글자를 친다(입력칸이 눌려 있어야 한다)
//   node tools/playtest/play.mjs <이름> stop             브라우저를 닫는다
//   사진과 상태는 tools/playtest/.runs/<이름>/ 에 쌓인다(저장소에 올리지 않는다).
// ─────────────────────────────────────────────────────────────────────────────
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME = 'C:/Users/user/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const ROOT = 'C:/ictk_repo/morningdewcrimescene/tools/playtest/.runs';
const [name, cmd, ...args] = process.argv.slice(2);
if (!name || !cmd) { console.log('사용법은 파일 머리 주석'); process.exit(1); }
const dir = path.join(ROOT, name);
mkdirSync(dir, { recursive: true });
const stateFile = path.join(dir, 'state.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const W = 390, H = 844;
const portOf = (n) => 9300 + ([...n].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 100003, 7) % 600);

// 누를 수 있는 것 — 버튼·링크·입력칸 중 화면 안에 보이는 것만, 위에서 아래 순서로
const LIST_JS = `(() => {
  // 버튼·링크·입력칸 + 손가락 모양 커서가 뜨는 것(React 가 onClick 을 단 상자는 속성이 없어 이것으로 잡는다)
  const isPtr = (el) => el && el.nodeType === 1 && getComputedStyle(el).cursor === 'pointer';
  const els = [...document.querySelectorAll('button, a[href], input, textarea, [role=button]'),
    ...[...document.querySelectorAll('div, span, li, img, svg, section, article, p, label')].filter((el) => isPtr(el) && !isPtr(el.parentElement) && !el.closest('button, a[href]'))];
  const out = [];
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    const cx = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), cy = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
    const top = document.elementFromPoint(cx, cy);
    const covered = top && !(el === top || el.contains(top) || top.contains(el));
    const label = ((el.innerText || '').trim() || el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('placeholder') || el.value || '').replace(/\\s+/g, ' ').slice(0, 60);
    // 다른 것에 덮여 사람 손이 닿지 않는 것은 목록에서 뺀다
    if (covered) continue;
    out.push({ label, x: Math.round(cx), y: Math.round(cy), tag: el.tagName.toLowerCase() });
  }
  return out;
})()`;

// ── 상주 조종기 ────────────────────────────────────────────────────────────
async function serve(url, port) {
  const { default: puppeteer } = await import('file:///C:/ictk_repo/morningdewcrimescene/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true, userDataDir: path.join(dir, 'profile'),
    args: ['--no-first-run', '--no-default-browser-check', `--window-size=${W},${H}`, '--hide-scrollbars'],
    defaultViewport: { width: W, height: H, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
  });
  const page = (await browser.pages())[0] || await browser.newPage();
  // 시험판: 잠긴 사건(야간조)은 이 브라우저에서 미리 풀어 둔다 — 플레이어는 비밀번호를 모른다(페이지가 읽히기 전에)
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('crimescene_unlock_yaganjo', '1'); } catch (e) {} });
  await page.goto(url, { waitUntil: 'networkidle2' }).catch(() => {});
  let list = [];

  async function look() {
    await sleep(500);
    const shot = path.join(dir, 'screen.png').replace(/\\/g, '/');
    await page.screenshot({ path: shot });
    list = await page.evaluate(LIST_JS);
    const text = await page.evaluate(() => (document.body.innerText || '').replace(/\n{2,}/g, '\n').slice(0, 1800));
    return ['화면 사진: ' + shot, '── 누를 수 있는 것 (번호 · 글 · 가운데 좌표) ──',
      ...list.map((e, i) => `[${i}] ${e.label || '(글자 없음 ' + e.tag + ')'} @${e.x},${e.y}`),
      '── 화면에 보이는 글 ──', text].join('\n');
  }
  const tapAt = async (x, y) => { await page.touchscreen.tap(x, y); await sleep(900); };

  async function run(c, a) {
    if (c === 'look') return look();
    if (c === 'click') { const e = list[+a[0]]; if (!e) return '그 번호가 없다 — look 을 먼저\n' + await look(); await tapAt(e.x, e.y); return look(); }
    if (c === 'tap') { await tapAt(+a[0], +a[1]); return look(); }
    if (c === 'swipe') {
      // 손가락이 닿는 자리(화면 가운데)에서 위로 올라가며 밀리는 상자를 찾는다 — 사람이 미는 것과 같다.
      //   (예전엔 화면에서 가장 큰 밀리는 상자를 밀어서, 수첩·사건 파일을 열어 둬도 그 뒤 지도가 밀렸다.
      //    2026-09-30 시험의 「목록이 안 밀린다」 세 건이 그것이었다.) 안쪽 틀(iframe)이면 그 문서를 민다.
      const moved = await page.evaluate((d) => {
        const W0 = innerWidth, H0 = innerHeight;
        const can = (el, axis) => { const cs = getComputedStyle(el); const ov = axis === 'x' ? cs.overflowX : cs.overflowY; return /(auto|scroll)/.test(ov) && (axis === 'x' ? el.scrollWidth > el.clientWidth + 4 : el.scrollHeight > el.clientHeight + 4); };
        const axis = d === 'left' || d === 'right' ? 'x' : 'y';
        let el = document.elementFromPoint(W0 / 2, H0 * 0.45);
        const by = (t) => { const w = t.clientWidth || W0, h = t.clientHeight || H0; return { left: d === 'left' ? w * 0.6 : d === 'right' ? -w * 0.6 : 0, top: d === 'up' ? h * 0.5 : d === 'down' ? -h * 0.5 : 0 }; };
        if (el && el.tagName === 'IFRAME') { const se = el.contentDocument?.scrollingElement; if (se) { se.scrollBy(by(el)); return 'iframe'; } }
        for (; el && el !== document.documentElement; el = el.parentElement) if (can(el, axis)) { el.scrollBy(by(el)); return String(el.className).slice(0, 30) || el.tagName; }
        const se = document.scrollingElement; se.scrollBy(by(se)); return 'page';
      }, a[0]);
      return '밀었다: ' + moved + String.fromCharCode(10) + await look();
    }
    if (c === 'pinch') {
      const cdp = await page.createCDPSession();
      const cx = W / 2, cy = H * 0.45, s0 = a[0] === 'in' ? 140 : 30, s1 = a[0] === 'in' ? 30 : 140;
      const pts = (s) => [{ x: cx - s, y: cy, id: 1 }, { x: cx + s, y: cy, id: 2 }];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(s0) });
      for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(s0 + ((s1 - s0) * i) / 8) });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await cdp.detach();
      return look();
    }
    if (c === 'type') { await page.keyboard.type(a.join(' ')); return look(); }
    return '모르는 명령: ' + c;
  }

  let busy = Promise.resolve();
  const srv = createServer((req, res) => {
    let body = '';
    req.on('data', (d) => { body += d; });
    req.on('end', () => {
      const { c, a } = JSON.parse(body || '{}');
      if (c === 'stop') { res.end('닫았다'); setTimeout(async () => { await browser.close().catch(() => {}); process.exit(0); }, 100); return; }
      busy = busy.then(() => run(c, a || []).catch(async (e) => '오류: ' + (e?.message || e) + String.fromCharCode(10) + await look().catch(() => ''))).then((out) => res.end(out), (e) => res.end('오류: ' + (e?.message || e)));
    });
  });
  srv.listen(port, '127.0.0.1');
  writeFileSync(path.join(dir, 'ready'), String(port));
}

// ── 명령 ────────────────────────────────────────────────────────────────
const send = async (c, a) => {
  const { port } = JSON.parse(readFileSync(stateFile, 'utf8'));
  const r = await fetch(`http://127.0.0.1:${port}/`, { method: 'POST', body: JSON.stringify({ c, a }) });
  return r.text();
};

if (cmd === 'serve') {
  await serve(args[0], +args[1]);
} else if (cmd === 'start') {
  const url = args[0] || 'http://localhost:5180/solo-play';
  const port = portOf(name);
  try { writeFileSync(path.join(dir, 'ready'), ''); } catch { /* 처음 */ }
  const self = fileURLToPath(import.meta.url);
  const child = spawn(process.execPath, [self, name, 'serve', url, String(port)], { detached: true, stdio: 'ignore' });
  child.unref();
  writeFileSync(stateFile, JSON.stringify({ port, pid: child.pid }));
  let ok = false;
  for (let i = 0; i < 120 && !ok; i++) { await sleep(250); try { ok = readFileSync(path.join(dir, 'ready'), 'utf8') === String(port); } catch { /* 아직 */ } }
  console.log(ok ? await send('look', []) : '브라우저를 못 띄웠다');
} else {
  try { console.log(await send(cmd, args)); } catch (e) { console.log('조종기에 닿지 않는다 — start 를 먼저: ' + e.message); }
}
