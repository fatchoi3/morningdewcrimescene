// 정본 콘텐츠(src/data/gameData.js) + 비밀팩(secrets.js)을 합쳐 단일 진실원천을 만든다.
// 앱은 비밀을 분리해 배포하지만, 문서 생성기(Node·미배포)는 감식 비번·복구 비번 등
// 전체 데이터를 필요로 하므로 여기서 mergeSecrets로 다시 합친다.
// 설정(사이트 URL·팔레트)은 gameConfig(앱/문서 공통 단일 설정)에서 가져온다.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { evidenceMap as _publicMap, victim, suspects } from '../../src/data/gameData.js';
import { mergeSecrets } from '../../src/data/mergeSecrets.js';
import { gameConfig } from '../../src/config/gameConfig.js';

// 실제 비밀팩(secrets.js)이 있으면 그것을, 없으면 템플릿(secrets.example.js)으로 폴백
const _hasRealSecrets = existsSync(fileURLToPath(new URL('../../src/data/secrets.js', import.meta.url)));
const secrets = (await import(_hasRealSecrets ? '../../src/data/secrets.js' : '../../src/data/secrets.example.js')).default;

export const evidenceMap = mergeSecrets(_publicMap, secrets);
export { victim, suspects };
// 톡서랍 복구 번호 — 인물 시트에 「내 폰 번호」로 찍는다. 사람은 자기 폰 번호를 안다.
export const recover = secrets.recover || {};

// 게임 접속 사이트 (참가자용 QR · PPT 표지에서 사용)
export const SITE_URL = gameConfig.siteUrl;

// 용의자 표시 순서 + 색상 (앱/문서 공통 팔레트)
export const PERSON_ORDER = gameConfig.personOrder;
export const PERSON_COLOR = gameConfig.personColor;
export const PERSON_BG = gameConfig.personBg;

// 코드 → 항목 (code 필드를 주입)
export const allClues = Object.entries(evidenceMap).map(([code, v]) => ({ code, ...v }));

export function clueByCode(code) {
  const v = evidenceMap[code];
  return v ? { code, ...v } : null;
}

/** 특정 인물의 단서 목록 (옵션으로 type 필터) */
export function cluesOf(person, type) {
  return allClues.filter((c) => c.person === person && (!type || c.type === type));
}

/** 코드의 제목(없으면 '(미작성)') */
export function titleOf(code) {
  const v = evidenceMap[code];
  if (!v) return `⚠️미존재(${code})`;
  return v.title?.trim() || '(제목 미작성)';
}

/** 단서가 어떤 특수단서의 선행조건(unlockedBy)으로 쓰이는지 역참조 맵 */
export function buildUnlockReverseIndex() {
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
export function lint() {
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
