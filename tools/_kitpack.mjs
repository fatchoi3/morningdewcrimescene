// /board-kit 이 실제로 내놓는 인쇄물 여섯 종을 그대로 읽어 시뮬레이션용 팩을 만든다.
//
//   지금까지의 팩은 정본 데이터에서 손으로 추린 것이었다. 같은 원본이긴 해도 「인쇄물에
//   실제로 실린 것」과는 다르다 — 판에 안 실린 정보가 팩에 들어가거나, 판에만 있는 안내가
//   팩에서 빠질 수 있다. 이번에는 뽑아서 탁자에 올릴 종이를 그대로 읽는다.
//
//   [QR 을 카드 번호로 건다]
//   QR 은 SVG 라 주소가 HTML 에 안 남는다. 그리고 플레이어가 손에 쥐는 것도 코드가 아니라
//   카드에 인쇄된 번호(D11·C5)다. 그래서 인쇄된 카드에서 번호와 제목을 긁어, 제목이 같은
//   단서의 화면 내용을 그 번호에 건다 — 실제로 찍었을 때 보이는 것까지가 판이다.
import fs from 'node:fs';
import { allClues } from './docgen/loadData.mjs';

const DIR = 'tools/docgen/output/html';
const KIT = ['보드_진행물', '보드_배치와트랙', '보드_장소판', '보드_단서카드', '보드_인물카드', '진상해설서'];

const text = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<svg[\s\S]*?<\/svg>/gi, '[QR]')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<\/(h1|h2|h3|p|div|tr|li)>/gi, '\n')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/(td|th)>/gi, ' | ')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .split('\n').map((l) => l.replace(/[ \t]+/g, ' ').replace(/ \| $/, '').trim())
  .filter((l, i, a) => l || a[i - 1])
  .join('\n').trim();

const sheets = {};
for (const name of KIT) {
  const p = `${DIR}/${name}.html`;
  if (!fs.existsSync(p)) { console.log('  ✗ 없음:', name); continue; }
  sheets[name] = text(fs.readFileSync(p, 'utf8'));
}

// 인쇄된 카드에서 번호와 제목을 긁는다. QR 이 붙은 카드만 화면이 있다.
const cardHtml = fs.readFileSync(`${DIR}/보드_단서카드.html`, 'utf8');
// QR 은 SVG 라 덩치가 크다 — 정규식 하나로 훑으면 어긋난다. 카드 단위로 잘라 각각 읽는다.
const printed = cardHtml.split('<div class="card').slice(1).map((chunk) => {
  const body = chunk.slice(0, chunk.indexOf('<div class="card') + 1 || undefined);
  const no = (body.match(/<span class="no"[^>]*>([^<]+)</) || [])[1];
  const title = (body.match(/<div class="ct">([^<]*)</) || [])[1];
  const cd = (body.match(/<div class="cd[^"]*">([\s\S]*?)<\/div>/) || [])[1];
  return no && title
    ? { no: no.trim(), title: title.trim(), body: cd || '', hasQR: body.includes('class="qr"') }
    : null;
}).filter(Boolean);

const byTitle = new Map();
for (const c of allClues) if (c.title) byTitle.set(c.title.trim(), c);
// 카드에 인쇄된 제목이 정본 제목과 다른 것이 있다(파우치 → 「…의 소지품」). 본문으로 한 번 더 건다.
const norm = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
const byBody = new Map();
for (const c of allClues) { const k = norm(c.detail || c.description); if (k) byBody.set(k, c); }
// 필적 대조 카드(Q6)는 정본 단서가 아니라 생성된 게시물이다 — 결과는 대조 옵션에 들어 있다.
const hand = allClues.find((c) => c.handwriting?.options?.length);
const byWho = new Map((hand?.handwriting.options || []).map((o) => [o.who, o]));

const flat = (c) => {
  const out = [];
  const push = (label, v) => { if (v) out.push(label ? `${label}: ${v}` : String(v)); };
  push('', (c.detail || c.description || '').replace(/<[^>]+>/g, ' '));
  for (const p of c.pages || []) push(p.title || '쪽', (p.content || '').replace(/<[^>]+>/g, ' '));
  for (const a of c.phone?.apps || []) {
    out.push(`[${a.name || a.id}]`);
    push('', (a.content || '').replace(/<[^>]+>/g, ' '));
    for (const it of a.items || []) push(it.label, it.detail || it.value);
    for (const cl of a.calls || []) out.push(` · ${cl.time} ${cl.name} ${cl.direction} ${cl.duration || ''}`.trimEnd());
    for (const ph of a.photos || []) out.push(` · [사진] ${ph.caption} — 그림 파일 ${ph.image} (무엇이 적혀 있는지는 그림을 봐야 안다)`);
    for (const ch of a.chats || []) {
      out.push(` 방 「${ch.name}」${ch.deleted ? ' (삭제됨 — 네 자리를 넣어야 복구된다)' : ''}`);
      for (const m of ch.messages || []) out.push(`   ${m.who === 'me' ? '나' : ch.name}: ${(m.text || '').replace(/<[^>]+>/g, '')}`);
    }
  }
  for (const it of c.wallet?.items || []) push(it.label, (it.detail || '') + (it.image ? ` — 그림 파일 ${it.image}` : ''));
  return out.join('\n');
};

const screens = {}, images = [], missed = [];
for (const p of printed) {
  if (!p.hasQR) continue;
  // 필적 대조는 찍으면 그 한 사람의 대조 결과만 나오고, 결과는 찍은 사람만 본다.
  const who = (p.title.match(/필적 대조\s*—\s*(.+)$/) || [])[1];
  if (who && byWho.has(who)) {
    const o = byWho.get(who);
    screens[`${p.no} ${p.title}`] = `${o.result}\n(이 카드는 ${who} 의 다이어리가 판에 공개된 뒤라야 찍을 수 있다. 한 라운드에 세 명까지.)`;
    continue;
  }
  const c = byTitle.get(p.title) || byBody.get(norm(p.body));
  if (!c) {
    // 「…의 소지품」처럼 여러 단서를 한 장으로 묶은 카드다. 본문은 이미 카드에 다 실려 있으니
    //   화면에 더할 것은 그림뿐이다 — 어느 그림이 붙어 있는지만 알려 준다.
    const merged = allClues.filter((x) => x.detail && p.body.includes(norm(x.detail).slice(0, 20)));
    if (merged.length) {
      for (const m of merged) if (m.image) images.push(`${p.no} ${p.title} → 그림 ${m.image} (${m.title})`);
      screens[`${p.no} ${p.title}`] = `찍으면 카드에 적힌 물건들의 사진이 크게 열린다.\n${merged.map((m) => `· ${m.title}`).join('\n')}`;
    } else missed.push(`${p.no} ${p.title}`);
    continue;
  }
  const body = flat(c);
  if (body) screens[`${p.no} ${p.title}`] = body;
  if (c.image) images.push(`${p.no} ${p.title} → 그림 ${c.image}`);
  for (const a of c.phone?.apps || []) for (const ph of (a.photos || [])) images.push(`${p.no} ${p.title} → 폰 사진첩 ${ph.image} (${ph.caption})`);
}

const pack = {
  주의: [
    '이 팩은 /board-kit 이 내놓는 인쇄물 여섯 종을 그대로 읽은 것이다.',
    'sheets 가 탁자에 올릴 종이 전문이고, screens 는 카드의 QR 을 찍었을 때 폰에 뜨는 화면이다 — 카드에 인쇄된 번호로 걸려 있다.',
    'images 에 적힌 그림 안의 글자(발급번호·날짜·수치 등)는 이 팩에 없다. 그림에 무엇이 적혀 있는지 단정하지 말고, 필요하면 「그 그림을 봐야 안다」고 적어라.',
    '여기 없는 것은 판에도 없다. 지어내지 마라.',
  ].join(' '),
  sheets, screens, images,
};
fs.writeFileSync('tools/_kit_sim.json', JSON.stringify(pack, null, 1), 'utf8');

console.log('인쇄물', Object.keys(sheets).length, '종 ·', Object.values(sheets).reduce((n, s) => n + s.length, 0).toLocaleString(), '자');
for (const [k, v] of Object.entries(sheets)) console.log(`   ${k.padEnd(14)} ${v.length.toLocaleString()}자`);
console.log('인쇄된 카드', printed.length, '장 · 그중 QR', printed.filter((p) => p.hasQR).length);
console.log('QR 화면', Object.keys(screens).length, '개 · 그림 안내', images.length, '줄');
if (missed.length) console.log('제목이 안 맞아 화면을 못 건 카드:\n   ' + missed.join('\n   '));
