// 정본 콘텐츠(src/data/gameData.js) + 비밀팩(secrets.js)을 합쳐 단일 진실원천을 만든다.
// 앱은 비밀을 분리해 배포하지만, 문서 생성기(Node·미배포)는 감식 비번·복구 비번 등
// 전체 데이터를 필요로 하므로 여기서 mergeSecrets로 다시 합친다.
// 설정(사이트 URL·팔레트)은 gameConfig(앱/문서 공통 단일 설정)에서 가져온다.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { makeDocData } from './dataCore.mjs';

// 실제 비밀팩(secrets.js)이 있으면 그것을, 없으면 템플릿(secrets.example.js)으로 폴백
const _hasRealSecrets = existsSync(fileURLToPath(new URL('../../src/data/secrets.js', import.meta.url)));
const secrets = (await import(_hasRealSecrets ? '../../src/data/secrets.js' : '../../src/data/secrets.example.js')).default;

// 합성·도우미는 dataCore.mjs 에 있다(브라우저 인쇄물 키트와 한 벌을 쓴다).
export const { victim, suspects, evidenceMap, recover, SITE_URL, PERSON_ORDER, PERSON_COLOR, PERSON_BG, allClues, clueByCode, cluesOf, titleOf, buildUnlockReverseIndex, lint } = makeDocData(secrets);
