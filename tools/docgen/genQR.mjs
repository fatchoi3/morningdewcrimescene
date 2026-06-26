// QR 부착 가이드 — gameData에서 단서 획득 방식을 분류하고,
//  ① 부착표(코드→단서명→분류→붙일 물건/위치)
//  ② 인쇄용 QR 그리드(코드 문자열을 인코딩한 실제 QR SVG, 잘라 붙이기)
// 를 생성한다. QR 페이로드 = 단서 코드(앱 스캐너가 그대로 읽어 단서 확보).
import QRCode from 'qrcode';
import { allClues, PERSON_ORDER, PERSON_COLOR, SITE_URL } from './loadData.mjs';
import { cctvClueCodes } from '../../src/data/gameData.js';
import { BASE_CSS } from './styles.mjs';
import { esc } from './render.mjs';

const cctvSet = new Set(cctvClueCodes);

// 운영자가 단계에 맞춰 "게시"하는 특수 단서 — 비번/트리거가 없어 QR 게시가 적합.
// (2차 부검=중간 점검. 1차 부검은 BRIF-00 시작 브리핑 묶음으로 통합됨. 감식 비번·길잡이 트리거 단서는 제외)
const OPERATOR_QR = {
  'LONS-62': { sub: '진술/안내', loc: '운영자 게시 — 중간 점검 때 공개', phase: 2 },
};

// 획득 방식: qr(실물 부착) / app(앱에서 획득) / op(운영자 처리) / skip(빈 슬롯)
function method(c) {
  if (c.code === 'SIAH-72' || cctvSet.has(c.code)) return { kind: 'app', label: '앱 · CCTV 열람대' };
  if (c.handwriting) return { kind: 'app', label: '앱 · 필적 대조' };
  if (OPERATOR_QR[c.code]) return { kind: 'qr', label: 'QR 게시(운영자)' };
  if (c.type === '감식') return { kind: 'op', label: '운영 · 검식 비번' };
  if (c.type === '특수') {
    const auto = (c.unlockedBy && c.unlockedBy.length) || (c.unlockedByAny && c.unlockedByAny.length);
    if (auto) return { kind: 'app', label: '앱 · 자동 해금' };
    if (c.viewUnlock) return { kind: 'app', label: '앱 · 자동(열람 시)' };  // 특정 화면 열람 흔적으로 자동 해금
    if (c.award) return { kind: 'qr', label: '운영자 휴대 카드(조건부)' };  // 운영자가 들고 다니다 조건 시 제시
    return { kind: 'op', label: '운영 · 코드 배포' };
  }
  if (!(c.title || '').trim()) return { kind: 'skip', label: '' };
  return { kind: 'qr', label: 'QR 부착' };
}

// QR 부착 단서의 세부 분류 + 붙일 물건/위치
function subtype(c) {
  if (OPERATOR_QR[c.code]) return { sub: OPERATOR_QR[c.code].sub, loc: OPERATOR_QR[c.code].loc };
  if (c.type === '특수' && c.award) return { sub: '운영자 카드', loc: `운영자 휴대 — ${c.award}` };
  const t = c.title || '';
  if (/손목시계/.test(t)) return { sub: '소품(착용)', loc: `${c.person} 배우 착용 — 심문 중 제시` };
  if (/멍|긁힌 자국/.test(t)) return { sub: '신체 흔적', loc: `${c.person} 배우 분장 + QR 카드` };
  if (/발견 경위|냉각된 관계|언쟁 목격|진술/.test(t)) return { sub: '진술/안내', loc: '공용 게시판 / 운영자 카드' };
  if (c.person === '목사' && /손톱|옷깃|단추|베개/.test(t)) return { sub: '현장 표식', loc: '목사님 방(현장) — QR 카드 비치' };
  if (c.person === '목사' && /방 위치|구조/.test(t)) return { sub: '안내', loc: '목사님 방 입구 안내문' };
  if (c.person === '목사') return { sub: '소품', loc: '목사님 방' };
  if (c.person === '공용') return { sub: '안내', loc: '공용 게시/배포' };
  return { sub: '소품', loc: `${c.person} 가방/방` };
}

const SUB_ORDER = ['소품', '소품(착용)', '현장 표식', '신체 흔적', '진술/안내', '안내', '운영자 카드'];

export async function genQRDocs() {
  const qrClues = [];
  const appClues = [];
  const opClues = [];
  for (const c of allClues) {
    const m = method(c);
    if (m.kind === 'qr') qrClues.push({ ...c, ...subtype(c) });
    else if (m.kind === 'app') appClues.push({ ...c, methodLabel: m.label });
    else if (m.kind === 'op') opClues.push({ ...c, methodLabel: m.label });
  }

  // 코드별 QR SVG 미리 생성
  const qrSvg = {};
  await Promise.all(qrClues.map(async (c) => {
    qrSvg[c.code] = await QRCode.toString(c.code, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
  }));
  // 게임 접속용 사이트 QR (참가자가 스캔하면 게임 사이트가 열림)
  const siteQrSvg = await QRCode.toString(SITE_URL, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
  const siteUrlText = SITE_URL.replace(/^https?:\/\//, '');

  // ── ① 부착표 ──────────────────────────────────────
  const tableCSS = `
.head{background:#0f0e0c;color:#e8e4dc;padding:22px 26px;border-radius:12px;margin-bottom:14px}
.head .ht{font-size:8pt;letter-spacing:.22em;color:#9c9a92;text-transform:uppercase;margin-bottom:8px}
.head .h1{font-size:20pt;font-weight:800}
.head .hs{font-size:9.5pt;color:#9c9a92;margin-top:8px}
.ch{font-size:13pt;font-weight:800;border-bottom:2px solid #1a1a1a;padding-bottom:6px;margin:20px 0 10px}
.pill{display:inline-block;color:#fff;border-radius:6px;padding:1px 9px;font-size:9pt;font-weight:800}
.co{font-family:Consolas,monospace;font-weight:700;font-size:8.5pt;white-space:nowrap}
.sub{font-size:7.5pt;font-weight:800;border-radius:8px;padding:1px 7px}
.s-소품{background:#e8f8f2;color:#0F6E56}.s-소품\\(착용\\){background:#e8f8f2;color:#0F6E56}
.s-현장{background:#fdeaea;color:#A32D2D}.s-신체{background:#fff3e2;color:#9a5b00}
.s-진술{background:#eef;color:#3a3a8a}.s-안내{background:#f1f0ec;color:#777}.s-운영{background:#1a1a1a;color:#ffd24a}
.tip{background:#f0f8ff;border:1px solid #b3d9ff;border-radius:8px;padding:10px 14px;margin:8px 0;font-size:8.5pt;color:#0C447C}
.stat{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0}
.stat .s{background:#f4f1e8;border:1px solid #e2d9bf;border-radius:8px;padding:7px 12px;font-size:9pt}
.stat .s b{font-size:12pt;color:#7a5a00}
`;
  const subBadge = (s) => {
    const key = s.startsWith('소품') ? '소품' : s === '현장 표식' ? '현장' : s === '신체 흔적' ? '신체' : s === '진술/안내' ? '진술' : s === '운영자 카드' ? '운영' : '안내';
    return `<span class="sub s-${key}">${esc(s)}</span>`;
  };
  const personPill = (p) => `<span class="pill" style="background:${PERSON_COLOR[p] || '#666'}">${esc(p)}</span>`;

  let table = `
<div class="head">
  <div class="ht">Crime Scene · QR 부착 가이드 · 운영자 전용</div>
  <div class="h1">QR 부착표 & 인쇄 시트</div>
  <div class="hs">QR 페이로드 = 단서 코드. 참가자가 스캔하면 그 단서가 앱에 수집됩니다.</div>
</div>
<div class="stat">
  <div class="s"><b>${qrClues.length}</b> QR 부착</div>
  <div class="s"><b>${appClues.length}</b> 앱 획득(QR 불필요)</div>
  <div class="s"><b>${opClues.length}</b> 운영자 처리</div>
</div>
<div class="tip">QR은 <b>해당 단서명과 비슷한 실물/현장/카드</b>에 붙입니다. 같은 코드의 QR은 뒤쪽 "인쇄용 QR 시트"에서 잘라 사용하세요.</div>`;

  for (const p of PERSON_ORDER) {
    const list = qrClues.filter((c) => c.person === p)
      .sort((a, b) => SUB_ORDER.indexOf(a.sub) - SUB_ORDER.indexOf(b.sub));
    if (!list.length) continue;
    table += `<div class="ch">${personPill(p)} <span style="font-size:10pt;color:#888">QR ${list.length}개</span></div>`;
    table += `<table class="avoid"><tr><th style="width:70px">코드</th><th style="width:34%">단서명</th><th style="width:90px">분류</th><th>붙일 물건 · 위치</th></tr>`;
    table += list.map((c) =>
      `<tr><td class="co">${esc(c.code)}</td><td><b>${esc(c.title)}</b></td><td>${subBadge(c.sub)}</td><td>${esc(c.loc)}</td></tr>`).join('');
    table += `</table>`;
  }

  // 앱/운영 (QR 불필요) 참조
  table += `<div class="ch pb">QR 없이 획득되는 단서 (참고)</div>`;
  table += `<table><tr><th style="width:70px">코드</th><th style="width:36%">단서명</th><th>획득 방식</th></tr>`;
  for (const c of [...appClues, ...opClues].sort((a, b) => a.methodLabel.localeCompare(b.methodLabel))) {
    table += `<tr><td class="co">${esc(c.code)}</td><td>${esc(c.title) || '(미작성)'}</td><td>${esc(c.methodLabel)}</td></tr>`;
  }
  table += `</table><div class="tip">위 단서는 CCTV 열람대·자동 해금·검식 비번·운영자 코드 배포로 얻으므로 실물 QR이 필요 없습니다. (검식 비번·배포 코드는 단서배치 가이드 8장 참조)</div>`;

  const tableHtml = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>QR 부착표</title><style>${BASE_CSS}${tableCSS}</style></head><body>${table}</body></html>`;

  // ── ② 인쇄용 QR 그리드 ────────────────────────────
  // 공개 순서(게임 진행 단계) — 인쇄시트를 단계 → 인물 순으로 묶는다.
  const phaseOf = (c) => {
    if (c.type === '특수' && c.award) return 4;  // 운영자 휴대 — 조건부 공개 카드
    if (c.reveal === '시작브리핑') return 0;  // 시작 세트 — 인물 무관하게 시작 단계로
    if (OPERATOR_QR[c.code]) return OPERATOR_QR[c.code].phase;  // 부검: 1차=시작, 2차=중간점검
    if (c.person === '공용') return 0;     // 시작/상시 (게임 설명서)
    if (c.person === '목사') return 2;     // 중간 점검: 목사님 방(현장) 개방
    if (c.phone) return 3;                 // 2부: 용의자 핸드폰
    return 1;                              // 1부: 용의자 소지품·진술·신체
  };
  const PHASES = [
    { n: 0, label: '시작 · 상시 — 브리핑 / 게임 설명' },
    { n: 1, label: '1부 — 용의자 소지품 · 진술 · 현장 흔적 (핸드폰 금지)' },
    { n: 2, label: '중간 점검 — 목사님 방(현장) 개방' },
    { n: 3, label: '2부 — 용의자 핸드폰 공개' },
    { n: 4, label: '운영자 휴대 — 조건부 공개 카드 (조건 충족 시 제시)' },
  ];

  const gridCSS = `
*{box-sizing:border-box}
body{font-family:'Malgun Gothic',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;margin:0}
@page{margin:10mm}
.gtitle{font-size:13pt;font-weight:800;margin:0 0 4px}
.gsub{font-size:8.5pt;color:#666;margin-bottom:12px}
.phase{background:#0f0e0c;color:#fff;font-size:11pt;font-weight:800;padding:8px 14px;border-radius:7px;margin:16px 0 8px}
.phase.pb{break-before:page;page-break-before:always}
.phase .phase-n{float:right;font-size:9pt;font-weight:600;color:#c9a84c}
.prow{font-size:9pt;font-weight:800;margin:8px 0 5px;padding-left:4px;border-left:3px solid #ccc}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.qcell{border:1px dashed #bbb;border-radius:6px;padding:8px 6px;text-align:center;page-break-inside:avoid}
.qcell svg{width:100%;height:auto;max-width:120px}
.qcode{font-family:Consolas,monospace;font-weight:700;font-size:8.5pt;margin-top:4px}
.qname{font-size:7.5pt;color:#444;line-height:1.3;margin-top:2px;min-height:2.2em}
.qsub{font-size:6.5pt;color:#999;margin-top:1px}
.accessbox{display:flex;align-items:center;gap:18px;border:2px solid #0f0e0c;border-radius:10px;padding:14px 18px;margin:6px 0 16px;background:#faf8f2}
.accessbox .qbig{width:120px;flex:0 0 120px}
.accessbox .qbig svg{width:120px;height:120px;display:block}
.accessbox .acc-t{font-size:13pt;font-weight:800;color:#0f0e0c}
.accessbox .acc-u{font-family:Consolas,monospace;font-size:11pt;font-weight:700;color:#7a5a00;margin:3px 0 6px}
.accessbox .acc-d{font-size:8.5pt;color:#555;line-height:1.4}
`;
  const cell = (c) => `<div class="qcell">${qrSvg[c.code]}<div class="qcode">${esc(c.code)}</div><div class="qname">${esc(c.title)}</div><div class="qsub">${esc(c.person)} · ${esc(c.sub)}</div></div>`;

  let body = '';
  let firstPhase = true;
  for (const ph of PHASES) {
    const inPhase = qrClues.filter((c) => phaseOf(c) === ph.n);
    if (!inPhase.length) continue;
    body += `<div class="phase${firstPhase ? '' : ' pb'}">${esc(ph.label)}<span class="phase-n">${inPhase.length}개</span></div>`;
    firstPhase = false;
    for (const p of PERSON_ORDER) {
      const list = inPhase.filter((c) => c.person === p);
      if (!list.length) continue;
      body += `<div class="prow" style="border-color:${PERSON_COLOR[p] || '#ccc'};color:${PERSON_COLOR[p] || '#333'}">${esc(p)} · ${list.length}개</div>`;
      body += `<div class="grid">${list.map(cell).join('')}</div>`;
    }
  }
  const gridHtml = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>QR 인쇄 시트</title><style>${gridCSS}</style></head><body>
<div class="gtitle">인쇄용 QR 시트 — ${qrClues.length}개 (공개 순서 → 인물별)</div>
<div class="gsub">공개 단계별로 모아 두었습니다. 점선대로 잘라 해당 물건/위치에 붙이세요. 스캔하면 코드가 앱에 입력됩니다.</div>
<div class="accessbox">
  <div class="qbig">${siteQrSvg}</div>
  <div>
    <div class="acc-t">게임 접속 QR — 가장 먼저 안내</div>
    <div class="acc-u">${esc(siteUrlText)}</div>
    <div class="acc-d">참가자 휴대폰으로 이 QR을 스캔하면 게임 사이트가 열립니다. 단서 QR과 달리 <b>코드가 아니라 사이트 주소</b>가 들어 있습니다. 입구·각 테이블에 크게 비치하세요.</div>
  </div>
</div>
${body}</body></html>`;

  return [
    { filename: 'QR_부착표.html', html: tableHtml },
    { filename: 'QR_인쇄시트.html', html: gridHtml },
  ];
}
