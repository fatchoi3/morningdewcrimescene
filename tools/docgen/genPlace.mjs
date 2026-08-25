// 단서배치 & 귀속 가이드 — 전부 gameData.js에서 자동 파생.
// 인물별 단서표 · 특수단서 조합표 · CCTV 귀속 매핑 · 일정표 · 방 배치도 · 체크리스트.
import {
  allClues, cluesOf, titleOf, evidenceMap,
  PERSON_ORDER, PERSON_COLOR, PERSON_BG, buildUnlockReverseIndex,
} from './loadData.mjs';
import { BASE_CSS } from './styles.mjs';
import { esc, renderSchedule, renderCctv } from './render.mjs';
import { MOVEMENT } from './movement.mjs';

const PLACE_CSS = `
.head{background:#0f0e0c;color:#e8e4dc;padding:24px 28px;border-radius:12px;margin-bottom:14px}
.head .ht{font-size:8pt;letter-spacing:.22em;color:#9c9a92;text-transform:uppercase;margin-bottom:8px}
.head .h1{font-size:20pt;font-weight:800;line-height:1.25}
.head .hs{font-size:9.5pt;color:#9c9a92;margin-top:8px}
.ch{font-size:14pt;font-weight:800;border-bottom:2px solid #1a1a1a;padding-bottom:6px;margin:24px 0 12px}
.pill{display:inline-block;color:#fff;border-radius:6px;padding:1px 9px;font-size:9pt;font-weight:800}
.co{font-family:Consolas,monospace;font-weight:700;font-size:8pt;white-space:nowrap}
.tip{background:#f0f8ff;border:1px solid #b3d9ff;border-radius:8px;padding:10px 14px;margin:8px 0;font-size:8.5pt;color:#0C447C}
.warn{background:#fff5f5;border:1px solid #ffcccc;border-radius:8px;padding:10px 14px;margin:8px 0;font-size:8.5pt;color:#791F1F}
.stat{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0}
.stat .s{background:#f4f1e8;border:1px solid #e2d9bf;border-radius:8px;padding:8px 14px;font-size:9pt}
.stat .s b{font-size:13pt;color:#7a5a00}
.combo-from{font-size:8pt;color:#555}
.chk{background:#f8f7f4;border:1px solid #e0ddd6;border-radius:10px;padding:14px 18px;font-size:9pt;line-height:2.05}
table.mv td{font-size:8.5pt}
table.mv .mvr.tgrp td{border-top:2px solid #cfc8ba}
table.mv .mvc{color:#555;line-height:1.45}
/* 방 배치도 */
.floor{width:100%;max-width:520px;margin:8px auto;display:block}
.floor rect.room{fill:#f3f1ec;stroke:#cfc8ba;stroke-width:1.5}
.floor rect.victim{fill:#fdeaea;stroke:#c98}
.floor rect.hall{fill:#eef1f5;stroke:#cfd6df;stroke-width:1}
.floor text{font-family:'Malgun Gothic',sans-serif;font-size:11px;fill:#333;text-anchor:middle;font-weight:700}
.floor .cam{font-size:9px;fill:#a06ec8}
`;

function personPill(p) {
  return `<span class="pill" style="background:${PERSON_COLOR[p] || '#666'}">${esc(p)}</span>`;
}
function typeMark(t) {
  if (t === '특수') return '<span class="badge b-sp">특수</span>';
  if (t === '일반') return '<span class="badge b-gn">일반</span>';
  return '';
}

// 인물별 단서 배치표
function personTable(person) {
  const clues = cluesOf(person).filter((c) => (c.title && c.title.trim()) || (c.detail && c.detail.trim()));
  if (!clues.length) return '';
  const rows = clues.map((c) => {
    const carrier = c.phone ? '📱핸드폰' : c.pages ? '📖페이지물' : c.wallet ? '👛지갑'
      : c.schedule ? '🗓️일정표' : c.cctv ? '📹CCTV' : '';
    const combo = (c.type === '특수' && c.unlockedBy?.length)
      ? `<div class="combo-from">← ${c.unlockedBy.map((x) => esc(x)).join(' + ')}</div>` : '';
    const tap = c.tapReveal ? `<div class="combo-from">👆${c.tapReveal.taps}회 탭 히든</div>` : '';
    return `<tr><td class="co">${esc(c.code)}</td><td><b>${esc(c.title) || '(미작성)'}</b>${typeMark(c.type)} ${carrier}${combo}${tap}</td><td>${esc(c.detail)}</td></tr>`;
  }).join('');
  return `<div class="ch">${personPill(person)} <span style="font-size:10pt;color:#888">${clues.length}개</span></div>` +
    `<table><tr><th style="width:70px">코드</th><th style="width:42%">단서</th><th>내용</th></tr>${rows}</table>`;
}

// 특수단서 조합 마스터표
function comboTable() {
  const specials = allClues.filter((c) => c.type === '특수' && c.unlockedBy?.length);
  if (!specials.length) return '';
  const rows = specials.map((c) =>
    `<tr><td class="co">${esc(c.code)}</td><td><b>${esc(c.title) || '(미작성)'}</b></td>` +
    `<td>${c.unlockedBy.map((x) => `<code>${esc(x)}</code> ${esc(titleOf(x))}`).join('<br>')}</td></tr>`).join('');
  return `<table><tr><th style="width:70px">해금 특수단서</th><th style="width:30%">제목</th><th>필요 선행 단서 (모두 수집 시 자동 해금)</th></tr>${rows}</table>`;
}

// 운영자 수동 부여(조건부) 특수단서 — 자동 해금 아님(unlockedBy 비움) + award(부여 조건) 보유
function manualTable() {
  const manual = allClues.filter((c) => c.type === '특수' && !(c.unlockedBy?.length) && !(c.unlockedByAny?.length) && c.award);
  if (!manual.length) return '';
  const rows = manual.map((c) =>
    `<tr><td class="co">${esc(c.code)}</td><td><b>${esc(c.title) || '(미작성)'}</b></td><td>${esc(c.award)}</td></tr>`).join('');
  return `<table><tr><th style="width:70px">코드</th><th style="width:26%">제목</th><th>부여 조건 (운영자 판단 · 자동 해금 아님)</th></tr>${rows}</table>`;
}

// 시작 공개 세트 — reveal:'시작브리핑' 단서를 한 묶음으로
function startSetTable() {
  const set = allClues.filter((c) => c.reveal === '시작브리핑');
  if (!set.length) return '';
  const rows = set.map((c) =>
    `<tr><td class="co">${esc(c.code)}</td><td><b>${esc(c.title) || '(미작성)'}</b></td><td>${esc(c.person)}</td></tr>`).join('');
  return `<table><tr><th style="width:70px">코드</th><th style="width:34%">제목</th><th>귀속</th></tr>${rows}</table>`;
}

// 방 배치도 (CctvModal FloorPlan 기준)
function floorPlan() {
  return `<svg class="floor" viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg">
  <polygon points="47,141 342,122 342,160" fill="rgba(165,110,200,0.16)" stroke="rgba(180,130,210,0.55)" stroke-width="1"/>
  <line x1="342" y1="92" x2="342" y2="258" stroke="#a9b3c0" stroke-width="2"/>
  <text x="356" y="200" class="cam" transform="rotate(90 356 200)">1층 가는 길</text>
  <rect class="room" x="55" y="45" width="95" height="70" rx="3"/>
  <rect class="room" x="150" y="45" width="95" height="70" rx="3"/>
  <rect class="room" x="245" y="45" width="90" height="70" rx="3"/>
  <rect class="room victim" x="335" y="12" width="63" height="80" rx="3"/>
  <rect class="room" x="55" y="172" width="95" height="73" rx="3"/>
  <rect class="room" x="150" y="172" width="95" height="73" rx="3"/>
  <rect class="room" x="245" y="172" width="90" height="73" rx="3"/>
  <rect class="hall" x="55" y="122" width="287" height="38"/>
  <text x="102" y="84">한다영</text><text x="197" y="84">한소미</text><text x="290" y="84">서지안</text>
  <text x="366" y="55">목사님</text>
  <text x="102" y="212">최종현</text><text x="197" y="212">문세린</text><text x="290" y="212">강지후</text>
  <circle cx="47" cy="141" r="9" fill="#11151c" stroke="#888" stroke-width="2"/>
  <text x="47" y="164" class="cam">CCTV</text>
  <text x="198" y="146" style="fill:#8a98aa;font-size:10px">복도 (CCTV 촬영)</text>
</svg>
<div class="tip">복도는 CCTV에 잡히지만 <b>목사님 방 내부에는 CCTV가 없습니다.</b> 방 배치는 앱의 CCTV 평면도와 동일합니다.</div>`;
}

// 전체 동선 타임라인 (시간순). 동선 위주 + CCTV 포착 여부.
function cctvFmt(s) {
  return esc(s)
    .replace(/✓/g, '<span style="color:#1a7a3a;font-weight:800">✓</span>')
    .replace(/사각/g, '<b style="color:#A32D2D">사각</b>')
    .replace(/(CCTV 단서 없음|부각되지 않음)/g, '<b style="color:#9a5b00">$1</b>');
}
function movementTable() {
  let prev = null;
  const rows = MOVEMENT.map((m) => {
    const grp = m.time !== prev ? ' tgrp' : '';
    prev = m.time;
    return `<tr class="mvr${grp}"><td class="nowrap">${grp ? esc(m.time) : ''}</td>` +
      `<td>${personPill(m.person)}</td><td>${esc(m.route)}</td><td class="mvc">${cctvFmt(m.cctv)}</td></tr>`;
  }).join('');
  return `<table class="mv"><tr><th style="width:78px">시각</th><th style="width:60px">인물</th><th style="width:34%">동선</th><th>CCTV 포착</th></tr>${rows}</table>`;
}

export function genPlaceGuide() {
  const total = allClues.length;
  const byType = (t) => allClues.filter((c) => c.type === t).length;
  const phones = allClues.filter((c) => c.phone);
  const pages = allClues.filter((c) => c.pages);
  const wallets = allClues.filter((c) => c.wallet);

  const cctv = evidenceMap['SIAH-72'];
  const sched = evidenceMap['HQIR-26'];

  const body = `
<div class="head">
  <div class="ht">Crime Scene · Operations Supplement</div>
  <div class="h1">단서 배치 & 귀속 가이드</div>
  <div class="hs">현재 evidenceMap(정본)에서 자동 생성 · 총 ${total}개 단서 · 운영자 전용</div>
</div>

<div class="ch">0. 단서 현황</div>
<div class="stat">
  <div class="s"><b>${total}</b> 전체 단서</div>
  <div class="s"><b>${byType('보통')}</b> 보통</div>
  <div class="s"><b>${byType('특수')}</b> 특수</div>
  <div class="s"><b>${byType('일반')}</b> 일반</div>
  <div class="s"><b>${phones.length}</b> 핸드폰</div>
  <div class="s"><b>${pages.length}</b> 페이지물</div>
  <div class="s"><b>${wallets.length}</b> 지갑</div>
</div>
<div class="tip"><b>귀속 방식</b> — 모든 단서는 <code>person</code> 필드로 인물에 귀속됩니다(서지안·한다영·한소미·최종현·강지후·문세린·목사·공용). 현장(목사 방)·CCTV·증언 단서는 person="목사" 또는 "공용"으로 분류되며, 내용·연계로 용의자를 가리킵니다.</div>

<div class="ch">1. 방 배치도</div>
${floorPlan()}

<div class="ch pb">1-2. 시작 공개 세트 (브리핑 동시 공개)</div>
<div class="tip">게임 시작 브리핑에서 아래 단서를 <b>한 묶음으로 공개</b>합니다(코드 일괄 배포 또는 QR 게시). 인쇄용 QR 시트의 "시작·상시" 단계에 함께 모여 있습니다.</div>
${startSetTable()}

<div class="ch pb">2. 인물별 단서 배치표</div>
${PERSON_ORDER.map(personTable).join('')}

<div class="ch pb">3. 특수단서 조합표 (자동 해금)</div>
<div class="tip">아래 특수단서는 <b>필요 선행 단서를 모두 수집하면 앱에서 자동 해금</b>됩니다(App.jsx). 선행 단서를 손에 넣게 배치하는 것이 운영의 핵심입니다.</div>
${comboTable()}

<div class="ch pb">3-2. 운영자 수동 부여 특수단서 (조건부)</div>
<div class="warn"><b>자동 해금이 아닙니다.</b> 아래 단서는 참가자가 조건을 충족했을 때 <b>운영자가 코드를 직접 부여</b>합니다. 조건이 맞기 전엔 주지 마세요. (QR 인쇄 불필요)</div>
${manualTable()}

<div class="ch pb">4. CCTV 귀속 매핑 <code>SIAH-72</code></div>
<div class="tip">CCTV 열람대에서 화면 속 인물을 누르면 해당 용의자의 CCTV 단서가 확보됩니다. 목사님 방 내부는 잡히지 않습니다.</div>
${renderCctv(cctv?.cctv, titleOf)}

<div class="ch pb">5. 목사님 일정표 <code>HQIR-26</code></div>
${renderSchedule(sched?.schedule)}

<div class="ch pb">6. 전체 동선 타임라인 (시간순)</div>
<div class="warn"><b>핵심 원칙 — 목사방 진입은 CCTV로 특정 불가</b><br>복도 CCTV는 인물이 <b>목사님 방 쪽으로 향하는 것까지만</b> 잡는다. 방 문은 사각이라 <b>누가 실제로 방 안에 들어갔는지는 어떤 CCTV로도 확인되지 않는다.</b> 서지안·문세린 모두 "방 쪽으로 갔다"까지만 찍혔고, 진입 여부는 진술·물증으로만 좁혀진다.</div>
${movementTable()}
<div class="tip">동선 위주 요약입니다. 각 인물의 구체적 행위·동기는 배우 시트와 진상해설서를 참조하세요.</div>

<div class="ch pb">7. 설치 체크리스트</div>
<div class="chk">
☐ <b>시작 브리핑 때 시작 공개 세트 일괄 공개</b> — ${allClues.filter((c) => c.reveal === '시작브리핑').map((c) => `<code>${esc(c.code)}</code>`).join(' · ')} (1-2 표 참조). 코드 배포 또는 QR 게시로 게임 시작과 동시에 공개한다.<br>
☐ <b>QR 인쇄·부착</b> — 전체 ${total}개 단서 중 빈 슬롯(제목·내용 미작성) 제외분<br>
☐ <b>특수단서 ${byType('특수')}개</b>는 QR 부착 불필요 — 대부분 선행 단서 수집 시 앱이 자동 해금<br>
☐ <b>조건부 수동부여 특수단서</b>(3-2 표)는 자동 해금 아님 — 조건 충족 시 운영자가 코드 직접 부여<br>
☐ <b>핸드폰 단서 ${phones.length}개</b>는 2부 해금 (1부 핸드폰 금지)<br>
☐ 실물 소품: 보충제 통 2개(라벨 인쇄) · 베개 · 텀블러(액체·흰가루) · 쉐이크 통 · 약통류(설하정·작은약통·요일별약통) · 회계장부 · 잠긴 다이어리 2권 · 지갑(딸 사진)<br>
☐ 목사님 방(D) 통제선 + "2부 개방" 안내문<br>
☐ 예배당 증거대: 목사님 일정표 + 목사 핸드폰(톡서랍 비번 0419)<br>
☐ CCTV 태블릿: ${cctv?.cctv?.timeline?.length || 0}개 시간대 · 총 ${(cctv?.cctv?.timeline || []).reduce((n, t) => n + (t.people?.length || 0), 0)}개 인물컷 장면 준비<br>
☐ 톡서랍 비번: 목사 0419 · 한다영 0302(언니 생일) · 한소미 0815(동생 생일)
</div>
<div class="warn"><b>운영 주의</b> — 자매(한다영·한소미) 폰 톡서랍은 상대 생일로 교차 잠겨 있어, 한쪽 폰을 열려면 상대의 다이어리(생일)를 먼저 읽어야 합니다. 이 교차 구조가 자매 관계를 드러내는 장치입니다.</div>

<div class="ch pb">8. 운영자 전용 코드 & 감식 비번</div>
<div class="warn"><b>⚠ 운영자 전용 — 참가자에게 노출 금지.</b></div>
<table><tr><th style="width:180px">용도</th><th>코드 / 비밀번호</th></tr>
<tr><td><b>운영자(테스트) 모드 진입</b></td><td>코드 입력란에 <code>ADMIN-OPEN</code> → 인물별 단서 일괄 획득 버튼 표시 + 감식 비번 자동 해제</td></tr>
<tr><td><b>운영자 모드 복귀</b></td><td>코드 입력란에 <code>ADMIN-CLOSE</code> 입력 또는 [초기화] 버튼</td></tr>
${allClues.filter((c) => c.type === '감식' && c.password).map((c) =>
  `<tr><td>감식 비번 — <code>${esc(c.code)}</code> ${esc(c.title)}</td><td><code>${esc(c.password)}</code></td></tr>`).join('')}
</table>
<div class="tip">감식 단서는 앱에서 열어도 결과가 가려져 있고, 위 비밀번호를 입력해야 결과가 공개됩니다(운영자 모드 ON이면 자동 공개). 진행자만 비번을 알고, 적절한 시점에 참가자에게 알려주세요.</div>
`;

  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>단서배치 & 귀속 가이드</title><style>${BASE_CSS}${PLACE_CSS}</style></head><body>${body}</body></html>`;
  return { filename: '단서배치_귀속가이드.html', html };
}
