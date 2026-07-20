// ─────────────────────────────────────────────────────────────────────────────
// features/scene — 장면(방/현장) 뷰. 역전재판식 풀블리드: 조사/이야기/이동 + 사건기록.
//   좌우로 밀어 방을 둘러보고(핫스팟), 인물을 눌러 심문으로, 감식은 '의뢰' 흐름.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { getClue } from '../content.js';
import { ROOM_HOTSPOTS, hotspotFor } from '../lib/game.js';
import { SceneBg, StandingFigure } from '../art.jsx';
import { DialogueBox, CommandBar } from '../vn.jsx';
import { CaseRecord } from './record.jsx';

// ── 장면(역전재판식 풀블리드: 조사/이야기/이동 + 사건기록) ────────────────────
export function SceneView({ location, collectedSet, roomSuspect, collectedClues, lab, onTalk, onOpen, onLockedToast, onBack }) {
  const [examine, setExamine] = useState(true);
  const [record, setRecord] = useState(false);
  const camRef = useRef(null);
  const trackRef = useRef(null);
  // 세로 화면: 트랙(방 이미지)이 뷰포트보다 넓으면 가운데로 스크롤 시작 — 좌우로 밀어 둘러본다
  useEffect(() => {
    const cam = camRef.current, tr = trackRef.current;
    if (cam && tr) cam.scrollLeft = Math.max(0, (tr.offsetWidth - cam.clientWidth) / 2);
  }, [location?.id]);
  if (!location) return null;
  const pannable = examine; // 조사 중에는 좌우 둘러보기
  const bodyPos = ROOM_HOTSPOTS[location.id]?.['__body__'] || { x: 50, y: 46, s: 1.1 };
  // 이전/다음 단서 순회 목록 — 모달로 열리는 소품만(감식 미확보는 의뢰 흐름이라 제외)
  const navCodes = [
    ...(location.showBody ? ['__body__'] : []),
    ...location.objects.filter((cd) => { const cc = getClue(cd); return cc && !(cc.type === '감식' && !collectedSet.has(cd)); }),
  ];
  return (
    <div className="aa-fs">
      <div className="aa-cam" ref={camRef}>
        <div className="aa-track" ref={trackRef}>
          <SceneBg location={location} />

      {examine && location.showBody && (
        <button className="s-zone body" style={{ left: `${bodyPos.x}%`, top: `${bodyPos.y}%`, '--s': bodyPos.s }} onClick={() => onOpen('__body__', navCodes)} aria-label="시신 조사">
          <span className="s-zone-ground" />
          <span className="s-zone-glow" />
          <span className="s-zone-lab">시신</span>
        </button>
      )}
      {examine && location.objects.map((code, i) => {
        const c = getClue(code); if (!c) return null;
        const have = collectedSet.has(code);
        const p = hotspotFor(location, code, i);
        const isGamsik = c.type === '감식';
        const req = isGamsik && lab ? lab.requested(code) : false;
        const zoneLab = have ? c.title
          : isGamsik && lab ? (req ? '🔬 분석 중…' : lab.ready(code) ? '🔬 감식 의뢰' : '채취물 필요')
          : '조사';
        return (
          <button key={code} className={`s-zone${have ? ' have' : ''}${req && !have ? ' req' : ''}`} style={{ left: `${p.x}%`, top: `${p.y}%`, '--s': p.s }}
            aria-label={zoneLab}
            onClick={() => {
              if (isGamsik && !have) {
                // 감식은 '의뢰 → 2차 심문 때 결과' 흐름 (2차 개방 후엔 즉시 결과)
                if (!lab || !lab.ready(code)) { onLockedToast('🧪 채취물이 부족합니다 — 관련 실물 단서를 먼저 확보하세요'); return; }
                if (lab.stage >= 3) { onOpen(code, navCodes); return; }
                if (req) { onLockedToast('🔬 분석 중입니다 — 2차 심문이 열리면 결과가 도착합니다'); return; }
                lab.request(code); return;
              }
              onOpen(code, navCodes);
            }}>
            <span className="s-zone-ground" />
            <span className="s-zone-glow" />
            {have && <span className="s-zone-check">✓</span>}
            <span className="s-zone-lab">{zoneLab}</span>
          </button>
        );
      })}
        </div>
      </div>

      <div className="aa-loc-chip">🔦 {location.label}</div>
      {pannable && <div className="aa-swipe-hint">← 밀어서 방을 둘러보기 →</div>}

      {roomSuspect && onTalk && (
        <button className="s-figure" onClick={() => onTalk(roomSuspect.id)} aria-label={`${roomSuspect.name}과 이야기한다`}>
          <span className="s-figure-tip">💬 이야기를 한다</span>
          <StandingFigure sid={roomSuspect.id} person={roomSuspect.name} image={roomSuspect.image} height={240} fallbackSize={110} />
          <span className="s-figure-lab">{roomSuspect.name}</span>
        </button>
      )}

      <DialogueBox location={location.label}
        text={examine ? ('그림 속 빛나는 곳을 눌러 조사하자.' + (roomSuspect ? ` ${roomSuspect.name}을(를) 누르면 이야기할 수 있다.` : '')) : '무엇을 할까?'} />

      <CommandBar items={[
        { icon: '🔍', label: '조사한다', active: examine, onClick: () => setExamine((e) => !e) },
        { icon: '📓', label: '사건기록', onClick: () => setRecord(true) },
        { icon: '🚶', label: '이동한다', onClick: onBack },
      ]} />

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
