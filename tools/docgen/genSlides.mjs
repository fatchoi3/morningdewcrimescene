// 게임 진행용 슬라이드(.pptx) 생성기 — 참가자용(빔프로젝터로 띄워 보여주는 화면).
//   피해자·용의자(웹 인물 이미지)·핸드폰 QR은 gameData에서 자동 파생.
//   운영자 전용 지시 슬라이드는 넣지 않는다(참가자 시점). 조 이름은 TEAMS 상수.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import pptxgen from 'pptxgenjs';
import QRCode from 'qrcode';
import { evidenceMap, victim, suspects, SITE_URL, PERSON_ORDER, PERSON_COLOR } from './loadData.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', '..', 'public');
const imgPath = (webPath) => join(PUBLIC, (webPath || '').replace(/^\//, ''));

const DARK = '0F0E0C', PANEL = '1B1813', GOLD = 'C9A84C', LIGHT = 'E8E4DC', GREY = '9C9A92', LINE = '4A463E';
const hx = (c) => (c || '#666666').replace('#', '');

// 게임 설명서(LSUX-91) 페이지 → 제목으로 내용 조회 (앱과 동일 출처)
const MANUAL = evidenceMap['LSUX-91']?.pages || [];
const page = (t) => (MANUAL.find((p) => p.title === t)?.content || '').trim();

// 2층 평면도(배치도) — CCTV 열람대와 동일 레이아웃
const ROOMS = [
  { x: 55, y: 45, w: 95, h: 70, label: '이사랑' },
  { x: 150, y: 45, w: 95, h: 70, label: '이현지' },
  { x: 245, y: 45, w: 90, h: 70, label: '박희원' },
  { x: 335, y: 12, w: 63, h: 80, label: '목사님', victim: true },
  { x: 55, y: 172, w: 95, h: 73, label: '최종현' },
  { x: 150, y: 172, w: 95, h: 73, label: '이가현' },
  { x: 245, y: 172, w: 90, h: 73, label: '윤은재' },
];

// 평면도(배치도) — 어두운 슬라이드에서도 잘 보이도록 밝은 카드 위에 그린다.
//  example: { route:[{x,y}...], who } 주면 예시 동선(점선 화살표 + ❓ 마커)을 함께 그린다.
function drawFloorPlan(pptx, slide, ox, oy, sc, example) {
  const X = (v) => ox + v * sc;
  const Y = (v) => oy + v * sc;
  const S = (v) => v * sc;
  const pad = 0.16;
  // 밝은 카드 배경 (대비 확보)
  slide.addShape(pptx.ShapeType.roundRect, { x: ox - pad, y: oy - pad, w: S(400) + pad * 2, h: S(280) + pad * 2, fill: { color: 'F5F2EA' }, line: { color: 'D8D0BE', width: 1 }, rectRadius: 0.08 });
  // 복도
  slide.addShape(pptx.ShapeType.rect, { x: X(55), y: Y(122), w: S(287), h: S(38), fill: { color: 'E8E2D3' }, line: { color: 'CBC3AE', width: 0.75 } });
  slide.addShape(pptx.ShapeType.rect, { x: X(335), y: Y(92), w: S(63), h: S(168), fill: { color: 'E8E2D3' }, line: { color: 'CBC3AE', width: 0.75 } });
  // 방
  for (const r of ROOMS) {
    slide.addShape(pptx.ShapeType.rect, {
      x: X(r.x), y: Y(r.y), w: S(r.w), h: S(r.h),
      fill: { color: r.victim ? 'FBE9E9' : 'FFFFFF' },
      line: { color: r.victim ? 'C06868' : '9A917C', width: r.victim ? 1.75 : 1 },
    });
    slide.addText(r.label, { x: X(r.x), y: Y(r.y), w: S(r.w), h: S(r.h), align: 'center', valign: 'middle', fontSize: 12, bold: true, color: r.victim ? '9A3B3B' : '3A352B' });
  }
  // CCTV 카메라
  slide.addShape(pptx.ShapeType.ellipse, { x: X(40), y: Y(134), w: S(14), h: S(14), fill: { color: 'A06EC8' } });
  slide.addText('CCTV', { x: X(20), y: Y(150), w: S(60), h: S(20), align: 'center', fontSize: 9, color: '7A4FA0', bold: true });
  // 1층 가는 길
  slide.addText('↓ 1층 가는 길', { x: X(305), y: Y(225), w: S(95), h: S(25), align: 'center', fontSize: 9, color: '8A8270' });

  // 예시 동선 (실제 게임 동선과 무관) — 점선 화살표 여러 구간 + ❓ 마커
  if (example && Array.isArray(example.route) && example.route.length >= 2) {
    const EX = 'E0584F';
    const pts = example.route;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      slide.addShape(pptx.ShapeType.line, {
        x: X(a.x), y: Y(a.y), w: S(b.x - a.x), h: S(b.y - a.y),
        line: { color: EX, width: 2.25, dashType: 'dash', ...(i === pts.length - 1 ? { endArrowType: 'triangle' } : {}) },
      });
    }
    const s0 = pts[0];
    slide.addShape(pptx.ShapeType.ellipse, { x: X(s0.x) - 0.12, y: Y(s0.y) - 0.12, w: 0.24, h: 0.24, fill: { color: EX }, line: { color: 'FFFFFF', width: 1.5 } });
    slide.addText('?', { x: X(s0.x) - 0.12, y: Y(s0.y) - 0.13, w: 0.24, h: 0.24, align: 'center', valign: 'middle', fontSize: 11, bold: true, color: 'FFFFFF' });
  }
}

// 앱 '증거 스캐너' 화면 목업 (코드 직접 입력 예시) — 네이티브 도형
function drawScanMock(pptx, slide, x, y, w, code) {
  const h = 4.4;
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, fill: { color: 'FBFAF6' }, line: { color: 'C9A84C', width: 1.5 }, rectRadius: 0.05 });
  slide.addText('🔍 증거 스캐너', { x: x + 0.28, y: y + 0.22, w: w - 0.56, h: 0.4, fontSize: 14, bold: true, color: '2B2820' });
  // QR 스캔 버튼
  slide.addShape(pptx.ShapeType.roundRect, { x: x + 0.3, y: y + 0.78, w: w - 0.6, h: 0.58, fill: { color: 'EFE7CF' }, line: { color: 'C9A84C', width: 1 }, rectRadius: 0.05 });
  slide.addText('📷  카메라로 QR 스캔', { x: x + 0.3, y: y + 0.78, w: w - 0.6, h: 0.58, align: 'center', valign: 'middle', fontSize: 12, bold: true, color: '7A5A00' });
  // 코드 입력
  slide.addText('코드 입력', { x: x + 0.3, y: y + 1.55, w: w - 0.6, h: 0.3, fontSize: 10, color: '8A8270' });
  slide.addShape(pptx.ShapeType.roundRect, { x: x + 0.3, y: y + 1.88, w: w - 1.5, h: 0.62, fill: { color: 'FFFFFF' }, line: { color: '9A917C', width: 1 }, rectRadius: 0.04 });
  slide.addText(code, { x: x + 0.45, y: y + 1.88, w: w - 1.85, h: 0.62, valign: 'middle', fontSize: 17, bold: true, color: '1F6E55', fontFace: 'Consolas' });
  slide.addShape(pptx.ShapeType.roundRect, { x: x + w - 1.12, y: y + 1.88, w: 0.82, h: 0.62, fill: { color: '2B2820' }, rectRadius: 0.04 });
  slide.addText('확인', { x: x + w - 1.12, y: y + 1.88, w: 0.82, h: 0.62, align: 'center', valign: 'middle', fontSize: 12, bold: true, color: 'C9A84C' });
  slide.addText('스캔이 어려우면 코드를 직접 입력하세요. (대소문자 구분 없음)', { x: x + 0.3, y: y + 2.75, w: w - 0.6, h: 0.7, fontSize: 10, color: '8A8270', lineSpacingMultiple: 1.2 });
}

function personImage(pptx, slide, webPath, name, color, x, y, w, h) {
  const p = imgPath(webPath);
  if (webPath && existsSync(p)) {
    slide.addImage({ path: p, x, y, w, h, sizing: { type: 'contain', w, h }, rounding: false });
  } else {
    // 이미지 없으면 색 박스 + 이니셜
    slide.addShape(pptx.ShapeType.rect, { x, y, w, h, fill: { color: hx(color) } });
    slide.addText((name || '?').slice(0, 1), { x, y, w, h, align: 'center', valign: 'middle', fontSize: 40, bold: true, color: 'FFFFFF' });
  }
}

// 6개 조 (조 인원·편성은 별도 공지)
const TEAMS = ['원영조', '민경조', '재헌조', '도현조', '정혁조', '예림조'];

export async function genSlidesPptx(outPath) {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';      // 13.33 x 7.5 inch
  pptx.author = 'Morning Dew Crime Scene';
  pptx.title = '새벽이슬 크라임씬 — 참가자 가이드';

  const webQr = await QRCode.toDataURL(SITE_URL, { margin: 1, width: 900, errorCorrectionLevel: 'M' });
  const urlText = SITE_URL.replace(/^https?:\/\//, '');

  // 2부 용의자 6인 핸드폰 QR + 2차 부검 QR (참가자가 화면에서 스캔)
  const PHONE6 = ['박희원', '이사랑', '이현지', '최종현', '윤은재', '이가현']
    .map((name) => { const e = Object.entries(evidenceMap).find(([, v]) => v.phone && v.person === name); return e ? { name, code: e[0] } : null; })
    .filter(Boolean);
  for (const p of PHONE6) p.qr = await QRCode.toDataURL(p.code, { margin: 1, width: 600, errorCorrectionLevel: 'M' });

  // 사건 개요(시작 브리핑) · CCTV 열람대 진입 단서 — 참가자가 화면 QR을 스캔/입력
  const briefCode = (Object.entries(evidenceMap).find(([, v]) => v.reveal === '시작브리핑') || [])[0] || 'BRIF-00';
  const cctvCode = (Object.entries(evidenceMap).find(([, v]) => v.cctv) || [])[0] || 'SIAH-72';
  const briefQr = await QRCode.toDataURL(briefCode, { margin: 1, width: 600, errorCorrectionLevel: 'M' });
  const cctvQr = await QRCode.toDataURL(cctvCode, { margin: 1, width: 600, errorCorrectionLevel: 'M' });

  const bg = (s) => { s.background = { color: DARK }; };
  const kicker = (s, t) => s.addText(t, { x: 0.8, y: 0.5, w: 11.7, h: 0.4, fontSize: 12, color: GOLD, charSpacing: 3, bold: true });
  const title = (s, t) => s.addText(t, { x: 0.8, y: 0.95, w: 11.7, h: 0.9, fontSize: 30, color: LIGHT, bold: true });
  const newSlide = (kick, ttl) => { const s = pptx.addSlide(); bg(s); if (kick) kicker(s, kick); if (ttl) title(s, ttl); return s; };
  // 불릿 리스트
  const bullets = (s, items, o = {}) => s.addText(
    items.map((t) => ({ text: t, options: { bullet: { indent: 16 }, fontSize: o.fontSize || 16, color: o.color || LIGHT, breakLine: true, paraSpaceAfter: o.gap == null ? 13 : o.gap } })),
    { x: o.x || 0.85, y: o.y || 2.0, w: o.w || 11.6, h: o.h || 4.6, valign: 'top', lineSpacingMultiple: 1.15 });

  // ── 1) 표지 ────────────────────────────────────────
  let s = pptx.addSlide(); bg(s);
  s.addText('MORNING DEW · CRIME SCENE', { x: 0.9, y: 2.5, w: 11.5, h: 0.5, fontSize: 16, color: GOLD, charSpacing: 5, bold: true, align: 'center' });
  s.addText('새벽이슬 크라임씬', { x: 0.9, y: 3.1, w: 11.5, h: 1.3, fontSize: 56, color: LIGHT, bold: true, align: 'center' });
  s.addText('— 수련회 살인 사건 —', { x: 0.9, y: 4.5, w: 11.5, h: 0.6, fontSize: 18, color: GREY, align: 'center' });

  // ── 2) 사건 개요 + 목표 ────────────────────────────
  s = newSlide('CASE', '사건 개요');
  personImage(pptx, s, victim.image, victim.name, '6b6760', 9.5, 1.7, 3.1, 4.0);
  s.addText([
    { text: `피해자  ${victim.name}`, options: { fontSize: 20, color: LIGHT, bold: true, breakLine: true, paraSpaceAfter: 3 } },
    { text: `${victim.age}세 · ${victim.occupation}`, options: { fontSize: 13, color: GOLD } },
  ], { x: 0.85, y: 1.95, w: 8.3, h: 0.95 });
  bullets(s, [
    '수련회 마지막 날, 목사님이 개인 방에서 숨진 채 발견되었다.',
    '협심증 병력이 있었지만, 부검상 단순 발작사로 보기 어려운 정황.',
    '현장에 있던 청년부 임원 6명이 용의자다.',
  ], { x: 0.85, y: 3.0, w: 8.3, h: 2.2, fontSize: 15 });
  s.addShape(pptx.ShapeType.roundRect, { x: 0.85, y: 5.55, w: 8.3, h: 1.1, fill: { color: '17150F' }, line: { color: GOLD, width: 1.25 }, rectRadius: 0.05 });
  s.addText([
    { text: '목표  ', options: { fontSize: 14, color: GOLD, bold: true } },
    { text: '우리 조가 단서를 모아 범인 1명 + 동기 + 방법을 밝혀낸다.', options: { fontSize: 14, color: LIGHT } },
  ], { x: 1.1, y: 5.6, w: 7.8, h: 1.0, valign: 'middle' });

  // ── 3) 등장인물 6인 (각자 방에) ────────────────────
  s = newSlide('SUSPECTS', '등장인물 — 용의자 6인');
  s.addText('각 용의자는 자기 방에 있습니다. 조별로 방을 돌며 직접 심문하세요.', { x: 0.85, y: 1.55, w: 11.6, h: 0.4, fontSize: 13, color: GREY });
  const people = PERSON_ORDER.filter((n) => suspects.some((sp) => sp.name === n)).map((n) => suspects.find((sp) => sp.name === n));
  {
    const cols = 3, cw = 3.85, ch = 2.62, gx = 0.3, gy = 0.12, ox = 0.6, oy = 1.95;
    const iw = 2.55, ih = 1.95;  // 사진 크게(여백 활용)
    people.slice(0, 6).forEach((sp, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      const x = ox + c * (cw + gx), y = oy + r * (ch + gy);
      const col = hx(PERSON_COLOR[sp.name]);
      s.addShape(pptx.ShapeType.rect, { x, y, w: cw, h: ch, fill: { color: PANEL }, line: { color: col, width: 1.25 } });
      personImage(pptx, s, sp.image, sp.name, PERSON_COLOR[sp.name], x + (cw - iw) / 2, y + 0.12, iw, ih);
      s.addText(sp.name, { x, y: y + 2.12, w: cw, h: 0.34, align: 'center', fontSize: 17, color: LIGHT, bold: true });
      s.addText(sp.occupation, { x: x + 0.1, y: y + 2.42, w: cw - 0.2, h: 0.24, align: 'center', fontSize: 10, color: col, bold: true });
    });
  }

  // ── 4) 왜 6명인가 + 추리 대전제 ────────────────────
  s = newSlide('BRIEFING', '용의자가 6명인 이유');
  bullets(s, [
    '숙소 2층(목사님 방이 있는 층)은 청년부 임원 6명만 사용했다.',
    '일반 청년부원·외부 참가자는 1층·별관 — 사건 시간대 2층에 올라온 외부인은 복도 CCTV에 0명.',
    '전날~당일 목사님과 단독 접점이 있던 사람도 정확히 이 6명뿐.',
  ], { x: 0.85, y: 2.0, w: 11.6, h: 2.8, fontSize: 16 });
  s.addShape(pptx.ShapeType.roundRect, { x: 0.85, y: 5.2, w: 11.6, h: 1.5, fill: { color: '17150F' }, line: { color: GOLD, width: 1.25 }, rectRadius: 0.05 });
  s.addText([
    { text: '추리 대전제\n', options: { fontSize: 14, color: GOLD, bold: true } },
    { text: '목사님 방 안에는 CCTV가 없습니다. 복도에만 있어요. — “복도에서 누가·언제 움직였나”가 열쇠입니다.', options: { fontSize: 14, color: LIGHT } },
  ], { x: 1.1, y: 5.32, w: 11.1, h: 1.3, valign: 'middle', lineSpacingMultiple: 1.2 });

  // ── 5) 준비 & 접속 + 우리 조 ───────────────────────
  s = newSlide('READY', '준비 & 접속');
  bullets(s, [
    '인터넷이 되는 환경에서 진행합니다.',
    '1인 1휴대폰 — 각자 폰으로 접속하세요.',
    '접속: 오른쪽 QR 스캔 (또는 공지방의 링크).',
  ], { x: 0.85, y: 2.05, w: 7.7, h: 2.3, fontSize: 16 });
  s.addText('우리 조 (6개 조)', { x: 0.85, y: 4.55, w: 7.7, h: 0.4, fontSize: 13, color: GOLD, bold: true });
  s.addText(TEAMS.join('   ·   '), { x: 0.85, y: 4.95, w: 7.7, h: 0.6, fontSize: 16, color: LIGHT });
  s.addImage({ data: webQr, x: 9.5, y: 1.95, w: 3.0, h: 3.0 });
  s.addText(urlText, { x: 9.3, y: 5.05, w: 3.4, h: 0.4, fontSize: 13, color: GOLD, bold: true, align: 'center' });
  s.addText('스캔해 접속!  (안 되면 공지방 링크)', { x: 9.0, y: 5.45, w: 4.0, h: 0.4, fontSize: 11, color: GREY, align: 'center' });

  // ── 6) 단서 찾는 법 (QR 위치 + 앱 입력) ────────────
  s = newSlide('CLUES', '단서 찾는 법');
  bullets(s, [
    '단서 QR은 벽 · 바닥 · 물건 · 인물(배우)에 붙어 있습니다.',
    '카메라로 QR을 스캔하면 단서가 앱에 모입니다.',
    '스캔이 어려우면 코드를 직접 입력해도 됩니다.',
    '예) 게임 설명서 코드 LSUX-91 을 입력해 규칙을 열어보세요.',
  ], { x: 0.85, y: 2.05, w: 5.7, h: 3.8, fontSize: 15 });
  drawScanMock(pptx, s, 7.0, 1.9, 4.5, 'LSUX-91');

  // ── 7) 사건 개요 단서 (BRIF-00) — 게임 시작 시 스캔/입력 ─
  s = newSlide('CASE', '사건 개요 단서');
  bullets(s, [
    '게임을 시작하면 이 코드를 스캔(또는 직접 입력)하세요.',
    '사건 현황 · 1차 부검 소견 · 방 구조 · 시신 발견 경위 등 [사건 브리핑]이 열립니다.',
    '추리의 출발점이니 조원 모두 먼저 읽어보세요.',
  ], { x: 0.85, y: 2.2, w: 6.5, h: 3.6, fontSize: 16 });
  s.addShape(pptx.ShapeType.roundRect, { x: 9.05, y: 1.95, w: 3.4, h: 4.0, fill: { color: 'FBFAF6' }, line: { color: GOLD, width: 1.5 }, rectRadius: 0.05 });
  s.addImage({ data: briefQr, x: 9.65, y: 2.25, w: 2.2, h: 2.2 });
  s.addText(briefCode, { x: 9.05, y: 4.55, w: 3.4, h: 0.45, align: 'center', fontSize: 22, bold: true, color: '1F6E55', fontFace: 'Consolas' });
  s.addText('스캔 또는 코드 직접 입력', { x: 9.05, y: 5.05, w: 3.4, h: 0.4, align: 'center', fontSize: 12, color: '8A8270' });

  // ── 7-2) 단서 깊이 파기 (귀속·특수해금·톡서랍/비번) ──
  s = newSlide('CLUES', '단서, 더 깊이 파기');
  bullets(s, [
    '특수 단서 자동 해금 — 서로 관련된 단서 2개를 모으면 [특수 단서]가 저절로 열립니다.',
    '감식 단서 — 열면 결과가 가려져 있어요. 중간 점검 때 조별로 분석할 단서 2개를 골라 운영자에게 의뢰하면, 운영자가 알려주는 비밀번호로 결과가 열립니다.',
    '⚠️ 감식 비밀번호는 5번 틀리면 잠깁니다 — 운영자에게 받기 전엔 함부로 입력하지 마세요.',
    '핸드폰은 깊이 파세요 (2부) — 삭제된 카톡은 [톡서랍]으로 복구! 네 자리 비밀번호가 필요해요.',
    '모은 단서는 [수집 증거] 탭에서 언제든 다시 볼 수 있어요.',
  ], { x: 0.85, y: 2.0, w: 11.7, h: 4.8, fontSize: 16, gap: 14 });

  // ── 8) 게임 진행 순서 ──────────────────────────────
  s = newSlide('FLOW', '게임 진행 순서');
  const STEPS = [
    ['시작 · 브리핑', '사건 개요와 1차 부검 결과 확인'],
    ['1부 — 심문 (60분)', '6개 조가 6개 방을 10분씩 돌며 용의자 심문'],
    ['중간 점검 (30~40분)', '단서 정리 · 감식 질문 · 목사님 방·CCTV 열람 (조별)'],
    ['2부 — 자유 탐문 (30분+)', '용의자 핸드폰 공개 · 자유롭게 조사'],
    ['마무리 — 결과 제출', '조별로 범인·동기·방법을 제출지에 작성 & 발표'],
  ];
  STEPS.forEach((p, i) => {
    const y = 2.0 + i * 0.92;
    s.addShape(pptx.ShapeType.ellipse, { x: 0.85, y, w: 0.55, h: 0.55, fill: { color: GOLD } });
    s.addText(String(i + 1), { x: 0.85, y, w: 0.55, h: 0.55, fontSize: 18, color: DARK, bold: true, align: 'center', valign: 'middle' });
    s.addText([
      { text: `${p[0]}     `, options: { fontSize: 18, color: LIGHT, bold: true } },
      { text: p[1], options: { fontSize: 13, color: GREY } },
    ], { x: 1.6, y, w: 11.2, h: 0.55, valign: 'middle' });
  });

  // ── 9) 1부 — 심문 (순환 + 질문법) ──────────────────
  s = newSlide('PART 1', '1부 — 심문 (60분)');
  bullets(s, [
    '각 조의 첫 시작 방만 배정됩니다 → 이후 10분마다 반시계 방향으로 옆 방으로 이동 → 60분에 6명 전원 심문.',
    '용의자(배우)에게 직접 질문하세요.',
    '용의자는 거짓·회피도 합니다 — 바로 자백하지 않아요.',
    '모은 단서를 들이대며 추궁하면 더 많은 정보가 나옵니다.',
    '답과 “말·증거의 모순”을 메모해 두세요. (폰으로 모은 단서를 확인하며 추궁해도 됩니다)',
  ], { x: 0.85, y: 1.95, w: 6.3, h: 4.7, fontSize: 14 });
  drawFloorPlan(pptx, s, 7.45, 2.2, 0.0135);

  // ── 10) 중간 점검 (30~40분) ────────────────────────
  s = newSlide('CHECKPOINT', '중간 점검 (30~40분)');
  s.addText('조별로 아래를 돌아가며 진행합니다.', { x: 0.85, y: 1.55, w: 11.6, h: 0.4, fontSize: 13, color: GREY });
  [
    ['단서 정리·의논', '1부에서 모은 단서를 조별로 정리하고 추리를 맞춰봅니다.'],
    ['감식 질문 (조별)', '분석할 단서를 2개만 골라 의뢰 → 결과는 우리 조에게만 공개.'],
    ['목사님 방 탐문 — 5분', '현장을 직접 조사. 방이 떨어져 있어 오가는 이동 2분을 감안하세요.'],
    ['CCTV 열람 — 2분', 'CCTV 열람대에서 복도 동선을 확인합니다.'],
  ].forEach((h, i) => {
    const y = 2.1 + i * 1.12;
    s.addText('•  ' + h[0], { x: 0.85, y, w: 11.6, h: 0.45, fontSize: 16, color: GOLD, bold: true });
    s.addText(h[1], { x: 1.2, y: y + 0.45, w: 11.1, h: 0.55, fontSize: 13, color: LIGHT, lineSpacingMultiple: 1.15 });
  });

  // ── 10-2) CCTV 열람대 — 진입 QR + 보는 법 (중간 점검 때 사용) ─
  s = newSlide('CCTV', 'CCTV 열람대');
  bullets(s, [
    '중간 점검 때 조별로 2분간 열람합니다.',
    '① 이 QR을 스캔하면 CCTV 열람 화면이 열립니다.',
    '② 화면에서 시간대를 고릅니다.',
    '③ 복도에 나타난 ❓ 인물을 탭하면 그 시각·위치의 CCTV 단서가 확보됩니다.',
    '방 안(목사님 방)은 찍히지 않아요 — 복도 움직임에 주목!',
  ], { x: 0.85, y: 2.0, w: 6.5, h: 4.6, fontSize: 15 });
  s.addShape(pptx.ShapeType.roundRect, { x: 9.05, y: 1.95, w: 3.4, h: 4.0, fill: { color: 'FBFAF6' }, line: { color: GOLD, width: 1.5 }, rectRadius: 0.05 });
  s.addImage({ data: cctvQr, x: 9.65, y: 2.25, w: 2.2, h: 2.2 });
  s.addText(cctvCode, { x: 9.05, y: 4.55, w: 3.4, h: 0.45, align: 'center', fontSize: 22, bold: true, color: '1F6E55', fontFace: 'Consolas' });
  s.addText('스캔하면 CCTV 열람대 진입', { x: 9.05, y: 5.05, w: 3.4, h: 0.4, align: 'center', fontSize: 12, color: '8A8270' });

  // ── 11) 2부 — 자유 탐문 ────────────────────────────
  s = newSlide('PART 2', '2부 — 자유 탐문 (30분+)');
  bullets(s, [
    '모든 용의자의 핸드폰이 공개됩니다 (카톡 · 검색 기록 · 사진).',
    '자유롭게 용의자를 다시 탐문하고, 개방된 목사님 방·현장을 조사하세요.',
    '모은 단서를 종합해 진범을 좁혀가세요.',
  ], { x: 0.85, y: 2.0, w: 11.6, h: 4.4, fontSize: 16 });

  // ── 12) 2부 — 용의자 핸드폰 QR 6개 ─────────────────
  s = newSlide('PART 2', '2부 — 용의자 핸드폰 공개');
  s.addText('각 QR을 스캔하면 해당 용의자의 핸드폰이 열립니다.', { x: 0.85, y: 1.5, w: 11.6, h: 0.5, fontSize: 14, color: GREY });
  {
    const cols = 3, cw = 3.7, ch = 2.45, gx = 0.45, gy = 0.22, ox = 1.05, oy = 2.05;
    PHONE6.forEach((p, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      const x = ox + c * (cw + gx), y = oy + r * (ch + gy);
      const col = hx(PERSON_COLOR[p.name]);
      s.addShape(pptx.ShapeType.roundRect, { x, y, w: cw, h: ch, fill: { color: 'FBFAF6' }, line: { color: col, width: 1.25 }, rectRadius: 0.05 });
      s.addImage({ data: p.qr, x: x + (cw - 1.45) / 2, y: y + 0.16, w: 1.45, h: 1.45 });
      s.addText(`${p.name} 핸드폰`, { x, y: y + 1.66, w: cw, h: 0.34, align: 'center', fontSize: 14, bold: true, color: '2B2820' });
      s.addText(p.code, { x, y: y + 2.0, w: cw, h: 0.3, align: 'center', fontSize: 13, bold: true, color: '7A5A00', fontFace: 'Consolas' });
    });
  }

  // ── 13) 마무리 — 결과 제출 ─────────────────────────
  s = newSlide('WRAP-UP', '마무리 — 결과 제출');
  bullets(s, [
    '2부가 끝나면 1층에 모입니다.',
    '조별로 배부된 [결과 제출지]에 각 인물(목사님·용의자 6명)에 대한 판단 — 범인 여부 · 동기 · 방법 · 근거 단서 — 을 적어 제출합니다.',
    '추리를 발표하고, 진행자가 정답과 숨은 진실을 공개합니다.',
    '채점: 단서 활용도 + 추리의 정확도.',
  ], { x: 0.85, y: 2.0, w: 11.6, h: 4.4, fontSize: 16 });

  // ── 15) 클로징 ─────────────────────────────────────
  s = pptx.addSlide(); bg(s);
  s.addText('진실을 밝혀라', { x: 0.9, y: 2.9, w: 11.5, h: 1.1, fontSize: 44, color: LIGHT, bold: true, align: 'center' });
  s.addText(urlText, { x: 0.9, y: 4.1, w: 11.5, h: 0.6, fontSize: 18, color: GOLD, bold: true, align: 'center' });

  await pptx.writeFile({ fileName: outPath });
  return outPath;
}
