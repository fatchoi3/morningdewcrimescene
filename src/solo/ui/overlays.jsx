// ─────────────────────────────────────────────────────────────────────────────
// ui/overlays — 공용 오버레이 껍데기.
//   Shell        : 단서 열람용 중앙 모달(ESC 닫기)
//   SheetOverlay : 전체 화면 시트(수첩·범인 지목 공용, ESC 닫기)
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect } from 'react';

export function Shell({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="s-modal-ov" onClick={onClose}>
      <div className="s-modal" onClick={(e) => e.stopPropagation()}>
        <div className="s-modal-h"><div className="mt">{title}</div><button className="mx" onClick={onClose}>✕</button></div>
        <div className="s-modal-b">{children}</div>
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
