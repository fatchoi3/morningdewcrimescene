// ─────────────────────────────────────────────────────────────────────────────
// features/intro — 게임 프레임 화면들.
//   StartScreen : 시작(수사 시작·이어하기)
//   BriefingVN  : 브리핑(역전재판식 VN 시퀀스)
//   EventVN     : 중간 사건(1차 심문 완료 후 부검 소견 → 살인 전환)
//   EndingScreen: 엔딩(정/오답 + 사건 전말 + 타임라인)
// ─────────────────────────────────────────────────────────────────────────────
import { useRef, useState } from 'react';
import { briefing, victim, suspects } from '../content.js';
import { cast, t } from '../../data/cast.js';
import { isUiTap, REVEAL, TIMELINE } from '../lib/game.js';
import { BriefingArt, EndingArt, StandingFigure } from '../art.jsx';
import { DialogueBox } from '../vn.jsx';

// ── 시작 화면 — 수사 시작 / 이어하기 ─────────────────────────────────────────
export function StartScreen({ started, continueCount, onStart, onContinue, onReset }) {
  return (
    <div className="solo-wrap">
      <div className="s-start">
        <div className="s-rain" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} style={{
              left: `${(i * 4.3 + (i % 5) * 3) % 100}%`,
              height: `${9 + (i % 4) * 7}px`,
              animationDuration: `${1.2 + (i % 6) * 0.32}s`,
              animationDelay: `${(i % 8) * 0.45}s`,
            }} />
          ))}
        </div>
        <div className="s-eye">Crime Scene · Solo</div>
        <div className="s-title">{briefing.title}</div>
        <div className="s-sub">{briefing.subtitle}</div>
        {/* 새 수사 = 저장 초기화 후 처음부터 — 이어하기는 별도 버튼 */}
        <button className="s-btn" onClick={onStart}>
          {started ? '새 수사 시작 (처음부터)' : '수사 시작'}
        </button>
        {continueCount > 0 && (
          <button className="s-link" style={{ marginTop: 14 }} onClick={onContinue}>이어하기 (단서 {continueCount})</button>
        )}
        <button className="s-link" style={{ marginTop: 6, color: '#8a8880' }} onClick={onReset}>🔄 저장 초기화 (테스트용)</button>
      </div>
    </div>
  );
}

// ── 브리핑 (역전재판식 VN 시퀀스) ─────────────────────────────────────────
export function BriefingVN({ onDone }) {
  const beats = [
    { loc: '프롤로그', text: briefing.subtitle },
    ...briefing.lines.map((l) => ({ text: l })),
    { text: '당신은 수사관이다. 현장을 조사하고 용의자를 심문해, 누가·어떻게·왜 죽였는지 밝혀라.' },
  ];
  const [i, setI] = useState(0);
  const dlgRef = useRef(null);
  const [speaking, setSpeaking] = useState(false);
  const beat = beats[Math.min(i, beats.length - 1)];
  const last = i >= beats.length - 1;
  return (
    <div className="aa-fs" onClick={(e) => { if (!isUiTap(e)) dlgRef.current?.tap(); }}>
      <div className="aa-stage"><BriefingArt fill /></div>
      <div className="aa-loc-chip">사건 브리핑 · {victim.name}({victim.age})</div>
      <div className={`aa-room-fig${speaking ? ' talking' : ''}`}><StandingFigure sid="PLAYER" person="수사관" height={520} fallbackSize={140} /></div>
      <DialogueBox ref={dlgRef} location={beat.loc} text={beat.text}
        onAdvance={() => { if (last) onDone(); else setI((n) => n + 1); }} onTyping={setSpeaking}
        actions={[{ label: '⏭ 건너뛰기', onClick: onDone }]}
        hint={last ? '▶ 현장으로' : `${i + 1}/${beats.length} · 탭하여 다음`} />
    </div>
  );
}

// ── 중간 사건 — 1차 심문 완료 후 부검 소견 도착(살인 전환) 연출 ───────────────
export function EventVN({ onDone }) {
  const beats = [
    { loc: '무전', text: t('"…수사관님, 국과수입니다. {{victim.full}} 1차 부검 소견이 나왔습니다."') },
    { loc: '부검 소견', text: '"사인은 단순 심장 발작이 아닙니다. 코와 입 주변의 압박흔, 안면의 점상출혈 — 질식 소견입니다."' },
    { loc: '수사 전환', text: '단순 발작사가 아니다. 사건은 지금부로 살인 사건으로 전환된다.' },
    { text: '통제 중이던 목사님 방이 개방되었다. 압수했던 CCTV 원본과 관계자 휴대폰도 열람할 수 있다.' },
    { text: '감식반이 합류했다. 채취물을 가져가면 감식 의뢰실에서 분석을 맡길 수 있다 — 단, 결과가 나오기까지는 시간이 걸린다.' },
    { text: '…낮의 진술들을 물증으로 검증할 차례다. 거짓말은 반드시 무너진다.' },
  ];
  const [i, setI] = useState(0);
  const dlgRef = useRef(null);
  const [speaking, setSpeaking] = useState(false);
  const beat = beats[Math.min(i, beats.length - 1)];
  const last = i >= beats.length - 1;
  return (
    <div className="aa-fs" onClick={(e) => { if (!isUiTap(e)) dlgRef.current?.tap(); }}>
      <div className="aa-stage" style={{ background: 'radial-gradient(120% 100% at 50% 0%, #2a1214 0%, #140a0c 55%, #07050a 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 40% at 50% 30%, #c0585822, transparent 70%)', animation: 'aablink 2.2s ease-in-out infinite' }} />
      </div>
      <div className="aa-loc-chip" style={{ color: '#e07a7a', borderColor: '#e07a7a44' }}>🚨 중간 사건 · 부검 소견</div>
      <div className={`aa-room-fig${speaking ? ' talking' : ''}`}><StandingFigure sid="PLAYER" person="수사관" height={520} fallbackSize={140} /></div>
      <DialogueBox ref={dlgRef} location={beat.loc} text={beat.text}
        onAdvance={() => { if (last) onDone(); else setI((n) => n + 1); }} onTyping={setSpeaking}
        actions={[{ label: '⏭ 건너뛰기', onClick: onDone }]}
        hint={last ? '▶ 전면 조사 시작' : `${i + 1}/${beats.length} · 탭하여 다음`} />
    </div>
  );
}

// ── 2차 사건 — 2차 심문 개시 직전, 정밀(2차) 부검 결과가 급히 도착 ──────────────
export function EventVN2({ onDone }) {
  const beats = [
    { loc: '복도', text: '"잠깐, 수사관님!" — 젊은 형사가 서류 봉투를 들고 달려온다.' },
    { loc: '2차 부검', text: '"국과수 정밀(2차) 부검 결과입니다. 방금 나왔어요. 이건 꼭 보셔야 합니다."' },
    { loc: '2차 부검', text: '"베개에서 나온 솜·섬유가 피해자 기도에서도 검출됐습니다. 압박 방향과 힘까지 — 타살에 의한 질식사, 확정입니다."' },
    { text: '「2차 부검」 소견이 사건 기록에 등록되었다. 이제 이 확정된 사인으로 용의자들을 다시 몰아붙일 수 있다.' },
  ];
  const [i, setI] = useState(0);
  const dlgRef = useRef(null);
  const [speaking, setSpeaking] = useState(false);
  const beat = beats[Math.min(i, beats.length - 1)];
  const last = i >= beats.length - 1;
  return (
    <div className="aa-fs" onClick={(e) => { if (!isUiTap(e)) dlgRef.current?.tap(); }}>
      <div className="aa-stage" style={{ background: 'radial-gradient(120% 100% at 50% 0%, #2a1214 0%, #140a0c 55%, #07050a 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 40% at 50% 30%, #c0585822, transparent 70%)', animation: 'aablink 2.2s ease-in-out infinite' }} />
      </div>
      <div className="aa-loc-chip" style={{ color: '#e07a7a', borderColor: '#e07a7a44' }}>🚨 2차 사건 · 정밀 부검</div>
      <div className={`aa-room-fig${speaking ? ' talking' : ''}`}><StandingFigure sid="PLAYER" person="수사관" height={520} fallbackSize={140} /></div>
      <DialogueBox ref={dlgRef} location={beat.loc} text={beat.text}
        onAdvance={() => { if (last) onDone(); else setI((n) => n + 1); }} onTyping={setSpeaking}
        actions={[{ label: '⏭ 건너뛰기', onClick: onDone }]}
        hint={last ? '▶ 2차 심문 시작' : `${i + 1}/${beats.length} · 탭하여 다음`} />
    </div>
  );
}

// ── 엔딩 — 정/오답 + 사건 전말 + 그날의 진실(타임라인) ────────────────────────
export function EndingScreen({ result, onNewCase }) {
  const r = result;
  return (
    <div className="solo-wrap">
      <div className="s-body" style={{ paddingTop: 24 }}>
        <EndingArt good={r.culpritRight} />
        <div className="s-score">
          <div className="s-eye">사건 종결</div>
          <div className="big" style={{ color: r.culpritRight ? 'var(--ok)' : 'var(--danger)' }}>{r.culpritRight ? '정답' : '오답'}</div>
          <div style={{ color: r.culpritRight ? 'var(--ok)' : 'var(--danger)', fontWeight: 800, marginTop: 6 }}>
            {r.culpritRight ? '✓ 진범을 정확히 지목했습니다' : `✗ 당신의 지목: ${suspects.find((s) => s.id === r.pick)?.name || '—'}`}
          </div>
          <div style={{ marginTop: 10, fontSize: '.9rem', color: '#cfcabb' }}>진범 <b style={{ color: '#fff' }}>{cast.S4.name}</b> · 직접 사인 <b style={{ color: '#fff' }}>베개 질식</b></div>
        </div>
        <div className="s-reveal">
          <h2 style={{ textAlign: 'center' }}>사건의 전말</h2>
          {REVEAL.order.map((id) => {
            const s = suspects.find((x) => x.id === id);
            return (
              <div key={id} style={{ marginTop: 16 }}>
                <h3>{s?.name} <span className="role">— {REVEAL.people[id].role}</span></h3>
                <p style={{ lineHeight: 1.8 }}>{REVEAL.people[id].text}</p>
              </div>
            );
          })}
          <h3 style={{ borderBottom: '1px solid var(--line)', paddingBottom: 6, marginTop: 24 }}>🕰 그날의 진실 — 시간 순</h3>
          <div className="s-timeline">
            {TIMELINE.map(([t, d], i) => (
              <div className="s-tl2-row" key={i}>
                <div className="s-tl2-t">{t}</div>
                <div className="s-tl2-d">{d}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#0f0e0c', border: '1px solid var(--gold)', borderRadius: 12, padding: 18, marginTop: 22 }}>
            <div className="s-eye" style={{ color: 'var(--gold)' }}>사건의 본질</div>
            <p style={{ lineHeight: 1.9, marginBottom: 0 }}>{REVEAL.essence}</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <button className="s-btn" onClick={onNewCase}>새 사건</button>
        </div>
      </div>
    </div>
  );
}
