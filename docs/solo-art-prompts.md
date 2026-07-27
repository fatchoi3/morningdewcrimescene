# 솔로 추리게임 — 실제 일러스트 넣기 (턴키 가이드)

지금은 모든 장면·초상·연출이 **벡터(SVG)로 자동 렌더**됩니다. 아래 경로에 **그림 파일만 넣으면
자동으로 그 그림이 우선 표시**되고(코드 수정 불필요), 없으면 SVG로 폴백합니다.
게임 화면엔 **필름 비네트가 자동으로 얹히므로** 그림은 평평한 조명으로 뽑아도 분위기가 삽니다.

## 넣는 곳 (파일만 떨구면 끝)
| 대상 | 경로 (`public/` 아래) | 포맷 | 비율 |
|---|---|---|---|
| 방/시설 장면 배경 | `public/images/scenes/<장소ID>.jpg` | jpg·png·webp 아무거나 | 16:9, 1600×900+ |
| 인물 초상 | `public/images/people/<파일명>` (아래 표) | png·jpg | 1:1, 512×512+ |
| 브리핑 히어로 | `public/images/briefing.jpg` | jpg·png | 16:5(배너), 1600×500 |
| 엔딩 히어로 | `public/images/ending.jpg` | jpg·png | 16:5(배너), 1600×500 |

> 장면은 `<장소ID>.jpg/png/webp` 순으로 자동 탐색합니다. 파일을 넣고 새로고침만 하면 됩니다.

## 무료로 그림 뽑는 법 (택1)
- **Bing 이미지 크리에이터 / Copilot**(무료, DALL·E 3 기반) — bing.com/images/create
- **ChatGPT 무료 이미지**, **Google Gemini(이미지)**, **Krea/Playground 무료 티어**
- 로컬: **Stable Diffusion(Automatic1111·ComfyUI)** — 완전 무료·오프라인
- 프롬프트를 그대로 붙여넣고, 나온 이미지를 위 경로에 저장하면 됩니다.

## 공통 스타일 (모든 프롬프트 앞에 붙여 통일감↑)
```
Dark noir Korean crime-mystery illustration, moody muted palette, cinematic soft lighting,
subtle film grain, painterly flat-vector style, cohesive art direction, no text, no watermark
```
**Negative(제외):** `text, letters, watermark, signature, ui, frame, border, extra limbs, deformed, lowres`
장면은 끝에 `no people, empty room, 16:9` / 초상은 `head and shoulders, single person, plain background, 1:1` 를 덧붙이세요.

---

## 방 · 시설 장면 (11)

| 장소ID | 파일 | 프롬프트(공통 스타일 + 아래 + `no people, 16:9`) |
|---|---|---|
| ROOM-JH | scenes/ROOM-JH.jpg | 청년부 막내 남학생의 정돈된 기숙사 방, 등산 장비·보충제 통, 책상 위 노트, 차분한 파란 톤 |
| ROOM-SR | scenes/ROOM-SR.jpg | 총무 여성의 방, 화장품 파우치·서류·라벨지, 살짝 어수선함, 로즈핑크 톤 |
| ROOM-HW | scenes/ROOM-HW.jpg | 전도사의 단정한 방, 요일별 약통·다이어리·손목시계, 골드/카키 톤, 어딘가 서늘함 |
| ROOM-HJ | scenes/ROOM-HJ.jpg | 회계 여성의 차분하고 정갈한 방, 서류·약통, 청록 톤 |
| ROOM-GH | scenes/ROOM-GH.jpg | 회장 여성의 방, 성경책·다이어리, 아이 그림 편지가 살짝 보임, 보라 톤 |
| ROOM-EJ | scenes/ROOM-EJ.jpg | 찬양팀장 남성의 방, 악보·기타·셔츠, 자주/보라 톤 |
| ROOM-PS | scenes/ROOM-PS.jpg | **사건 현장** — 목사의 방, 침대 위 담요에 덮인 형체, 폴리스라인 테이프, 노란 증거 표식, 붉은 경광 톤, 무겁고 긴장된 분위기 |
| LOC-CCTV | scenes/LOC-CCTV.jpg | 어두운 CCTV 관제실, 벽면 가득한 모니터 그리드, 청록 스캔라인 발광 |
| LOC-PHONE | scenes/LOC-PHONE.jpg | 증거물 테이블 위에 나란히 놓인 압수 스마트폰 여러 대, 증거 태그 |
| LOC-LAB | scenes/LOC-LAB.jpg | 국과수 감식실 벤치, 비커·현미경·샘플 랙, 청록 실험실 조명 |
| LOC-COMMON | scenes/LOC-COMMON.jpg | 수련회 숙소의 조용한 복도, 늘어선 방문·천장 조명, 원근감 |

---

## 인물 초상 (7)  — 공통 스타일 + `head and shoulders, single person, plain background, 1:1`

| 인물 | 파일 | 프롬프트 |
|---|---|---|
| 최종현(23·서기) | people/s1.png | 싹싹한 청년부 막내 남성, 밝지만 불안한 눈빛, 파란 톤 |
| 윤은재(24·찬양팀장) | people/s2.png | 다혈질 인상의 남성, 굳은 표정, 자주 톤 |
| 이현지(26·회계) | people/s3.png | 말수 적고 꼼꼼한 여성, 속을 감춘 표정, 청록 톤 |
| 박희원(28·전도사) | people/s4.png | 차분하고 모범적인 여성 전도사, 어딘가 경직된 미소, 골드 톤 |
| 이사랑(25·총무) | people/s5.png | 사교적이나 지쳐 보이는 여성, 시선 회피, 로즈핑크 톤 |
| 이가현(28·회장) | people/s6.png | 단단해 보이는 여성 회장, 비밀을 감춘 눈빛, 보라 톤 |
| 김호치 목사(58·피해자) | people/victim.jpg | 원칙주의 노년 남성 목사, 온화하지만 엄격, 흑백/세피아 |

---

## 브리핑 · 엔딩 (배너 16:5)

| 대상 | 파일 | 프롬프트(공통 스타일 + `wide banner 16:5`) |
|---|---|---|
| 브리핑 | briefing.jpg | 비 내리는 밤, 교회 수련회 건물 실루엣과 십자가, 폴리스라인 테이프, 무거운 야경 |
| 엔딩 | ending.jpg | 사건 종결 — 닫힌 사건 파일과 도장, 차분한 마무리 톤 |

---

### 팁
- **일관성**: 같은 툴·같은 공통 스타일 문장으로 한 번에 뽑으면 톤이 통일됩니다. 시드 고정 가능하면 고정.
- **용량**: 배경은 1600×900 jpg(품질 80%)면 충분(가볍게). webp면 더 가벼움.
- 몇 장 만들어 넣어보시고 톤을 알려주시면, 나머지 프롬프트를 그 방향으로 맞춰 드리겠습니다.
