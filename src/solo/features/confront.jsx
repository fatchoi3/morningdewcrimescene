// ─────────────────────────────────────────────────────────────────────────────
// features/confront — 대질: 범인을 맞힌 뒤 결정적 증거 한 장을 내민다.
//   감·소거법으로 찍어도 맞힐 수 있었다 — 「증거로 몰아붙이는 맛이 없다」(2026-10-01 시험).
//   정본: 진범은 살인을 끝까지 부인한다. 그래서 대질은 자백이 아니라 「말을 잃는」 데서 끝나고,
//   수사 노트 한 줄이 못을 박는다. 틀리면 한 번 더 — 두 번째도 틀리면 그대로 결말.
//   대사·정답은 lib/game.js 의 CONFRONT. (새벽이슬·야간조 두 게임이 같은 파일을 한 벌씩 쓴다)
// ─────────────────────────────────────────────────────────────────────────────
import { useRef, useState } from 'react';
import { suspects, soloContent } from '../content.js';
import { CONFRONT, isUiTap } from '../lib/game.js';
import { StandingFigure } from '../art.jsx';
import { DialogueBox } from '../vn.jsx';

const MAX_TRIES = 2;
const chipStyle = (on) => ({
  flex: 'none', background: on ? '#241f14' : '#ffffff10',
  border: `1px solid ${on ? 'var(--gold)' : '#ffffff2e'}`, color: on ? '#ffe9a8' : '#cdd3df',
  fontSize: '.74rem', fontWeight: 700, padding: '5px 11px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap',
});

// clues: 수첩에 있는 단서(제목·인물) · tries: 이미 내민 횟수(저장에 남는다 — 새로고침으로 다시 고르지 못하게)
// onPresent(code, tries) 내밀 때마다 · onDone(code) 결말로
export function ConfrontView({ clues, tries = 0, lastCode, onPresent, onDone }) {
  const who = suspects.find((s) => s.id === CONFRONT.culprit);
  const titleOf = (code) => clues.find((c) => c.code === code)?.title || soloContent.getClue?.(code)?.title || code;
  const [beat, setBeat] = useState(() => (tries >= MAX_TRIES ? { kind: 'fail', code: lastCode } : { kind: 'deny' }));
  const [picking, setPicking] = useState(false);
  const [sel, setSel] = useState(null);
  const [pPerson, setPPerson] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const dlgRef = useRef(null);

  const present = (code) => {
    const n = tries + 1;
    setPicking(false); setSel(null);
    onPresent(code, n);
    if (CONFRONT.accept[code]) setBeat({ kind: 'accept', code });
    else setBeat({ kind: CONFRONT.near.includes(code) ? 'near' : 'wrong', code, n });
  };

  const left = MAX_TRIES - tries;
  const LINES = {
    deny: { speaker: who?.name, text: CONFRONT.deny, hint: '▶ 증거를 내민다', next: () => setPicking(true) },
    accept: { speaker: who?.name, text: CONFRONT.accept[beat.code], hint: '▶ 탭하여 다음', next: () => setBeat({ kind: 'note', code: beat.code }) },
    note: { speaker: '수사 노트', text: CONFRONT.note, hint: '▶ 결말 보기', next: () => onDone(beat.code) },
    near: { speaker: who?.name, text: CONFRONT.nearLine, hint: left > 0 ? `▶ 한 번 더 내민다 (남은 기회 ${left})` : '▶ 탭하여 다음', next: () => (left > 0 ? setPicking(true) : setBeat({ kind: 'fail', code: beat.code })) },
    wrong: { speaker: who?.name, text: CONFRONT.wrongLine, hint: left > 0 ? `▶ 한 번 더 내민다 (남은 기회 ${left})` : '▶ 탭하여 다음', next: () => (left > 0 ? setPicking(true) : setBeat({ kind: 'fail', code: beat.code })) },
    fail: { speaker: '수사 노트', text: CONFRONT.failNote, hint: '▶ 결말 보기', next: () => onDone(beat.code || null) },
  };
  const line = LINES[beat.kind];
  // 이름 칸이 「수사 노트」면 본문 머리의 「(수사 노트)」는 겹친다 — 떼고 보인다
  const body = line.speaker === '수사 노트' ? String(line.text || '').replace(/^\(수사 노트\)\s*/, '') : line.text;
  // 「거의 맞았다」 — 그 자리의 증거지만 그 사람을 직접 가리키지는 않는다. 방향은 맞다고 한 줄 붙인다
  const note = beat.kind === 'near' ? '(수사 노트) 방향은 맞다 — 다만 이것만으로는 그를 가리키지 못한다.' : null;

  const persons = [...new Set(clues.map((c) => c.person).filter(Boolean))];
  const list = clues.filter((c) => !pPerson || c.person === pPerson);
  const icon = (c) => soloContent.clueIcon?.(c) || '📄';

  return (
    <div className="aa-fs" onClick={(e) => { if (!picking && !isUiTap(e)) dlgRef.current?.tap(); }}>
      <div className="aa-stage" style={{ background: 'radial-gradient(120% 100% at 50% 0%, #20160e 0%, #120c08 55%, #07050a 100%)' }} />
      <div className="aa-loc-chip" style={{ color: '#ffd479', borderColor: '#ffd47944' }}>⚖️ 대질 · {who?.name}</div>
      <div className={`aa-room-fig${speaking && line.speaker === who?.name ? ' talking' : ''}`}>
        <StandingFigure sid={CONFRONT.culprit} person={who?.name} image={who?.image} height={560} fallbackSize={150}
          mood={beat.kind === 'accept' || beat.kind === 'note' ? 'shock' : beat.kind === 'near' || beat.kind === 'wrong' ? 'angry' : undefined} />
      </div>
      {beat.code && beat.kind !== 'deny' && (
        <div className="cf-shown">📎 내민 증거 — {titleOf(beat.code)}</div>
      )}
      {!picking && (
        <DialogueBox ref={dlgRef} speaker={line.speaker} text={note ? `${body}\n${note}` : body}
          onAdvance={line.next} onTyping={setSpeaking} hint={line.hint} />
      )}
      {picking && (
        <div className="aa-present" onClick={(e) => e.stopPropagation()}>
          <div className="aa-present-h">
            <span>⚖️ <b>결정적 증거 한 장</b>을 고르세요 · 남은 기회 {left}</span>
          </div>
          {persons.length > 1 && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
              <button style={chipStyle(!pPerson)} onClick={() => setPPerson(null)}>전체 {clues.length}</button>
              {persons.map((p) => <button key={p} style={chipStyle(pPerson === p)} onClick={() => setPPerson(p)}>{p}</button>)}
            </div>
          )}
          <div className="s-grid">
            {list.map((c) => (
              <button key={c.code} className="s-card" style={sel === c.code ? { borderColor: 'var(--gold)', background: '#241f14' } : undefined}
                onClick={() => setSel(c.code)}>
                <div className="ck">{icon(c)}</div>
                <div className="cn" style={{ fontSize: '.82rem' }}>{c.title}</div>
                <div className="cm">{c.person}</div>
              </button>
            ))}
          </div>
          <div className="cf-actions">
            <button className="s-btn" disabled={!sel} onClick={() => sel && present(sel)}>
              {sel ? `이 증거를 내민다 — ${titleOf(sel)}` : '증거를 고르세요'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
