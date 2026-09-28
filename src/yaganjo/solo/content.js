// ─────────────────────────────────────────────────────────────────────────────
// content — soloContent(콘텐츠 레이어)에서 필요한 값들을 이름으로 재노출.
//   기능 모듈들이 `import { getClue, suspects } from '../content.js'` 형태로 쓴다.
//   (soloContent 객체 자체도 필요할 때가 있어 함께 내보낸다 — computeAutoUnlocked 등)
// ─────────────────────────────────────────────────────────────────────────────
import { soloContent } from './soloContent.js';

export const {
  briefing,
  suspects,
  victim,
  locations,
  caseKey,
  provider,
  clueIcon,
  getClue,
  crimeSceneCodes,
  suspectIds,
  gamsikCodes,
  gamsikReady,
  startingClues,
} = soloContent;

export { soloContent };
