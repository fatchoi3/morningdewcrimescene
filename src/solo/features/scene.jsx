// ─────────────────────────────────────────────────────────────────────────────
// features/scene — 장면(방/현장) 뷰. 역전재판식 풀블리드: 조사/이야기/이동 + 사건기록.
//   좌우로 밀어 방을 둘러보고(핫스팟), 인물을 눌러 심문으로, 감식은 '의뢰' 흐름.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { getClue } from '../content.js';
import { ROOM_HOTSPOTS, hotspotFor } from '../lib/game.js';
import { pendingQuestions } from '../lib/alerts.js';
import { SceneBg, StandingFigure } from '../art.jsx';
import { DialogueBox, CommandBar } from '../vn.jsx';
import { CaseRecord } from './record.jsx';

// ── 장면(역전재판식 풀블리드: 조사/이야기/이동 + 사건기록) ────────────────────
export function SceneView({ location, collectedSet, roomSuspect, collectedClues, lab, stage = 1, state, phase = 1, onTalk, onOpen, onLockedToast, onBack }) {
  // 이 인물에게 아직 안 물어본 질문 수 — 있으면 대화 영역에 알림 배지
  const talkPending = roomSuspect ? pendingQuestions(roomSuspect.id, state || {}, phase) : 0;
  const [examine, setExamine] = useState(true);
  const [record, setRecord] = useState(false);
  // 배경 그림의 실제 비율. 트랙을 이 비율로 잡아야 핫스팟 %좌표가 그림과 정확히 일치한다
  //   (16:9로 고정해두면 1376×768 같은 그림은 cover로 좌우가 잘려 좌표가 밀린다).
  const [bgRatio, setBgRatio] = useState(16 / 9);
  const camRef = useRef(null);
  const trackRef = useRef(null);
  // 트랙(방 이미지)이 뷰포트보다 크면 가운데로 스크롤 시작 — 밀어서 둘러본다(모바일은 상하좌우 2D 팬)
  useEffect(() => {
    setBgRatio(16 / 9); // 방을 옮기면 새 그림의 onLoad 가 다시 정확한 비율을 준다
    const cam = camRef.current, tr = trackRef.current;
    if (cam && tr) {
      cam.scrollLeft = Math.max(0, (tr.offsetWidth - cam.clientWidth) / 2);
      cam.scrollTop = Math.max(0, (tr.offsetHeight - cam.clientHeight) / 2);
    }
  }, [location?.id]);
  if (!location) return null;
  const isLab = location.kind === 'lab'; // 감식 의뢰실 — 감식원에게 대화형으로 의뢰
  const pannable = examine && !isLab;
  const bodyPos = ROOM_HOTSPOTS[location.id]?.['__body__'] || { x: 50, y: 46, s: 1.1 };
  const talkPos = ROOM_HOTSPOTS[location.id]?.['__talk__']; // 있으면 인물이 배경에 그려짐 → 터치존, 없으면 떠 있는 스탠딩
  return (
    <div className="aa-fs">
      <div className="aa-cam" ref={camRef}>
        <div className="aa-track" ref={trackRef} style={{ aspectRatio: String(bgRatio) }}>
          <SceneBg location={location} onRatio={setBgRatio} />

      {examine && location.showBody && (
        <div className="s-zone-wrap" style={{ left: `${bodyPos.x}%`, top: `${bodyPos.y}%`, '--s': bodyPos.s }}>
          <button className="s-zone body" onClick={() => onOpen('__body__')} aria-label="시신 조사" />
          <svg className="s-zone-outline body" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <rect x="2" y="2" width="96" height="96" rx="6" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="s-zone-lab">시신</span>
        </div>
      )}
      {examine && !isLab && location.objects.map((code, i) => {
        const c = getClue(code); if (!c) return null;
        if (c.phone && stage < 3) return null;   // 휴대폰은 2차 심문(stage 3)에 해금 — 그 전엔 방에 안 보임
        const have = collectedSet.has(code);
        const p = hotspotFor(location, code, i);
        const isGamsik = c.type === '감식';
        const req = isGamsik && lab ? lab.requested(code) : false;
        const zoneLab = have ? c.title
          : isGamsik && lab ? (req ? '🔬 분석 중…' : lab.ready(code) ? '🔬 감식 의뢰' : '채취물 필요')
          : '조사';
        // 핫스팟: w/h가 있으면 물건 크기에 맞춘 상자, poly가 있으면 실루엣 모양.
        //   poly는 버튼 자체를 clip-path로 잘라 '실루엣 안에서만' 클릭되게 한다 →
        //   물건이 서로 붙어 있어도 클릭·표시 영역이 겹치지 않는다.
        //   (이름표는 잘리면 안 되므로 래퍼의 형제로 두고 버튼 hover에 반응시킨다)
        const boxed = p.w != null;
        const clip = p.poly ? `polygon(${p.poly.map((pt) => `${pt[0]}% ${pt[1]}%`).join(', ')})` : undefined;
        const wrapStyle = boxed
          ? { left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, height: `${p.h}%` }
          : { left: `${p.x}%`, top: `${p.y}%`, '--s': p.s };
        const onPick = () => {
          if (isGamsik && !have) {
            // 감식은 '의뢰 → 2차 심문 때 결과' 흐름 (2차 개방 후엔 즉시 결과)
            if (!lab || !lab.ready(code)) { onLockedToast('🧪 채취물이 부족합니다 — 관련 실물 단서를 먼저 확보하세요'); return; }
            if (lab.stage >= 3) { onOpen(code); return; }
            if (req) { onLockedToast('🔬 분석 중입니다 — 2차 심문이 열리면 결과가 도착합니다'); return; }
            lab.request(code); return;
          }
          onOpen(code);
        };
        const tone = have ? ' have' : req ? ' req' : '';
        return (
          <div key={code} className={`s-zone-wrap${boxed ? ' boxed' : ''}`} style={wrapStyle}>
            {/* 클릭 판정 전용(투명). poly면 실루엣 안에서만 눌린다 */}
            <button className={`s-zone${boxed ? ' boxed' : ''}${p.poly ? ' poly' : ''}${tone}`}
              style={clip ? { clipPath: clip, WebkitClipPath: clip } : undefined}
              aria-label={zoneLab} onClick={onPick} />
            {/* 표시 전용 — 면은 비우고 '테두리만' 빛낸다(버튼 밖이라 발광이 잘리지 않음) */}
            <svg className={`s-zone-outline${tone}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {p.poly
                ? <polygon points={p.poly.map((pt) => `${pt[0]},${pt[1]}`).join(' ')} vectorEffect="non-scaling-stroke" />
                : <rect x="2" y="2" width="96" height="96" rx="6" vectorEffect="non-scaling-stroke" />}
            </svg>
            {have && <span className="s-zone-check">✓</span>}
            {/* 새로 할 수 있게 된 것에만 알림 — 감식 의뢰 가능, 2차에 열린 휴대폰.
                안 챙긴 일반 단서까지 붙이면 방마다 느낌표 범벅이라 테두리로 충분하다. */}
            {!have && ((isGamsik && lab?.ready(code) && !req) || (c.phone && stage >= 3)) && (
              <span className="s-alert" title={isGamsik ? '감식 의뢰할 수 있다' : '휴대폰을 볼 수 있게 됐다'}>!</span>
            )}
            <span className="s-zone-lab">{zoneLab}</span>
          </div>
        );
      })}

      {/* 인물 터치존은 반드시 .aa-track(그림) 안에 둔다 —
          밖에 두면 %좌표가 '그림'이 아니라 '화면' 기준이 되어 창 크기에 따라 인물에서 어긋난다. */}
      {roomSuspect && onTalk && talkPos && (
        <button className="s-talkzone"
          style={{ left: `${talkPos.x}%`, top: `${talkPos.y}%`, ...(talkPos.w ? { width: `${talkPos.w}%`, height: `${talkPos.h}%` } : null) }}
          onClick={() => onTalk(roomSuspect.id)} aria-label={`${roomSuspect.name}과 이야기한다`}>
          {/* 인물은 테두리를 그리지 않는다 — 발밑 빛 + '이야기를 한다' 칩만으로 안내.
              (그림 속 인물 위에 선을 얹으면 오히려 지저분해 보임) */}
          <span className="s-talkzone-glow" />
          {talkPending > 0 && <span className="s-alert" title={`물어볼 것 ${talkPending}`}>!</span>}
          <span className="s-talkzone-tip">💬 {roomSuspect.name} — 이야기를 한다{talkPending > 0 ? ` (${talkPending})` : ''}</span>
        </button>
      )}
        </div>
      </div>

      <div className="aa-loc-chip">🔦 {location.label}</div>
      {pannable && <div className="aa-swipe-hint">← 밀어서 방을 둘러보기 →</div>}

      {roomSuspect && onTalk && !talkPos && (
        <button className="s-figure" onClick={() => onTalk(roomSuspect.id)} aria-label={`${roomSuspect.name}과 이야기한다`}>
          <span className="s-figure-tip">💬 이야기를 한다</span>
          <StandingFigure sid={roomSuspect.id} person={roomSuspect.name} image={roomSuspect.image} height={240} fallbackSize={110} />
          <span className="s-figure-lab">{roomSuspect.name}</span>
        </button>
      )}

      {isLab && (
        <div className="aa-ask">
          <div className="aa-ask-h">🧑‍🔬 감식원 — 어떤 걸 분석해 드릴까요?</div>
          {location.objects.map((code) => {
            const c = getClue(code); if (!c) return null;
            const have = collectedSet.has(code);
            const req = lab?.requested(code);
            const ready = lab?.ready(code);
            const cls = have ? 'done' : (ready && !req) ? 'new' : req ? 'asked' : '';
            const label = have ? `✅ ${c.title} — 결과 보기`
              : req ? `🔬 ${c.title} — 분석 중…`
              : ready ? `🔬 ${c.title} — 감식 의뢰`
              : `🔒 ${c.title} — 채취물 필요`;
            return (
              <button key={code} className={cls} onClick={() => {
                if (have) { onOpen(code); return; }
                if (!ready) { onLockedToast('🧪 채취물이 부족합니다 — 관련 실물 단서를 먼저 확보하세요'); return; }
                if (lab.stage >= 3) { onOpen(code); return; }
                if (req) { onLockedToast('🔬 분석 중입니다 — 2차 심문이 열리면 결과가 도착합니다'); return; }
                lab.request(code);
              }}>{ready && !req && !have ? '❗ ' : ''}{label}</button>
            );
          })}
          <button className="end" onClick={onBack}>↩ 나간다</button>
        </div>
      )}

      <DialogueBox location={isLab ? '감식 의뢰실' : location.label}
        text={isLab
          ? '감식원이 결과를 기다린다. 분석할 단서를 고르자 — 채취물을 확보한 것만 의뢰할 수 있고, 결과는 2차 심문이 열릴 때 도착한다.'
          : (examine ? ('그림 속 물건에 마우스를 올리면(모바일은 탭) 조사할 수 있다.' + (roomSuspect ? ` ${roomSuspect.name}을(를) 누르면 이야기할 수 있다.` : '')) : '무엇을 할까?')} />

      <CommandBar items={(isLab ? [
        { icon: '📓', label: '사건기록', onClick: () => setRecord(true) },
        { icon: '🚶', label: '이동한다', onClick: onBack },
      ] : [
        { icon: '🔍', label: '조사한다', active: examine, onClick: () => setExamine((e) => !e) },
        { icon: '📓', label: '사건기록', onClick: () => setRecord(true) },
        { icon: '🚶', label: '이동한다', onClick: onBack },
      ])} />

      {record && (
        <div className="aa-record">
          <button className="aa-close" onClick={() => setRecord(false)}>✕</button>
          <h3>사건 기록</h3>
          <CaseRecord clues={collectedClues} onOpen={(c) => { setRecord(false); onOpen(c); }} />
        </div>
      )}
    </div>
  );
}
