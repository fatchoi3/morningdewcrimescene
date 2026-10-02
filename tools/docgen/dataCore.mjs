// 문서 생성기의 데이터 합성 본체 — 정본(gameData.js) + 비밀팩을 합쳐 한 벌로 만든다.
//   비밀팩을 어디서 고르는지만 다르다: Node(loadData.mjs)는 fs 로 secrets.js 를 찾고,
//   브라우저 인쇄물 키트(loadData.browser.mjs)는 Vite 의 @secrets 별칭이 골라 준다.
//   여기에는 node: 모듈을 들이지 않는다 — 들이면 브라우저 번들이 깨진다.
import { evidenceMap as _publicMap, victim, suspects } from '../../src/data/gameData.js';
import { mergeSecrets } from '../../src/data/mergeSecrets.js';
import { gameConfig } from '../../src/config/gameConfig.js';

export function makeDocData(secrets) {
  const evidenceMap = mergeSecrets(_publicMap, secrets);
  // 톡서랍 복구 번호 — 인물 시트에 「내 폰 번호」로 찍는다. 사람은 자기 폰 번호를 안다.
  const recover = secrets.recover || {};

  // 게임 접속 사이트 (참가자용 QR · PPT 표지에서 사용)
  const SITE_URL = gameConfig.siteUrl;

  // 용의자 표시 순서 + 색상 (앱/문서 공통 팔레트)
  const PERSON_ORDER = gameConfig.personOrder;
  const PERSON_COLOR = gameConfig.personColor;
  const PERSON_BG = gameConfig.personBg;

  // 코드 → 항목 (code 필드를 주입)
  const allClues = Object.entries(evidenceMap).map(([code, v]) => ({ code, ...v }));

  function clueByCode(code) {
    const v = evidenceMap[code];
    return v ? { code, ...v } : null;
  }

  /** 특정 인물의 단서 목록 (옵션으로 type 필터) */
  function cluesOf(person, type) {
    return allClues.filter((c) => c.person === person && (!type || c.type === type));
  }

  /** 코드의 제목(없으면 '(미작성)') */
  function titleOf(code) {
    const v = evidenceMap[code];
    if (!v) return `⚠️미존재(${code})`;
    return v.title?.trim() || '(제목 미작성)';
  }

  /** 단서가 어떤 특수단서의 선행조건(unlockedBy)으로 쓰이는지 역참조 맵 */
  function buildUnlockReverseIndex() {
    const idx = {}; // code -> [특수코드...]
    for (const c of allClues) {
      if (Array.isArray(c.unlockedBy)) {
        for (const req of c.unlockedBy) {
          (idx[req] ||= []).push(c.code);
        }
      }
    }
    return idx;
  }

  /** evidenceMap 전체에 대한 정합성 점검 결과 (경고 리스트) */
  function lint() {
    const warnings = [];
    const codes = new Set(allClues.map((c) => c.code));
    for (const c of allClues) {
      if (Array.isArray(c.unlockedBy)) {
        for (const req of c.unlockedBy) {
          if (!codes.has(req)) warnings.push(`${c.code} unlockedBy 누락코드: ${req}`);
        }
      }
      // CCTV unlocks 점검
      if (c.cctv?.timeline) {
        for (const t of c.cctv.timeline) {
          for (const p of (t.people || [])) {
            if (p.unlocks && !codes.has(p.unlocks)) warnings.push(`${c.code} CCTV unlocks 누락코드: ${p.unlocks}`);
          }
        }
      }
    }
    return warnings;
  }
  return { victim, suspects, evidenceMap, recover, SITE_URL, PERSON_ORDER, PERSON_COLOR, PERSON_BG, allClues, clueByCode, cluesOf, titleOf, buildUnlockReverseIndex, lint };
}
