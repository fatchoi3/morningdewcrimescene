import { useEffect, useState } from 'react';

/**
 * WalletModal
 * 지갑 단서. 핸드폰처럼 클릭해서 내용물(사진·카드·신분증 등)을 하나씩 열어본다.
 *
 * item.wallet = {
 *   owner: '세린의 지갑',
 *   items: [{ label, detail, image?, icon? }]
 * }
 */
function WalletModal({ item, onClose }) {
  const [openIdx, setOpenIdx] = useState(null);
  const wallet = item.wallet || {};
  const items = wallet.items || [];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (openIdx !== null) setOpenIdx(null);
        else onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, openIdx]);

  const detail = openIdx !== null ? items[openIdx] : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="닫기">✕</button>
        <div className="wallet-titlebar">👛 {wallet.owner || item.title}</div>

        {detail ? (
          <div className="wallet-detail">
            <button className="wallet-back" onClick={() => setOpenIdx(null)}>← 지갑으로</button>
            {detail.image && (
              <div className="wallet-detail-img">
                <img src={detail.image} alt={detail.label} />
              </div>
            )}
            <h3 className="wallet-detail-title">{detail.label}</h3>
            <p className="wallet-detail-text">{detail.detail}</p>
          </div>
        ) : (
          <>
            <p className="wallet-help">지갑 속 항목을 눌러 확인하세요.</p>
            <div className="wallet-items">
              {items.map((it, i) => (
                <button key={i} className="wallet-item" onClick={() => setOpenIdx(i)}>
                  <span className="wallet-item-thumb">
                    {it.image
                      ? <img src={it.image} alt={it.label} />
                      : <span className="wallet-item-icon">{it.icon || '🗂️'}</span>}
                  </span>
                  <span className="wallet-item-label">{it.label}</span>
                  <span className="wallet-item-go">›</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default WalletModal;
