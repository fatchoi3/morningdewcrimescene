import { useState, useEffect } from 'react';

function EvidenceModal({ item, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="닫기">✕</button>
        <div className="modal-code">[{item.code}]</div>
        <h2 className="modal-title">{item.title}</h2>

        {item.image && (
          <div className="modal-image-wrap">
            <img src={item.image} alt={item.title} className="modal-image" />
          </div>
        )}

        <p className="modal-description">{item.description}</p>
        <div className="modal-detail">
          <span className="modal-detail-label">추가 정보</span>
          <p>{item.detail}</p>
        </div>
      </div>
    </div>
  );
}

function EvidenceList({ evidence }) {
  const [selected, setSelected] = useState(null);

  if (evidence.length === 0) {
    return <p>아직 수집한 증거가 없습니다. QR 코드를 스캔해 증거를 찾으세요.</p>;
  }

  return (
    <>
      <div>
        {evidence.map((item) => (
          <div
            key={item.code}
            className="evidence-item evidence-item--clickable"
            onClick={() => setSelected(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setSelected(item)}
          >
            <div className="evidence-code">[{item.code}] {item.title}</div>
            <div>{item.description}</div>
            <div className="evidence-tap-hint">탭하여 자세히 보기 →</div>
          </div>
        ))}
      </div>

      {selected && (
        <EvidenceModal item={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

export default EvidenceList;
