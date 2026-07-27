// ─────────────────────────────────────────────────────────────────────────────
// assets — 콘텐츠 안의 자산 경로를 배포 위치에 맞춰 보정한다.
//
//   gameData/cast 의 이미지 경로는 '/images/...' 처럼 루트 기준으로 적혀 있다.
//   사이트가 도메인 루트에 있으면 그대로 맞지만, GitHub Pages 프로젝트 사이트처럼
//   'example.github.io/저장소이름/' 하위에 놓이면 전부 404 가 된다.
//
//   빌드 시 vite 의 base 값(import.meta.env.BASE_URL)을 앞에 붙여 이 문제를 없앤다.
//   base 가 기본값 '/' 이면 결과가 원본과 같으므로, 루트 배포는 아무 영향이 없다.
//
//   Node(문서 생성기)에는 import.meta.env 가 없어 '/' 로 떨어진다 — 기존 동작 그대로.
// ─────────────────────────────────────────────────────────────────────────────

const BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';

// '/images/…' 만 대상. data: URI(팩에 담긴 사진)나 http(s) 주소는 건드리지 않는다.
const PREFIX = '/images/';
const head = BASE.replace(/\/$/, '');

export const assetUrl = (p) =>
  typeof p === 'string' && p.startsWith(PREFIX) ? head + p : p;

// 객체/배열을 깊이 순회하며 자산 경로만 보정한 새 값을 돌려준다(원본 불변).
export function withAssetBase(node) {
  if (!head) return node; // 루트 배포 — 바꿀 것이 없다
  if (typeof node === 'string') return assetUrl(node);
  if (Array.isArray(node)) return node.map(withAssetBase);
  if (node && typeof node === 'object') {
    const out = {};
    for (const key of Object.keys(node)) out[key] = withAssetBase(node[key]);
    return out;
  }
  return node;
}

export default withAssetBase;
