// 게임 진행용 슬라이드(.pptx) 생성기.
//   운영자가 빔프로젝터로 띄우며 진행하는 덱.
//   피해자·용의자(웹 인물 이미지)·진행 단계·게임 방법은 gameData에서 자동 파생.
//   진행 단계 상세는 '게임 설명서'(LSUX-91) 페이지 내용을 그대로 인용 → 앱과 동기화.
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

export async function genSlidesPptx(outPath) {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';      // 13.33 x 7.5 inch
  pptx.author = 'Morning Dew Crime Scene';
  pptx.title = '새벽이슬 크라임씬 — 게임 진행';

  const webQr = await QRCode.toDataURL(SITE_URL, { margin: 1, width: 900, errorCorrectionLevel: 'M' });
  const briefingQr = await QRCode.toDataURL('BRIF-00', { margin: 1, width: 900, errorCorrectionLevel: 'M' });
  const urlText = SITE_URL.replace(/^https?:\/\//, '');
  const brief = evidenceMap['BRIF-00'] || {};
  const briefPage = (t) => (brief.pages || []).find((p) => p.title === t)?.content || '';

  // 중간점검/2부 운영용 — 용의자 6인 핸드폰 QR + 2차 부검 QR
  const PHONE6 = ['박희원', '이사랑', '이현지', '최종현', '윤은재', '이가현']
    .map((name) => { const e = Object.entries(evidenceMap).find(([, v]) => v.phone && v.person === name); return e ? { name, code: e[0] } : null; })
    .filter(Boolean);
  for (const p of PHONE6) p.qr = await QRCode.toDataURL(p.code, { margin: 1, width: 600, errorCorrectionLevel: 'M' });
  const lonsQr = await QRCode.toDataURL('LONS-62', { margin: 1, width: 900, errorCorrectionLevel: 'M' });
  const lons = evidenceMap['LONS-62'] || {};

  const bg = (s) => { s.background = { color: DARK }; };
  const kicker = (s, t) => s.addText(t, { x: 0.8, y: 0.5, w: 11.7, h: 0.4, fontSize: 12, color: GOLD, charSpacing: 3, bold: true });
  const title = (s, t) => s.addText(t, { x: 0.8, y: 0.95, w: 11.7, h: 0.9, fontSize: 32, color: LIGHT, bold: true });
  const newSlide = (kick, ttl) => { const s = pptx.addSlide(); bg(s); if (kick) kicker(s, kick); if (ttl) title(s, ttl); return s; };

  // ── 1) 표지 (QR 없음) ──────────────────────────────
  let s = pptx.addSlide(); bg(s);
  s.addText('MORNING DEW · CRIME SCENE', { x: 0.9, y: 2.5, w: 11.5, h: 0.5, fontSize: 16, color: GOLD, charSpacing: 5, bold: true, align: 'center' });
  s.addText('새벽이슬 크라임씬', { x: 0.9, y: 3.1, w: 11.5, h: 1.3, fontSize: 56, color: LIGHT, bold: true, align: 'center' });
  s.addText('— 수련회 살인 사건 —', { x: 0.9, y: 4.5, w: 11.5, h: 0.6, fontSize: 18, color: GREY, align: 'center' });

  // ── 2) 사건 개요 / 피해자 (인물 이미지) ────────────
  s = newSlide('CASE', '사건 개요 · 피해자');
  personImage(pptx, s, victim.image, victim.name, '6b6760', 9.3, 1.7, 3.3, 4.4);
  s.addText([
    { text: `${victim.name}`, options: { fontSize: 26, color: LIGHT, bold: true, breakLine: true, paraSpaceAfter: 4 } },
    { text: `${victim.age}세 · ${victim.gender} · ${victim.occupation}`, options: { fontSize: 14, color: GOLD, breakLine: true } },
  ], { x: 0.85, y: 2.05, w: 8.1, h: 1.1 });
  s.addText(page('사건 개요') || '수련회 당일, 목사님이 방에서 숨진 채 발견되었다.', { x: 0.85, y: 3.25, w: 8.1, h: 3.4, fontSize: 15, color: LIGHT, lineSpacingMultiple: 1.3, valign: 'top' });

  // ── 3) 등장인물 (웹 인물 이미지) ───────────────────
  s = newSlide('SUSPECTS', '등장인물 — 용의자 6인');
  const people = PERSON_ORDER.filter((n) => suspects.some((sp) => sp.name === n)).map((n) => suspects.find((sp) => sp.name === n));
  const cols = 3, cw = 3.95, ch = 2.42, gx = 0.35, gy = 0.18, ox = 0.75, oy = 1.95;
  people.slice(0, 6).forEach((sp, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    const x = ox + c * (cw + gx), y = oy + r * (ch + gy);
    const col = hx(PERSON_COLOR[sp.name]);
    s.addShape(pptx.ShapeType.rect, { x, y, w: cw, h: ch, fill: { color: PANEL }, line: { color: col, width: 1.25 } });
    personImage(pptx, s, sp.image, sp.name, PERSON_COLOR[sp.name], x + (cw - 1.5) / 2, y + 0.12, 1.5, 1.5);
    s.addText(sp.name, { x, y: y + 1.68, w: cw, h: 0.4, align: 'center', fontSize: 16, color: LIGHT, bold: true });
    s.addText(sp.occupation, { x: x + 0.1, y: y + 2.05, w: cw - 0.2, h: 0.32, align: 'center', fontSize: 10, color: col, bold: true });
  });

  // ── 4) 수사 대상 — 왜 이 6명인가 (시작 브리핑) ─────
  s = newSlide('BRIEFING', '수사 대상 — 용의자가 6명인 이유');
  s.addText(briefPage('용의자가 6명인 이유'), { x: 0.85, y: 1.95, w: 11.6, h: 3.3, fontSize: 15, color: LIGHT, lineSpacingMultiple: 1.35, valign: 'top' });
  s.addShape(pptx.ShapeType.roundRect, { x: 0.85, y: 5.45, w: 11.6, h: 1.25, fill: { color: '17150F' }, line: { color: GOLD, width: 1.25 }, rectRadius: 0.05 });
  s.addText([
    { text: '추리 대전제  ', options: { fontSize: 14, color: GOLD, bold: true } },
    { text: briefPage('목사님 방 위치·구조') || '목사님 방 내부는 CCTV 사각, 복도만 촬영된다.', options: { fontSize: 13, color: LIGHT } },
  ], { x: 1.1, y: 5.55, w: 11.1, h: 1.05, valign: 'middle' });

  // (게임 접속 QR 슬라이드는 제외 — 접속 QR은 '게임 방법' 슬라이드·클로징에 포함됨)

  // ── 5) 게임 진행 순서 (개요) ───────────────────────
  s = newSlide('FLOW', '게임 진행 순서');
  const STEPS = [
    ['시작 · 브리핑', '1차 부검 결과(심정지)와 시신 발견 경위 공개'],
    ['1부 — 단서 수집 (60분)', '용의자 1:1 심문 · 조별 10분씩 순환 (핸드폰 금지)'],
    ['중간 점검', '단서 정리 · 검식 2개 제출 · 목사님 방 조별 탐문'],
    ['2부 — 자유 탐문 (30분+)', '핸드폰 공개 · 자유 조사 · 2차 부검(직접 사인) 공개'],
    ['마무리 — 발표', '조별로 범인·검거 사유 제출 및 발표'],
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

  // ── 6) 1부 상세 — CCTV 열람대 배치도 ───────────────
  s = newSlide('PART 1', '1부 — 단서 수집 (60분)');
  s.addText('용의자를 한 명씩 10분씩, 조별로 돌아가며 심문합니다. (핸드폰 금지)\n화면에는 ‘CCTV 열람대’ 배치도를 띄워 두고 동선을 함께 확인하세요.',
    { x: 0.85, y: 1.85, w: 11.6, h: 0.95, fontSize: 14, color: LIGHT, lineSpacingMultiple: 1.25 });
  drawFloorPlan(pptx, s, 3.55, 2.85, 0.0155);

  // ── 7) 중간 점검 상세 ──────────────────────────────
  s = newSlide('CHECKPOINT', '중간 점검');
  s.addText(page('중간 점검'), { x: 0.85, y: 1.95, w: 11.6, h: 4.8, fontSize: 15, color: LIGHT, lineSpacingMultiple: 1.3, valign: 'top' });

  // ── 8) 2부 상세 ────────────────────────────────────
  s = newSlide('PART 2', '2부 — 자유 탐문 (30분+)');
  s.addText(page('2부 — 자유 탐문'), { x: 0.85, y: 1.95, w: 11.6, h: 4.8, fontSize: 15, color: LIGHT, lineSpacingMultiple: 1.3, valign: 'top' });

  // ── 9) 마무리 상세 ─────────────────────────────────
  s = newSlide('WRAP-UP', '마무리 — 발표 & 제출');
  s.addText(page('마무리 — 발표 & 제출'), { x: 0.85, y: 1.95, w: 11.6, h: 4.8, fontSize: 15, color: LIGHT, lineSpacingMultiple: 1.3, valign: 'top' });

  // ── 10) 게임 방법 (앱 사용법) + 웹 QR ──────────────
  s = newSlide('HOW TO PLAY', '게임 방법');
  const how = [
    ['1. QR 스캔으로 접속·수집', '오른쪽 접속 QR로 사이트에 들어가고, 현장의 QR을 스캔하면 단서가 앱에 모입니다.'],
    ['2. 단서 열람 & 추리', '소지품·핸드폰·CCTV 동선을 살펴 용의자별 동기와 기회를 파악합니다.'],
    ['3. 심문 & 최종 지목', '용의자(배우)를 심문하고, 마지막에 범인을 지목·발표합니다.'],
  ];
  how.forEach((h, i) => {
    const y = 2.0 + i * 1.45;
    s.addText(h[0], { x: 0.85, y, w: 8.2, h: 0.5, fontSize: 18, color: GOLD, bold: true });
    s.addText(h[1], { x: 1.05, y: y + 0.55, w: 7.9, h: 0.8, fontSize: 13, color: LIGHT, lineSpacingMultiple: 1.2 });
  });
  s.addImage({ data: webQr, x: 9.6, y: 2.2, w: 2.9, h: 2.9 });
  s.addText(urlText, { x: 9.4, y: 5.2, w: 3.3, h: 0.4, fontSize: 13, color: GOLD, bold: true, align: 'center' });

  // ── 11) 게임 방법 · 코드로 단서 입력 (앱 화면 예시) ──
  s = newSlide('HOW TO PLAY', '게임 방법 · 코드로 단서 입력');
  s.addText([
    { text: 'QR을 스캔하거나, 코드를 직접 입력해 단서를 수집합니다.', options: { fontSize: 15, color: LIGHT, breakLine: true, paraSpaceAfter: 12 } },
    { text: '지금 바로 ‘게임 설명서’를 열어 보세요 —', options: { fontSize: 14, color: GREY, breakLine: true, paraSpaceAfter: 4 } },
    { text: '앱의 코드 입력란에 아래 코드를 입력하면 됩니다.', options: { fontSize: 14, color: GREY } },
  ], { x: 0.85, y: 2.1, w: 4.3, h: 2.0, valign: 'top' });
  // 강조 코드 (텍스트 — 실제 입력용)
  s.addShape(pptx.ShapeType.roundRect, { x: 0.85, y: 4.25, w: 4.3, h: 1.2, fill: { color: '17150F' }, line: { color: GOLD, width: 1.5 }, rectRadius: 0.06 });
  s.addText('게임 설명서 단서', { x: 1.05, y: 4.42, w: 3.9, h: 0.35, fontSize: 11, color: GREY });
  s.addText('LSUX-91', { x: 1.05, y: 4.72, w: 3.9, h: 0.6, fontSize: 30, bold: true, color: GOLD, fontFace: 'Consolas' });
  // 앱 화면 목업
  drawScanMock(pptx, s, 6.4, 1.95, 4.6, 'LSUX-91');
  s.addText('실제 앱 ‘증거 스캐너’ 화면 예시', { x: 6.4, y: 6.45, w: 4.6, h: 0.35, fontSize: 10, color: GREY, align: 'center' });

  // ── 12) 게임 방법 · CCTV 단서 보는 법 (예시 화면) ───
  s = newSlide('HOW TO PLAY', '게임 방법 · CCTV 단서 보는 법');
  s.addText([
    { text: '① 시간대를 고르고,', options: { fontSize: 15, color: LIGHT, breakLine: true, paraSpaceAfter: 10 } },
    { text: '② 복도에 나타난 ❓ 인물을 탭하면', options: { fontSize: 15, color: LIGHT, breakLine: true, paraSpaceAfter: 10 } },
    { text: '③ 그 시각·위치의 용의자 CCTV 단서가 확보됩니다.', options: { fontSize: 15, color: LIGHT, breakLine: true, paraSpaceAfter: 16 } },
    { text: '방 안(목사님 방)은 찍히지 않습니다. 복도에서 누가·언제 움직였는지에 주목하세요.', options: { fontSize: 12, color: GREY } },
  ], { x: 0.85, y: 2.1, w: 5.4, h: 4.0, valign: 'top' });
  drawFloorPlan(pptx, s, 6.95, 2.3, 0.0135, { route: [{ x: 160, y: 95 }, { x: 160, y: 141 }, { x: 290, y: 141 }] });
  s.addText('※ 예시 화면입니다 — 실제 게임 동선과 무관', { x: 6.6, y: 6.35, w: 5.6, h: 0.35, fontSize: 10, color: 'E0584F', align: 'center', bold: true });

  // ── 13) 시작 브리핑 자료 QR (BRIF-00) ──────────────
  s = newSlide('BRIEFING', '시작 브리핑 자료 공개');
  s.addImage({ data: briefingQr, x: 9.5, y: 1.8, w: 3.0, h: 3.0 });
  s.addText('스캔하면 브리핑 자료가 페이지로 열립니다', { x: 9.1, y: 4.9, w: 3.8, h: 0.4, fontSize: 11, color: GREY, align: 'center' });
  s.addText([
    { text: `${brief.title || '사건 브리핑'}`, options: { fontSize: 20, color: LIGHT, bold: true, breakLine: true, paraSpaceAfter: 10 } },
    { text: '한 장의 QR에 사건 현황·1차 부검 소견·목사님 방 구조·용의자가 6명인 이유·시신 발견 경위가 페이지로 담겨 있습니다.', options: { fontSize: 14, color: LIGHT, lineSpacingMultiple: 1.35, breakLine: true, paraSpaceAfter: 10 } },
    { text: (brief.pages || []).map((p, i) => `${i + 1}. ${p.title}`).join('   ·   '), options: { fontSize: 12, color: GREY } },
  ], { x: 0.85, y: 2.0, w: 8.2, h: 4.4, valign: 'top' });
  s.addText('시작 브리핑 때 이 QR을 게시하세요.', { x: 0.85, y: 6.3, w: 8.2, h: 0.4, fontSize: 12, color: GOLD, bold: true });

  // ════ 운영 중 띄우는 화면 (중간 점검 · 2부) ════

  // ── 14) 중간 점검 진행 (운영) ──────────────────────
  s = newSlide('CHECKPOINT', '중간 점검 — 진행 안내');
  [
    ['① 단서 정리', '조별로 모여 1부에서 모은 단서를 정리·의논합니다.'],
    ['② 검식 의뢰 (조별 2개)', '각 조가 분석할 단서를 2개만 골라 운영자에게 제출 → 결과는 그 조에게만 공개.'],
    ['③ 목사님 방 개방 (조별 5분)', '통제돼 있던 목사님 방(현장)을 조별로 5분씩 돌아가며 탐문합니다.'],
    ['④ 2부 준비', '모든 조가 방 탐문을 마치면 잠깐 정비 후 2부로.'],
  ].forEach((h, i) => {
    const y = 2.05 + i * 1.15;
    s.addText(h[0], { x: 0.85, y, w: 11.6, h: 0.45, fontSize: 17, color: GOLD, bold: true });
    s.addText(h[1], { x: 1.05, y: y + 0.5, w: 11.4, h: 0.55, fontSize: 13, color: LIGHT, lineSpacingMultiple: 1.2 });
  });

  // ── 15) 2부 시작 — 용의자 핸드폰 QR 6개 ─────────────
  s = newSlide('PART 2', '2부 — 용의자 핸드폰 공개');
  s.addText('각 QR을 스캔하면 해당 용의자의 핸드폰이 앱에서 열립니다. (1부에선 핸드폰 금지)', { x: 0.85, y: 1.5, w: 11.6, h: 0.5, fontSize: 14, color: GREY });
  {
    const cols = 3, cw = 3.7, ch = 2.25, gx = 0.45, gy = 0.25, ox = 1.05, oy = 2.15;
    PHONE6.forEach((p, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      const x = ox + c * (cw + gx), y = oy + r * (ch + gy);
      const col = hx(PERSON_COLOR[p.name]);
      s.addShape(pptx.ShapeType.roundRect, { x, y, w: cw, h: ch, fill: { color: 'FBFAF6' }, line: { color: col, width: 1.25 }, rectRadius: 0.05 });
      s.addImage({ data: p.qr, x: x + (cw - 1.45) / 2, y: y + 0.18, w: 1.45, h: 1.45 });
      s.addText(`${p.name} 핸드폰`, { x, y: y + 1.7, w: cw, h: 0.4, align: 'center', fontSize: 14, bold: true, color: '2B2820' });
      s.addText(p.code, { x, y: y + 2.0, w: cw, h: 0.25, align: 'center', fontSize: 9, color: '8A8270', fontFace: 'Consolas' });
    });
  }

  // ── 16) 2차 부검 결과 공개 (2부 중간) ──────────────
  s = newSlide('AUTOPSY 2', '2차 부검 결과 공개 (2부 중간)');
  s.addImage({ data: lonsQr, x: 9.5, y: 1.8, w: 3.0, h: 3.0 });
  s.addText('스캔하면 앱에 단서로 추가됩니다', { x: 9.1, y: 4.9, w: 3.8, h: 0.4, fontSize: 11, color: GREY, align: 'center' });
  s.addText([
    { text: `${lons.title || '2차 부검'}`, options: { fontSize: 20, color: LIGHT, bold: true, breakLine: true, paraSpaceAfter: 10 } },
    { text: lons.detail || '', options: { fontSize: 14, color: GREY, lineSpacingMultiple: 1.35 } },
  ], { x: 0.85, y: 2.0, w: 8.2, h: 4.4, valign: 'top' });
  s.addText('2부 중간쯤 이 QR을 게시하세요. (심정지 → 질식 반전)', { x: 0.85, y: 6.3, w: 8.2, h: 0.4, fontSize: 12, color: GOLD, bold: true });

  // ── 17) 클로징 ─────────────────────────────────────
  s = pptx.addSlide(); bg(s);
  s.addText('진실을 밝혀라', { x: 0.9, y: 2.9, w: 11.5, h: 1.1, fontSize: 44, color: LIGHT, bold: true, align: 'center' });
  s.addText(urlText, { x: 0.9, y: 4.1, w: 11.5, h: 0.6, fontSize: 18, color: GOLD, bold: true, align: 'center' });

  await pptx.writeFile({ fileName: outPath });
  return outPath;
}
