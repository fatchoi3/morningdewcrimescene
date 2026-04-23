import { useState, useEffect } from 'react';

/**
 * ManualModal
 * pages 배열이 있는 증거 아이템에 표시되는 페이지네이션 설명서 팝업.
 * 이전/다음 버튼으로 페이지를 이동하며, ESC 또는 오버레이 클릭으로 닫는다.
 */
function ManualModal({ item, onClose }) {
  const [page, setPage] = useState(0);
  const pages = item.pages;
  const total = pages.length;
  const current = pages[page];

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setPage((p) => Math.min(p + 1, total - 1));
      if (e.key === 'ArrowLeft') setPage((p) => Math.max(p - 1, 0));
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, total]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel manual-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="닫기">✕</button>

        <div className="modal-code">[{item.code}] 사용 설명서</div>

        {/* 페이지 인디케이터 */}
        <div className="manual-pagination-dots">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`manual-dot ${i === page ? 'manual-dot--active' : ''}`}
              onClick={() => setPage(i)}
              aria-label={`${i + 1}페이지`}
            />
          ))}
        </div>

        {/* 페이지 본문 */}
        <div className="manual-content">
          <h2 className="manual-title">{current.title}</h2>
          <div className="manual-body">
            {current.content.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>

        {/* 이전 / 다음 버튼 */}
        <div className="manual-nav">
          <button
            type="button"
            className="manual-nav-btn"
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
          >
            ← 이전
          </button>
          <span className="manual-page-count">{page + 1} / {total}</span>
          <button
            type="button"
            className="manual-nav-btn"
            onClick={() => setPage((p) => Math.min(p + 1, total - 1))}
            disabled={page === total - 1}
          >
            다음 →
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * StandardModal
 * 일반 증거 아이템의 이미지·설명 팝업.
 */
function StandardModal({ item, onClose }) {
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

// pages 필드 유무에 따라 ManualModal 또는 StandardModal을 선택해 렌더링
function EvidenceModal({ item, onClose }) {
  return item.pages
    ? <ManualModal item={item} onClose={onClose} />
    : <StandardModal item={item} onClose={onClose} />;
}

function EvidenceList({ evidence }) {
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');

  if (evidence.length === 0) {
    return <p>아직 수집한 증거가 없습니다. QR 코드를 스캔해 증거를 찾으세요.</p>;
  }

  const filtered = (query.trim()
    ? evidence.filter((item) => {
        const q = query.trim().toLowerCase();
        return item.code.toLowerCase().includes(q) || item.title.toLowerCase().includes(q);
      })
    : evidence
  ).slice().reverse();

  return (
    <>
      <div className="form-group" style={{ marginBottom: '4px' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="단서명 또는 코드로 검색"
        />
      </div>

      <div className="evidence-scroll">
        {filtered.length === 0 && (
          <p style={{ color: '#a9b0d9', fontSize: '0.9rem' }}>검색 결과가 없습니다.</p>
        )}
        {filtered.map((item) => (
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
