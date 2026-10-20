// ─────────────────────────────────────────────────────────────────────────────
// ui/overlays — 공용 오버레이 껍데기.
//   Shell        : 단서 열람용 중앙 모달(ESC 닫기)
//   SheetOverlay : 전체 화면 시트(수첩·범인 지목 공용, ESC 닫기)
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';

export function Shell({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  // 아래에 글이 더 있으면 「▼ 아래에 더 있어요」 — 글이 창 끝에 딱 맞게 끊기면 다 읽은 줄 알았다(튜토리얼 2차).
  //   옅은 그림자는 아무도 못 봤다. 끝까지 밀면 사라진다. 그림이 늦게 와 높이가 바뀌어도 다시 잰다.
  const boxRef = useRef(null);
  const [more, setMore] = useState(false);
  const [lift, setLift] = useState(0); // 튜토리얼 말풍선이 창 아래를 덮고 있으면 그만큼 위로
  const sync = () => {
    const el = boxRef.current;
    if (!el) return;
    setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 24);
    const dock = document.querySelector('.tut-tip.dock');
    // sticky 는 창의 아래 여백(튜토리얼 동안 120px) 위에서 멈추므로 그만큼은 빼고 모자란 만큼만
    const pb = parseFloat(getComputedStyle(el).paddingBottom) || 0;
    setLift(dock ? Math.max(0, Math.round(el.getBoundingClientRect().bottom - dock.getBoundingClientRect().top + 6 - pb)) : 0);
  };
  useEffect(() => {
    sync();
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(sync);
    [...el.children].forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  }, [children]);
  return (
    <div className="s-modal-ov" onClick={onClose}>
      <div className="s-modal" ref={boxRef} onScroll={sync} onClick={(e) => e.stopPropagation()}>
        <div className="s-modal-h"><div className="mt">{title}</div><button className="mx" onClick={onClose}>✕</button></div>
        <div className="s-modal-b">{children}</div>
        {more && <div className="s-modal-more" aria-hidden="true" style={lift ? { bottom: lift } : undefined}>▼ 아래에 더 있어요</div>}
      </div>
    </div>
  );
}

// ── 전체 화면 시트 오버레이(수첩·범인 지목 공용) ──
export function SheetOverlay({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="s-sheet">
      <div className="s-sheet-head">
        <button className="s-sheet-back" onClick={onClose} aria-label="닫기">←</button>
        <div className="s-sheet-title">{title}</div>
      </div>
      <div className="s-sheet-body">{children}</div>
    </div>
  );
}
