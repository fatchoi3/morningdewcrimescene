// ─────────────────────────────────────────────────────────────────────────────
// features/record — 사건 기록(수첩): 맨 위 사건 개요 + 단서 정보 / 인물 정보 / 대화 기록 / 메모.
//   CaseRecord가 진입점. 내부에서 ClueGroups·PeopleInfo(PersonCard)·TalkLog를 조립한다.
//   (새벽이슬·야간조 두 게임이 같은 파일을 한 벌씩 쓴다 — 고치면 둘 다 고친다)
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { victim, suspects, briefing } from '../content.js';
import { Avatar } from '../art.jsx';

// ── 사건 개요 — 브리핑을 건너뛰면 사건을 다시 볼 곳이 없었다(2026-09-30 시험: 세 사람 모두) ──
function CaseBrief({ defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const lines = briefing?.lines || [];
  return (
    <div className="s-brief" data-tut="brief">
      <button className="s-brief-h" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>📋 사건 개요 · 피해자 {victim.name}{victim.age ? `(${victim.age})` : ''}</span>
        <span className="s-brief-t">{open ? '접기 ▲' : '펼치기 ▼'}</span>
      </button>
      {open && (
        <div className="s-brief-b">
          {briefing?.subtitle && <p className="s-brief-sub">{briefing.subtitle}</p>}
          {lines.map((l, i) => <p key={i}>{l}</p>)}
        </div>
      )}
    </div>
  );
}

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

// ── 단서 목록(인물별 그룹 하나로 통합, 특수/감식은 카드 테두리로 구분) ──
//   ⭐·🔬 는 예전엔 눌러도 걸러지지 않는 범례였다 — 이제 실제로 거른다.
const FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'special', label: '⭐ 추리', test: (c) => c.type === '특수' },
  { id: 'gamsik', label: '🔬 감식', test: (c) => c.type === '감식' },
  { id: 'talk', label: '🗣 증언', test: (c) => c.type === '증언' },
];
function ClueGroups({ clues, onOpen }) {
  const [f, setF] = useState('all');
  const ft = FILTERS.find((x) => x.id === f);
  const shown = ft?.test ? clues.filter(ft.test) : clues;
  const groups = {};
  shown.forEach((c) => { (groups[c.person || '공용'] ||= []).push(c); });
  const cardCls = (c) => 's-card' + (c.type === '특수' ? ' clue-special' : c.type === '감식' ? ' clue-gamsik' : '');
  return (
    <>
      {clues.length === 0 && <p style={{ color: 'var(--muted)' }}>아직 단서가 없습니다. 현장을 조사하세요.</p>}
      {clues.length > 0 && (
        <div className="s-clue-filter">
          {FILTERS.filter((x) => !x.test || clues.some(x.test)).map((x) => (
            <button key={x.id} className={f === x.id ? 'on' : ''} onClick={() => setF(x.id)}>
              {x.label} {x.test ? clues.filter(x.test).length : clues.length}
            </button>
          ))}
        </div>
      )}
      {Object.keys(groups).sort().map((g) => (
        <div key={g} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '.78rem', color: 'var(--muted)', margin: '8px 2px 4px' }}>{g} · {groups[g].length}</div>
          <div className="s-grid">
            {groups[g].map((c) => (
              <button key={c.code} className={cardCls(c)} onClick={() => onOpen(c.code)}>
                <div className="cn" style={{ fontSize: '.9rem' }}>{c.title}</div>
                <div className="cm">{c.type || '보통'}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// ── 대화 기록 — 인물별로 들은 말(질문 · 대답 · 캐묻기 · 반박)을 들은 순서대로 ──
//   캐묻기로 나온 말은 한 번 넘기면 다시 볼 길이 없었다(2026-09-30 시험).
const LOG_MARK = { answer: '💬', press: '🔎', topic: '📁', break: '❗', soft: '〰' };
function TalkLog({ talkLog }) {
  const people = suspects.filter((s) => (talkLog?.[s.id] || []).length > 0);
  const [who, setWho] = useState(people[0]?.id || null);
  if (!people.length) return <p style={{ color: 'var(--muted)' }}>아직 들은 말이 없습니다. 심문을 하면 여기에 쌓입니다.</p>;
  const cur = people.find((p) => p.id === who) || people[0];
  const rows = talkLog[cur.id] || [];
  return (
    <>
      <div className="s-clue-filter">
        {people.map((p) => (
          <button key={p.id} className={cur.id === p.id ? 'on' : ''} onClick={() => setWho(p.id)}>{p.name} {(talkLog[p.id] || []).length}</button>
        ))}
      </div>
      <div className="s-talklog">
        {rows.map((r, i) => (
          <div key={i} className={`s-talklog-row ${r.kind || ''}`}>
            <div className="tq">{LOG_MARK[r.kind] || '💬'} {r.q}{r.phase >= 2 ? ' · 2차' : ''}</div>
            <div className="ta">{r.a}</div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── 사건 기록 — 사건 개요 / 단서 정보 / 인물 정보 / 대화 기록 / 메모 ──
export function CaseRecord({ clues, onOpen, notes, onNotes, talkLog, briefOpen }) {
  const [tab, setTab] = useState('clues'); // clues | people | talk | notes
  const hasNotes = typeof onNotes === 'function';
  const talkCount = Object.values(talkLog || {}).reduce((n, a) => n + a.length, 0);
  return (
    <>
      <CaseBrief defaultOpen={briefOpen} />
      <div className="s-record-tabs">
        <button className={tab === 'clues' ? 'on' : ''} onClick={() => setTab('clues')}>단서 ({clues.length})</button>
        <button className={tab === 'people' ? 'on' : ''} onClick={() => setTab('people')}>인물</button>
        <button className={tab === 'talk' ? 'on' : ''} onClick={() => setTab('talk')}>대화 기록{talkCount ? ` (${talkCount})` : ''}</button>
        {hasNotes && <button className={tab === 'notes' ? 'on' : ''} onClick={() => setTab('notes')}>메모</button>}
      </div>
      {tab === 'clues' && <ClueGroups clues={clues} onOpen={onOpen} />}
      {tab === 'people' && <PeopleInfo />}
      {tab === 'talk' && <TalkLog talkLog={talkLog} />}
      {tab === 'notes' && hasNotes && (
        <textarea value={notes || ''} onChange={(e) => onNotes(e.target.value)} placeholder="추리 메모를 자유롭게 적으세요…"
          style={{ width: '100%', minHeight: 160, marginTop: 8, background: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 10, padding: 12, fontFamily: 'inherit', fontSize: '.95rem' }} />
      )}
    </>
  );
}
