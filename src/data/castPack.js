// ─────────────────────────────────────────────────────────────────────────────
// castPack — 배포 없이 캐스팅을 바꾸는 "콘텐츠 팩".
//
//   운영자가 앱에서 이름·나이·사진을 고치면 이 브라우저에만 저장된다(localStorage).
//   서버로 아무것도 올라가지 않으므로, 남이 호스팅하는 인스턴스를 써도
//   우리 팀의 캐스팅·사진이 밖으로 나가지 않는다.
//
//   팩은 JSON 한 장이다. 사진은 data URI 로 안에 들어 있어 파일 하나만 주고받으면 된다.
//   (편집기가 업로드 시 자동으로 축소하므로 용량이 커지지 않는다 — castPhoto.js)
//
//   cast.js 가 import 시점에 이 파일을 읽어 기본 캐스팅 위에 덮어쓴다.
//   localStorage 는 동기라서 앱이 그려지기 전에 반영된다(깜빡임 없음).
// ─────────────────────────────────────────────────────────────────────────────

export const PACK_KEY = 'crimescene_castPack';
export const PACK_VERSION = 1;

// 팩이 덮어쓸 수 있는 인물 필드. 그 외 키는 무시한다.
// (role 은 피해자 전용 — '목사'. 이름과 합쳐 '김호치 목사' 표기를 만든다.)
const TEXT_FIELDS = ['name', 'short', 'role', 'gender', 'occupation', 'family', 'notes', 'hint', 'detail'];

// localStorage 한도(브라우저 대개 5MB)에 여유를 두고 자른다.
const MAX_PACK_CHARS = 4_000_000;

const hasStorage = () => {
  try { return typeof localStorage !== 'undefined'; } catch { return false; }
};

// ── 읽기/쓰기 ────────────────────────────────────────────────────────────────

// 저장된 팩. 없거나 깨졌으면 null (Node·docgen 에서도 안전하게 null).
export function readPack() {
  if (!hasStorage()) return null;
  try {
    const raw = localStorage.getItem(PACK_KEY);
    if (!raw) return null;
    const pack = JSON.parse(raw);
    return pack && typeof pack === 'object' ? pack : null;
  } catch {
    return null; // 깨진 팩 때문에 게임이 안 뜨는 일은 없어야 한다
  }
}

export function writePack(pack) {
  if (!hasStorage()) return { ok: false, error: '이 환경에서는 저장할 수 없습니다.' };
  let text;
  try {
    text = JSON.stringify({ ...pack, version: PACK_VERSION });
  } catch {
    return { ok: false, error: '팩을 JSON 으로 만들 수 없습니다.' };
  }
  if (text.length > MAX_PACK_CHARS) {
    const mb = (text.length / 1_000_000).toFixed(1);
    return { ok: false, error: `팩이 너무 큽니다(${mb}MB). 사진 수를 줄이거나 다시 올려 주세요.` };
  }
  try {
    localStorage.setItem(PACK_KEY, text);
    return { ok: true, bytes: text.length };
  } catch {
    return { ok: false, error: '브라우저 저장 공간이 부족합니다. 사진을 줄여 보세요.' };
  }
}

export function clearPack() {
  if (!hasStorage()) return;
  try { localStorage.removeItem(PACK_KEY); } catch { /* 무시 */ }
}

// ── 병합 ─────────────────────────────────────────────────────────────────────

// 기본 캐스팅 위에 팩을 덮어쓴 새 객체를 돌려준다(원본 불변).
// 팩에 없는 인물·필드는 기본값을 그대로 쓴다 — 이름만 바꾸는 것도 가능.
export function applyPack(castRaw, pack) {
  const people = pack?.people;
  if (!people || typeof people !== 'object') return castRaw;

  const out = {};
  for (const id of Object.keys(castRaw)) {
    const base = castRaw[id];
    const patch = people[id];
    if (!patch || typeof patch !== 'object') { out[id] = base; continue; }

    const merged = { ...base };
    for (const f of TEXT_FIELDS) {
      if (typeof patch[f] === 'string' && patch[f].trim() !== '') merged[f] = patch[f];
    }
    // 나이는 숫자로 (빈 문자열·NaN 은 무시)
    if (patch.age !== undefined && patch.age !== '') {
      const n = Number(patch.age);
      if (Number.isFinite(n)) merged.age = n;
    }
    // 사진: data URI 또는 경로. 둘 다 <img src> 로 그대로 쓸 수 있다.
    // (patch.photoRaw 는 편집기가 보정 스타일을 바꿀 때 다시 쓰는 원본이라 게임은 읽지 않는다.)
    if (typeof patch.photo === 'string' && patch.photo !== '') merged.image = patch.photo;
    // 색상
    if (typeof patch.color === 'string' || typeof patch.bg === 'string') {
      merged.theme = {
        color: typeof patch.color === 'string' ? patch.color : base.theme.color,
        bg: typeof patch.bg === 'string' ? patch.bg : base.theme.bg,
      };
    }
    out[id] = merged;
  }
  return out;
}

// 편집기용 — 현재 캐스팅에서 팩 초안을 만든다(내보내기 기본값).
export function packFromCast(castRaw) {
  const people = {};
  for (const id of Object.keys(castRaw)) {
    const p = castRaw[id];
    people[id] = {
      name: p.name, short: p.short ?? '', age: p.age, gender: p.gender,
      occupation: p.occupation, family: p.family ?? '',
      ...(p.notes !== undefined ? { notes: p.notes } : {}),
      ...(p.hint !== undefined ? { hint: p.hint } : {}),
      ...(p.detail !== undefined ? { detail: p.detail } : {}),
      photo: p.image, color: p.theme.color, bg: p.theme.bg,
    };
  }
  return { version: PACK_VERSION, people };
}
