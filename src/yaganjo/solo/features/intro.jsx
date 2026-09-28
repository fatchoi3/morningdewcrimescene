// ─────────────────────────────────────────────────────────────────────────────
// features/intro — 게임 프레임 화면들.
//   StartScreen : 시작(수사 시작·이어하기)
//   BriefingVN  : 브리핑(역전재판식 VN 시퀀스)
//   EventVN     : 중간 사건(1차 심문 완료 후 부검 소견 → 살인 전환)
//   EndingScreen: 엔딩(정/오답 + 사건 전말 + 타임라인)
// ─────────────────────────────────────────────────────────────────────────────
import { useRef, useState } from 'react';
import { briefing, victim, suspects } from '../content.js';
import { cast, t } from '../../../scenarios/yaganjo/cast.js';
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

// ── 중간 점검 — 1차 탐문을 마치면 현장이 열린다 ────────────────────────────
//   보드판 이벤트 ①(현장 개방) + ②의 첫째 영장(2층·태블릿) + ③(CCTV 원본)을 한 번에 연다.
//   **질식도 살인도 한 글자도 말하지 않는다.** 보드판에서 이 시점의 사인은 여전히 압사이고,
//   질식은 마지막 이벤트 ④에서야 나온다. 여기서 먼저 말하면 차민우의 「내가 죽였다」,
//   흐엉·임기석의 「지게차가 비어 있었다」, 서장현의 「사고라고 생각했습니다」가
//   전부 무게를 잃는다(1회차 시뮬레이션 #21).
export function EventVN({ onDone }) {
  const beats = [
    { loc: '무전', text: '"…수사관님, 현장 감식 끝났습니다. C통로와 동쪽 구역, 조사 목적으로 들어가셔도 됩니다."' },
    { loc: '현장', text: '"치운 건 파렛트와 시신뿐입니다. 바닥의 자국, 랙 1단에 나와 있던 것, 3단에 얹혀 있던 것, 시신 옆에 떨어져 있던 종이는 그날 새벽 그대로입니다."' },
    { loc: '영장', text: '압수수색 영장이 나왔다. 2층 사무실·관제실·계단을 볼 수 있다. 조장의 칸은 자물쇠가 걸려 있고, 열쇠가 나오지 않아 아직 열지 못했다.' },
    { loc: 'CCTV', text: '본사 보안업체에서 카메라 여섯 대의 원본이 왔다. 그날 밤 전 구간이다. 이 센터의 카메라는 사람이 아니라 물건과 사고를 보려고 달았다 — 얼굴이 남는 것은 정문 G-1 하나뿐이고, 자동문 M-2는 문 위에서 수직으로 내려다봐 안전모와 어깨만 남는다.' },
    { text: '감식반이 합류했다. 채취물을 가져가면 감식 의뢰실에서 분석을 맡길 수 있다 — 결과가 나오기까지는 시간이 걸린다.' },
    { loc: '1차 소견', text: '"사인은 아직 압사로 보고 있습니다. 정밀 부검은 의뢰만 해 둔 상태입니다."' },
    { text: '…1차 탐문에서 들은 말을 물증으로 검증할 차례다.' },
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
      <div className="aa-loc-chip" style={{ color: '#e07a7a', borderColor: '#e07a7a44' }}>🚨 중간 점검 · 현장 개방</div>
      <div className={`aa-room-fig${speaking ? ' talking' : ''}`}><StandingFigure sid="PLAYER" person="수사관" height={520} fallbackSize={140} /></div>
      <DialogueBox ref={dlgRef} location={beat.loc} text={beat.text}
        onAdvance={() => { if (last) onDone(); else setI((n) => n + 1); }} onTyping={setSpeaking}
        actions={[{ label: '⏭ 건너뛰기', onClick: onDone }]}
        hint={last ? '▶ 전면 조사 시작' : `${i + 1}/${beats.length} · 탭하여 다음`} />
    </div>
  );
}

// ── 2차 심문 개시 — 휴대전화 영장 · 감식 결과 · 2차 부검이 한꺼번에 온다 ─────────
//   보드판 이벤트 ②의 셋째 영장(휴대폰) + 감식 결과 + ④(2차 부검)다. 문장은 진행물 카드 그대로.
//   끝나면 「2차 부검 소견」(AUTOPSY-2)이 사건 기록에 들어온다 — 인물에게 들이밀 수 있게.
export function EventVN2({ onDone }) {
  const beats = [
    { loc: '복도', text: '"잠깐, 수사관님!" — 젊은 형사가 서류 봉투를 들고 달려온다.' },
    { loc: '영장', text: '"휴대전화 압수수색영장이 나왔습니다. 압수한 휴대폰 일곱 대를 포렌식으로 열 수 있습니다. 누가 누구에게 몇 시에 보냈는지까지는 통신사에 있지만, 무슨 말을 했는지는 폰을 열어야 보입니다."' },
    { loc: '감식', text: '"맡기신 감식 결과도 도착했습니다. 그리고 — 국과수 2차 부검입니다."' },
    { loc: '2차 부검', text: '"사인은 질식입니다. 얼굴에 랩이 감겨 있었습니다. 후두부를 뒤에서 맞으셨고요."' },
    { loc: '2차 부검', text: '"돌아가신 시각은 03:00에서 03:30 사이, 1차 소견과 같습니다. 파렛트에 눌린 흔적은 사후입니다."' },
    { loc: '2차 부검', text: '"텀블러에서 나온 성분은 사인과 관계없습니다. …뒤에서 오는 건 멀쩡한 사람도 못 봤을 겁니다."' },
    { text: '「깔렸다」를 전제로 들은 말이 있으면, 그 말은 이제 사실이 아니다. 「2차 부검 소견」이 사건 기록에 등록되었다 — 1차 검안 소견서를 다시 읽어라.' },
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
          <div style={{ marginTop: 10, fontSize: '.9rem', color: '#cfcabb' }}>진범 <b style={{ color: '#fff' }}>{cast.S1.name}</b> · 직접 사인 <b style={{ color: '#fff' }}>후두부 가격 뒤 스트레치 랩 질식</b></div>
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
