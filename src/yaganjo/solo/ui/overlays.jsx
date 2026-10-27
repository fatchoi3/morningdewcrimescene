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
  const sync = () => {
    const el = boxRef.current;
    if (!el) return;
    // 남은 스크롤이 아니라 마지막 내용의 아래 끝으로 잰다 — 본문 아래 여백만 남았는데도 떠서 밀어 봐도 새 글이 없었다(17회차 둘)
    const last = el.lastElementChild;
    const hidden = last ? last.getBoundingClientRect().bottom - el.getBoundingClientRect().bottom : el.scrollHeight - el.scrollTop - el.clientHeight;
    setMore(hidden > 40);
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
      {/* 본문만 밀린다(머리·바닥 줄은 고정) — 「▼ 아래에 더 있어요」가 본문 글자 위에 겹쳤다(튜토리얼 3차, 셋 다). 바닥 줄은 본문 밖이다. */}
      <div className="s-modal" onClick={(e) => e.stopPropagation()}>
        <div className="s-modal-h"><div className="mt">{title}</div><button className="mx" onClick={onClose}>✕</button></div>
        <div className="s-modal-b" ref={boxRef} onScroll={sync}>{children}</div>
        {more && <div className="s-modal-more" aria-hidden="true">▼ 아래에 더 있어요</div>}
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
