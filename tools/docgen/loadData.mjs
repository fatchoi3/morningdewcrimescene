// 정본 데이터(src/data/gameData.js)를 직접 import 한다.
// 이 파일이 단일 진실원천(single source of truth)이며,
// 모든 운영 문서는 여기서 파생된다.
import { evidenceMap, victim, suspects } from '../../src/data/gameData.js';

export { evidenceMap, victim, suspects };

// 용의자 표시 순서 + 색상 (앱/문서 공통 팔레트)
export const PERSON_ORDER = ['박희원', '이사랑', '이현지', '최종현', '윤은재', '이가현', '목사', '공용'];

export const PERSON_COLOR = {
  '박희원': '#854F0B', '이사랑': '#A32D2D', '이현지': '#0F6E56',
  '최종현': '#185FA5', '윤은재': '#444440', '이가현': '#534AB7',
  '목사': '#6b6760', '공용': '#6b6760',
};
export const PERSON_BG = {
  '박희원': '#FEF6E4', '이사랑': '#FDEAEA', '이현지': '#E8F8F2',
  '최종현': '#EAF3FC', '윤은재': '#F0EFEC', '이가현': '#EEEDFE',
  '목사': '#f0ede6', '공용': '#f0ede6',
};

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
