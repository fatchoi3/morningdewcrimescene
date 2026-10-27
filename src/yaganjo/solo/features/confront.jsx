// ─────────────────────────────────────────────────────────────────────────────
// features/confront — 대질: 범인을 맞힌 뒤 결정적 증거 한 장을 내민다.
//   감·소거법으로 찍어도 맞힐 수 있었다 — 「증거로 몰아붙이는 맛이 없다」(2026-10-01 시험).
//   정본: 진범은 살인을 끝까지 부인한다. 그래서 대질은 자백이 아니라 「말을 잃는」 데서 끝나고,
//   「⚖️ 입증」 도장과 수사 노트 한 줄이 못을 박는다. 틀리면 한 번 더 — 두 번째도 틀리면 그대로 결말.
//   대사·정답은 lib/game.js 의 CONFRONT. (새벽이슬·야간조 두 게임이 같은 파일을 한 벌씩 쓴다)
//
//   2026-10-07 시험 뒤(정답을 내고도 「실패한 줄 알았다」, 이미 쓴 정답 카드를 다시 낼 생각을 못 했다):
//   - 첫마디는 그 거짓말이 2차 심문에서 깨졌는지에 따라 갈린다(denyBefore / deny) — 듣지 못한 말로 시작하지 않는다.
//   - 정답이면 수사관이 먼저 그 증거를 짚고(press), 범인이 말을 잃고, 「입증」 도장이 찍힌다.
//   - 고르기 판에서 이 사람의 거짓을 이미 깬 증거에 ✅ 를 단다.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { suspects, soloContent, locations } from '../content.js';
import { CONFRONT, isUiTap } from '../lib/game.js';
import { DATA } from '../interrogation.js';
import { StandingFigure } from '../art.jsx';
import { DialogueBox } from '../vn.jsx';

const MAX_TRIES = 2;
const chipStyle = (on) => ({
  flex: 'none', background: on ? '#241f14' : '#ffffff10',
  border: `1px solid ${on ? 'var(--gold)' : '#ffffff2e'}`, color: on ? '#ffe9a8' : '#cdd3df',
  fontSize: '.74rem', fontWeight: 700, padding: '5px 11px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap',
});
const SILENT = '\n(…더는 말을 잇지 못한다.)';

// clues: 수첩에 있는 단서(제목·인물) · broke: 이 범인에게서 깬 진술(state.broke[범인])
// tries: 이미 내민 횟수(저장에 남는다 — 새로고침으로 다시 고르지 못하게)
// onPresent(code, tries) 내밀 때마다 · onDone(code) 결말로
export function ConfrontView({ clues, broke = [], tries = 0, lastCode, onPresent, onHold, onDone }) {
  const who = suspects.find((s) => s.id === CONFRONT.culprit);
  const titleOf = (code) => clues.find((c) => c.code === code)?.title || soloContent.getClue?.(code)?.title || code;
  const [beat, setBeat] = useState(() => (tries >= MAX_TRIES ? { kind: 'fail', code: lastCode } : { kind: 'deny' }));
  const [picking, setPicking] = useState(false);
  // 둘째 단계 — 첫 정답에 그가 버틴 뒤(hold). { first: 첫 정답 코드, tries: 둘째에서 내민 횟수 }
  const [round2, setRound2] = useState(null);
  const [sel, setSel] = useState(null);
  // 대사를 넘기려던 탭이 막 뜬 카드 판에 떨어져 엉뚱한 카드가 골라졌다(18회차) — 판이 뜬 직후 400ms 는 카드 탭을 받지 않는다
  const pickAt = useRef(0);
  useEffect(() => { if (picking) pickAt.current = Date.now(); }, [picking]);
  const [pPerson, setPPerson] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const dlgRef = useRef(null);

  const brokeIds = new Set(broke.map((e) => e.id));
  // 이 사람의 거짓을 이미 깬 증거 — 심문에서 그 진술을 무너뜨린 코드들
  //   2차 심문에서 깬 것만 — 튜토리얼에서 깬 순찰 일지가 ✅ 로 맨 위에 서서, 둘이 그 카드부터 내고 졌다(14회차)
  const usedCodes = new Set((DATA[CONFRONT.culprit]?.statements || [])
    .filter((s) => brokeIds.has(s.id) && s.contradict && s.phase === 2)
    .flatMap((s) => s.contradict.codes || [s.contradict.code]));
  // 깼으면 deny · 깨지 않았어도 03:16 인정을 들었으면(TST-H) denyAdmitted · 둘 다 아니면 denyBefore
  const admitted = clues.some((c) => c.code === 'TST-H');
  const deny = brokeIds.has(CONFRONT.keyStatement) ? CONFRONT.deny
    : admitted && CONFRONT.denyAdmitted ? CONFRONT.denyAdmitted
    : (CONFRONT.denyBefore || CONFRONT.deny);

  const present = (code) => {
    setPicking(false); setSel(null);
    // 둘째 단계 — 채점은 첫 증거로 이미 끝났다(onPresent 안 부름). 맞으면 말을 잃고, 두 번 틀리면 버틴 채로 끝난다
    if (round2) {
      const t = round2.tries + 1;
      setRound2({ ...round2, tries: t });
      const pair = CONFRONT.holdCombo?.[round2.first]?.[code];
      const okCombo = !!pair && clues.some((c) => c.code === pair);
      if ((CONFRONT.holdAccept?.[round2.first] || []).includes(code) || okCombo) { onHold?.(code, true); setBeat({ kind: 'press2', code }); }
      else setBeat({ kind: 'wrong2', code, n: t });
      return;
    }
    const n = tries + 1;
    onPresent(code, n);
    if (CONFRONT.accept[code]) setBeat({ kind: CONFRONT.press?.[code] ? 'press' : 'accept', code });
    else setBeat({ kind: CONFRONT.near.includes(code) ? 'near' : 'wrong', code, n });
  };

  // 틀린 증거의 종류(감식·증언·⭐)에 따라 받아치는 말 — 늘 같은 한 줄이라 무엇이 틀렸는지 몰랐다(9회차)
  const wrongLineOf = (code) => {
    // 자주 내는 오답은 그 카드에 맞춰 왜 아닌지 — 빈 일지를 내고 「아무것도 증명하지 못합니다」만 듣자 억울했다(14회차)
    if (CONFRONT.wrongByCode?.[code]) return CONFRONT.wrongByCode[code];
    const c = clues.find((x) => x.code === code);
    const kind = soloContent.gamsikCodes?.has(code) ? '감식' : c?.type;
    return CONFRONT.wrongBy?.[kind] || CONFRONT.wrongLine;
  };
  const left = MAX_TRIES - tries;
  const again = left > 0 ? `▶ 한 번 더 내민다 (남은 기회 ${left})` : '▶ 탭하여 다음';
  // 한 번 더 내밀 때는 인물 거르기를 「전체」로 되돌린다 — 앞에서 고른 거르기가 남아 엉뚱한 카드를 고를 뻔했다(8회차)
  const retry = () => (left > 0 ? (setPPerson(null), setSel(null), setPicking(true)) : setBeat({ kind: 'fail', code: beat.code }));
  const left2 = round2 ? MAX_TRIES - round2.tries : MAX_TRIES;
  const retry2 = () => (left2 > 0 ? (setPPerson(null), setSel(null), setPicking(true)) : setBeat({ kind: 'holdFail', code: round2.first }));
  const hasHold = (code) => !!CONFRONT.hold?.[code];
  const LINES = {
    // 기회가 두 번뿐이라는 걸 첫 증거를 내고서야 알았다(10회차) — 첫 내밀기 전에 말한다
    // ✅ 도 낼 수 있다는 걸 첫 실패 뒤에야 알았다 — 정답이 그 카드였다(15회차). 첫 안내에 넣는다
    deny: { speaker: who?.name, text: deny, hint: `▶ 증거를 내민다 — 기회는 ${MAX_TRIES}번${usedCodes.size > 0 ? ' · 2차 심문에서 깬 증거(✅)도 됩니다' : ''}`, next: () => setPicking(true) },
    // 첫 정답 — 버팀(hold)이 있으면 그리로, 없으면 바로 말을 잃는다
    press: { speaker: '수사관', text: CONFRONT.press?.[beat.code], hint: '▶ 탭하여 다음', next: () => setBeat({ kind: hasHold(beat.code) ? 'hold' : 'accept', code: beat.code }) },
    hold: { speaker: who?.name, text: CONFRONT.hold?.[beat.code], hint: `▶ 한 번 더 몰아붙인다 — 기회 ${MAX_TRIES}번`, next: () => { setRound2({ first: beat.code, tries: 0 }); setPPerson(null); setPicking(true); } },
    // 말을 잃는 비트에서도 「📎 내민 증거」는 방금 낸 카드(shown) — 첫 카드로 바뀌어 보였다(15회차)
    press2: { speaker: '수사관', text: CONFRONT.press2?.[beat.code], hint: '▶ 탭하여 다음', next: () => setBeat({ kind: 'accept', code: round2?.first || beat.code, final: true, shown: beat.code }) },
    wrong2: { speaker: who?.name, text: wrongLineOf(beat.code), hint: left2 > 0 ? `▶ 한 번 더 내민다 (남은 기회 ${left2})` : '▶ 탭하여 다음', next: retry2 },
    holdFail: { speaker: '수사 노트', text: CONFRONT.holdFail, hint: '▶ 결말 보기', next: () => { onHold?.(null, false); onDone(round2?.first || beat.code); } },
    accept: { speaker: who?.name, text: (beat.final && CONFRONT.accept2 ? CONFRONT.accept2 : (CONFRONT.accept[beat.code] || '')) + SILENT, hint: '▶ 탭하여 다음', next: () => setBeat({ kind: 'note', code: beat.code, shown: beat.shown }) },
    // 결정타는 둘째 카드였는데 마지막 노트가 첫 증거 얘기로 끝나 흐려졌다(18회차) — 둘째 카드가 무너뜨린 것을 먼저
    note: { speaker: '수사 노트', text: (beat.shown && beat.shown !== beat.code && CONFRONT.why2?.[beat.shown] ? `${CONFRONT.why2[beat.shown]}\n` : '') + (CONFRONT.noteBy?.[beat.code] || (CONFRONT.noteStatement && !brokeIds.has(CONFRONT.noteStatement) && CONFRONT.noteBefore) || CONFRONT.note), hint: '▶ 결말 보기', next: () => onDone(beat.code) },
    near: { speaker: who?.name, text: CONFRONT.nearLine, hint: again, next: retry },
    wrong: { speaker: who?.name, text: wrongLineOf(beat.code), hint: again, next: retry },
    fail: { speaker: '수사 노트', text: CONFRONT.failNote, hint: '▶ 결말 보기', next: () => onDone(beat.code || null) },
  };
  const line = LINES[beat.kind];
  // 이름 칸이 「수사 노트」면 본문 머리의 「(수사 노트)」는 겹친다 — 떼고 보인다
  const body = line.speaker === '수사 노트' ? String(line.text || '').replace(/^\(수사 노트\)\s*/, '') : line.text;
  // 「거의 맞았다」 — 그 자리의 증거지만 그 사람을 직접 가리키지는 않는다. 방향은 맞다고 한 줄 붙인다
  //   엉뚱한 증거면 무엇이 필요한지 한 줄 — 「아무것도 증명하지 못합니다」만 두 번 듣고 기준을 몰랐다(2026-10-08 시험)
  const note = beat.kind === 'near' ? '(수사 노트) 방향은 맞다 — 다만 이것만으로는 그를 가리키지 못한다.'
    // 「그 시각의 말이 거짓」은 빈 일지(말과 안 맞는 빈 칸)를 부르는 말이었다(14회차) — 「기록이 그를 어디에 세우는가」로
    : beat.kind === 'wrong2' && left2 > 0 ? `(수사 노트) ${CONFRONT.holdNeed?.[round2?.first] || ''}`
    : beat.kind === 'wrong' && left > 0 ? `(수사 노트) 필요한 건 그 시각 그가 어디서 무엇을 했는지 보여 주는 기록이다 — 동쪽으로 들어간 기록, 또는 03:24에 그가 2층에서 한 일의 기록. 빈 칸이나 없는 기록은 그를 어디에도 세우지 못한다.${usedCodes.size > 0 ? ' 2차 심문에서 그를 무너뜨린 증거(✅)도 다시 내밀 수 있다.' : ''}`
      : null;
  // 「⚖️ 입증」 도장은 둘째 단계까지 무너뜨렸을 때만 — 버틴 채 끝나면 찍지 않는다(완벽한 해결 조건과 같게)
  const proved = beat.kind === 'accept' || beat.kind === 'note';

  const persons = [...new Set(clues.map((c) => c.person).filter(Boolean))];
  // 이미 깬 증거를 앞에 — 2차 심문에서 쓴 정답 카드를 대질에서 다시 낼 생각을 못 했다(2026-10-07)
  //   그다음 ⭐ 추리 단서 — 30~108장을 두세 번 밀어야 찾았다(9회차 셋 다).
  const rank = (c) => (usedCodes.has(c.code) ? 0 : c.type === '특수' ? 1 : 2);
  // 자동문·2층 묶음 — 대질은 백 장 가까이에서 골라야 해 막막했다(17회차, 사용자 승인). 자리로만 묶는다
  const office = new Set([...(locations.all.find((l) => l.id === 'ROOM-U')?.objects || []), 'LOOKUP-ZVLJ-37']);
  const GROUP = {
    '__special': (c) => c.type === '특수',
    '__lab': (c) => soloContent.gamsikCodes?.has(c.code) || c.type === '감식',
    '__door': (c) => /M-2/.test(c.title || ''),
    '__office': (c) => office.has(c.code),
  };
  const list = clues.filter((c) => !pPerson || (GROUP[pPerson] ? GROUP[pPerson](c) : c.person === pPerson))
    .sort((a, b) => rank(a) - rank(b));
  const icon = (c) => soloContent.clueIcon?.(c) || '📄';

  return (
    <div className="aa-fs" onClick={(e) => { if (!picking && !isUiTap(e)) dlgRef.current?.tap(); }}>
      <div className="aa-stage" style={{ background: 'radial-gradient(120% 100% at 50% 0%, #20160e 0%, #120c08 55%, #07050a 100%)' }} />
      <div className="aa-loc-chip" style={{ color: '#ffd479', borderColor: '#ffd47944' }}>⚖️ 대질 · {who?.name}</div>
      <div className={`aa-room-fig${speaking && line.speaker === who?.name ? ' talking' : ''}`}>
        <StandingFigure sid={CONFRONT.culprit} person={who?.name} image={who?.image} height={560} fallbackSize={150}
          mood={proved ? 'shock' : beat.kind === 'near' || beat.kind === 'wrong' || beat.kind === 'wrong2' || beat.kind === 'hold' ? 'angry' : undefined} />
      </div>
      {proved && <div className="cf-stamp" key={beat.code}>⚖️ 입증</div>}
      {beat.code && beat.kind !== 'deny' && (
        <div className="cf-shown">📎 내민 증거 — {titleOf(beat.shown || beat.code)}</div>
      )}
      {!picking && (
        <DialogueBox ref={dlgRef} speaker={line.speaker} text={note ? `${body}\n${note}` : body}
          onAdvance={line.next} onTyping={setSpeaking} hint={line.hint} />
      )}
      {picking && (
        <div className="aa-present" onClick={(e) => e.stopPropagation()}>
          <div className="aa-present-h">
            {/* 정답 둘 중 하나(03:24 태블릿 조회)는 현장이 아니라 그 시각의 거짓말을 깨는 증거다 — 「그 자리」만 말하자 현장 증거만 찾았다(13회차) */}
            {round2
              ? <span>⚖️ <b>그가 물러선 자리를 무너뜨리는 기록</b> 한 장 — {CONFRONT.holdNeed?.[round2.first]} · 남은 기회 {left2}</span>
              : <span>⚖️ <b>그 시각 그가 어디서 무엇을 했는지 보여 주는 기록</b> 한 장 · 남은 기회 {left}</span>}
          </div>
          {usedCodes.size > 0 && (
            <p className="cf-used-note">✅ — 2차 심문에서 이 사람의 거짓말을 무너뜨린 증거(1차·튜토리얼에서 깬 것은 아님). 대질에서 다시 내밀 수 있어요.</p>
          )}
          {persons.length > 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingBottom: 8 }}>
              <button style={chipStyle(!pPerson)} onClick={() => setPPerson(null)}>전체 {clues.length}</button>
              {[['__special', '⭐ 추리'], ['__lab', '🔬 감식'], ['__door', '🚪 M-2 자동문'], ['__office', '🗄 2층 사무실']].map(([k, lb]) => <button key={k} style={chipStyle(pPerson === k)} onClick={() => setPPerson(k)}>{lb} {clues.filter(GROUP[k]).length}</button>)}
              {persons.map((p) => <button key={p} style={chipStyle(pPerson === p)} onClick={() => setPPerson(p)}>{p}</button>)}
            </div>
          )}
          <div className="s-grid">
            {list.map((c) => (
              <button key={c.code} className={`s-card${usedCodes.has(c.code) ? ' cf-used' : ''}`}
                style={sel === c.code ? { borderColor: 'var(--gold)', background: '#241f14' } : undefined}
                onClick={() => { if (Date.now() - pickAt.current >= 400) setSel(c.code); }}>
                <div className="ck">{icon(c)}</div>
                <div className="cn" style={{ fontSize: '.82rem' }}>{usedCodes.has(c.code) ? '✅ ' : ''}{c.title}</div>
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
