import { useState, useEffect } from 'react';

// 객체 키 → 한국어 레이블 매핑 (id·name은 모달 헤더에서 별도 표시하므로 제외)
const FIELD_LABELS = {
  age: '나이',
  gender: '성별',
  occupation: '직업',
  notes: '비고',
  specialHint: '특별 단서'
};

/**
 * PersonModal
 * 칩 클릭 시 표시되는 인물 상세 정보 팝업.
 * ESC 키 또는 오버레이 클릭으로 닫을 수 있다.
 */
function PersonModal({ person, onClose }) {
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
          <div className="modal-detail" style={{ marginTop: '16px' }}>
            <span className="modal-detail-label">특별 단서</span>
            <p>{person.specialHint}</p>
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
 *   victim   - 피해자 정보 객체
 *   suspects - 용의자 정보 배열
 */
function CommonInfo({ victim, suspects }) {
  const [selected, setSelected] = useState(null);

  // 피해자를 맨 앞에 두고 용의자를 이어 붙인 전체 인물 목록
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
        <PersonModal person={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

export default CommonInfo;
