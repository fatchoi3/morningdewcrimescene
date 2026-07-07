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

## 다른 단체가 가져다 쓰기 (리브랜딩)

1. **설정 한 곳** — `src/config/gameConfig.js`
   - `title` / `tagline` / `siteUrl` / `teams`(조 이름) / `personColor`·`personBg`(팔레트)
   - `roles.victim.label`(피해자 표시 이름). ⚠️ `roles.victim.key`("목사")는 **구조 토큰**이라
     단서 데이터가 참조하므로 바꾸지 마세요(표시 이름만 label로 변경).
2. **스토리/단서 콘텐츠** — `src/data/gameData.js`
   - 단서 텍스트·인물·핸드폰/CCTV 등 게임 내용 전부. 교회명·인물명 등 서사 문자열도 여기에.
3. **정답/비밀번호** — `src/data/secrets.js`
   - 감식 비번(9)·톡서랍 복구 비번(3)·수료증 진위 답. 코드 키는 gameData의 단서 코드와 일치해야 함.
4. **인물 사진** — `public/images/people/` (아래 "개인정보" 참고)
5. 바꾼 뒤 `npm run docs` 로 QR·배치도·PPT 등 운영 문서를 재생성.

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
