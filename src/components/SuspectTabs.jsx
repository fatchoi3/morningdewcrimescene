import { useState, useEffect } from 'react';

const FIELD_LABELS = {
  age: '나이',
  gender: '성별',
  occupation: '직업',
  family: '가족관계',
  notes: '비고'
};

/**
 * PersonAvatar
 * 인물 사진을 표시한다. 사진이 없거나 로드에 실패하면
 * 이름 첫 글자로 된 아바타로 대체한다.
 */
function PersonAvatar({ person, isVictim = false, size = 'md' }) {
  const [errored, setErrored] = useState(false);
  const showFallback = !person.image || errored;
  const cls = `person-photo person-photo--${size}${isVictim ? ' person-photo--victim' : ''}`;

  return (
    <div className={cls}>
      {showFallback ? (
        <span className="person-photo-initial">{person.name?.[0] ?? '?'}</span>
      ) : (
        <img
          src={person.image}
          alt={person.name}
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}

function PersonModal({ person, isVictim, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="닫기">✕</button>

        <div className="person-photo-wrap">
          <PersonAvatar person={person} isVictim={isVictim} size="lg" />
        </div>

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
        {people.map((person) => {
          const isVictim = person.id === victim.id;
          return (
            <button
              key={person.id}
              type="button"
              className={`chip ${isVictim ? 'chip--victim' : ''}`}
              onClick={() => setSelected(person)}
            >
              <PersonAvatar person={person} isVictim={isVictim} size="sm" />
              {person.name}
            </button>
          );
        })}
      </div>

      <p className="scan-hint" style={{ marginTop: '12px' }}>
        이름을 탭하면 사진과 상세 정보를 볼 수 있습니다.
      </p>

      {selected && (
        <PersonModal
          person={selected}
          isVictim={selected.id === victim.id}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

export default CommonInfo;
