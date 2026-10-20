// ─────────────────────────────────────────────────────────────────────────────
// features/tutorial — 첫 수사 안내.
//   TutorialCoach : 지정 선택자만 밝히고 주변은 어둡게+클릭 차단, 화살표 안내.
//   TutorialFinale: 첫 심문까지 마치면 한 번 뜨는 마무리 멘트.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';

// 누를 단추가 들어 있는 판 — 말풍선은 이 판을 비켜 서고, 판은 어둡게 덮지 않는다.
//   예전엔 단추 바로 옆에 말풍선을 붙여, 읽어야 할 글을 그 말풍선이 덮었다(2026-10-19 사용자 직접 시험):
//   반박할 대사·증거 고르기 머리글·단서 사진·사건 개요 첫 줄.
const BOX_SEL = '.aa-present, .aa-dialogue, .aa-ask, .s-modal, .s-sheet';
const toRect = (r) => ({ x: r.left, y: r.top, w: r.width, h: r.height });

// ── 튜토리얼 코치마크 — 클릭할 곳만 밝히고 주변은 어둡게+클릭 차단, 깜빡이는 화살표 안내 ──
//   targetSel(선택자)의 실제 위치를 추적해 '구멍'을 내고, 나머지 4개 마스크가 클릭을 막는다.
export function TutorialCoach({ targetSel, text, onSkip, dim = true }) {
  const [rect, setRect] = useState(null);
  const [box, setBox] = useState(null);
  // 건너뛰기는 두 번 눌러야 — 말풍선 속 글줄이 누를 대상(사람 그림) 위에 올 때 그냥 지나가다 눌러 튜토리얼이 꺼졌다
  const [skipArm, setSkipArm] = useState(false);
  useEffect(() => { if (!skipArm) return undefined; const id = setTimeout(() => setSkipArm(false), 6000); return () => clearTimeout(id); }, [skipArm]);
  const skip = (e) => { e.stopPropagation(); if (skipArm) onSkip(); else setSkipArm(true); };
  useEffect(() => {
    let raf;
    // 가리킬 것이 화면 밖(밀어야 보이는 복도·방·목록)에 있으면 한 번 그쪽으로 밀어 준다 —
    //   「종현방을 눌러라」는데 종현방이 화면 밖이라 멈춘 줄 알았다는 말을 들었다(2026-09-30 시험).
    //   그림 비율이 늦게 도착하면 자리가 한 번 더 바뀌므로 처음 1.5초 동안은 계속 살핀다(그 뒤엔 플레이어 손에 맡긴다).
    const t0 = Date.now();
    const tick = () => {
      const el = document.querySelector(targetSel);
      if (el && Date.now() - t0 < 1500) {
        const r = el.getBoundingClientRect();
        // 반쯤 잘려도 민다(화면보다 작은 것만 — 큰 것은 어차피 다 안 들어온다)
        const cut = (r.left < 0 || r.right > window.innerWidth) && r.width < window.innerWidth;
        if (r.width && (cut || r.bottom < 0 || r.top > window.innerHeight)) {
          el.scrollIntoView({ block: 'nearest', inline: 'center' });
        }
      }
      if (el) {
        const r = toRect(el.getBoundingClientRect());
        setRect((o) => (o && o.x === r.x && o.y === r.y && o.w === r.w && o.h === r.h ? o : r));
        const b = el.closest(BOX_SEL);
        const br = b ? toRect(b.getBoundingClientRect()) : null;
        setBox((o) => (o && br && o.x === br.x && o.y === br.y && o.w === br.w && o.h === br.h ? o : br));
      } else { setRect(null); setBox(null); }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [targetSel]);
  // 대상을 못 찾아도 안내를 지우지 않는다 — 예전엔 여기서 null 을 돌려줘 마스크까지 사라졌고,
  //   그 순간 플레이어가 아무 데나 눌러 딴 길로 샜다(선택자가 바뀌면 조용히 이렇게 된다).
  //   대신 화면을 살짝 덮고 할 일만 가운데 띄운다 — 클릭은 막지 않아 갇히지도 않는다.
  if (!rect || rect.w === 0) {
    return (
      <div className="tut-coach">
        <div className="tut-mask soft" style={{ inset: 0, width: '100%', height: '100%' }} />
        <div className="tut-cap tut-cap-center">{text}</div>
        <button className="tut-skip" onClick={onSkip}>튜토리얼 건너뛰기 ✕</button>
      </div>
    );
  }
  const W = window.innerWidth, H = window.innerHeight;
  const pad = box ? 6 : 12; // 판 안의 단추는 둘레를 좁게 — 넓으면 고리가 바로 위 안내 줄을 덮었다
  // 대사창 밖의 키 큰 대상(사람 그림)은 대사창 위에서 끊는다 — 금색 고리가 대사창·단추 위로 세로줄을 그었다
  const dlg = !box && document.querySelector('.aa-dialogue');
  const dlgTop = dlg ? dlg.getBoundingClientRect().top : H;
  const hx = Math.max(0, rect.x - pad), hy = Math.max(0, rect.y - pad);
  const hw = rect.w + pad * 2, hh = Math.max(24, Math.min(rect.h + pad * 2, dlgTop - 4 - hy));
  // 밝게 둘 영역 = 단추 + 그 단추가 든 판(대사창·증거 고르기·단서 창·수첩). 판 안에서도 누를 수 있는 건 단추뿐이다.
  let vx = hx, vy = hy, vr = hx + hw, vb = hy + hh;
  if (box) {
    vx = Math.max(0, Math.min(vx, box.x)); vy = Math.max(0, Math.min(vy, box.y));
    vr = Math.min(W, Math.max(vr, box.x + box.w)); vb = Math.min(H, Math.max(vb, box.y + box.h));
  }
  const vw = vr - vx, vh = vb - vy;
  // 말풍선 자리 — 그 판의 위나 아래, 빈 쪽으로. 둘 다 좁으면(사람 그림처럼 화면을 다 차지하면 말풍선이
  //   화면 위로 밀려나 아예 안 보였다) 읽기 단계는 화면 맨 아래에, 누르기 단계는 대상 위에 겹쳐 띄운다.
  const NEED = 112;
  const roomUp = vy, roomDown = H - vb;
  const lower = vy + vh / 2 > H / 2;
  const place = lower
    ? (roomUp >= NEED ? 'above' : roomDown >= NEED ? 'below' : 'dock')
    : (roomDown >= NEED ? 'below' : roomUp >= NEED ? 'above' : 'dock');
  // 복도의 목표판(🎯 할 일·장 막대) — 말풍선이 그 위를 덮었다. 아래로 내려 비켜 선다
  const hud = document.querySelector('.hall-hud-chip');
  const hudB = hud && place === 'below' ? hud.getBoundingClientRect().bottom + 8 : 0;
  const tipTop = place === 'below' ? Math.max(vb + 6, hudB) : vy - 6;
  // 화살표는 말풍선이 대상 바로 옆에 붙을 때만 — 판을 비켜 서면 엉뚱한 모서리를 가리켰다
  const arrow = place === 'below' ? tipTop === hy + hh + 6 : place === 'above' ? vy === hy : false;
  const cx = rect.x + rect.w / 2;
  const half = Math.min(230, W * 0.47); // 말풍선 반폭 — 화면 밖으로 안 나가게 클램프(말풍선 최대폭 94vw 의 절반 — 0.44 면 왼쪽이 3px 잘렸다)
  const tipLeft = Math.min(Math.max(cx, half + 8), W - half - 8);
  const capShift = tipLeft - cx; // 캡션만 화면 안으로 밀고, 화살표는 타깃 중심을 가리키게 유지
  // 건너뛰기는 말풍선 안에 — 따로 띄우면 단계 이름·심문 제목·대사창 단추를 덮었다
  const cap = (style) => (
    <div className="tut-cap" style={style}>
      {text}
      <button className={`tut-skip-in${skipArm ? ' arm' : ''}`} onClick={skip}>{skipArm ? '한 번 더 누르면 튜토리얼을 끕니다' : '튜토리얼 건너뛰기 ✕'}</button>
    </div>
  );
  // 판 안의 단추 둘레 — 보이되 누를 수는 없게(투명 막)
  const blocks = dim && box ? [
    { left: vx, top: vy, width: vw, height: Math.max(0, hy - vy) },
    { left: vx, top: hy + hh, width: vw, height: Math.max(0, vb - (hy + hh)) },
    { left: vx, top: hy, width: Math.max(0, hx - vx), height: hh },
    { left: hx + hw, top: hy, width: Math.max(0, vr - (hx + hw)), height: hh },
  ] : [];
  return (
    <div className="tut-coach">
      {dim && <>
        <div className="tut-mask" style={{ left: 0, top: 0, width: '100%', height: vy }} />
        <div className="tut-mask" style={{ left: 0, top: vb, width: '100%', height: `calc(100% - ${vb}px)` }} />
        <div className="tut-mask" style={{ left: 0, top: vy, width: vx, height: vh }} />
        <div className="tut-mask" style={{ left: vr, top: vy, width: `calc(100% - ${vr}px)`, height: vh }} />
      </>}
      {blocks.map((b, i) => <div key={i} className="tut-mask clear" style={b} />)}
      <div className="tut-ring" style={{ left: hx, top: hy, width: hw, height: hh }} />
      {place === 'dock'
        ? <div className={`tut-tip dock${dim ? ' mid' : ''}`} style={dim ? { top: 'auto', bottom: H - Math.min(dlgTop, vb) + 14 } : undefined}>{cap()}</div>
        : (
          <div className="tut-tip" style={{ left: cx, top: tipTop, transform: place === 'below' ? 'translate(-50%,0)' : 'translate(-50%,-100%)' }}>
            {place === 'below'
              ? (<>{arrow && <div className="tut-arrow up" />}{cap({ transform: `translateX(${capShift}px)` })}</>)
              : (<>{cap({ transform: `translateX(${capShift}px)` })}{arrow && <div className="tut-arrow down" />}</>)}
          </div>
        )}
    </div>
  );
}

// ── 튜토리얼 마무리 멘트 — 첫 심문까지 마치면 한 번 표시 ──
export function TutorialFinale({ onClose }) {
  return (
    <div className="tut-finale-ov">
      <div className="tut-finale">
        <div className="tf-badge">🎓 튜토리얼 완료</div>
        <h3>수사의 기본을 익혔습니다</h3>
        <p>이제 지도를 오가며 <b>용의자 6명을 모두 찾아가 조사하고 심문</b>하세요.<br />
          확보한 단서는 <b>사건 기록</b>에서 인물·유형별로 확인할 수 있습니다.<br />
          여섯 명을 <b>한 번씩 다 만나면</b> C통로 현장·공용 공간·관제실 열람대·감식 의뢰실이 열립니다.<br />
          2차 심문이 열리면 <b>사건 파일</b>을 제출해 사건을 마무리하세요.</p>
        <button className="s-btn" onClick={onClose}>수사 시작</button>
      </div>
    </div>
  );
}
