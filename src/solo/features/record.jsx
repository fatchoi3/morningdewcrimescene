// ─────────────────────────────────────────────────────────────────────────────
// features/record — 사건 기록(수첩): 단서 정보 / 인물 정보 / 메모.
//   CaseRecord가 진입점. 내부에서 ClueGroups·PeopleInfo(PersonCard)를 조립한다.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { victim, suspects } from '../content.js';
import { Avatar } from '../art.jsx';

// ── 인물 카드(피해자/용의자 프로필) ──
function PersonCard({ p, role }) {
  return (
    <div className="s-person-card">
      <Avatar person={p.name} image={p.image} size={56} />
      <div className="pc-body">
        <div className="pc-name">{p.name} <span className="s-tag">{p.occupation}</span>{role && <span className="s-tag danger">{role}</span>}</div>
        <div className="pc-meta">{[p.age ? `${p.age}세` : '', p.gender, p.family].filter(Boolean).join(' · ')}</div>
        <div className="pc-notes">{p.notes || p.detail || ''}</div>
      </div>
    </div>
  );
}

function PeopleInfo() {
  return (
    <>
      <div className="s-section-t">피해자</div>
      <PersonCard p={victim} role="피해자" />
      <div className="s-section-t">용의자 ({suspects.length})</div>
      {suspects.map((s) => <PersonCard key={s.id} p={s} />)}
    </>
  );
}

// ── 단서 목록(인물별/유형별 전환) ──
function ClueGroups({ clues, onOpen }) {
  const [mode, setMode] = useState('person'); // person | type
  const keyOf = (c) => (mode === 'person' ? (c.person || '공용') : (c.type || '보통'));
  const groups = {};
  clues.forEach((c) => { (groups[keyOf(c)] ||= []).push(c); });
  return (
    <>
      <div className="s-seg">
        <button className={mode === 'person' ? 'on' : ''} onClick={() => setMode('person')}>인물별</button>
        <button className={mode === 'type' ? 'on' : ''} onClick={() => setMode('type')}>유형별</button>
      </div>
      {clues.length === 0 && <p style={{ color: 'var(--muted)' }}>아직 단서가 없습니다. 현장을 조사하세요.</p>}
      {Object.keys(groups).sort().map((g) => (
        <div key={g} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '.78rem', color: 'var(--muted)', margin: '8px 2px 4px' }}>{g} · {groups[g].length}</div>
          <div className="s-grid">
            {groups[g].map((c) => (
              <button key={c.code} className="s-card" onClick={() => onOpen(c.code)}>
                <div className="cn" style={{ fontSize: '.9rem' }}>{c.title}</div>
                <div className="cm">{mode === 'person' ? (c.type || '보통') : (c.person || '공용')}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// ── 사건 기록 — 단서 정보 / 인물 정보 / 메모 ──
export function CaseRecord({ clues, onOpen, notes, onNotes }) {
  const [tab, setTab] = useState('clues'); // clues | people | notes
  const hasNotes = typeof onNotes === 'function';
  return (
    <>
      <div className="s-record-tabs">
        <button className={tab === 'clues' ? 'on' : ''} onClick={() => setTab('clues')}>단서 정보 ({clues.length})</button>
        <button className={tab === 'people' ? 'on' : ''} onClick={() => setTab('people')}>인물 정보</button>
        {hasNotes && <button className={tab === 'notes' ? 'on' : ''} onClick={() => setTab('notes')}>메모</button>}
      </div>
      {tab === 'clues' && <ClueGroups clues={clues} onOpen={onOpen} />}
      {tab === 'people' && <PeopleInfo />}
      {tab === 'notes' && hasNotes && (
        <textarea value={notes || ''} onChange={(e) => onNotes(e.target.value)} placeholder="추리 메모를 자유롭게 적으세요…"
          style={{ width: '100%', minHeight: 160, marginTop: 8, background: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 10, padding: 12, fontFamily: 'inherit', fontSize: '.95rem' }} />
      )}
    </>
  );
}
