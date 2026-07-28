// ─────────────────────────────────────────────────────────────────────────────
// lib/alerts — '아직 할 일이 남았다'를 세는 알림(❗) 계산.
//   웹앱의 알림 배지처럼, 갈 수 있는 곳/누를 수 있는 것에 남은 거리가 있으면 표시한다.
//     · 복도: 그 방에 안 챙긴 단서나 안 물어본 질문이 남았는가
//     · 방 안: 인물에게 물어볼 게 남았는가(대화 버튼), 새로 열린 조사거리가 있는가
//   "남은 것"만 세고 "이미 한 것"은 세지 않는다 — 다 하면 배지가 사라져 진행도가 보인다.
// ─────────────────────────────────────────────────────────────────────────────
import { getClue, suspects, gamsikReady } from '../content.js';
import { visibleStatements, visibleTopics, topicClues } from '../interrogation.js';

const sidOfPerson = (person) => suspects.find((s) => s.name === person)?.id || null;

/** 인물에게 지금 물어볼 수 있는데 아직 안 물어본 것 — 진술 질문 + 화제 + 화제 아래 단서 질문. */
export function pendingQuestions(sid, state, phase = 1) {
  if (!sid) return 0;
  const collected = state.collected || [];
  const open = visibleStatements(sid, collected, state.stUnlocked?.[sid] || [], phase);
  const asked = new Set(state.askedQ?.[sid] || []);
  let n = open.filter((s) => !asked.has(s.id)).length;
  // 화제와 그 아래 단서도 세야 '단서를 주웠으니 다시 가서 물어보라'는 신호가 방 문에 뜬다.
  //   아직 안 꺼낸 화제는 1개로만 센다 — 꺼내야 그 아래가 열리므로.
  const askedT = new Set(state.askedT?.[sid] || []);
  const askedC = new Set(state.askedC?.[sid] || []);
  for (const t of visibleTopics(sid, collected)) {
    const inTopic = topicClues(sid, t, collected, open);
    if (!inTopic.length) continue;                    // 이어질 게 없는 화제는 화면에도 안 뜬다
    if (!askedT.has(t.id)) { n += 1; continue; }
    n += inTopic.filter((code) => !askedC.has(code)).length;
  }
  return n;
}

/** 방에서 '지금 당장 할 수 있는' 것만 센다 — 배지를 따라갔는데 할 게 없으면 안 되니까. */
export function pendingClues(loc, state, stage = 1) {
  if (!loc?.objects) return 0;
  const got = new Set(state.collected || []);
  const collected = state.collected || [];
  const requested = new Set(state.labReq || []);
  return loc.objects.filter((code) => {
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
 *   { clues, questions, total } — total>0 이면 배지를 띄운다.
 *   잠긴 장소(stage 미달)는 셀 필요가 없으므로 0.
 */
export function locationAlerts(loc, state, stage = 1, phase = 1) {
  if (!loc || loc.stage > stage) return { clues: 0, questions: 0, total: 0 };
  const clues = pendingClues(loc, state, stage);
  const questions = loc.kind === 'room' ? pendingQuestions(sidOfPerson(loc.person), state, phase) : 0;
  return { clues, questions, total: clues + questions };
}

/** 배지에 띄울 짧은 사유(툴팁용). */
export function alertReason({ clues, questions }) {
  const parts = [];
  if (clues) parts.push(`살펴볼 것 ${clues}`);
  if (questions) parts.push(`물어볼 것 ${questions}`);
  return parts.join(' · ');
}
