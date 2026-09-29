// ─────────────────────────────────────────────────────────────────────────────
// features/casefile — 사건 파일(최종 제출): 범인 한 명을 확정한 뒤 그 사람의 수법·동기 → 채점/엔딩.
//   정답/오답은 범인으로 가른다. 수법·동기는 범인을 맞혔을 때만 따로 ✓/✗ 로 매긴다.
//   선택지는 정답표(caseKey.methods)가 아니라 살해 가설 목록(caseKey.choiceMethods)이다 —
//   정답표를 그대로 보이면 다섯 구멍의 요약이 되어 지워 나가기만 해도 풀렸다(3회차 #1).
//   범인을 「확정」하기 전에는 목록을 띄우지 않는다. 목록을 먼저 훑어 힌트로 쓰지 못하게.
// ─────────────────────────────────────────────────────────────────────────────
import { suspects, soloContent } from '../content.js';
import { Avatar } from '../art.jsx';

const METHODS = soloContent.caseKey.choiceMethods;
const MOTIVES = soloContent.caseKey.choiceMotives;

function Choice({ title, items, value, onPick }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div className="s-eye" style={{ marginBottom: 8 }}>{title}</div>
      <div className="s-accuse-list">
        {items.map((m) => (
          <button key={m.id} className={`s-accuse-row${value === m.id ? ' on' : ''}`} onClick={() => onPick(m.id)}>
            <div className="ar-body"><div className="ar-occ" style={{ fontSize: '.86rem', color: 'var(--text)', marginTop: 0, lineHeight: 1.55 }}>{m.label}</div></div>
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
  const locked = !!(pick && cf.locked);
  const ready = locked && cf.method && cf.motive;
  const set = (patch) => onPick({ ...cf, ...patch });
  const picked = suspects.find((s) => s.id === pick);
  return (
    <>
      <p style={{ color: 'var(--muted)', lineHeight: 1.7, margin: '0 0 14px' }}>
        모은 단서와 심문을 근거로, 이 사건의 <b style={{ color: 'var(--text)' }}>범인</b>을 한 명 확정하고
        그 사람이 <b style={{ color: 'var(--text)' }}>어떻게</b>, <b style={{ color: 'var(--text)' }}>왜</b> 했는지 고르세요.
        제출하면 사건이 종결되고 전말이 공개됩니다.
      </p>
      {!locked ? (
        <>
          <div className="s-accuse-list">
            {suspects.map((s) => (
              <button key={s.id} className={`s-accuse-row${pick === s.id ? ' on' : ''}`} onClick={() => set({ culprit: s.id, method: null, motive: null })}>
                <Avatar person={s.name} image={s.image} size={44} />
                <div className="ar-body"><div className="ar-name">{s.name}</div><div className="ar-occ">{s.occupation}</div></div>
                <span className="ar-radio">{pick === s.id ? '◉' : '○'}</span>
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', margin: '20px 0 4px' }}>
            <button className="s-btn" disabled={!pick} style={!pick ? { opacity: 0.5 } : {}} onClick={() => set({ locked: true })}>
              {pick ? `${picked?.name} — 이 사람으로 확정 →` : '범인을 지목하세요'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="s-accuse-row on" style={{ cursor: 'default' }}>
            <Avatar person={picked?.name} image={picked?.image} size={44} />
            <div className="ar-body"><div className="ar-name">{picked?.name}</div><div className="ar-occ">범인으로 확정</div></div>
            {/* 수법·동기를 하나라도 고른 뒤에는 되돌릴 수 없다 — 확정해 두고 목록만 훑은 뒤 다시 고르는 길을 막는다(4회차 #12) */}
            {!cf.method && !cf.motive && <button className="s-link" onClick={() => set({ locked: false, method: null, motive: null })}>다시 고르기</button>}
          </div>
          <Choice title="수법 — 어떻게 죽였는가" items={METHODS} value={cf.method} onPick={(id) => set({ method: id })} />
          <Choice title="동기 — 왜 죽였는가" items={MOTIVES} value={cf.motive} onPick={(id) => set({ motive: id })} />
          <div style={{ textAlign: 'center', margin: '20px 0 4px' }}>
            <button className="s-btn" disabled={!ready} style={!ready ? { opacity: 0.5 } : {}} onClick={onSubmit}>
              {ready ? '사건 파일 제출 →' : '수법과 동기를 고르세요'}
            </button>
          </div>
        </>
      )}
    </>
  );
}
