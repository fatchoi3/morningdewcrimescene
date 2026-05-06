import { useState, useEffect } from 'react';

// specialHint를 제외한 기본 필드 레이블 (specialHint는 별도 잠금 처리)
const FIELD_LABELS = {
  age: '나이',
  gender: '성별',
  occupation: '직업',
  notes: '비고'
};

/**
 * PersonModal
 * 칩 클릭 시 표시되는 인물 상세 정보 팝업.
 * unlocked가 true일 때만 specialHint를 표시한다.
 */
function PersonModal({ person, unlocked, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="닫기">✕</button>

        <div className="modal-code">{person.occupation}</div>
        <h2 className="modal-title">{person.name}</h2>

        <div className="person-fields">
          {Object.entries(FIELD_LABELS).map(([key, label]) =>
            person[key] != null ? (
              <div key={key} className="person-field">
                <span className="person-field-label">{label}</span>
                <span className="person-field-value">{person[key]}</span>
              </div>
            ) : null
          )}
        </div>

        {person.specialHint && (
          <div className={`modal-detail hint-lock ${unlocked ? 'hint-lock--open' : ''}`} style={{ marginTop: '16px' }}>
            <span className="modal-detail-label">
              특별 단서 {!unlocked && <span className="hint-lock-badge">🔒 {person.unlockedBy} 수집 필요</span>}
            </span>
            {unlocked
              ? <p>{person.specialHint}</p>
              : <p className="hint-lock-text">이 단서는 아직 잠겨 있습니다.</p>
            }
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * CommonInfo
 * 피해자와 용의자를 칩(chip) 형태로 나열하고,
 * 칩 클릭 시 PersonModal로 상세 정보를 표시한다.
 *
 * Props:
 *   victim           - 피해자 정보 객체
 *   suspects         - 용의자 정보 배열
 *   evidenceCollected - 수집된 증거 배열 (특별 단서 잠금 해제 여부 판단에 사용)
 */
function CommonInfo({ victim, suspects, evidenceCollected = [] }) {
  const [selected, setSelected] = useState(null);

  // 수집된 증거 코드 집합 — O(1) 조회를 위해 Set으로 변환
  const collectedCodes = new Set(evidenceCollected.map((e) => e.code));

  const people = [victim, ...suspects];

  return (
    <div>
      <div className="chip-list">
        {people.map((person) => (
          <button
            key={person.id}
            type="button"
            className={`chip ${person.id === victim.id ? 'chip--victim' : ''}`}
            onClick={() => setSelected(person)}
          >
            {person.name}
          </button>
        ))}
      </div>

      <p className="scan-hint" style={{ marginTop: '12px' }}>
        이름을 탭하면 상세 정보를 볼 수 있습니다.
      </p>

      {selected && (
        <PersonModal
          person={selected}
          unlocked={collectedCodes.has(selected.unlockedBy)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

export default CommonInfo;
