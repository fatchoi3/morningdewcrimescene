import { useState, useEffect } from 'react';
import PhoneModal from './PhoneModal.jsx';
import CctvModal from './CctvModal.jsx';
import WalletModal from './WalletModal.jsx';
import ScheduleModal from './ScheduleModal.jsx';

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

        <div className="modal-code">[{item.code}] {item.title || '사용 설명서'}</div>

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
          {current.image && (
            <div className="manual-image-wrap">
              <img src={current.image} alt={current.title} className="manual-image" />
            </div>
          )}
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

// 사진 N회 터치 이벤트의 영구 저장소 (localStorage)
const TAP_STORE = 'crimescene_tapReveal';
function readTapDone() {
  try { return JSON.parse(localStorage.getItem(TAP_STORE) || '{}'); }
  catch { return {}; }
}

/**
 * StandardModal
 * 일반 증거 아이템의 이미지·설명 팝업.
 * item.tapReveal = { taps, text } 가 있으면 사진을 taps회 터치 시 숨은 이벤트가
 * 표시되고, 그 상태가 localStorage에 영구 저장된다.
 */
function StandardModal({ item, onClose }) {
  const reveal = item.tapReveal;
  const [taps, setTaps] = useState(0);
  const [revealed, setRevealed] = useState(() => (reveal ? !!readTapDone()[item.code] : false));

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const need = reveal?.taps || 5;
  const handleImgTap = () => {
    if (!reveal || revealed) return;
    const n = taps + 1;
    setTaps(n);
    if (n >= need) {
      setRevealed(true);
      try {
        const d = readTapDone();
        d[item.code] = true;
        localStorage.setItem(TAP_STORE, JSON.stringify(d));
      } catch { /* 저장 실패는 무시 */ }
    }
  };

  const tappable = reveal && !revealed;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="닫기">✕</button>
        <div className="modal-code">[{item.code}]</div>
        <h2 className="modal-title">{item.title}</h2>

        {item.image && (
          <div
            className="modal-image-wrap"
            onClick={handleImgTap}
            style={tappable ? { cursor: 'pointer' } : undefined}
            title={tappable ? '사진을 살펴보세요' : undefined}
          >
            <img
              src={revealed && reveal?.image ? reveal.image : item.image}
              alt={item.title}
              className="modal-image"
            />
          </div>
        )}

        <p className="modal-description">{item.description}</p>
        <div className="modal-detail">
          <span className="modal-detail-label">추가 정보</span>
          <p>{item.detail}</p>
        </div>

        {revealed && (
          <div className="modal-event">
            <span className="modal-event-label">⚠️ 발견</span>
            <p>{reveal.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// cctv > wallet > schedule > phone > pages > 기본 순으로 적절한 모달을 선택해 렌더링
function EvidenceModal({ item, evidence, onCollect, onClose }) {
  if (item.cctv) return <CctvModal item={item} evidence={evidence} onCollect={onCollect} onClose={onClose} />;
  if (item.wallet) return <WalletModal item={item} onClose={onClose} />;
  if (item.schedule) return <ScheduleModal item={item} onClose={onClose} />;
  if (item.phone) return <PhoneModal item={item} onClose={onClose} />;
  if (item.pages) return <ManualModal item={item} onClose={onClose} />;
  return <StandardModal item={item} onClose={onClose} />;
}

function EvidenceList({ evidence, specialUnlockKey = 0, onCollect }) {
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('normal'); // 'normal' | 'special'

  if (evidence.length === 0) {
    return <p>아직 수집한 증거가 없습니다. QR 코드를 스캔해 증거를 찾으세요.</p>;
  }

  // 보통 단서와 특수 단서 분리
  const normalEvidence = evidence.filter((item) => item.type === '보통');
  const specialEvidence = evidence.filter((item) => item.type === '특수');

  // 특수 단서 해금 여부 확인.
  // unlockedBy에 적힌 선행 단서를 모두 보유하면 해금된다.
  // (선행 단서가 2개면 2개 모두, 1개면 1개만 — 가이드의 단일 트리거 특수 단서 대응)
  const isSpecialUnlocked = (special) => {
    if (!special.unlockedBy || special.unlockedBy.length === 0) return true;
    const need = Math.min(2, special.unlockedBy.length);
    const unlockedCount = special.unlockedBy.filter((code) =>
      evidence.some((item) => item.code === code)
    ).length;
    return unlockedCount >= need;
  };

  // 현재 필터에 따라 표시할 증거 결정
  const displayEvidence = filterType === 'normal' ? normalEvidence : specialEvidence;

  const filtered = (query.trim()
    ? displayEvidence.filter((item) => {
        const q = query.trim().toLowerCase();
        return (
          item.code.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          (item.person && item.person.toLowerCase().includes(q))
        );
      })
    : displayEvidence
  ).slice().reverse();

  return (
    <>
      {/* 보통/특수 단서 필터 탭 */}
      <div className="tab-list evidence-tabs" style={{ marginBottom: '12px' }}>
        <button
          type="button"
          className={`tab-button ${filterType === 'normal' ? 'active' : ''}`}
          onClick={() => setFilterType('normal')}
        >
          보통 단서 ({normalEvidence.length})
        </button>
        <button
          key={specialUnlockKey}
          type="button"
          className={`tab-button ${filterType === 'special' ? 'active' : ''}${specialUnlockKey > 0 ? ' tab-button--sparkle' : ''}`}
          onClick={() => setFilterType('special')}
        >
          특수 단서 ({specialEvidence.length})
        </button>
      </div>

      <div className="form-group" style={{ marginBottom: '4px' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="단서명, 코드 또는 인물로 검색"
        />
      </div>

      <div className="evidence-scroll">
        {filtered.length === 0 && (
          <p style={{ color: '#666666', fontSize: '0.9rem' }}>
            {filterType === 'special'
              ? '아직 해금된 특수 단서가 없습니다. 관련 보통 단서 2개를 모두 수집하면 자동으로 해금됩니다.'
              : '검색 결과가 없습니다.'}
          </p>
        )}
        {filtered.map((item) => {
          const unlocked = filterType === 'normal' || isSpecialUnlocked(item);

          return (
            <div
              key={item.code}
              className={`evidence-item evidence-item--clickable ${!unlocked ? 'evidence-item--locked' : ''}`}
              onClick={() => unlocked && setSelected(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && unlocked && setSelected(item)}
              style={{ opacity: unlocked ? 1 : 0.6, cursor: unlocked ? 'pointer' : 'not-allowed' }}
            >
              <div className="evidence-code">
                {unlocked ? `[${item.code}]` : '🔒'} {item.title}
                {unlocked && item.person && (
                  <span className="evidence-person">{item.person}</span>
                )}
              </div>
              {unlocked && <div className="evidence-tap-hint">탭하여 자세히 보기 →</div>}
            </div>
          );
        })}
      </div>

      {selected && (
        <EvidenceModal
          item={selected}
          evidence={evidence}
          onCollect={onCollect}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

export default EvidenceList;
