// ─────────────────────────────────────────────────────────────────────────────
// lib/alerts — '아직 할 일이 남았다'를 세는 알림(❗) 계산.
//   웹앱의 알림 배지처럼, 갈 수 있는 곳/누를 수 있는 것에 남은 거리가 있으면 표시한다.
//     · 복도: 그 방에 안 챙긴 단서나 안 물어본 질문이 남았는가
//     · 방 안: 인물에게 물어볼 게 남았는가(대화 버튼), 새로 열린 조사거리가 있는가
//   "남은 것"만 세고 "이미 한 것"은 세지 않는다 — 다 하면 배지가 사라져 진행도가 보인다.
// ─────────────────────────────────────────────────────────────────────────────
import { getClue, suspects, gamsikReady } from '../content.js';
import { visibleStatements, visibleTopics, topicClues, clueTargetIn } from '../interrogation.js';

const sidOfPerson = (person) => suspects.find((s) => s.name === person)?.id || null;

/**
 * 남은 질문거리를 { total, key } 로 나눠 센다.
 *   total = 아직 안 물어본 것 전부(진술 질문 + 화제 + 화제 아래 단서 질문)
 *   key   = 그 안에 남아 있는 '아직 못 짚은 모순' 수 — 사건을 여는 모순은 통틀어 16개뿐인데
 *           잡담 한 줄과 같은 무게로 합산하면 2차 진입 때 인당 10~16(합 74)이 찍혀,
 *           숫자가 "여기 뭔가 남았다" 말고는 아무것도 못 알려준다.
 */
export function questionBreakdown(sid, state, phase = 1) {
  if (!sid) return { total: 0, key: 0 };
  const collected = state.collected || [];
  const open = visibleStatements(sid, collected, state.stUnlocked?.[sid] || [], phase);
  const asked = new Set(state.askedQ?.[sid] || []);
  // 이미 짚은 모순은 남은 일이 아니다 — 다시 꺼내도 "이미 짚은 모순이다"만 돌아온다.
  const broke = new Set((state.broke?.[sid] || []).map((b) => b?.id));
  // 한 모순에 질문으로도 단서로도 닿으므로 진술 id 로 접어 센다 — 안 접으면 같은 모순을 둘로 세서
  //   실제 남은 개수보다 부풀려 찍힌다.
  const keySts = new Set();
  const markKey = (stId) => { if (stId && !broke.has(stId)) keySts.add(stId); };
  const targetOf = (code) => { const t = clueTargetIn(open, code); return t?.kind === 'contradict' ? t.stId : null; };
  let total = 0;
  for (const s of open) {
    if (asked.has(s.id)) continue;
    total += 1;
    if (s.contradict) markKey(s.id);
  }
  // 화제와 그 아래 단서도 세야 '단서를 주웠으니 다시 가서 물어보라'는 신호가 방 문에 뜬다.
  //   아직 안 꺼낸 화제는 1개로만 센다 — 꺼내야 그 아래가 열리므로.
  const askedT = new Set(state.askedT?.[sid] || []);
  const askedC = new Set(state.askedC?.[sid] || []);
  for (const t of visibleTopics(sid, collected)) {
    const inTopic = topicClues(sid, t, collected, open);
    if (!inTopic.length) continue;                    // 이어질 게 없는 화제는 화면에도 안 뜬다
    if (!askedT.has(t.id)) { total += 1; inTopic.forEach((c) => markKey(targetOf(c))); continue; }
    const left = inTopic.filter((code) => !askedC.has(code));
    total += left.length;
    left.forEach((c) => markKey(targetOf(c)));
  }
  return { total, key: keySts.size };
}

/** 인물에게 지금 물어볼 수 있는데 아직 안 물어본 것의 개수.
 *  숫자 하나만 쓰는 호출처(features/scene 의 대화 배지)가 있어 형태를 그대로 둔다 —
 *  갈래가 필요하면 questionBreakdown 을 쓴다. */
export function pendingQuestions(sid, state, phase = 1) {
  return questionBreakdown(sid, state, phase).total;
}

/** 방에서 '지금 당장 할 수 있는' 것만 센다 — 배지를 따라갔는데 할 게 없으면 안 되니까. */
export function pendingClues(loc, state, stage = 1) {
  if (!loc?.objects) return 0;
  const got = new Set(state.collected || []);
  const collected = state.collected || [];
  const requested = new Set(state.labReq || []);
  // inner = 방 핫스팟이 아니라 다른 단서 안에서 확보하는 것(CCTV 열람대 안의 컷들).
  //   빼고 세면 열람대를 한 번 여는 순간 CCTV 열람실 배지가 영원히 꺼지는데, 2·3막 모순은 그 안에 있다.
  return [...loc.objects, ...(loc.inner || [])].filter((code) => {
    if (got.has(code)) return false;
    const c = getClue(code);
    if (!c) return false;
    if (c.phone && stage < 3) return false;                     // 아직 폰은 못 봄
    // 감식은 채취물이 있어야 의뢰할 수 있고, 이미 맡긴 건 기다리는 일뿐이다.
    //   이걸 안 걸러 감식 의뢰실 배지가 '🔒 채취물 필요'뿐인데도 늘 켜져 있었다.
    if (c.type === '감식') return !requested.has(code) && gamsikReady(code, collected);
    return true;
  }).length;
}

/**
 * 장소 하나의 알림 상태.
 *   { clues, questions, key, total } — total>0 이면 배지를 띄운다(key = 그중 모순으로 이어질 질문).
 *   잠긴 장소(stage 미달)는 셀 필요가 없으므로 0.
 */
export function locationAlerts(loc, state, stage = 1, phase = 1) {
  if (!loc || loc.stage > stage) return { clues: 0, questions: 0, key: 0, total: 0 };
  const clues = pendingClues(loc, state, stage);
  const q = loc.kind === 'room' ? questionBreakdown(sidOfPerson(loc.person), state, phase) : { total: 0, key: 0 };
  return { clues, questions: q.total, key: q.key, total: clues + q.total };
}

/** 배지에 띄울 짧은 사유(툴팁용). */
export function alertReason({ clues, questions, key = 0 }) {
  const parts = [];
  if (clues) parts.push(`살펴볼 것 ${clues}`);
  if (questions) parts.push(`물어볼 것 ${questions}${key ? ` (모순 ${key})` : ''}`);
  return parts.join(' · ');
}
