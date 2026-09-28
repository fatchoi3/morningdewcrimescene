// ─────────────────────────────────────────────────────────────────────────────
// features/casefile — 사건 파일(최종 제출): 범인 한 명 + 그 사람의 수법·동기 → 채점/엔딩.
//   정답/오답은 범인으로만 가른다. 수법·동기는 엔딩에 따로 ✓/✗ 로 보인다 —
//   셋을 세우지 않고 이름만 찍어도 「정답」이 되던 것(2회차 시뮬레이션 #39)을 드러내려는 것.
// ─────────────────────────────────────────────────────────────────────────────
import { suspects, soloContent } from '../content.js';
import { Avatar } from '../art.jsx';

// 선택지는 여섯 사람의 수법·동기를 다 섞어 둔다(「무관」 둘은 범인에게 해당이 없어 뺀다)
const METHODS = soloContent.caseKey.methods.filter((m) => m.id !== 'm_none');
const MOTIVES = soloContent.caseKey.motives.filter((m) => m.id !== 'mo_none');

function Choice({ title, items, value, onPick }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div className="s-eye" style={{ marginBottom: 8 }}>{title}</div>
      <div className="s-accuse-list">
        {items.map((m) => (
          <button key={m.id} className={`s-accuse-row${value === m.id ? ' on' : ''}`} onClick={() => onPick(m.id)}>
            <div className="ar-body"><div className="ar-occ" style={{ fontSize: '.86rem', color: 'var(--text)', marginTop: 0 }}>{m.label}</div></div>
            <span className="ar-radio">{value === m.id ? '◉' : '○'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 사건 파일(최종 제출) ──
export function CaseFileView({ state, onPick, onSubmit }) {
  const cf = state.casefile || {};
  const pick = cf.culprit || null;
  const ready = pick && cf.method && cf.motive;
  const set = (patch) => onPick({ ...cf, ...patch });
  return (
    <>
      <p style={{ color: 'var(--muted)', lineHeight: 1.7, margin: '0 0 14px' }}>
        모은 단서와 심문을 근거로, 이 사건의 <b style={{ color: 'var(--text)' }}>범인</b>을 한 명 지목하고
        그 사람이 <b style={{ color: 'var(--text)' }}>어떻게</b>, <b style={{ color: 'var(--text)' }}>왜</b> 했는지 고르세요.
        제출하면 사건이 종결되고 전말이 공개됩니다.
      </p>
      <div className="s-accuse-list">
        {suspects.map((s) => (
          <button key={s.id} className={`s-accuse-row${pick === s.id ? ' on' : ''}`} onClick={() => set({ culprit: s.id })}>
            <Avatar person={s.name} image={s.image} size={44} />
            <div className="ar-body"><div className="ar-name">{s.name}</div><div className="ar-occ">{s.occupation}</div></div>
            <span className="ar-radio">{pick === s.id ? '◉' : '○'}</span>
          </button>
        ))}
      </div>
      {pick && <Choice title="수법 — 범인이 한 일" items={METHODS} value={cf.method} onPick={(id) => set({ method: id })} />}
      {pick && <Choice title="동기 — 범인이 그렇게 한 까닭" items={MOTIVES} value={cf.motive} onPick={(id) => set({ motive: id })} />}
      <div style={{ textAlign: 'center', margin: '20px 0 4px' }}>
        <button className="s-btn" disabled={!ready} style={!ready ? { opacity: 0.5 } : {}} onClick={onSubmit}>
          {ready ? '사건 파일 제출 →' : !pick ? '범인을 지목하세요' : '수법과 동기를 고르세요'}
        </button>
      </div>
    </>
  );
}
