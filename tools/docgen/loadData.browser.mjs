// 브라우저판 loadData — 인쇄물 키트(/qr-kit)가 Node 생성기를 그대로 돌리려고 쓴다.
//   vite.config.js 의 docgen-browser 플러그인이 tools/docgen 안의 './loadData.mjs' 를 이 파일로 바꿔 문다.
//   비밀팩은 @secrets 별칭이 골라 준다(Node 판은 fs 로 찾는다). 합성은 dataCore.mjs 한 벌.
import secrets from '@secrets';
import { makeDocData } from './dataCore.mjs';

export const { victim, suspects, evidenceMap, recover, SITE_URL, PERSON_ORDER, PERSON_COLOR, PERSON_BG, allClues, clueByCode, cluesOf, titleOf, buildUnlockReverseIndex, lint } = makeDocData(secrets);
