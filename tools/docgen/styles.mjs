// 운영 문서 공통 인쇄 CSS. 렌더 블록(phone/pages/wallet/sched/cctv)과
// 표·페이지 규칙을 포함한다. 각 생성기가 자기 헤더 CSS를 덧붙인다.
export const BASE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;font-size:10pt;line-height:1.6;color:#1a1a1a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
/* @page 에 여백을 주면 브라우저가 그 자리에 날짜·제목·주소·쪽번호를 찍는다. 여백은 본문이 든다. */
@page{margin:0}
body{padding:7mm 14mm}
.pb,.avoid{padding-top:0}
h1,h2,h3{line-height:1.25}
code{font-family:Consolas,monospace;font-size:8.5pt;background:#f1f0ec;border:1px solid #e0ddd6;border-radius:3px;padding:0 4px;white-space:nowrap}
.nowrap{white-space:nowrap}
.sec{font-size:8pt;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#9c9a92;margin:18px 0 8px;padding-bottom:5px;border-bottom:1.5px solid #e8e5de}
table{width:100%;border-collapse:collapse;margin:6px 0}
th{font-size:7.5pt;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#fff;background:#2a2824;text-align:left;padding:6px 8px}
td{font-size:9pt;padding:6px 8px;border-bottom:1px solid #eee;vertical-align:top;line-height:1.5}
tr:last-child td{border-bottom:none}
.badge{display:inline-block;font-size:7pt;font-weight:800;padding:1px 7px;border-radius:9px;margin-left:5px;vertical-align:middle}
.b-sp{background:#FEF3E2;color:#9a5b00}
.b-gn{background:#eef;color:#3a3a8a}
.pb{page-break-before:always}
.avoid{page-break-inside:avoid}

/* 렌더 블록 공통 */
.phone,.pagedoc{background:#f5f7fa;border:1px solid #e2e6ec;border-radius:10px;padding:12px 14px;margin:8px 0}
.phone-owner{font-size:9.5pt;font-weight:800;color:#3a4150;margin-bottom:8px}
.pht{font-size:8.5pt;font-weight:800;color:#3a6ea5;margin:12px 0 5px;border-top:1px dashed #d6dde6;padding-top:8px}
.pht:first-of-type{border-top:none;padding-top:0;margin-top:2px}
.contacts{display:flex;flex-wrap:wrap;gap:4px 10px}
.contact{font-size:8.5pt}.contact em{color:#888;font-style:normal;font-size:7.5pt}
.srch{margin:4px 0;padding:5px 8px;background:#fff;border-radius:6px;border:1px solid #eef}
.srch-q{font-size:8.5pt;font-weight:700}.srch-t{font-size:8pt;color:#1a6b3a;margin-top:1px}.srch-s{font-size:8pt;color:#555;margin-top:2px;line-height:1.45}
.kk{margin:6px 0;padding-left:10px;border-left:2px solid #d8e0ea}
.kkn{font-size:8.5pt;font-weight:700;margin-bottom:3px}
.kkn .del{font-size:7.5pt;font-weight:700;color:#A32D2D;margin-left:4px}
.msg{font-size:8.5pt;line-height:1.5;margin:1px 0}
.msg.me b{color:#1a6b3a}.msg.them b{color:#555}.msg.dl{color:#A32D2D;font-style:italic}
.msg .t{color:#aaa;font-size:7pt;margin-left:3px}
.photo,.wal{font-size:8.5pt;margin:3px 0}
.del{color:#A32D2D;font-weight:700;font-size:7.5pt}
.pw{font-size:7.5pt;color:#A32D2D;font-weight:700;background:#fdeaea;border-radius:6px;padding:0 6px;margin-left:4px}
.pagebody{font-size:8.5pt;line-height:1.6;color:#333}.pagebody p{margin-bottom:6px}
table.sched th,table.cctv th{background:#3a4150}
table.cctv .arrow{color:#c9a84c;font-weight:700}
table.cctv .look{font-size:7.5pt;color:#888;margin-top:2px}
table.cctv hr{border:none;border-top:1px dashed #ddd;margin:4px 0}
.tapreveal{font-size:8.5pt;background:#fff8f0;border:1px solid #f0d9b8;border-radius:6px;padding:6px 10px;margin:5px 0;color:#7a4a00}
`;
