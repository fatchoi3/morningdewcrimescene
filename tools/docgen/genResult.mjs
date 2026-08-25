// 결과 제출지 — A4 가로 1장에 동일 양식 2개(좌/우, 가운데 점선으로 잘라 2부).
// 각 양식: 상단 큰 제목 '결과 제출지' + 표(2열 × 7행). 1열=인물(목사님+용의자 6인), 2열=작성란.

const NAMES = ['목사님', '최종현', '한소미', '강지후', '서지안', '문세린', '한다영'];

export function genResultSheet() {
  const rows = NAMES.map((n) => `<tr><th>${n}</th><td></td></tr>`).join('');
  const form = `<div class="form">
    <div class="title">결과 제출지</div>
    <div class="meta">조 이름 <span class="blank">&nbsp;</span></div>
    <div class="hint">각 인물에 대한 판단(범인 여부 · 동기 · 방법 · 근거 단서)을 적어 주세요.</div>
    <table><colgroup><col style="width:32%"><col></colgroup>${rows}</table>
  </div>`;
  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>결과 제출지</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; margin: 0; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .wrap { display: flex; }
  .form { flex: 1; padding: 5mm 7mm; }
  .form:first-child { border-right: 1.4px dashed #aaa; }
  .title { text-align: center; font-size: 25pt; font-weight: 800; letter-spacing: 0.05em; margin: 1mm 0 3mm; }
  .meta { font-size: 11pt; color: #333; margin-bottom: 3mm; }
  .meta .blank { display: inline-block; min-width: 40mm; border-bottom: 1px solid #888; }
  .hint { text-align: center; font-size: 9pt; color: #666; margin-bottom: 3mm; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td { border: 1.4px solid #1a1a1a; padding: 5px 8px; vertical-align: top; }
  th { width: 32%; background: #efeae0; font-size: 12.5pt; font-weight: 800; text-align: center; height: 20mm; }
  td { height: 20mm; }
</style></head><body>
  <div class="wrap">${form}${form}</div>
</body></html>`;
  return { filename: '결과제출지.html', html };
}
