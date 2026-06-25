# 운영 문서 생성기 (docgen)

크라임씬 "Morning Dew" 운영용 PDF를 **`src/data/gameData.js`(정본)에서 직접** 생성한다.
구버전과 달리 단서 데이터를 따로 하드코딩하지 않으므로, **evidenceMap만 고치면 문서가 자동으로 따라온다.**

## 실행

```bash
npm run docs        # HTML + PDF 모두 생성 (puppeteer-core + 시스템 Chrome 사용)
npm run docs:html   # HTML만 (브라우저 인쇄로 직접 PDF 뽑을 때)
```

산출물: `tools/docgen/output/html`, `tools/docgen/output/pdf` (git 무시됨)

- PDF는 시스템 Chrome(`C:\Program Files\Google\Chrome\Application\chrome.exe`)을 사용한다.
  경로가 다르면 `build.mjs`의 `CHROME` 상수를 수정.

## 생성되는 문서 (HTML/PDF 10개 + PPT 1개)

| 문서 | 데이터 출처 |
|---|---|
| 배우레퍼런스_{6인}.pdf | 서사=`bible.mjs`(손관리) + 단서·핸드폰·다이어리·지갑=gameData.js |
| 단서배치_귀속가이드.pdf | **전부 gameData.js 자동 파생** (인물별표·특수조합·CCTV·일정표·방배치도) |
| 진상해설서.pdf | `genTruth.mjs` 서사(피해자명은 `victim.name`) |
| QR_부착표.pdf · QR_인쇄시트.pdf | `genQR.mjs` — 단서 획득방식 분류 + QR 부착표(코드→물건/위치) + **인쇄용 QR**(코드 인코딩, `qrcode` lib). QR 페이로드 = 단서 코드(앱 jsQR 스캐너가 그대로 인식). **인쇄시트 맨 위에 게임 접속 QR**(`SITE_URL`)도 포함 — 이 QR만 코드가 아니라 사이트 주소를 담는다 |
| 게임진행_슬라이드.pptx | `genSlides.mjs` — 운영자 빔프로젝터용 진행 덱(7장). 표지·마무리에 접속 QR, 등장인물·진행 단계는 gameData에서 자동 파생. `pptxgenjs` lib, `output/` 루트에 저장 |

> `genPrompts.mjs`(이미지 생성 프롬프트)는 빌드에서 제외됨 — 필요하면 `build.mjs`에 다시 추가.

## 파일 구성

- `loadData.mjs` — gameData.js import + 인물/색상/조회 헬퍼 + `lint()` 정합성 점검
- `codemap.mjs` — `clue-code-map.txt`(OLD→NEW) 파서
- `render.mjs` — phone/pages/wallet/schedule/cctv/tapReveal → 인쇄 HTML
- `styles.mjs` — 공통 인쇄 CSS
- `bible.mjs` — **유일하게 손으로 관리하는 데이터**: 6인 서사(정체성·타임라인·아는것/모르는것·금지)
- `gen*.mjs` — 문서별 생성기
- `build.mjs` — 일괄 빌드 + PDF 변환

## 이어가기 메모

1. evidenceMap이 바뀌면 → `npm run docs` 만 다시 실행하면 끝. (코드/내용은 자동 반영)
2. 인물 서사(정체성·금지 등)를 바꾸려면 → `bible.mjs` 만 수정.
3. 단서 코드가 또 재발급되면 → `clue-code-map.txt`만 갱신하면 프롬프트 문서가 따라옴.
4. `lint()`가 unlockedBy/CCTV의 깨진 참조를 빌드 때 경고로 알려준다.

## 알려진 데이터 이슈 (gameData.js 쪽)

- `type:'일반'` 단서 3개(`IHKX-61` 베개, `CKKT-40` 문유리창, `PMUZ-94` 섬유)는
  앱의 `EvidenceList`가 **보통/특수 탭 어디에도 표시하지 않는다** (보통/특수만 필터).
- `CKKT-40`은 `unlockedBy:['LGYR-78']`를 갖지만 `type:'일반'`이라
  `App.jsx`의 자동 해금(특수 전용)이 동작하지 않는다.
  → 현장 핵심 단서이므로, 표시하려면 `type`을 `'보통'`/`'특수'`로 바꾸는 것을 검토.
