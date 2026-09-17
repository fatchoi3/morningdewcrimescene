// 야간조 — C(오정숙) · D(흐엉) · F(임기석) 칸 단서
//
//   보드판 「야간조」 카드 17장(C 5+폰1 / D 5+폰1 / F 4+폰1)을 앱의 evidenceMap 항목으로 옮긴 것.
//   코드와 제목은 발급표(dp-mapping.md §11)를 그대로 쓴다 — 한 글자도 고치지 않았다.
//
//   ── 이 파일이 지키는 것 ────────────────────────────────────────────────────
//   · 사람을 가리킬 때는 {{S3}} · {{S4}} · {{S6}} 토큰만 쓴다. 이름을 직접 박지 않는다.
//     (여권·전표에 인쇄된 「NGUYEN THI HUONG」처럼 종이 위의 값은 토큰이 아니라 그대로 적는다.
//      cast[S4].name 은 '흐엉' 이라 토큰으로는 이 표기가 나오지 않는다.)
//   · 이 객체는 토큰이 풀리지 않은 원본이다. 조립부에서
//     withAssetBase(resolveTokens({ ...cluesCDF, ... }, cast)) 로 감싼다.
//   · 보이는 것만 적는다. 결론은 쓰지 않는다.
//   · 잠금 네 자리(오정숙 폰 · 흐엉 폰)는 이 파일에 없다. phone.lock 은 「네 자리를 묻는다」까지만
//     말하고, 답은 secrets 의 phoneLocks[code] 로 분리한다. 숫자가 어디 있는지도 적지 않는다
//     — 그 출처는 C3(준호 재활 일정표) · F5(카드사 승인 문자) · D4(딸 사진 뒷면)이 각자 들고 있다.
//   · 이미지는 아직 파일이 없어도 된다. 없으면 앱이 대체 표시로 떨어진다.
//
//   ── 알고 있어야 할 것 ──────────────────────────────────────────────────────
//   · phone.lock 은 현재 PhoneModal 이 읽지 않는 신규 필드다(mergeSecrets 의 주입 경로는
//     passwords / recover / lookups 셋뿐이다). 지금은 무해하게 무시되고, 잠금 화면을 붙이는 순간
//     콘텐츠를 다시 쓰지 않아도 되도록 자리만 먼저 잡아 둔 것이다.
//   · YTDK-27(C2)의 unlockedBy 는 「D1 마스터키가 있어야 열린다」를 데이터로 적은 것이다.
//     다만 rules.computeAutoUnlocked 는 type 이 '특수'/'감식' 인 항목만 본다 — '보통' 에 적힌
//     unlockedBy 로는 자동 해금이 일어나지 않는다. 1차에서는 진행자가 D1 확보를 확인하고 코드를
//     배포하는 운영으로 두고, 자동 해금까지 원하면 type 한 줄을 '특수' 로 올리면 그대로 작동한다.

export const cluesCDF = {
  // ── C · 오정숙의 칸 ─────────────────────────────────────────────────────────
  'VSTN-59': {
    title: '화장품 세트 넷',
    description: '{{S3}}의 탈의실 사물함 아래 칸에서 나왔다.',
    detail: '상자 네 개가 나란히 서 있다. 화장품 세트다. 겉을 싼 비닐 필름이 넷 다 뜯긴 데 없이 그대로다.\n\n셋에는 「파손」이라고 인쇄된 주황색 스티커가 붙어 있다. 남은 하나는 스티커를 떼어 낸 자국만 네모로 남아 있다.',
    image: '/images/yaganjo/c1-cosmetic-boxes.jpg',
    type: '보통',
    person: '{{S3}}',
  },

  'YTDK-27': {
    title: '봉인된 흰 봉투',
    description: '사물함 선반 안쪽, 접어 둔 겉옷 밑에 들어 있었다.',
    detail: '흰 봉투 한 장. 겉에는 아무것도 적혀 있지 않다. 입구가 풀로 봉해져 있고 뜯은 자국이 없다.\n\n〈뜯은 뒤〉\n안에 카드 전표 넉 장이 들어 있다. 날짜가 한 달씩 떨어져 있고, 가맹점 칸에 같은 재활병원 이름이 찍혀 있다.\n넉 장 다 아래 두 줄이 같다 — 결제자 {{S6}} / 환자 오준호.',
    image: '/images/yaganjo/c2-card-slips.jpg',
    type: '보통',
    person: '{{S3}}',
    // 🔑 개봉 조건 — OIXS-24(D1 사물함 마스터키). 위 주석 참고.
    unlockedBy: ['OIXS-24'],
  },

  'QYHA-34': {
    title: '준호 재활 일정표',
    description: '사물함 문 안쪽에 자석으로 붙여 둔 인쇄물 한 장.',
    detail: '병원에서 준 이번 달 일정표다. 맨 위에 「오준호 님(2009.03.14)」.\n\n월·수·금 16시가 줄마다 반복된다. 주 3회. 셋째 주까지는 칸마다 접수 도장이 찍혀 있다.\n\n마지막 주 세 칸은 비어 있다. 지우거나 그은 자국 없이 처음부터 비어 있다.',
    image: '/images/yaganjo/c3-rehab-schedule.jpg',
    type: '보통',
    person: '{{S3}}',
  },

  'EFJB-22': {
    title: '빈 장바구니 가방',
    description: '압수 목록에 「빈 장바구니 가방 1」로 적혀 있다.',
    detail: '접어서 주머니에 넣는 천 가방이고, 지금은 펼쳐진 채다.\n\n안에 아무것도 없다. 바닥과 옆면에 오래 접혀 있던 자국이 네모로 남아 있다. 손잡이 한쪽 끝이 닳아 실이 나와 있다.',
    image: '/images/yaganjo/c4-tote-bag.jpg',
    type: '보통',
    person: '{{S3}}',
  },

  'XWNR-11': {
    title: '앞치마',
    description: '집품 인원이 두르는 앞치마.',
    detail: '앞에 큰 주머니가 둘. 목장갑 한 켤레와 사물함 열쇠가 들어 있다.\n\n같이 나온 편의점 영수증 두 장. 한 장은 그날 21:48, 한 장은 사흘 전 21:51. 두 장 다 품목이 삼각김밥 두 개다.',
    image: '/images/yaganjo/c5-apron-receipts.jpg',
    type: '보통',
    person: '{{S3}}',
  },

  'DMYX-34': {
    title: '{{S3}}의 폰',
    description: '앞치마 주머니에서 나왔다.',
    detail: '화면을 누르면 네 자리를 묻는 잠금 화면이 뜬다.\n\n뒷면이 사진을 끼우는 투명 케이스인데 사진 자리는 비어 있다.\n\n네 자리가 맞으면 카카오톡·메시지·중고장터가 그대로 열린다.',
    image: '',
    type: '보통',
    person: '{{S3}}',
    phone: {
      owner: '{{S3}}의 휴대폰',
      // 정답 네 자리는 secrets 의 phoneLocks['DMYX-34'] 로 분리한다.
      lock: { digits: 4 },
      apps: [
        {
          id: 'kakao',
          type: 'kakao',
          name: '카카오톡',
          // 대화 목록을 빠짐없이 적는다 — 여기에 무엇이 없는지가 이 폰의 내용이다.
          chats: [
            {
              name: '준호',
              messages: [
                { from: 'them', text: '엄마 몇 시에 와', time: '22:12' },
                { from: 'me', text: '아침에 가. 밥 챙겨 먹고 자.', time: '22:15' },
                { from: 'them', text: 'ㅇㅇ', time: '22:16' },
              ],
            },
            {
              name: '{{S2}} 학생',
              messages: [
                { from: 'me', text: '조장이 오늘부터 한 명씩 부른다더라. 빨리 와.', time: '22:45' },
                { from: 'them', text: '아주머니 어디세요 잠깐 얘기해요', time: '00:05' },
              ],
            },
            {
              name: '식당 사장님',
              messages: [
                { from: 'them', text: '내일 점심에 두 시간만 더 봐 줄 수 있어요?', time: '전날 15:02' },
                { from: 'me', text: '네 갈게요.', time: '전날 15:20' },
              ],
            },
            {
              name: '동네 반상회',
              messages: [
                { from: 'them', text: '이번 주 재활용 배출은 목요일입니다.', time: '이틀 전' },
              ],
            },
          ],
        },
        {
          id: 'sms',
          type: 'sms',
          name: '메시지',
          chats: [
            {
              name: '[재활병원] 예약안내',
              messages: [
                { from: 'them', text: '[Web발신] 오준호 님 재활 예약 안내 — 월·수·금 16:00. 변경은 진료 전날까지 연락 주세요.', time: '지난달 09:10' },
                { from: 'them', text: '[Web발신] 오준호 님 이번 주 예약이 취소 처리되었습니다. 재예약을 원하시면 연락 주세요.', time: '나흘 전 09:12' },
              ],
            },
          ],
        },
        {
          // 같은 kakao 렌더러를 쓰되 이름만 다른 앱 — 중고 거래 채팅 1년치.
          id: 'market',
          type: 'kakao',
          name: '중고장터',
          chats: [
            {
              name: '구매자 · 라온',
              messages: [
                { from: 'them', text: '화장품 세트 아직 있나요?', time: '지난주' },
                { from: 'me', text: '네 있어요. 4만원이요.', time: '지난주' },
                { from: 'them', text: '미개봉 맞죠?', time: '지난주' },
                { from: 'me', text: '비닐 그대로예요.', time: '지난주' },
              ],
            },
            {
              name: '구매자 · 밤톨',
              messages: [
                { from: 'them', text: '커피포트 박스에 흠집 있나요?', time: '두 달 전' },
                { from: 'me', text: '겉에 조금요. 안은 새 거예요.', time: '두 달 전' },
                { from: 'them', text: '3만원에 갈게요.', time: '두 달 전' },
              ],
            },
            {
              name: '구매자 · 민들레',
              messages: [
                { from: 'them', text: '헤어드라이어 두 개 다 주시면 5만원 될까요?', time: '일곱 달 전' },
                { from: 'me', text: '네. 지하철역 앞에서 뵐게요.', time: '일곱 달 전' },
              ],
            },
            {
              name: '구매자 · 해달',
              messages: [
                { from: 'them', text: '무선청소기 영수증 있으세요?', time: '열한 달 전' },
                { from: 'me', text: '선물 받은 거라 없어요.', time: '열한 달 전' },
                { from: 'them', text: '알겠습니다. 그냥 살게요.', time: '열한 달 전' },
              ],
            },
          ],
        },
      ],
    },
  },

  // ── D · 흐엉의 칸 ───────────────────────────────────────────────────────────
  'OIXS-24': {
    title: '사물함 마스터키',
    description: '사물함 바닥에 깔린 비닐봉지 밑에 놓여 있었다.',
    detail: '열쇠 하나. 고리에 종이 이름표가 달려 있고, 볼펜으로 「사물함 마스터」라고 적혀 있다.\n\n이름표 구멍이 늘어나 찢어지기 직전이다. 이 열쇠가 어느 사물함을 여는지는 열쇠에도 이름표에도 적혀 있지 않다.',
    image: '/images/yaganjo/d1-master-key.jpg',
    type: '보통',
    person: '{{S4}}',
  },

  'HIEV-34': {
    title: '작업화 한 짝',
    description: '작업복과 함께 임의제출된 안전화. 오른쪽 한 짝이다.',
    detail: '발등에 철심이 든 물류용이고 뒤축 밑창이 한쪽으로 닳아 있다.\n\n뒤축 쪽 밑창 홈에 투명하고 얇은 조각이 끼어 있다. 끝을 잡아당기면 늘어난다.',
    image: '/images/yaganjo/d2-safety-shoe-sole.jpg',
    type: '보통',
    person: '{{S4}}',
  },

  'GOCI-93': {
    title: '여권',
    description: '작업복 안주머니에서 나왔다.',
    detail: '초록 표지의 베트남 여권. 이름난에 NGUYEN THI HUONG.\n\n사진은 3년 전 것이다. 사증 면에 E-9 도장이 찍혀 있고, 그 뒤 체류 자격 변경란은 비어 있다.\n\n표지 모서리가 눌려 접혀 있고, 겉장 안쪽에 젖었다 마른 자국이 한 군데 있다.\n\n— E-9 은 고용허가제의 비전문취업 체류자격이다. 이 자격으로 들어온 사람이 사업장을 옮기려면 원칙적으로 사용자의 동의가 있어야 하고, 동의 없이 옮기려면 부당한 처우를 입증해야 한다.',
    image: '/images/yaganjo/d3-passport.jpg',
    type: '보통',
    person: '{{S4}}',
  },

  'EBEZ-58': {
    title: '딸 사진',
    description: '사물함 문 안쪽에 종이테이프로 붙여 둔 사진 한 장.',
    detail: '',
    type: '보통',
    person: '{{S4}}',
    pages: [
      {
        title: '앞면',
        image: '/images/yaganjo/d4-daughter-photo.jpg',
        content: '플라스틱 의자에 앉은 예닐곱 살 아이가 정면을 보고 있다. 뒤로 창살 없는 창과 마당이 보인다.\n\n테이프가 네 귀퉁이에 여러 겹 덧붙어 있다. 여러 번 떼었다 다시 붙인 자리다.',
      },
      {
        title: '떼어 낸 뒤 — 뒷면',
        image: '/images/yaganjo/d4-daughter-photo-back.jpg',
        content: '뒷면에 볼펜으로 날짜 하나가 적혀 있다.\n\n「2020. 5. 12.」\n\n다른 글자는 없다.',
      },
    ],
  },

  'CHOH-86': {
    title: '지원센터 상담 카드',
    description: '명함 크기의 카드.',
    detail: '앞면에 「외국인노동자지원센터」와 전화번호, 상담 요일이 인쇄돼 있다. 모서리가 둥글게 닳았다.\n\n뒷면에 볼펜으로 한 줄 — 「여권 보관 사실을 증명할 자료가 있으면 신청 가능」. 그 아래 넉 달 전 날짜가 적혀 있다.',
    image: '/images/yaganjo/d5-support-center-card.jpg',
    type: '보통',
    person: '{{S4}}',
  },

  'LIPT-58': {
    title: '{{S4}}의 폰',
    description: '작업복 가슴주머니에서 나왔다.',
    detail: '보호필름이 두 겹 붙어 있고, 화면을 누르면 네 자리를 묻는다.\n\n잠금 화면 배경이 아이 사진이다.\n\n네 자리가 맞으면 메시지·통화·사진이 그대로 열린다. 가족과 주고받은 글은 베트남어로만 떠 있다 — 시각은 목록에 그대로 찍혀 있다.',
    image: '',
    type: '보통',
    person: '{{S4}}',
    phone: {
      owner: '{{S4}}의 휴대폰',
      // 정답 네 자리는 secrets 의 phoneLocks['LIPT-58'] 로 분리한다.
      lock: { digits: 4 },
      apps: [
        {
          id: 'sms',
          type: 'sms',
          name: '메시지',
          chats: [
            {
              // 베트남어 원문 그대로 둔다. 번역해야 읽히는 것이 이 대화방의 내용이다.
              name: 'Con gái',
              messages: [
                { from: 'them', text: 'Mẹ ơi, bao giờ mẹ về?', time: '엿새 전 19:40' },
                { from: 'me', text: 'Sắp rồi con. Mẹ hứa.', time: '엿새 전 19:52' },
                { from: 'them', text: 'Con nhớ mẹ.', time: '전날 20:11' },
                { from: 'me', text: 'Mẹ lấy lại được hộ chiếu rồi. Mẹ sẽ sớm về với con.', time: '03:29' },
              ],
            },
            {
              name: '외국인노동자지원센터',
              messages: [
                { from: 'them', text: '[외국인노동자지원센터] 상담 접수되었습니다. 사업장 변경 상담은 화·목 오후에 가능합니다.', time: '넉 달 전' },
                { from: 'me', text: '입국하고 첫 주에 여권을 가져갔습니다. 3년 되었습니다.', time: '넉 달 전' },
                { from: 'them', text: '여권 보관 사실을 증명할 자료가 있으면 사업장 변경 신청이 가능합니다. 사진·문서·증인 진술 중 하나면 됩니다.', time: '넉 달 전' },
                { from: 'me', text: '증명할 것이 없습니다. 어떻게 해야 합니까.', time: '석 달 전' },
                { from: 'them', text: '보관하고 있는 자리를 찍은 사진도 자료가 됩니다. 다만 무리해서 얻으려 하지는 마세요.', time: '석 달 전' },
                { from: 'me', text: '알겠습니다.', time: '석 달 전' },
                { from: 'me', text: '아직 동의서를 못 받았습니다. 열두 달째입니다.', time: '지난달' },
                { from: 'them', text: '상담 요일에 다시 연락 주세요. 기록은 남겨 두겠습니다.', time: '지난달' },
              ],
            },
          ],
        },
        {
          id: 'calls',
          type: 'calls',
          name: '전화',
          calls: [
            { name: 'Chồng', direction: 'in', time: '전날 20:41', duration: '18분 02초' },
            { name: 'Chồng', direction: 'out', time: '나흘 전 21:05', duration: '25분 47초' },
            { name: 'Chồng', direction: 'out', time: '엿새 전 20:52', duration: '31분 10초' },
            { name: '외국인노동자지원센터', direction: 'out', time: '넉 달 전 15:20', duration: '9분 33초' },
          ],
        },
        {
          id: 'photos',
          type: 'photos',
          name: '사진',
          photos: [
            {
              caption: '03:35 · 세로로 칸이 셋. 칸마다 이름표가 하나씩 붙어 있다. 한 칸은 비어 있고, 나머지 두 칸에 초록 표지가 하나씩 들어 있다.',
              image: '/images/yaganjo/hueong-locker-0335.jpg',
            },
            {
              caption: '아이가 마당에 서 있다. 지난 설에 받은 사진이다.',
              image: '/images/yaganjo/hueong-daughter-yard.jpg',
            },
            {
              caption: '반품 라벨 세 종류를 찍어 둔 것. 글자를 외우려고 찍었다.',
              image: '/images/yaganjo/hueong-return-labels.jpg',
            },
          ],
        },
      ],
    },
  },

  // ── F · 임기석의 칸 ─────────────────────────────────────────────────────────
  'LHMX-66': {
    title: '지게차 키',
    description: '압수 목록에 「지게차 키 1 — 작업복 오른쪽 주머니」로 적혀 있다.',
    detail: '노란 플라스틱 태그가 달린 키 한 개. 태그에 유성펜으로 「1호기」.\n\n고리에 다른 것은 걸려 있지 않다.',
    image: '/images/yaganjo/f1-forklift-key.jpg',
    type: '보통',
    person: '{{S6}}',
  },

  'ZFDF-11': {
    title: '운전면허증과 접힌 통지서',
    description: '지갑 뒤쪽 칸에서 나왔다.',
    detail: '운전면허증 한 장. 1종 보통.\n\n그 뒤에 네 번 접힌 종이 한 장이 끼워져 있다. 올해 4월자 「운전면허 정지 처분 통지서」. 정지 기간 1년.\n\n접은 자국이 여러 번 덧나 있고 모서리가 해졌다.',
    image: '/images/yaganjo/f2-license-suspension.jpg',
    type: '보통',
    person: '{{S6}}',
  },

  'LKQM-22': {
    title: '귀마개와 혈압약',
    description: '작업복 주머니에서 나왔다.',
    detail: '스펀지 귀마개 한 쌍. 여러 번 눌러 쓴 것이라 한쪽이 찌그러진 채 돌아오지 않는다.\n\n그 옆에 약국 봉투. 겉에 「아침 식후 1회」, 조제일이 이달 초다. 남은 알이 열 몇 개 들어 있다.',
    image: '/images/yaganjo/f3-earplugs-meds.jpg',
    type: '보통',
    person: '{{S6}}',
  },

  'VRVO-38': {
    title: '보온병',
    description: '배터리실 선반에서 임의제출된 스테인리스 보온병.',
    detail: '뚜껑이 컵으로 돌려 빠진다. 몸통 인쇄가 닳아 글자 반이 지워졌다.\n\n안은 비어 있다. 뚜껑 컵 안쪽에 마른 테두리가 한 바퀴 남아 있다.',
    image: '/images/yaganjo/f4-thermos.jpg',
    type: '보통',
    person: '{{S6}}',
  },

  'DMKO-85': {
    title: '{{S6}}의 폰',
    description: '폴더형 구형 단말. 잠금이 걸려 있지 않다.',
    detail: '덮개를 열면 바로 바탕화면이다.\n\n액정 가장자리에 금이 가 있고, 배터리 덮개가 테이프로 고정돼 있다.\n\n든 것은 문자함과 통화 목록뿐이다. 둘 다 짧고, 지운 자리도 없다.',
    image: '',
    type: '보통',
    person: '{{S6}}',
    phone: {
      owner: '{{S6}}의 휴대폰',
      apps: [
        {
          id: 'sms',
          type: 'sms',
          name: '메시지',
          // 목록을 빠짐없이 적는다.
          chats: [
            {
              name: '준호',
              messages: [
                { from: 'them', text: '나 괜찮아요. 신경 쓰지 마세요.', time: '어제 19:24' },
              ],
            },
            {
              name: '[카드] 승인알림',
              messages: [
                { from: 'them', text: '[Web발신] 승인 288,000원 / [재활병원] / 환자 오준호 · 2009.03.14 / 일시불', time: '넉 달 전 16:22' },
                { from: 'them', text: '[Web발신] 승인 288,000원 / [재활병원] / 환자 오준호 · 2009.03.14 / 일시불', time: '석 달 전 16:18' },
                { from: 'them', text: '[Web발신] 승인 288,000원 / [재활병원] / 환자 오준호 · 2009.03.14 / 일시불', time: '두 달 전 16:20' },
                { from: 'them', text: '[Web발신] 승인 288,000원 / [재활병원] / 환자 오준호 · 2009.03.14 / 일시불', time: '지난달 16:15' },
              ],
            },
            {
              name: '02-***-**** 센터 사무실',
              messages: [
                { from: 'them', text: '[GH로지스] 다음 주 안전 교육 일정 공지. 3센터 전 인원 대상.', time: '이틀 전 11:05' },
              ],
            },
          ],
        },
        {
          id: 'calls',
          type: 'calls',
          name: '전화',
          calls: [
            { name: '센터 사무실', direction: 'in', time: '전날 17:40', duration: '42초' },
            { name: '알 수 없는 번호', direction: 'missed', time: '사흘 전 14:03' },
            { name: '정비소', direction: 'out', time: '엿새 전 10:12', duration: '2분 08초' },
          ],
        },
      ],
    },
  },
};

export default cluesCDF;
