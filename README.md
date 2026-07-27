# 새벽이슬 크라임씬 (Morning Dew Crime Scene)

QR 기반 오프라인 크라임씬(추리) 게임 — 교회 청년부 수련회용. 참가자는 각자 휴대폰으로
현장의 QR을 스캔해 단서를 모으고, 용의자(배우)를 심문해 범인·동기·방법을 추리합니다.

- **A (현재):** 인터넷만 되면 도는 **정적 웹앱**. 다른 단체가 그대로 가져다 자기 수련회에서 운영 가능.
- **B (예정):** 방(room) 기반 **온라인 실시간 협동 플레이**(서버가 정답 소유). 아래 "아키텍처" 참고.

React 18 + Vite 5. 상태는 브라우저 `localStorage`에 저장(오프라인 단독).

---

## 빠른 시작

```bash
npm install
npm run dev        # 개발 서버
npm run build      # 프로덕션 빌드 → dist/
npm run docs       # 운영 문서(QR 키트·배치도·진상해설·PPT 등) 생성 → tools/docgen/output/
```

> 처음 클론했다면 `public/images/people/` 에 인물 사진을 넣거나(없으면 이름 첫 글자 아바타로 표시),
> 필요 시 `cp .env.example .env` 로 환경변수를 설정하세요.

---

## 캐스팅만 바꾸기 — 코드 수정 없이 (권장)

우리 팀 사람들로 등장인물을 갈아끼우는 것뿐이라면 **`/cast.html` 한 화면**이면 됩니다.
빌드도, 배포도, 저장소 포크도 필요 없습니다.

1. 브라우저에서 `/cast.html` 을 엽니다 (예: `https://…/cast.html`).
2. 이름·나이·직책·사진·색상을 고치고 **[저장]**.
3. 게임 화면을 새로 고치면 반영됩니다.

- 저장은 **그 브라우저에만** 됩니다. 사진을 포함해 아무것도 서버로 전송되지 않으므로,
  남이 호스팅하는 인스턴스를 써도 우리 팀 사진·캐스팅이 밖으로 나가지 않습니다.
- 다른 기기·다른 운영자에게 넘길 때는 **[파일로 내보내기]** 로 받은 `cast-pack.json` 을 전달하고,
  받는 쪽에서 **[파일에서 불러오기]** 하면 됩니다.
- 사진은 올릴 때 정사각형 600px 로 자동 축소됩니다(장당 50~100KB, 7명 다 넣어도 약 1.2MB).
- **사진 보정** — 기본값 `사건 파일 톤`. 각자 다른 조명에서 찍은 사진들의 밝기를 고르게 맞추고
  같은 색조·질감을 입혀 한 세트로 보이게 합니다(실측: 사진 간 밝기 편차 76%↓, 채도 편차 93%↓).
  원본 그대로 쓰려면 `원본 그대로` 로 바꾸면 되고, 언제든 다시 전환해도 재업로드가 필요 없습니다.
- **조사는 자동으로 맞춰집니다** — `종현과 → 수아와`, `종현아 → 수아야`, `최종현이 → 한수아가`.
  편집기의 [본문 예시]에서 바로 확인할 수 있습니다.
- 손대지 않은 항목은 저장소 기본값을 계속 따라갑니다(팩에는 바꾼 것만 담깁니다).

> 사건의 줄거리·트릭·단서는 바뀌지 않습니다. 그것까지 바꾸려면 아래 "저장소를 고쳐서 쓰기"로.

---

## 우리 팀 사이트 갖기 — AWS 없이 (GitHub Pages)

캐스팅만 바꾸는 거라면 위 `/cast.html` 로 충분합니다. **우리만의 주소**가 필요할 때만 이쪽으로.

1. 이 저장소를 **포크**.
2. Settings → Pages → Source 를 **GitHub Actions** 로.
3. Actions 탭 → `GitHub Pages` → **Run workflow**.

끝입니다. AWS 계정도, 도메인도, 시크릿 설정도 필요 없습니다.
main 에 push 할 때마다 자동 배포하려면 Variables 에 `ENABLE_PAGES = true` 를 추가하세요.

- 주소는 `https://<계정>.github.io/<저장소>/` 형태이고, 하위 경로에서도 이미지가 깨지지 않게
  빌드가 자동으로 맞춥니다(`VITE_BASE`). 저장소 이름을 `<계정>.github.io` 로 하면 루트 주소가 됩니다.
- 혼자 하는 추리(`/solo.html`)도 하위 경로에서 동작합니다(서비스워커 등록 범위 포함).
- ⚠️ 포크 저장소에서는 기존 `deploy.yml`(S3 배포)이 시크릿이 없어 실패합니다.
  Actions 탭에서 그 워크플로를 **Disable** 해 두세요.
- ⚠️ 정답(`src/data/secrets.js`)은 저장소에 포함되어 있고 빌드 결과에도 들어갑니다.
  이는 S3 배포와 같은 수준이지만, 공개 데모용이라면 워크플로의 `VITE_DEMO: '1'` 주석을 해제하세요.

---

## 저장소를 고쳐서 쓰기 (리브랜딩 · 시나리오 변경)

1. **등장인물** — `src/data/cast.js`
   - 이름·나이·직책·사진 경로·색상의 **단일 원천**. 용의자 목록과 팔레트가 전부 여기서 파생됩니다.
   - 본문에서 인물을 가리킬 땐 이름을 직접 쓰지 말고 토큰을 쓰세요: `{{S5}}` `{{S5.short}}`
     `{{S5|과/와}}`(조사 자동). 규칙은 `src/data/tokens.js` 주석 참고.
   - 이름을 **조회 키**로 써야 하는 곳(단서의 `person` 과 맞추는 팔레트·방 매핑 등)은
     `keyByPersonName({ S1: … })` 로 적습니다. JSX 안처럼 감쌀 수 없는 곳은 `t('…{{S1}}…')`.
   - 멀티플레이(`index.html`)와 솔로(`solo.html`)가 같은 cast 를 공유합니다.
2. **설정** — `src/config/gameConfig.js`
   - `title` / `tagline` / `siteUrl` / `teams`(조 이름).
   - ⚠️ `personOrder`·`personColor`·`personBg` 는 이제 **cast 에서 파생**됩니다. 직접 고치지 마세요.
   - ⚠️ `roles.victim.key`("목사")는 **구조 토큰**이라 단서 데이터가 참조하므로 바꾸지 마세요.
3. **스토리/단서 콘텐츠** — `src/data/gameData.js`
   - 단서 텍스트·핸드폰/CCTV 등 게임 내용. 인물 이름은 위 토큰으로 참조되어 있습니다.
4. **정답/비밀번호** — `src/data/secrets.js`
   - 감식 비번(9)·톡서랍 복구 비번(3)·수료증 진위 답. 코드 키는 gameData의 단서 코드와 일치해야 함.
5. **인물 사진** — `public/images/people/` (아래 "개인정보" 참고)
6. 바꾼 뒤 `npm run docs` 로 QR·배치도·PPT 등 운영 문서를 재생성.

---

## 개인정보 (중요)

- 실제 사람 얼굴 사진은 **저장소에 커밋되지 않습니다**(`.gitignore` 가 `public/images/people/*.png|*.jpg` 제외).
- 각 운영자가 **본인이 촬영·동의받은** 사진을 로컬에 넣어 사용하세요. 없으면 이름 첫 글자 아바타로 대체됩니다.
- **공개 배포 전 체크리스트**
  - [ ] 이미 커밋된 실제 사진 untrack: `git rm --cached public/images/people/*.png public/images/people/*.jpg`
  - [ ] git **히스토리에도** 과거 사진/정답이 남아 있으므로, 공개용은 **새 저장소(clean history)로 시작**
        하거나 `git filter-repo` 로 히스토리를 정리하세요. (기존 저장소를 그대로 public 전환하면 노출됩니다.)
  - [ ] 공개 데모는 검색 비색인(`index.html`의 `robots noindex`) 유지.

---

## 정답을 저장소에 노출하지 않으려면 (선택)

기본은 `secrets.js`를 커밋해 "받으면 바로 도는 키트"입니다. 정답이 공개되지 않는 저장소를 원하면:

1. `.gitignore` 에서 `src/data/secrets.js` 주석 해제
2. `git rm --cached src/data/secrets.js`
3. 로컬에만 `secrets.js` 유지 — `secrets.js`가 없으면 앱/문서는 `secrets.example.js`(플레이스홀더)로 자동 폴백

---

## 공개 데모 빌드

```bash
VITE_DEMO=1 npx vite build      # secrets.demo.js(정답 미포함)로 번들 + 상단 데모 배너
```

데모 번들에는 실제 감식 비번/발급번호가 포함되지 않습니다(빌드 시 `@secrets` 별칭이 `secrets.demo.js`로 치환).

---

## 배포 (정적 호스팅)

`npm run build` 결과물(`dist/`)을 정적 호스팅에 올리면 됩니다.

- **Cloudflare Pages / Vercel / Netlify** 권장(무료·HTTPS·커스텀 도메인).
  - 빌드 명령: `npm run build` · 출력 디렉터리: `dist`
- 참가자는 QR 또는 공지 링크로 직접 접속하므로 검색 비색인을 유지합니다.

---

## 아키텍처 (A → B 확장 대비)

컴포넌트는 데이터·비밀 검증을 직접 하지 않고 **services 계층**을 통합니다. 모드는 `VITE_MODE`(기본 `local`).

```
              VITE_MODE (기본 local)
  ┌─────────────────┴─────────────────┐
  LocalProvider / LocalStore      RemoteProvider / RemoteStore (B, 미구현)
  (번들 콘텐츠 + localStorage)     (server.js 방 서버 · 서버가 정답 소유)
        └──── GameProvider / GameStore 인터페이스 ────┘
                        ▲
        App · EvidenceList · PhoneModal · CctvModal
```

- `src/services/` — `index.js`(모드 스위치), `localProvider`/`localStore`(현재), `remoteProvider`/`remoteStore`(B 스텁), `rules.js`(해금 엔진).
- 비밀 검증(감식 비번·톡서랍 복구·수료증 조회)과 상태 저장이 모두 인터페이스를 지나므로,
  B는 `server.js`(주석 처리된 방 서버 골격)에 Remote 구현만 연결하면 **컴포넌트 변경 없이** 확장됩니다.

---

## 라이선스

- 코드: MIT · 창작 콘텐츠(스토리·이미지·문서): CC BY-NC-SA 4.0 · 실제 인물 사진: 배포 대상 아님(운영자 로컬).
- 자세한 내용은 [LICENSE](LICENSE) 참고.
