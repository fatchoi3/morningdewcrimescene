// 배우 레퍼런스 시트 6장 — 서사(bible) + 단서/핸드폰/다이어리/지갑(gameData)
import { cluesOf, titleOf, evidenceMap, PERSON_COLOR, PERSON_BG } from './loadData.mjs';
import { BIBLE } from './bible.mjs';
import { MOVEMENT } from './movement.mjs';
import { personMovementSVG } from './floorplan.mjs';
import { BASE_CSS } from './styles.mjs';
import { esc, renderPhone, renderPages, renderWallet, renderTapReveal } from './render.mjs';

const SHEET_CSS = `
.hd{color:#fff;padding:20px 24px;border-radius:12px;margin-bottom:14px}
.hd .rl{font-size:8pt;letter-spacing:.18em;text-transform:uppercase;opacity:.85;margin-bottom:6px}
.hd .nm{font-size:24pt;font-weight:800;line-height:1.1}
.hd .meta{font-size:10pt;opacity:.92;margin-top:6px}
.hd .role{display:inline-block;font-size:9pt;font-weight:800;background:rgba(255,255,255,.22);padding:3px 12px;border-radius:12px;margin-top:10px}
.lock{background:#fff5f5;border:1px solid #ffcccc;border-radius:7px;padding:7px 12px;margin-bottom:8px;font-size:8.5pt;color:#791F1F}
.idy{background:#f8f7f4;border-radius:10px;padding:14px 16px;font-size:10pt;line-height:1.75}
.idy strong{font-weight:800}
.tlr{display:flex;gap:12px;padding:6px 0;border-bottom:1px solid #efece6}
.tlr:last-child{border-bottom:none}
.tlt{font-size:9pt;font-weight:800;color:#9c9a92;width:70px;flex-shrink:0}
.tlx{font-size:9.5pt;line-height:1.55}.tlx strong{font-weight:700}
.kbox{border-radius:8px;padding:11px 14px;margin:5px 0;font-size:9.5pt;line-height:1.7}
.kbox.know{background:#f0f8f0;border-left:3px solid #3B6D11}
.kbox.unk{background:#fff8f0;border-left:3px solid #EF9F27}
.co{font-family:Consolas,monospace;font-weight:700;font-size:8.5pt;white-space:nowrap}
.cti{font-weight:700}
.combo{font-size:7.5pt;color:#9a5b00;margin-top:3px}
.forbid{background:#fff5f5;border:2px solid #E24B4A;border-radius:9px;padding:11px 14px;margin:9px 0}
.forbid .fl{font-size:8pt;font-weight:800;color:#E24B4A;letter-spacing:.1em;margin-bottom:5px}
.forbid li{font-size:9pt;color:#791F1F;line-height:1.8;margin-left:16px}
.tnote{font-size:8pt;color:#9c9a92;margin-top:6px}
.flowwrap{text-align:center;margin:6px 0}
svg.flowmap{width:100%;max-width:440px;height:auto;background:#fbfaf8;border:1px solid #ece8e0;border-radius:8px;padding:6px}
.flowcap{font-size:7.5pt;color:#9c9a92;margin-top:3px}
table.flowstrip td{font-size:8.5pt}
table.flowstrip .mvcc{color:#555;line-height:1.45}
`;

function typeBadge(t) {
  if (t === '특수') return '<span class="badge b-sp">특수</span>';
  if (t === '일반') return '<span class="badge b-gn">일반</span>';
  return '';
}

function clueRow(c) {
  const detail = [esc(c.detail), renderTapReveal(c.tapReveal)].filter(Boolean).join('');
  const combo = (c.type === '특수' && Array.isArray(c.unlockedBy) && c.unlockedBy.length)
    ? `<div class="combo">🔓 해금 조건: ${c.unlockedBy.map((x) => `${esc(x)}(${esc(titleOf(x))})`).join(' + ')}</div>` : '';
  return `<tr><td class="co">${esc(c.code)}</td>` +
    `<td class="cti">${esc(c.title) || '<span style="color:#bbb">(제목 미작성)</span>'}${typeBadge(c.type)}${combo}</td>` +
    `<td>${detail || '<span style="color:#bbb">—</span>'}</td></tr>`;
}

function cctvFmt(s) {
  return esc(s)
    .replace(/✓/g, '<span style="color:#1a7a3a;font-weight:800">✓</span>')
    .replace(/사각/g, '<b style="color:#A32D2D">사각</b>')
    .replace(/(CCTV 단서 없음|부각되지 않음)/g, '<b style="color:#9a5b00">$1</b>');
}

// 당일 동선 — 평면도 위 시간순 경로 + 텍스트 스트립
function movementSection(person, color) {
  const pts = [];
  for (const t of (evidenceMap['SIAH-72']?.cctv?.timeline || [])) {
    for (const p of (t.people || [])) {
      if (p.who === person) pts.push({ time: t.time, x: p.x, y: p.y });
    }
  }
  const rows = MOVEMENT.filter((m) => m.person === person);
  if (!pts.length && !rows.length) return '';
  const svg = pts.length ? `<div class="flowwrap">${personMovementSVG(person, color, pts)}<div class="flowcap">평면도의 번호 = CCTV에 찍힌 순서 · 본인 방은 색으로 표시 · <b>방 안은 CCTV 사각</b></div></div>` : '';
  const strip = rows.length
    ? `<table class="flowstrip"><tr><th style="width:78px">시각</th><th>동선</th><th style="width:40%">CCTV</th></tr>` +
      rows.map((m) => `<tr><td class="nowrap">${esc(m.time)}</td><td>${esc(m.route)}</td><td class="mvcc">${cctvFmt(m.cctv)}</td></tr>`).join('') + `</table>`
    : '';
  return `<div class="sec">당일 동선 (CCTV 포착)</div>${svg}${strip}`;
}

export function genRefSheet(person) {
  const b = BIBLE[person];
  const c = PERSON_COLOR[person], bg = PERSON_BG[person];
  const clues = cluesOf(person);
  const shown = clues.filter((x) => (x.title && x.title.trim()) || (x.detail && x.detail.trim()));
  const emptyCount = clues.length - shown.length;

  // 핸드폰/다이어리/지갑 상세 블록
  const details = [];
  for (const cl of clues) {
    if (cl.phone) details.push(`<div class="sec">${esc(cl.title)} <code>${esc(cl.code)}</code> — 핸드폰 상세</div>` + renderPhone(cl.phone));
    if (cl.pages) details.push(`<div class="sec">${esc(cl.title)} <code>${esc(cl.code)}</code></div>` + renderPages(cl.pages, cl.title));
    if (cl.wallet) details.push(`<div class="sec">${esc(cl.title)} <code>${esc(cl.code)}</code></div>` + renderWallet(cl.wallet));
  }

  const body = `
<div class="hd" style="background:linear-gradient(135deg,${c},${c}cc)">
  <div class="rl">Crime Scene · 배우 레퍼런스 시트 · 본인 외 열람 금지</div>
  <div class="nm">${esc(person)}</div>
  <div class="meta">${esc(b.meta)}</div>
  <div class="role">${esc(b.role)}</div>
</div>
<div class="lock">🔒 <b>이 시트는 ${esc(person)} 배우 본인만 봅니다.</b> 다른 배우·참여자와 절대 공유하지 마세요. 다른 인물의 비밀은 모르는 것이 정상이며, 게임 후 진상 공개 때 함께 알게 됩니다.</div>

<div class="sec">정체성</div>
<div class="idy">${b.identity}</div>

<div class="sec">당일 타임라인</div>
<div>${b.timeline.map(([t, x]) => `<div class="tlr"><div class="tlt">${esc(t)}</div><div class="tlx">${x}</div></div>`).join('')}</div>

<div class="sec">내가 아는 것 / 모르는 것</div>
<div class="kbox know">${b.knows[0]}</div>
<div class="kbox unk">${b.knows[1]}</div>

${movementSection(person, c)}

<div class="sec">보유 단서 목록 (${shown.length}개)</div>
<table class="avoid"><tr><th style="width:74px">코드</th><th style="width:40%">단서</th><th>내용</th></tr>
${shown.map(clueRow).join('')}
</table>
${emptyCount ? `<div class="tnote">※ 이 외 미작성(빈) 슬롯 ${emptyCount}개는 생략. (gameData.js에 제목·내용이 비어 있음)</div>` : ''}

${details.join('\n')}

${(b.script && b.script.length) ? `<div class="sec">추궁 대응 대본 (길잡이 특수가 나를 가리킬 때)</div>
<table class="avoid"><tr><th style="width:38%">상황</th><th>대응</th></tr>
${b.script.map(([sit, line]) => `<tr><td><b>${esc(sit)}</b></td><td>${line}</td></tr>`).join('')}
</table>` : ''}

<div class="forbid"><div class="fl">⛔ 절대 금지 — 게임이 무너집니다</div><ul>
${b.forbidden.map((f) => `<li>${f}</li>`).join('')}
</ul></div>
`;

  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>배우시트 ${esc(person)}</title><style>${BASE_CSS}${SHEET_CSS}</style></head><body>${body}</body></html>`;
  return { filename: `배우레퍼런스_${person}.html`, html };
}

export function genAllRefSheets() {
  return Object.keys(BIBLE).map(genRefSheet);
}
