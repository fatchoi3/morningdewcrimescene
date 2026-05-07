import { useState, useEffect } from 'react';

const FIELD_LABELS = {
  age: '나이',
  gender: '성별',
  occupation: '직업',
  notes: '비고'
};

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
      </div>
    </div>
  );
}

function CommonInfo({ victim, suspects }) {
  const [selected, setSelected] = useState(null);

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
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

export default CommonInfo;
