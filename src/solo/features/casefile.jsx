// ─────────────────────────────────────────────────────────────────────────────
// features/casefile — 사건 파일(최종 제출): 범인 한 명만 지목 → 채점/엔딩.
// ─────────────────────────────────────────────────────────────────────────────
import { suspects } from '../content.js';
import { Avatar } from '../art.jsx';

// ── 사건 파일(최종 제출) — 범인 한 명만 지목 ──
export function CaseFileView({ state, onPick, onSubmit }) {
  const pick = state.casefile?.culprit || null;
  return (
    <>
      <p style={{ color: 'var(--muted)', lineHeight: 1.7, margin: '0 0 14px' }}>
        모은 단서와 심문을 근거로, 이 사건의 <b style={{ color: 'var(--text)' }}>범인</b>을 한 명 지목하세요.
        제출하면 사건이 종결되고 전말이 공개됩니다.
      </p>
      <div className="s-accuse-list">
        {suspects.map((s) => (
          <button key={s.id} className={`s-accuse-row${pick === s.id ? ' on' : ''}`} onClick={() => onPick(s.id)}>
            <Avatar person={s.name} image={s.image} size={44} />
            <div className="ar-body"><div className="ar-name">{s.name}</div><div className="ar-occ">{s.occupation}</div></div>
            <span className="ar-radio">{pick === s.id ? '◉' : '○'}</span>
          </button>
        ))}
      </div>
      <div style={{ textAlign: 'center', margin: '20px 0 4px' }}>
        <button className="s-btn" disabled={!pick} style={!pick ? { opacity: 0.5 } : {}} onClick={onSubmit}>
          {pick ? '사건 파일 제출 →' : '범인을 지목하세요'}
        </button>
      </div>
    </>
  );
}
