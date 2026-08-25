// ─────────────────────────────────────────────────────────────────────────────
// tokens — 콘텐츠 본문의 인물 토큰을 실제 이름으로 치환한다.
//
//   {{S5}}          → 한다영        (cast[id].name)
//   {{S5.short}}    → 다영          (cast[id].short — 임의 필드 접근 가능)
//   {{S5|과/와}}     → 한다영과      (받침 있음 → 앞 형태 / 없음 → 뒤 형태)
//   {{S5.short|이/}} → 다영이        (뒤 형태가 비어 있으면 받침 없을 때 아무것도 안 붙음)
//
// 조사 형태를 코드에 박지 않고 본문에서 쌍(A/B)으로 적게 한 이유:
//   캐스팅을 바꾸면 받침이 달라져 조사도 달라진다. '한다영과' → '수아와'.
//   쌍만 적어두면 이름이 무엇으로 바뀌든 문법이 맞는다.
// ─────────────────────────────────────────────────────────────────────────────

const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;
const JONG_COUNT = 28;
const JONG_RIEUL = 8; // 종성 ㄹ

// 마지막 글자의 받침 정보. { has, rieul }
function finalConsonant(word) {
  const ch = String(word).trim().slice(-1);
  const code = ch.charCodeAt(0);
  if (Number.isNaN(code) || code < HANGUL_BASE || code > HANGUL_LAST) {
    return { has: false, rieul: false }; // 한글이 아니면 받침 없음으로 취급
  }
  const jong = (code - HANGUL_BASE) % JONG_COUNT;
  return { has: jong !== 0, rieul: jong === JONG_RIEUL };
}

// 받침 유무에 맞는 조사 형태를 고른다. pair = '과/와' 처럼 A/B.
function pickParticle(word, pair) {
  const slash = pair.indexOf('/');
  if (slash === -1) return pair; // 쌍이 아니면 그대로
  const withJong = pair.slice(0, slash);
  const withoutJong = pair.slice(slash + 1);
  const { has, rieul } = finalConsonant(word);
  // '으로/로' 는 ㄹ 받침도 뒤 형태를 쓴다 (서울로, 이슬로)
  if (has && rieul && withJong.startsWith('으')) return withoutJong;
  return has ? withJong : withoutJong;
}

const TOKEN = /\{\{\s*([A-Za-z_$][\w$]*)(?:\.([\w$]+))?(?:\|([^}]*))?\s*\}\}/g;

// 문자열 하나를 치환. 미정의 토큰은 그대로 두고 onMissing 으로 알린다.
export function resolveString(str, cast, onMissing) {
  if (!str.includes('{{')) return str;
  return str.replace(TOKEN, (whole, id, field, particle) => {
    const person = cast[id];
    if (!person) {
      onMissing?.(whole, `cast 에 '${id}' 없음`);
      return whole;
    }
    const value = person[field || 'name'];
    if (value == null) {
      onMissing?.(whole, `cast.${id} 에 '${field || 'name'}' 없음`);
      return whole;
    }
    return particle == null ? value : value + pickParticle(value, particle);
  });
}

// 객체/배열/문자열을 깊이 순회하며 치환한 새 값을 돌려준다(원본 불변).
// 키 순서는 보존한다 — 데이터 덤프 비교로 리팩터 무해함을 검증하기 위해.
export function resolveTokens(node, cast, onMissing) {
  if (typeof node === 'string') return resolveString(node, cast, onMissing);
  if (Array.isArray(node)) return node.map((v) => resolveTokens(v, cast, onMissing));
  if (node && typeof node === 'object') {
    const out = {};
    for (const key of Object.keys(node)) out[key] = resolveTokens(node[key], cast, onMissing);
    return out;
  }
  return node;
}

export default resolveTokens;
