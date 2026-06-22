// AI 이미지 생성 프롬프트 문서. 구버전 프롬프트 데이터를 신 코드로 매핑.
// kind(doc/obj/phone/cctv)에 따라 한국어 텍스트 지시를 합성한다.
import { toNew } from './codemap.mjs';
import { evidenceMap, titleOf, PERSON_COLOR } from './loadData.mjs';
import { esc } from './render.mjs';

const SUFFIX = 'isolated object on pure black background, no watermark, photorealistic, cinematic lighting, high contrast, single dramatic spotlight, 1:1 square crop, dark moody atmosphere, all text and writing in Korean hangul script';
const SUFFIX_MJ = '--ar 1:1 --style raw --v 6';

function compose(kind, base, title) {
  if (kind === 'doc') return `${base}, the document has a large bold Korean title at the top reading "${title}", all body text in Korean hangul`;
  if (kind === 'phone') return `${base}, Korean hangul text on screen, KakaoTalk or browser UI in Korean, all text in Korean hangul`;
  if (kind === 'cctv') return `${base}, Korean timestamp overlay, all UI text in Korean hangul`;
  return `${base}, Korean hangul text on any visible labels or evidence tags`; // obj
}

// [구코드, 표시명, 소유, kind, base, 한국어제목]
const RAW = [
  ['AZPL-94', '청소 봉사 기록', '박희원', 'doc', 'forensic evidence photograph, handwritten sign-up sheet on a clipboard, pen resting on paper, black background, single overhead spotlight, deep shadows, crime scene documentation, close-up, muted warm tones, high contrast', '청소 봉사 기록'],
  ['WUQZ-78', '설하정 약통 (이상)', '박희원', 'obj', 'forensic evidence photograph, small amber pill bottle on black surface, yellow round pills inside with no engravings, evidence ruler beside it, harsh directional light, macro lens close-up, dark moody', '설하정 약통'],
  ['BRZD-12', '정품 알약 발견', '박희원', 'obj', 'forensic evidence photograph, white nitroglycerin tablets arranged on black velvet, evidence numbered marker beside them, macro close-up, cold forensic lighting', '정품 알약 발견'],
  ['DSHM-31', '협심증 진단서', '박희원', 'doc', 'forensic evidence photograph, official medical diagnosis document on black surface, clinical text, spot lighting, dark moody, high contrast', '협심증 진단서'],
  ['LZWX-93', '면담 기록', '박희원', 'doc', 'forensic evidence photograph, paper schedule or planner page on dark surface, one appointment circled in red pen, handwritten notes, harsh overhead light', '전도사 자격 면담 기록'],
  ['LVRY-41', '핸드폰 (박희원)', '박희원', 'obj', 'forensic evidence photograph, smartphone face-down on black surface, slight scuff marks, evidence bag nearby, side rim lighting, deep shadow', '핸드폰'],
  ['KDGY-11', '열린 핸드폰 — 검색 기록', '박희원', 'phone', 'forensic evidence photograph, smartphone screen lit up showing browser search history with suspicious medical search terms about asphyxiation detection, dark room, screen glow only light source', '검색 기록'],
  ['WCFG-46', '복도 배회 CCTV', '박희원', 'cctv', 'forensic evidence photograph, grainy CCTV still frame printed on paper, corridor scene with figure pausing near a door, low resolution monochrome security camera footage, pinned to investigation board with red circle', '복도 배회 CCTV'],
  ['PLWX-33', '베개 위치 이상', '박희원', 'obj', 'forensic evidence photograph, white pillow lying on dark wooden floor beside a bed, circular red forensic marker highlighting fabric pressure marks, single overhead light, haunting stillness', '베개 위치'],
  ['WNDW-91', '문 유리창', '박희원', 'obj', 'forensic evidence photograph, small rectangular glass window inset in a door, dark hallway visible through glass, fingerprint smudge on glass, dramatic side light, deep shadow', '문 유리창'],
  ['LHSC-06', '협심증 처방전', '박희원', 'doc', 'forensic evidence photograph, medical prescription paper for angina medication on black surface, pill packaging beside it, clinical cold lighting', '협심증 처방전'],
  ['PGZT-09', '카톡 부탁 메시지', '박희원', 'phone', 'forensic evidence photograph, smartphone showing KakaoTalk messaging app with a conversation requesting to purchase medication, dark background, screen glow the only light', '카톡 메시지'],
  ['ACNJ-83', '수료증 위조 확정', '박희원', 'doc', 'forensic evidence photograph, two certificates side by side on black surface, authentication seal clearly different between the two, document fraud investigation style', '수료증 위조 확정'],
  ['JQOO-57', '약병 교체 타임라인', '박희원', 'doc', 'forensic evidence photograph, handwritten timeline chart on paper with arrows connecting time events, paper on dark surface, investigation board aesthetic, single spotlight', '약병 교체 타임라인'],
  ['QAWG-10', '복도 진입 시각 확인', '박희원', 'cctv', 'forensic evidence photograph, CCTV printout showing timestamp 14:42, corridor with a figure entering a door, low resolution monochrome, printed on matte paper', '복도 진입 시각'],

  ['YUQO-48', 'CCTV 캡처 12:20', '이사랑', 'cctv', 'forensic evidence photograph, CCTV still frame printed on paper showing a young woman walking toward a room door, timestamp 12:20 visible, grainy monochrome, red circle marking', 'CCTV 캡처 12:20'],
  ['SESE-63', '청년부 회계 장부', '이사랑', 'doc', 'forensic evidence photograph, open accounting ledger book on dark surface, one line item circled in red pen, official treasurer stamp visible, cold forensic overhead light', '청년부 회계 장부'],
  ['MPAH-32', '파우치 흰 가루', '이사랑', 'obj', 'forensic evidence photograph, small cosmetic pouch open on black surface, white powder residue visible on the fabric interior, forensic evidence swab beside it, macro close-up, cold bright forensic light', '파우치 흰 가루'],
  ['YBBU-45', '전날 면담 기록', '이사랑', 'doc', 'forensic evidence photograph, church schedule paper on dark surface, one appointment entry circled in red, soft shadow, documentary evidence style', '전날 면담 기록'],
  ['PECG-06', '핸드폰 (이사랑)', '이사랑', 'obj', 'forensic evidence photograph, smartphone face up on black surface, screen off, evidence numbered tag attached, side rim lighting', '핸드폰'],
  ['PQSH-34', '열린 핸드폰 — 요힘빈 검색', '이사랑', 'phone', 'forensic evidence photograph, smartphone screen showing browser search results about yohimbine cardiac side effects, screen glow in dark room', '요힘빈 검색'],
  ['VHBT-17', '오후 배회 CCTV', '이사랑', 'cctv', 'forensic evidence photograph, CCTV still frame printout showing a woman repeatedly checking her phone while pacing in a corridor, timestamp 13:10, grainy monochrome', '오후 배회 CCTV'],
  ['ZTHB-21', '잠긴 다이어리', '이사랑', 'obj', 'forensic evidence photograph, small personal diary with a tiny combination lock on the clasp, paper sticking out from the pages, dark surface, single overhead light, moody shadow', '잠긴 다이어리'],

  ['QZXY-18', '플라스틱 통 [단백질]', '최종현', 'obj', 'forensic evidence photograph, supplement container on black surface, paper label reading protein peeling at the corner revealing tape underneath, evidence marker pointing to peeling edge, dramatic side light, macro close-up', '단백질 통'],
  ['JZLM-98', '플라스틱 통 [요힘빈]', '최종현', 'obj', 'forensic evidence photograph, supplement container with label reattached crookedly, tape edges visible where label was swapped, black background, forensic evidence number marker', '요힘빈 통'],
  ['TPNJ-25', '쉐이크 통', '최종현', 'obj', 'forensic evidence photograph, single stainless steel shaker bottle on black surface, white powder residue inside, lid placed beside it, evidence tag attached, forensic lighting', '쉐이크 통'],
  ['LQKZ-03', '요힘빈 위험성 경고', '최종현', 'doc', 'forensic evidence photograph, handwritten warning note on paper with medical information about cardiac risks, underlined urgent phrases, dark background, single spotlight', '요힘빈 위험성 경고'],
  ['AOYY-73', '목격 진술서', '최종현', 'doc', 'forensic evidence photograph, witness statement form on paper, handwritten description of a distressed young man, dark surface, investigative document lighting', '목격 진술서'],
  ['WNEP-79', '음료 전달 목격 진술', '최종현', 'doc', 'forensic evidence photograph, witness statement form with handwritten testimony describing a young man handing a drink to an older man, key sentence underlined in red, dark background', '음료 전달 목격'],
  ['MMSY-80', '보충제 성분 분석 결과', '최종현', 'doc', 'forensic evidence photograph, laboratory analysis report on paper, test results showing yohimbine detected, chemical name highlighted in red, lab stamp and seal, clinical cold lighting', '보충제 성분 분석'],

  ['ELML-43', '졸피뎀 약통', '이현지', 'obj', 'forensic evidence photograph, prescription sleeping pill bottle on black surface, no prescription label, pills visible through translucent orange plastic, evidence marker, macro lens, cold forensic light', '졸피뎀 약통'],
  ['KBDD-44', '목사님 텀블러', '이현지', 'obj', 'forensic evidence photograph, stainless steel thermos tumbler on dark surface, liquid still inside, evidence seal tape across the lid, forensic marker beside it, dramatic side lighting', '목사님 텀블러'],
  ['HJFI-23', '열린 핸드폰 — 졸피뎀 검색', '이현지', 'phone', 'forensic evidence photograph, smartphone screen lit in dark room showing search history about dissolving sleeping pills in liquid and drug detection, screen glow only light source', '졸피뎀 검색'],
  ['HTBE-10', '카카오톡 (삭제 흔적)', '이현지', 'phone', 'forensic evidence photograph, smartphone showing messaging conversation with a visible gap where messages were deleted, red forensic annotation circle around the missing section, screen glow in darkness', '카카오톡 삭제 흔적'],
  ['PPSO-17', '텀블러 성분 감식 결과', '이현지', 'doc', 'forensic evidence photograph, lab analysis report showing zolpidem detected in liquid sample, small photograph of the tumbler attached, clinical lab lighting', '텀블러 성분 감식'],
  ['GIQA-02', '자매 관계 확인', '이현지', 'doc', 'forensic evidence photograph, two family registry documents side by side on dark surface, same family name highlighted, red connecting line between names, investigation board style', '자매 관계 확인'],

  ['LCSX-35', '언쟁 목격 진술서', '윤은재', 'doc', 'forensic evidence photograph, printed witness statement form on dark surface, handwritten description of loud argument and door slamming, one sentence underlined in red pen, cold overhead light', '언쟁 목격 진술'],
  ['UCGX-01', '반려된 기획안', '윤은재', 'doc', 'forensic evidence photograph, event planning proposal document with two large red REJECTED stamps on cover page, paper edges slightly crumpled, dark surface, single hard overhead light', '반려된 기획안'],
  ['MAKA-55', '옷깃 목격 진술서', '윤은재', 'doc', 'forensic evidence photograph, witness statement paper with handwritten account of grabbing a shirt collar, key phrase circled in red, dark investigative document style', '옷깃 목격 진술'],
  ['EISF-00', '수첩 메모', '윤은재', 'obj', 'forensic evidence photograph, small personal notebook open on dark surface, handwritten Korean note visible, red forensic circle around a phrase, evidence numbered tag, moody spotlight', '수첩 메모'],
  ['DRNK-21', '음료 미복용 진술서', '윤은재', 'doc', 'forensic evidence photograph, typed witness statement form on dark surface, key testimony paragraph highlighted about the victim not having consumed the beverage, documentary evidence photography', '음료 미복용 진술'],

  ['DSQO-10', '예방접종 수첩', '이가현', 'obj', 'forensic evidence photograph, child vaccination booklet on dark surface, guardian field handwritten, evidence number tag, single tight spotlight', '예방접종 수첩'],
  ['JKVN-96', '목사 폰 삭제 기록', '이가현', 'phone', 'forensic evidence photograph, smartphone screen showing photo gallery with deleted blank thumbnails, timestamp of deletion visible, red forensic annotation circles on deleted items', '폰 삭제 기록'],
  ['KVRU-70', '복구된 삭제 영상', '이가현', 'phone', 'forensic evidence photograph, tablet screen showing a recovered deleted file with RECOVERED FILE watermark, digital forensics interface, dark moody room', '복구된 기록'],
  ['QWRO-64', '신고 지연 10분', '이가현', 'doc', 'forensic evidence photograph, CCTV timeline printout on paper showing two timestamps with a 10-minute gap highlighted in red, investigation annotation arrows', '신고 지연 10분'],
  ['IIKU-90', '딸 사진', '이가현', 'obj', 'forensic evidence photograph, physical photograph of a young girl about 5 years old lying on dark surface as evidence, evidence number marker beside it, slight worn edges, dramatic single light', '딸 사진'],

  ['BGSU-22', '부검 1차 소견', '공용', 'doc', 'forensic evidence photograph, official autopsy preliminary report document on dark surface, medical terminology visible, one section marked with red question mark, clinical document forensic style, cold overhead lighting', '부검 1차 소견'],
  ['JSIK-99', '질식사 확정', '공용', 'doc', 'forensic evidence photograph, final autopsy report document with large red confirmation stamp on dark surface, dramatic overhead light, official medical document aesthetic', '질식사 확정'],
  ['MFRQ-48', '파우더 성분 감식 결과', '공용', 'doc', 'forensic evidence photograph, laboratory forensic analysis report confirming yohimbine compound in powder sample, chemical notation visible, small sample photo attached, clinical bright lab lighting', '파우더 성분 감식'],
];

export function genPrompts() {
  // 매핑 + 그룹화
  const entries = RAW.map(([oldc, name, owner, kind, base, ktitle]) => {
    const code = toNew(oldc);
    const exists = !!evidenceMap[code];
    return { oldc, code, exists, name, owner, kind, prompt: compose(kind, base, ktitle), ktitle, curTitle: exists ? titleOf(code) : '' };
  });
  const missing = entries.filter((e) => !e.exists);
  const owners = ['박희원', '이사랑', '이현지', '최종현', '윤은재', '이가현', '공용'];

  const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0908;font-family:'Malgun Gothic',sans-serif;color:#e8e4dc;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{margin:12mm}
.cover{padding:50px 44px}
.ct{font-size:8pt;letter-spacing:.22em;color:#7a7976;text-transform:uppercase;margin-bottom:14px}
.h1{font-size:24pt;font-weight:800;margin-bottom:8px}
.h2{font-size:11pt;color:#9c9a92;margin-bottom:20px}
.bar{width:48px;height:2px;background:#c9a84c;margin-bottom:18px}
.how{background:#141210;border:1px solid #2a2620;border-radius:8px;padding:16px;font-size:9pt;color:#9c9a92;line-height:2}
.how code{background:#1a1816;border:1px solid #2a2620;border-radius:3px;padding:1px 5px;font-family:Consolas,monospace;font-size:8pt;color:#c9a84c}
.miss{background:#2a1410;border:1px solid #6a2a1a;border-radius:8px;padding:12px 16px;margin-top:14px;font-size:8.5pt;color:#e0a090;line-height:1.7}
.grp{page-break-before:always;padding:14px}
.gh{font-size:14pt;font-weight:800;padding:8px 12px;border-radius:8px;margin-bottom:12px}
.card{background:#0f0e0c;border:1px solid #211f1b;border-radius:8px;padding:12px 14px;margin-bottom:10px;page-break-inside:avoid}
.chead{display:flex;align-items:baseline;gap:8px;margin-bottom:6px;flex-wrap:wrap}
.code{font-family:Consolas,monospace;font-weight:700;font-size:9pt}
.old{font-family:Consolas,monospace;font-size:7.5pt;color:#5f5e5a}
.cname{font-size:9pt;color:#cfc8b8}
.pbox{background:#000;border-radius:6px;padding:9px 11px;font-family:Consolas,monospace;font-size:7.5pt;line-height:1.7;color:#bcd6bc;word-break:break-word}
.sfx{margin-top:8px;font-family:Consolas,monospace;font-size:7pt;color:#6a6450;line-height:1.7}
.mj{color:#c9a84c}
`;
  const cover = `
<div class="cover">
  <div class="ct">Crime Scene · 단서 이미지 생성 프롬프트 · 운영자 전용</div>
  <div class="h1">단서 이미지 생성 프롬프트</div>
  <div class="h2">신 단서 코드 매핑 적용 · Midjourney / DALL·E / Stable Diffusion용</div>
  <div class="bar"></div>
  <div class="how">
    <b style="color:#c9a84c">사용 방법</b><br>
    1. 각 카드의 프롬프트를 복사<br>
    2. 끝에 공통 접미사를 붙임 (카드마다 표기)<br>
    3. Midjourney: 접미사 뒤에 <code>${SUFFIX_MJ}</code> 추가<br>
    4. DALL·E 3: 그대로 사용, 1024×1024<br>
    · 총 ${entries.length}개 프롬프트 · 모든 텍스트가 한국어(한글)로 표시되도록 지시됨
  </div>
  ${missing.length ? `<div class="miss"><b>⚠ 코드 매핑 누락 ${missing.length}건</b> — 아래 프롬프트는 clue-code-map.txt에 옛 코드가 없어 신 코드를 찾지 못했습니다. evidenceMap에 해당 단서가 있는지 확인 후 수동 지정하세요:<br>${missing.map((m) => `${esc(m.oldc)} (${esc(m.name)})`).join(' · ')}</div>` : ''}
</div>`;

  const groups = owners.map((owner) => {
    const list = entries.filter((e) => e.owner === owner);
    if (!list.length) return '';
    const col = PERSON_COLOR[owner] || '#c9a84c';
    const cards = list.map((e) => `
      <div class="card">
        <div class="chead">
          <span class="code" style="color:${col}">${e.exists ? esc(e.code) : '⚠️ ' + esc(e.oldc)}</span>
          <span class="old">(구 ${esc(e.oldc)})</span>
          <span class="cname">${esc(e.name)}${e.exists && e.curTitle && e.curTitle !== e.name ? ` · 현재: ${esc(e.curTitle)}` : ''}</span>
        </div>
        <div class="pbox">${esc(e.prompt)}</div>
        <div class="sfx">+ 접미사: ${esc(SUFFIX)}<br><span class="mj">Midjourney: ${esc(SUFFIX_MJ)}</span></div>
      </div>`).join('');
    return `<div class="grp"><div class="gh" style="background:${col}22;color:${col};border:1px solid ${col}55">${esc(owner)} · ${list.length}개</div>${cards}</div>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>이미지 생성 프롬프트</title><style>${css}</style></head><body>${cover}${groups}</body></html>`;
  return { filename: '이미지생성프롬프트.html', html };
}
