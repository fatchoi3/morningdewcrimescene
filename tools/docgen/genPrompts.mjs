// AI 이미지 생성 프롬프트 문서 — gameData(정본)에서 직접 파생한다.
// "이미지가 필요한 물질/문서 단서"를 자동 선별해 현재 제목·내용으로 프롬프트를 합성하므로
// 데이터가 바뀌어도 항상 동기화된다(구 코드 하드코딩 방식 폐기 → 드리프트 없음).
import { allClues, PERSON_ORDER, PERSON_COLOR } from './loadData.mjs';
import { cctvClueCodes } from '../../src/data/gameData.js';
import { esc } from './render.mjs';

const SUFFIX = 'isolated on a pure black background, no watermark, photorealistic, cinematic lighting, high contrast, single dramatic spotlight, 1:1 square crop, dark moody atmosphere, all text and writing in Korean hangul script';
const SUFFIX_MJ = '--ar 1:1 --style raw --v 6';

const cctvSet = new Set(cctvClueCodes);
const isStruct = (c) => c.cctv || c.phone || c.pages || c.wallet || c.schedule || c.handwriting;
const NOISE = /옷가지|성경책|파우치/;                 // 일상 소지품 노이즈(이미지 불필요)
const DOCRE = /진단서|처방전|장부|기록|진술|편지|수첩|연락망|제안서|독촉장|소견|성분|분석|감식|타임라인|확인|예방접종|영수증/;
const ALLOW_SPECIAL = new Set(['LONS-62']); // 2차 부검 소견(특수)도 문서 이미지로 포함 (1차는 BRIF-00 묶음)

// 이미지 프롬프트를 만들 단서인가?
function included(c) {
  if (!(c.title || '').trim()) return false;          // 빈 슬롯
  if (isStruct(c)) return false;                       // 핸드폰·다이어리·CCTV·지갑·일정표·필적(앱 렌더)
  if (cctvSet.has(c.code)) return false;               // CCTV 동선 단서(앱 평면도)
  if (NOISE.test(c.title)) return false;               // 옷가지·성경책·파우치 노이즈
  if (c.type === '보통' || c.type === '감식') return true;
  if (ALLOW_SPECIAL.has(c.code)) return true;          // 부검 특수
  return false;                                        // 길잡이 특수·일반 제외
}

const kindOf = (c) => (DOCRE.test((c.title || '') + (c.detail || '')) ? 'doc' : 'obj');
const firstSentence = (s) => {
  const t = (s || '').replace(/\s+/g, ' ').split(/[.。!?]/)[0].trim();
  return t.length > 64 ? t.slice(0, 64) + '…' : t;
};

const DOC_BASE = 'forensic evidence photograph, a document/paper laid flat on a dark surface, clinical overhead lighting, soft shadow, investigation-board aesthetic';
const OBJ_BASE = 'forensic evidence photograph, the item isolated on a pure black surface, an evidence number marker beside it, macro close-up, dramatic single-side spotlight, deep shadows';

function compose(c) {
  const kind = kindOf(c);
  const hint = firstSentence(c.detail) ? `, 내용 요지: "${firstSentence(c.detail)}"` : '';
  if (kind === 'doc') {
    return `${DOC_BASE}, the document has a large bold Korean title at the top reading "${c.title}"${hint}, all body text in Korean hangul`;
  }
  return `${OBJ_BASE}, subject: "${c.title}" (${c.person}의 단서)${hint}, Korean hangul text on any visible labels or evidence tags`;
}

export function genPrompts() {
  const entries = allClues.filter(included).map((c) => ({
    code: c.code, person: c.person, title: c.title, kind: kindOf(c), prompt: compose(c),
  }));

  const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0908;font-family:'Noto Sans KR','Malgun Gothic',sans-serif;color:#e8e4dc;-webkit-print-color-adjust:exact;print-color-adjust:exact}
/* @page 에 여백을 주면 브라우저가 그 자리에 날짜·제목·주소·쪽번호를 찍는다. 여백은 본문이 든다. */
@page{margin:0}
body{padding:7mm 12mm}
.grp{padding-top:12mm}
.cover{padding:50px 44px}
.ct{font-size:8pt;letter-spacing:.22em;color:#7a7976;text-transform:uppercase;margin-bottom:14px}
.h1{font-size:24pt;font-weight:800;margin-bottom:8px}
.h2{font-size:11pt;color:#9c9a92;margin-bottom:20px}
.bar{width:48px;height:2px;background:#c9a84c;margin-bottom:18px}
.how{background:#141210;border:1px solid #2a2620;border-radius:8px;padding:16px;font-size:9pt;color:#9c9a92;line-height:2}
.how code{background:#1a1816;border:1px solid #2a2620;border-radius:3px;padding:1px 5px;font-family:Consolas,monospace;font-size:8pt;color:#c9a84c}
.grp{page-break-before:always;padding:14px}
.gh{font-size:14pt;font-weight:800;padding:8px 12px;border-radius:8px;margin-bottom:12px}
.card{background:#0f0e0c;border:1px solid #211f1b;border-radius:8px;padding:12px 14px;margin-bottom:10px;page-break-inside:avoid}
.chead{display:flex;align-items:baseline;gap:8px;margin-bottom:6px;flex-wrap:wrap}
.code{font-family:Consolas,monospace;font-weight:700;font-size:9pt}
.kind{font-size:7pt;color:#6a6450;border:1px solid #2a2620;border-radius:8px;padding:0 6px}
.cname{font-size:9pt;color:#cfc8b8}
.pbox{background:#000;border-radius:6px;padding:9px 11px;font-family:Consolas,monospace;font-size:7.5pt;line-height:1.7;color:#bcd6bc;word-break:break-word}
.sfx{margin-top:8px;font-family:Consolas,monospace;font-size:7pt;color:#6a6450;line-height:1.7}
.mj{color:#c9a84c}
`;
  const cover = `
<div class="cover">
  <div class="ct">Crime Scene · 단서 이미지 생성 프롬프트 · 운영자 전용</div>
  <div class="h1">단서 이미지 생성 프롬프트</div>
  <div class="h2">gameData(정본)에서 자동 생성 · 총 ${entries.length}개 · Midjourney / DALL·E / Stable Diffusion용</div>
  <div class="bar"></div>
  <div class="how">
    <b style="color:#c9a84c">사용 방법</b><br>
    1. 각 카드의 프롬프트를 복사<br>
    2. 끝에 공통 접미사를 붙임 (카드마다 표기)<br>
    3. Midjourney: 접미사 뒤에 <code>${SUFFIX_MJ}</code> 추가 · DALL·E 3: 그대로 1024×1024<br>
    · 모든 문서·라벨 텍스트가 한국어(한글)로 표시되도록 지시됨<br>
    · 핸드폰·다이어리·CCTV·지갑·필적 단서와 옷가지·성경책 등 노이즈, 길잡이 특수는 제외(앱에서 표시되거나 이미지 불필요)
  </div>
</div>`;

  const groups = PERSON_ORDER.map((owner) => {
    const list = entries.filter((e) => e.person === owner);
    if (!list.length) return '';
    const col = PERSON_COLOR[owner] || '#c9a84c';
    const cards = list.map((e) => `
      <div class="card">
        <div class="chead">
          <span class="code" style="color:${col}">${esc(e.code)}</span>
          <span class="kind">${e.kind === 'doc' ? '문서' : '물체'}</span>
          <span class="cname">${esc(e.title)}</span>
        </div>
        <div class="pbox">${esc(e.prompt)}</div>
        <div class="sfx">+ 접미사: ${esc(SUFFIX)}<br><span class="mj">Midjourney: ${esc(SUFFIX_MJ)}</span></div>
      </div>`).join('');
    return `<div class="grp"><div class="gh" style="background:${col}22;color:${col};border:1px solid ${col}55">${esc(owner)} · ${list.length}개</div>${cards}</div>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>이미지 생성 프롬프트</title><style>${css}</style></head><body>${cover}${groups}</body></html>`;
  return { filename: '이미지생성프롬프트.html', html };
}
