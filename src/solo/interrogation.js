// ─────────────────────────────────────────────────────────────────────────────
// interrogation — 역전재판식 심문(증언 + 추궁 + 증거 제시로 모순 잡기).
//   인물별 '증언(statements)'을 보고:
//     · 추궁(press): 진술을 눌러 부연/꼬리 답변. pressUnlock로 새 증언 개방.
//     · 증거 제시(present): 진술에 맞는 증거 → "모순!"(contradict) → 자백/새 증언 해금.
//         soft = 관련 있으나 모순은 아닌 반응(신뢰도 유지) / 그 외 = 관계없는 증거(신뢰도-1).
//   증거 게이팅: needs(단서 보유 시 증언 등장) · hidden(추궁/모순으로만 열림).
//   무고=해명, 가담=모순→자백, 진범(박희원)=모순에도 끝까지 부인.
// ─────────────────────────────────────────────────────────────────────────────

const WRONG = '…이건 이 진술과 관계없는 것 같군요.';

const DATA = {
  // ── S1 최종현 — 무고(도구로 이용) ──
  S1: {
    intro: '…제가 드린 음료 때문일까 봐 무서워요. 근데 전 아무 짓도 안 했어요.',
    statements: [
      { id: 'am', text: '목사님이랑 등산 갔다가, 돌아와서 "단백질" 음료를 타 드렸어요.',
        press: '통에 라벨을 손으로 써서 구분했어요. 헷갈릴 리가 없는데…',
        soft: { 'VNTD-61': '그 등산 지도요? 목사님이 제일 좋아하던 코스예요.' },
        contradict: { code: 'TUBE-12', text: '❗모순 — 그 "단백질" 통은 라벨이 바뀌어 있었습니다. 실제 내용물은 요힘빈이었어요. 당신 잘못이 아닙니다.', unlock: 'relief' } },
      { id: 'relief', hidden: true, text: '(안도) 그럼… 저는 이용당한 거네요. 정말 다행이에요.',
        press: '그럼 라벨을 바꾼 사람이 진짜 범인이겠네요. 전 몰랐어요.' },
      { id: 'own', text: '요힘빈은 제 다이어트용이었어요. 목사님껜 절대 안 드렸고요.', needs: 'OYJW-26',
        press: '제 통은 따로 뒀는데… 누가 건드린 거예요.',
        soft: { 'OYJW-26': '네, 그건 제 거예요. 근데 목사님껜 단백질만 드렸어요.' } },
    ],
  },

  // ── S2 윤은재 — 무고(언쟁뿐) ──
  S2: {
    intro: '찬양곡 갈등은 인정해요. 근데 전 안 죽였어요.',
    statements: [
      { id: 'noon', text: '점심 뒤에 방에서 다투긴 했지만, 제가 나올 때 목사님은 멀쩡했어요.',
        press: '멱살은 잡았어요. 근데 목사님이 뿌리친 게 다예요. 12시 45분쯤 나왔어요.',
        soft: { 'IOVT-95': '이 손목 멍요? 목사님이 제 손 뿌리쳐서 생긴 거예요. 목을 조른 게 아니라고요.', 'AVLP-75': '단추요? 실랑이하다 제 셔츠에서 떨어졌나 봐요.' } },
      { id: 'hike', text: '오전엔 산에 따라 올라갔다가 그냥 내려왔어요.',
        press: '먼발치에 목사님이랑 종현이가 보여서 말도 못 붙였어요.' },
      { id: 'alibi', text: '제가 나올 때 목사님은 아직 그 음료도 안 드신 상태였어요.', needs: 'IOVT-95',
        press: '그러니까 제가 나온 뒤에 무슨 일이 있었던 거예요. 전 아니에요.' },
    ],
  },

  // ── S3 이현지 — 가담(수면제·사인 무관), 동생 보호 ──
  S3: {
    intro: '…무슨 일이죠.',
    statements: [
      { id: 'rel', text: '목사님과 저는 아무 마찰도 없었어요.', press: '회계 일로 몇 번 뵌 게 다예요.' },
      { id: 'sis', text: '이사랑 총무완 그냥 친한 동료 사이예요.', press: '…가깝게 지내요.',
        contradict: { code: 'BUFL-52', text: '❗모순 — 당신 다이어리엔 이사랑을 "동생"이라 적었습니다.', unlock: 'sis2' } },
      { id: 'sis2', hidden: true, text: '(한숨) …네. 이사랑은 제 친동생이에요. 숨겨서 미안해요.',
        press: '상속을 포기하고 동생 빚을 몰래 갚아왔어요. 동생이 무너지는 걸 볼 수 없었어요.' },
      { id: 'room', text: '전 목사님 방엔 들어가지 않았어요.', needs: 'SAJL-88', press: '…정말이에요.',
        soft: { 'BXNP-29': '졸피뎀요? 제 불면증 약이에요.' },
        contradict: { code: 'NVYN-22', text: '❗모순 — 목사님 텀블러 감식에서 당신이 먹는 졸피뎀 성분이 나왔습니다.', unlock: 'sisConf', confess: true } },
      { id: 'sisConf', hidden: true, text: '…동생을 지키고 싶었어요. 목사님이 잠들면 재정 점검이 미뤄질 줄 알았어요. 죽이려던 게 아니에요.',
        press: '정말 잠깐 미루려던 것뿐이에요. 믿어주세요.' },
    ],
  },

  // ── S4 박희원 — 진범(모순에도 끝까지 부인) ──
  S4: {
    intro: '무슨 일이시죠? 저는 목사님을 늘 존경했습니다.',
    statements: [
      { id: 'cert', text: '제 신학교 수료증은 정식으로 받은 겁니다.', press: '왜 자꾸 수료증 얘길 하시죠.',
        contradict: { code: 'LWUY-33', text: '❗모순 — 목사님 휴대폰엔 "박 전도사 수료증이 의심스럽다"는 지인의 카톡이 있고, 목사님은 교단에 확인하려 했습니다.', unlock: 'cert2' } },
      { id: 'cert2', hidden: true, text: '(잠시 굳는다) …그건 목사님이 착각하신 겁니다.', press: '…더 드릴 말씀 없습니다.' },
      { id: 'room', text: '저는 그날 목사님 방에 들어간 적이 없습니다.', press: '복도를 몇 번 오가긴 했지만요.',
        soft: { 'LUDP-77': '제 시계에 자국요? 어디 부딪혔겠죠. 그게 무슨 의미가 있습니까.' } },
      { id: 'pills', text: '제 요일별 약통엔 영양제뿐입니다.', needs: 'UTUW-73', press: '비타민, 루테인, 오메가3… 그게 전부예요.',
        contradict: { code: 'HIDN-37', text: '❗모순 — 그 영양제 통 감식에서 목사님의 협심증 약 "설하정"이 검출됐습니다. 왜 당신 통에 목사님 약이 있죠?', unlock: 'crack' } },
      { id: 'crack', hidden: true, text: '(표정이 흔들린다) …모릅니다. 저는 아무것도 인정하지 않습니다.', press: '증거 있습니까? 저는 끝까지 부인하겠습니다.' },
    ],
  },

  // ── S5 이사랑 — 가담(보충제 라벨 교체) ──
  S5: {
    intro: '…돈 이야기는 하고 싶지 않아요.',
    statements: [
      { id: 'room', text: '전 제 방에만 있었고, 다른 방엔 안 갔어요.', press: '총무라 정신없이 바빴어요.',
        contradict: { code: 'NYBB-98', text: '❗모순 — 당신 화장품 파우치에서, 라벨을 오릴 때 묻는 흰 가루가 나왔습니다.', unlock: 'label' } },
      { id: 'label', hidden: true, text: '(떨리는 목소리) …그건…', press: '…',
        soft: { 'LBPG-31': '라벨지랑 볼펜은 행사 준비에 쓴 거예요.' },
        contradict: { code: 'TUBE-12', text: '❗모순 — 최종현의 보충제 라벨이 바뀌어 있었습니다. 그 흰 가루, 그 손길이 당신 것이죠.', unlock: 'labelConf', confess: true } },
      { id: 'labelConf', hidden: true, text: '…목사님이 한 번만 쓰러지면 재정 점검이 미뤄질 줄 알았어요. 죽이려던 건 절대 아니었어요.',
        press: '요힘빈이 그렇게까지 될 줄은 몰랐어요.' },
      { id: 'money', text: '찬조금은 제가 정리하는 중이었어요.', needs: 'BCZN-89', press: '…빚이 좀 있었어요.',
        soft: { 'BCZN-89': '제 다이어리를 보셨군요. …네, 빚 때문이었어요.' } },
    ],
  },

  // ── S6 이가현 — 증거 인멸(발견자) ──
  S6: {
    intro: '제 사생활은 이 사건과 관계없어요.',
    statements: [
      { id: 'report', text: '전 목사님을 발견하고 바로 신고했어요.', press: '놀라서 정신이 없었어요.',
        contradict: { code: 'LWUY-33', text: '❗모순 — 발견과 신고 사이에 공백이 있고, 그 사이 목사님 폰의 톡서랍 기록이 지워졌습니다.', unlock: 'delete' } },
      { id: 'delete', hidden: true, text: '…네, 제 험담 대화를 지웠어요. 증거 인멸은 맞지만 살인은 아니에요.',
        press: '제 비밀을 지키고 싶었을 뿐이에요.' },
      { id: 'niece', text: '그 아인 제 조카예요.', needs: 'LWNR-86', press: '…왜 그걸 물으세요.',
        contradict: { code: 'LWNR-86', text: '❗모순 — 그 그림 편지는 당신을 "엄마"라고 부르고 있습니다.', unlock: 'motive' } },
      { id: 'motive', hidden: true, text: '…제 딸이에요. 이혼했고, 조카라 속여왔죠.',
        press: '목사님이 그 사실을 흘려서 파혼당했어요. 원망스러웠던 건 맞아요. 근데 안 죽였어요.' },
      { id: 'key', text: '제가 들어갔을 땐 이미 돌아가셨고, 방엔 아무도 없었어요.', needs: 'LWUY-33',
        press: '제 직전에 누가 나갔다면… 전 못 봤어요. 이미 늦어 있었어요.' },
    ],
  },
};

const stOf = (sid, stId) => DATA[sid]?.statements.find((s) => s.id === stId) || null;

export const introOf = (sid) => DATA[sid]?.intro || '';

/** 현재 노출되는 증언: 기본(always) + needs 충족 + hidden 해금. */
export function visibleStatements(sid, collected = [], unlocked = []) {
  const d = DATA[sid];
  if (!d) return [];
  const have = new Set(collected);
  const open = new Set(unlocked);
  return d.statements.filter((s) => {
    if (s.hidden) return open.has(s.id);
    if (s.needs) return have.has(s.needs);
    return true;
  }).map((s) => ({ id: s.id, text: s.text }));
}

/** 추궁 → { text, unlock? } */
export function pressOf(sid, stId) {
  const s = stOf(sid, stId);
  return s ? { text: s.press || '…(더 할 말이 없다.)', unlock: s.pressUnlock } : { text: '' };
}

/** 증거 제시 → { result:'contradict'|'soft'|'wrong', text, unlock?, confess? } */
export function presentOn(sid, stId, code) {
  const s = stOf(sid, stId);
  if (!s) return { result: 'wrong', text: WRONG };
  if (s.contradict && s.contradict.code === code) {
    return { result: 'contradict', text: s.contradict.text, unlock: s.contradict.unlock, confess: !!s.contradict.confess };
  }
  if (s.soft && s.soft[code]) return { result: 'soft', text: s.soft[code] };
  return { result: 'wrong', text: WRONG };
}

/** 이 인물에게 아직 못 잡은 모순이 남았는지(대기 중인 결정 증거 존재) */
export function hasPendingContradiction(sid, collected = [], unlocked = [], broke = []) {
  const brokenIds = new Set(broke);
  return visibleStatements(sid, collected, unlocked).some((v) => {
    const s = stOf(sid, v.id);
    return s?.contradict && !brokenIds.has(s.id);
  });
}
