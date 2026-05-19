export const evidenceMap = {
  'CLUE-01': {
    title: '게임 설명서',
    description: '게임의 기본 규칙과 플레이 방법이 담긴 설명서입니다.',
    detail: '',
    image: '/images/clue-01.svg',
    type: '보통',
    person: '공용',
    pages: [
      {
        title: '크라임씬 미스터리란?',
        content: '현장에 숨겨진 QR 코드나 단서 코드를 찾아 증거를 수집하는 오프라인 추리 게임입니다.\n\n팀원들과 함께 현장을 탐색하며 증거를 모으고, 수집한 정보를 바탕으로 범인과 사건의 진실을 밝혀내세요.\n\n이 설명서는 앱 사용법을 안내합니다. 화살표 버튼으로 페이지를 넘기세요.'
      },
      {
        title: 'QR 코드 스캔',
        content: '화면 왼쪽의 [카메라로 QR 스캔] 버튼을 누르면 카메라 팝업이 열립니다.\n\n카메라를 현장의 QR 코드에 가까이 가져다 대면 자동으로 인식하여 증거를 수집합니다.\n\n인식에 성공하면 팝업이 자동으로 닫히고 수집 결과가 메시지로 표시됩니다.\n\n실내가 어두울 경우 조명을 켜거나 QR 코드와의 거리를 조정해 보세요.'
      },
      {
        title: '코드 직접 입력',
        content: 'QR 코드 스캔이 어려운 경우 [코드 직접 입력] 필드에 단서 코드를 입력할 수 있습니다.\n\n코드 형식 예시: CLUE-01, CLUE-02, CLUE-03\n\n입력 후 [확인] 버튼을 누르거나 Enter 키를 누르면 증거가 수집됩니다.\n\n코드는 대소문자를 구분하지 않습니다.'
      },
      {
        title: '수집된 증거 확인',
        content: '화면 오른쪽 [수집된 증거] 탭에서 지금까지 모은 증거 목록을 확인할 수 있습니다.\n\n탭 옆 괄호 안의 숫자가 현재 수집된 증거 수입니다.\n\n목록의 항목을 탭하면 증거 이미지와 상세 설명이 담긴 팝업이 열립니다.\n\n수집한 증거는 앱을 닫아도 자동으로 저장됩니다.'
      },
      {
        title: '공통 정보 & 초기화',
        content: '[공통 정보] 탭에서 피해자와 용의자의 기본 정보를 확인할 수 있습니다.\n\n이름 칩을 탭하면 해당 인물의 직업·나이·특별 단서 등 상세 정보가 표시됩니다.\n\n게임을 처음부터 다시 시작하려면 오른쪽 상단 [초기화] 버튼을 누르세요. 수집된 증거가 모두 삭제됩니다.'
      }
    ]
  },

  // =============================================
  // 이오랑 (진범) — 보통 단서 10개
  // =============================================
  'YUQO-48': { // 공용 공간  @@@ 수정 필요
    title: 'CCTV 화면 캡처',
    description: '복도 쪽 CCTV 화면이다.',
    detail: '12시 23분 경, 이오랑이 남자 숙소 방향 이동. 약 1분 20초 후 여자 숙소로 복귀. 손에 무언가 들고 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이오랑'
  },
  'SESE-63': {
    title: '청년부 회계 장부', // 공용(사무실) @@@ 수정 필요
    description: '',
    detail: '"기타" 항목 120만원 지출. 영수증 없음. 이오랑 직인.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이오랑'
  },
  'MPAH-32': { // 가방, @@@ 수정 필요
    title: '파우치',
    description: '화장용 스테인리스 스패슸러, 쪽집게, 화장솜, 소독용 알코올, 쿠션, 속눈썹 풀, 속눈썹 등이 있다',
    detail: '이오랑의 화장품이다. 군대군대 하얀 가루가 묻어있다. 화장품 가루인가 싶다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이오랑'
  },
  'YBBU-45': { // 공용(일정표), @@@ 수정 필요
    title: '전날 단독 면담 기록',
    description: '이오랑의 손목 안쪽에 남은 옅은 붉은 자국. 라텍스 소재의 장갑을 장시간 착용했을 때 생기는 압박 흔적과 일치한다.',
    detail: '목사 일정표: "재정 관련 면담 — 이오랑 총무 (15분)". 이오랑은 "진로 상담"이라 주장.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이오랑'
  },
  'PECG-06': {//가방 @@@ 수정 필요
    title: '핸드폰',
    description: '',
    detail: '검색 기록·카카오톡 확인 가능. 직접 열어달라고 해야 함.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이오랑'
  },
  'PQSH-34': {
    title: '열린 핸드폰',
    description: '',
    detail: '검색: "안드롤 심장 부작용", "스테로이드 협심증 위험". 종덕과의 카톡 없음 확인.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이오랑'
  },
  'PGSD-57': {
    title: '고가 화장품',
    description: '',
    detail: '급여 대비 고가 화장품 다수',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이오랑'
  },
  'CASI-77': { // 핸드폰
    title: 'SNS 여행 사진',
    description: '',
    detail: '수련회 한 달 전 해외여행 사진. 노이즈',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이오랑'
  },
  'VHBT-17': { // CCTV
    title: '배회하는 이오랑',
    description: '',
    detail: '13:10~13:40 식당·숙소 배회. 표정 굳음. 핸드폰 자주 확인.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이오랑'
  },
  'ZTHB-21': { // @@@
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이오랑'
  },

  // =============================================
  // 이오랑 (진범) — 특수 단서 5개
  // =============================================
  'EKQZ-25': {
    title: 'CCTV 경로 상세 분석',
    description: '',
    detail: '화장실 방향 맞지만 종덕 방 앞 우회로 경유. 화장실 진입 여부 불확인',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이오랑',
    unlockedBy: []
  },
  'MFRQ-48': {
    title: '파우더 성분 감식 결과',
    description: '',
    detail: '이오랑 손과 텀블러 잔여물 모두 WPI. "아침 쉐이크" 해명 가능하지만 라벨 교체 시 동일 성분 묻을 수도 있음.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이오랑',
    unlockedBy: []
  },
  'IRPH-46': {
    title: '회계 영수증 일부 발견',
    description: '',
    detail: '120만원 중 60만원 영수증 뒤늦게 발견. 나머지 60만원 여전히 행방불명.부분 해명에 그침.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이오랑',
    unlockedBy: ['YUQO-48', 'SESE-63']
  },
  'JDNI-38': {//@@@
    title: '종덕 진술 — 안드롤 미언급 확인',
    description: '',
    detail: '오랑 누나한테 보충제 얘기 한 적 없어요." 이오랑이 독자적으로 사전 조사했음을 확증.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이오랑',
    unlockedBy: ['ZTHB-21', 'MPAH-32']
  },
  'WJIE-77': {
    title: '내용물 교체 기록',
    description: '이오랑의 다이어리 한 페이지에 적힌 암호 같은 메모. "A와 B를 바꾼다. D-7."이라고 쓰여 있으며, 두 개의 원이 화살표로 연결된 스케치가 옆에 있다.',
    detail: '메모 날짜가 사건 발생 7일 전이며, 이후 페이지에는 "완료"라는 짧은 한 줄 메모만 남아 있다.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이오랑',
    unlockedBy: ['CASI-77', 'YBBU-45']
  },

  // =============================================
  // 최종덕 (조력자/의심 대상) QR단서 총 15개, 다른 인물에 대한 대본, 다른 인물의 단서에 대한 대본 
  // 단서QR 부착 - 가방 : 5개( 단백질, 안드롤, 텀블러, 등산코스 지도, 등산 장갑 ), 
  // 수중 - 핸드폰 : 1개 ( 목사와 같이 찍은 사진이 배경으로 되어 있다.) - 관련 단서 3개 ( 목사에게 전화, 안드롤 처방전,  ) 2차 때
  // 보통 단서 10개  
  // =============================================
  'DBVZ-30': {
    title: '등산코스 지도', // 불필요, 가방
    description: '숙소 근처에 있는 산의 등산코스 지도.',
    detail: '등산 코스를 신중하게 선택한 흔적이 보이는 지도. 목사가 선호하는 난이도와 경로가 표시되어 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종덕'
  },
  'WZOI-51': {
    title: '등산 장갑', // 불필요, 가방
    description: '최종덕의 가방에 있는 등산용 장갑. ',
    detail: '일반적인 등산 장갑처럼 생겼다. 하얀 가루와 흙먼지가 묻어있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종덕'
  },
  'TPNJ-25': {
    title: '텀블러', // 가방 --> 다른 사람에게 물으면 평소 두 개씩 가지고 다닌다고 함. 목사님꺼까지, 하지만 가방엔 하나 하얀가루가 묻음.
    description: '최종덕과 피해자 목사가 함께 찍은 여러 장의 사진. 등산, 식사, 청년부 활동 등 다양한 장소에서 촬영된 것들이다.',
    detail: '사진 속 두 사람의 표정과 거리감으로 보아 매우 친밀한 관계였던 것으로 보인다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종덕'
  },
  'QZXY-18': {
    title: '안드롤 통', // 가방  --- 특수 단서 SHFK-09
    description: '하얀 가루가 담겨져 있는 통, 성분명: 옥시메톨론(Androl). 운동 보충제 중에서도 강력한 효과로 알려진 물질이다.',
    detail: '하얀 가루가 전체 통의 1/4밖에 남아있지 않다. 자주 먹었는지 라벨이 너덜하게 해져있다. "1회 1스쿱 (1스쿱 15g), 주의: 정해진 양만 섭취하시오." 라고 적혀있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종덕'
  },
  'JZLM-98': {
    title: '단백질 통', // 가방 --- 특수 단서 SHFK-09
    description: '하얀 가루가 담겨져 있는 통, 성분명 : 분리유청단백질(WPI, Whey Protein Isolate). 단백질 보충제 중에서도 순도가 높은 제품이다.',
    detail: '하얀 가루가 전체 통의 3/4만큼 남아있다. 자주 먹었는지 라벨이 너덜하게 해져있다. "1회 3스쿱 (1스쿱 30g)" 라고 적혀있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종덕'
  },
  'VGIG-44': { 
    title: '핸드폰', // 2차 때 공개 예정, 방에 두고 돌아다님
    description: '배경 사진이 최종덕과 피해자 목사가 함께 찍은 사진인 스마트폰.',
    detail: '카카오톡 메신저, 통화 기록이 있다. 종덕에게 열어달라고 해야겠다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종덕'
  },
  'KBUT-19': { 
    title: '열린 핸드폰', // 수중, VGIG-44를 물어볼 경우에만 해금.
    description: '카카오톡, 통화기록, 최근 검색 기록을 열람할 수 있다',
    detail: '카카오톡 : 최근 피해자와 재정 문제로 대화한 기록이 있다. 통화 기록 : 사건 당일 피해자와 1시 15분에 통화한 기록이 있다. 최근 검색 기록 : 안드롤의 위험성에 대해 검색했다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종덕'
  },
  'AOYY-73': {
    title: '불안한 모습의 종덕', // 방에 붙어 있음
    description: '평소와 다른 종덕의 모습.',
    detail: '오후 일정을 이지현에게 돌연 위임, 불안한 표정과 행동을 보임.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종덕'
  },
  'WNEP-79': { // 다른 사람 단서 중 나와 연관 있는 단서
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종덕'
  },
  'LQKZ-03': { // 다른 사람 단서 중 나와 연관 있는 단서
    title: '',
    description: '',
    detail: '메모에는 "이번 통은 왜인지 가루가 너무 곱다"는 짧은 한 줄 메모가 덧붙어 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종덕'
  },

  // =============================================
  // 최종덕 (조력자/의심 대상) — 특수 단서 5개
  // =============================================
  'SHFK-09': { // 자동, --- 두 개의 단서가 만나면 자동으로 열림.
    title: '똑같은 스쿱 크기',
    description: '단백질 통와 안드롤 통의 스쿱 크기가 같다.',
    detail: '1스쿱의 무게가 다른데 왜 같은 크기의 스쿱이 들어가 있지는지 의문이다.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '최종덕',
    unlockedBy: ['QZXY-18', 'JZLM-98']
  },
  'TWSI-17': { // 수중, SHFK-09 ('똑같은 스쿱 크기') 에 대해 질문 받았을 때
    title: '종덕의 진술, 같은 스쿱 크기',
    description: '"안드롤 통에 원래 작은 게 들어있었는데 아마 안에 파묻혀 있을거에요."',
    detail: '"단백질은 금방 금방 먹어서 스쿱이 많다보니 주로 이걸로 먹어요. 물론 1/4스쿱 정도로만 타서 먹어요"',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '최종덕',
    unlockedBy: []
  },
  'OXTC-68': {
    title: '열린 핸드폰', // 수중, VGIG-44를 물어볼 경우에만 해금.
    description: '카카오톡, 통화기록, 최근 검색 기록을 열람할 수 있다',
    detail: '카카오톡 : 최근 피해자와 재정 문제로 대화한 기록이 있다. 통화 기록 : 사건 당일 피해자와 1시 15분에 통화한 기록이 있다. 최근 검색 기록 : 안드롤의 위험성에 대해 검색했다.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '최종덕',
    unlockedBy: ['WNEP-79', 'VGIG-44']
  },
  'TMYO-78': { // 다른 사람 단서 중 나와 연관 있는 단서, 초 슈퍼 히든 단서
    title: '라벨 재부착 흔적',
    description: '',
    detail: '두 통 라벨 모서리에 이중 접착 흔적. 누군가 라벨을 교체했을 가능성.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '최종덕',
    unlockedBy: ['', '']
  },
  'MMSY-80': { // 다른 사람 단서 중 나와 연관 있는 단서
    title: '산 정상의 텀블러 성분 분석 결과',
    description: '',
    detail: '분리유청단백질(WPI) 100% 검출. 안드롤 성분 없음. 목사가 마신 것은 단백질',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '최종덕',
    unlockedBy: ['', '']
  },

  // =============================================
  // 이지현 (용의자 - 질투와 유산) — 보통 단서 9개, 점심 식사 후 목사님 자리에서 무언가 하는걸 봤다는 목격담.
  // =============================================
  'ELML-43': {
    title: '졸피뎀 약통', // 가방, 다른 사람이 이 단서를 볼 경우, 지현이 수면 장애가 있다는 소식은 처음 듣는다고 말한다.
    description: '강력한 수면제로 알려진 졸피뎀(Zolpidem) 약통. 이지현의 가방에서 발견되었다.',
    detail: '졸피뎀과 관련된 수면 진단서는 어디에도 없다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이지현'
  },
  'VXDA-53': {
    title: '핸드폰', // 2차 때 공개 예정, 방에 두고 돌아다님
    description: '배경 사진은 남동생과 찍은 사진으로 되어 있다.',
    detail: '잠긴 카카오톡, 통화 기록, 최근 검색 기록이 있다. 지현에게 열어달라고 해야겠다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이지현'
  },
  'HJFI-23': {
    title: '열린 핸드폰', // 수중, VXDA-53를 물어볼 경우에만 해금.
    description: '잠긴 카카오톡을 제외하고 통화 기록, 최근 검색 기록은 열람할 수 있다.',
    detail: `통화 기록 : 남동생과 최근에 연락한 기록이 있다. "누나 나 어떻게 해 나 이제 취업도 못 하겠어."라고 걱정하는 내용과 "누나가 알아서 해결할께 넌 가만히 있어."라는 답장이 마지막 내용이다.
    , 최근 검색 기록 : "졸피뎀 물에 잘 녹나요?", "부검하면 수면제 검출되나요?" 라는 검색어가 있다.`,
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이지현'
  },
  'HTBE-10': {
    title: '열린 카카오톡', // HJFI-23을 물어볼 경우 해금, 이 카톡에 대해 물으면 
    description: '목사님과의 카톡이다.',
    detail: '수련회 전날에 목사님에게 사무실로 찾아가겠다는 내용으로 카톡을 나눴다. 이전 대화 기록은 지현 폰에서만 삭제되었다. 목사님 카카오톡을 확인해야겠다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이지현'
  },
  'GFFZ-13': {
    title: '회계 장부', // 이 단서만 물어볼 경우, 짜증을 낸다.
    description: '뭔가 허술해 보이는 회계 장부.',
    detail: '장부에는 청년부 재정 관련된 수입과 지출이 대충 기록되어 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이지현'
  },
  'KBDD-44': {
    title: '화장품', // 불필요
    description: '이지현의 SNS 계정에 올라온 명품 사진 모음. 최근 게시물에 "곧 더 크게 바뀔 예정♥"라는 문구가 있다.',
    detail: '게시물이 사건 발생 2주 전에 올라왔다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이지현'
  },
  'OJMG-85': {
    title: '발샴푸', // 불필요
    description: '이지현의 스마트폰에서 발견된 대출 상담사와의 문자 내역. "현재 신용 등급으로는 추가 대출이 불가하다"는 내용이 담겨 있다.',
    detail: '문자 직후 이지현가 목사에게 전화를 건 기록이 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이지현'
  },
  'CLFL-13': {
    title: '청년부 통장', // 이지훈이 누구인지 지현에게 물어보면 교회 청년, 다른 사람에게 물어본다면 지현 동생이라고 말하면 됨
    description: '청년부 재정이 관리되는 통장. 이지현가 통장과 관련된 업무를 담당하고 있다.',
    detail: '3개월 간 통장 거래 내역을 분석한 결과, 이지훈에게 일정 금액이 종종 입금되고 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이지현'
  },
  'BGYS-92': {// 다른 사람 단서 중 나와 연관 있는 단서
    title: '배회하는 이지현',
    description: '',
    detail: '13:10~13:50 식당·등산로 입구 배회. 자꾸 등산로 방향 힐끔거림.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이지현'
  },

  // =============================================
  // 이지현 (용의자 - 질투와 유산) — 특수 단서 5개
  // =============================================
  'LOVN-56': { // 목사님 폰에 찍힌 청년부 통장과 지현의 회계장부를 발견하면 열리는 단서
    title: '서로 다른 회계 장부',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이지현',
    unlockedBy: ['GFFZ-13', 'BGYS-92']
  },
  'GIQA-02': { // 수중, 청년부 통장과 서로 다른 회계 장부를 발견하면 단서를 보여쥰더, 단 이지훈이 이지현 동생인걸 의심하거나 아는 경우만
    title: '남동생 헌금 유용 기록',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이지현',
    unlockedBy: ['HJFI-23', 'KBDD-44']
  },
  'PPSO-17': { // 다른 사람 단서 중 나와 연관 있는 단서
    title: '텀블러 성분 — 졸피뎀 검출',
    description: '',
    detail: '졸피뎀 검출 안 됨. 계획 실행 안 됐거나 실패. 직접 사인과 무관',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이지현',
    unlockedBy: ['ELML-43', 'CLFL-13']
  },
  'XXUL-79': { // 다른 사람 단서 중 나와 연관 있는 단서  맥거핀.
    title: '등산로 배회 이유',
    description: '',
    detail: '"목사님 안부가 걱정됐어요." 실제론 수면제 효과 안 나타나 초조. 겉으로는 걱정처럼 들림.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이지현',
    unlockedBy: ['HTBE-10', 'OJMG-85']
  },
  'MYDH-62': { // 다른 사람 단서 중 나와 연관 있는 단서
    title: '목사 사무실 방문 내용',
    description: '',
    detail: '"동생 일 조용히 해결해달라고 갔어요. 목사님이 안 된다고 하셨어요." 합법적 시도였음 확인',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이지현',
    unlockedBy: ['VXDA-53', 'LOVN-56']
  },

  // =============================================
  // 박희두 (용의자 - 과거의 원한) — 보통 단서 9개
  // =============================================
  'AZPL-94': { // 공용
    title: '목사 방 청소 자원봉사 기록',
    description: '',
    detail: '다른 청년 대신 자진 교체 신청. 목사 방 30분 단독 체류. 유일한 약병 접근 인물.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희두'
  },
  'WUQZ-78': { // 공용(목사 방)
    title: '응급약 약병 이상',
    description: '',
    detail: '정품 니트로글리세린 설하정엔 "GTN" 각인 있음. 약병 안 알약은 각인 없는 매끄러운 알약. 유당으로 의심.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희두'
  },
  'BRZD-12': { // 방 
    title: '정품 니트로글리세린 발견',
    description: '',
    detail: 'GTN 각인 정품 알약 6알. 희두 본인 처방 아님. 약병에서 빼낸 것으로 추정.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희두'
  },
  'DSHM-31': {
    title: '위조 수료증 의혹 서류',
    description: '',
    detail: '수료증 발급 번호 교단 DB 불일치. 목사가 전날 면담에서 통보. 수련회 이후 보고 예정.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희두'
  },
  'LZWX-93': {
    title: '전도사 자격 관련 면담 기록',
    description: '',
    detail: '목사 일정표: "전도사 자격 관련 면담 — 박희두 (15분)". 면담 후 표정 굳음 목격.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희두'
  },
  'LVRY-41': {
    title: '핸드폰',
    description: '',
    detail: '검색 기록·메모 확인 가능. 직접 열어달라고 해야 함',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희두'
  },
  'KDGY-11': {
    title: '열린 핸드폰',
    description: '',
    detail: '검색: "협심증 발작 발현 조건", "니트로글리세린 작용 원리", "유당 알약 외형". 메모: 협심증 등산 발작 가능성.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희두'
  },
  'WCFG-46': {
    title: '행적 불명 — 13:10~13:50',
    description: '',
    detail: '이 시간대 목격자 전무. "혼자 묵상"이라 주장. 목사 방 재방문 또는 약병 확인 추정.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희두'
  },
  'LHSC-06': {
    title: '목사 협심증 인지',
    description: '',
    detail: '"목사님이 직접 알려주셨어요." 전도사 신분상 가까이 지내며 알게 됨. 노이즈.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희두'
  },

  // =============================================
  // 박희두 (용의자 - 과거의 원한) — 특수 단서 5개
  // =============================================
  'PGZT-09': {
    title: '정품 알약 소지 이유 해명',
    description: '',
    detail: '"목사님 부탁으로 약국서 사다 드린 거예요." 카톡 확인 시 부탁 메시지 실재. 단, 짐에 있고 약병은 교체된 모순 해소 안 됨.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '박희두',
    unlockedBy: ['', '']
  },
  'ACNJ-83': {
    title: '수료증 원본 제출 — 위조 확정',
    description: '',
    detail: '원본도 발급 번호 불일치. 신학교 직접 확인: 해당 번호 수료생 없음. 위조 확정. 동기 강화.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '박희두',
    unlockedBy: ['', '']
  },
  'JQOO-57': {
    title: '약병 교체 타임라인',
    description: '',
    detail: '청소(전날) → 목사 통보(전날) → 아침 재방문 순서. 직접 증거 없으나 의심스러운 타임라인.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '박희두',
    unlockedBy: ['', '']
  },
  'MCMM-13': { // 맥거핀.
    title: '협심증 검색 해명', 
    description: '',
    detail: '"걱정돼서 찾아봤어요." 단 "유당 알약 외형" 검색은 걱정과 무관. 약 교체 사전 연구 해석 가능. ',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '박희두',
    unlockedBy: ['', '']
  },
  'QAWG-10': {
    title: '13:10~13:50 행적 최종 불명',
    description: '',
    detail: '위조+약병 교체+행적 불명 맞물림. 가장 배제 어려운 오답 경로. 이오랑 범행 타임라인과 별개로 분석 필요.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '박희두',
    unlockedBy: ['', '']
  },

  // =============================================
  // 윤재은 (용의자) — 보통 단서 9개
  // =============================================
  'LCSX-35': {
    title: '언쟁 목격 진술',
    description: '',
    detail: '찬양 선곡 문제로 격렬히 다툼. 재은이 눈이 빨게진 채 자리를 박차고 나감',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤재은'
  },
  'UCGX-01': {
    title: '거부 도장 찍힌 기획안',
    description: '',
    detail: '목사 반려 도장 2번. 재은이 심혈 기울인 찬양팀 기획안.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤재은'
  },
  'XZIU-65': {
    title: '핸드폰',
    description: '',
    detail: '검색 기록·카카오톡 확인 가능. 직접 열어달라고 해야 함.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤재은'
  },
  'KLLF-63': {
    title: '열린 핸드폰',
    description: '',
    detail: '검색: "스테로이드 심장 위험". 바로 직전 카톡: 팀원이 "보충제 먹어도 돼요?" 질문',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤재은'
  },
  'JOHG-57': {
    title: '운동화', //
    description: '',
    detail: '등산로 황토 흙 당일 새로 묻음. 공식 등산 때 신발과 다름. 산 입구까지 간 증거.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤재은'
  },
  'AZVU-48': {
    title: '라벨 없는 약봉투 2종',
    description: '',
    detail: '라벨 제거된 약봉투. 처음엔 설명 못 함. 부모님 고혈압약이라고 해명.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤재은'
  },
  'EISF-00': {
    title: '수첩 메모',
    description: '',
    detail: '"이번엔 절대 못 참아." 전후 맥락에 팀원 이름 등장.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤재은'
  },
  'LUVX-47': {
    title: '산 방향 이동 목격',
    description: '',
    detail: '"점심 후 재은이가 빠른 걸음으로 산 방향으로 가는 거 봤어요."',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤재은'
  },
  'MAKA-55': {
    title: '다시 산으로 간 재은',
    description: '',
    detail: '13:20~13:50 등산로 중반까지 올라갔다 복귀. 내려올 때 눈 충혈.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤재은'
  },

  // =============================================
  // 윤재은 (용의자 - 집착과 망상) — 특수 단서 5개
  // =============================================
  'UUSQ-85': {
    title: '약봉투 처방전 확인',
    description: '',
    detail: '부모님 이름 고혈압약 처방전. 스테로이드·심장약과 무관. 심부름으로 챙긴 것.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '윤재은',
    unlockedBy: ['', '']
  },
  'SXAH-88': {
    title: '검색어 전후 카톡 확인',
    description: '',
    detail: '검색 직전 팀원 카톡: "보충제 스테로이드 위험해요?" 답변 위해 검색한 것 확인.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '윤재은',
    unlockedBy: ['AZVU-48', 'MAKA-55']
  },
  'CTGS-92': {
    title: '산에 간 진짜 이유 — 재은 진술',
    description: '',
    detail: '"어제 너무 크게 화냈어서 사과하러 갔어요. 산 입구에서 종덕이가 전화하는 거 보고 나중에 하자고 돌아왔어요." 종덕 타임라인 뒷받침',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '윤재은',
    unlockedBy: ['XZIU-65', 'EISF-00']
  },
  'OLCG-88': {
    title: '수첩 메모 전후 맥락',
    description: '',
    detail: '목사가 아닌 팀원 갈등 메모. 목사와 관계 회복 시도 흔적도 있음. 맥거핀.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '윤재은',
    unlockedBy: ['UCGX-01', 'LCSX-35']
  },
  'DBEL-94': {
    title: '종덕 진술 확인 — 재은 목격',
    description: '',
    detail: '종덕: "12:55 통화 때 멀리서 누군가 보다 돌아갔어요." 재은 진술과 타임라인 일치. 맥거핀.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '윤재은',
    unlockedBy: ['LUVX-47', 'JOHG-57']
  },

  // =============================================
  // 이나현 (용의자 - 비밀 취재) — 보통 단서 9개
  // =============================================
  'IIKU-90': {
    title: '편지 초안',
    description: '',
    detail: '"당신이 그 카톡만 답했어도 오빠는 살아있었을 거야." 준혁 이름 등장.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이나현'
  },
  'PFWK-90': {
    title: '목사 방 익명 편지 3통',
    description: '',
    detail: '수 주에 걸쳐 수신. 목사만 알 수 있는 이준혁 마지막 카톡 디테일 담겨있음.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이나현'
  },
  'DSQO-10': {
    title: '이준혁 관련 자료',
    description: '',
    detail: '3년 전 사망 기사, 카톡 캡처, 교회 내부 기록. 오빠 이준혁 관련.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이나현'
  },
  'VGLV-69': {
    title: '핸드폰',
    description: '',
    detail: '녹음 파일·검색 기록·카카오톡 확인 가능. 직접 열어달라고 해야 함.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이나현'
  },
  'MJTJ-51': {
    title: '열린 핸드폰',
    description: '',
    detail: '검색: "필적 감정 원리", "익명 편지 추적 불가". 녹음 파일 1개. 통화 기록(13:00, 1분43초).',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이나현'
  },
  'JKVN-96': {
    title: '목사 기록 접근 로그',
    description: '',
    detail: '회장 권한 이상의 접근 로그. 정기 날짜 외 추가 접근 기록.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이나현'
  },
  'CXGY-03': {
    title: '시신 발견 경위',
    description: '',
    detail: '13:00 전화 → 10분 혼란 → 등산 → 13:40 정상 → 13:50 시신 발견·신고.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이나현'
  },
  'QWRO-64': {
    title: '초기 진술 누락',
    description: '',
    detail: '최초 조사에서 통화 사실 미언급. 추궁 후 인정',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이나현'
  },
  'VILR-41': {
    title: '목사와 냉각된 관계',
    description: '',
    detail: '최근 2주간 목사와 눈도 안 마주침. 기록 열람 후 감정 변화. 노이즈.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이나현'
  },

  // =============================================
  // 이나현 (용의자 - 비밀 취재) — 특수 단서 5개
  // =============================================
  'KVRU-70': {
    title: '녹음 파일 — 목사의 마지막 고백',
    description: '',
    detail: '"준혁이한테 전해줘. 그때 내가 연락 못 받아서… 3년 동안 한 번을 못 찾아갔어. 정말 미안했다고." 종덕 무고와 무관한 사과.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이나현',
    unlockedBy: ['QWRO-64', 'MJTJ-51']
  },
  'XWTW-80': {
    title: 'CCTV 도착 시각 확인',
    description: '',
    detail: '나현의 등산로 진입 13:10 이후. 목사 추락 추정(13:05~13:10)보다 늦음.편지 전달 불가능.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이나현',
    unlockedBy: ['DSQO-10', 'VGLV-69']
  },
  'BEHF-48': {
    title: '익명 편지 필체 분석',
    description: '',
    detail: '유의미한 차이 존재. 의도적 변형 또는 다른 방법 가능성 병존. 완전 배제불가',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이나현',
    unlockedBy: ['CXGY-03', 'JKVN-96']
  },
  'WEPC-44': {
    title: '기록 추가 접근 = 목사 부탁',
    description: '',
    detail: '목사 부탁 카톡 확인. 접근 자체는 허가됐으나 그 과정에서 일지 읽게 된것. 동기 형성 가능성 남음. 맥거핀.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이나현',
    unlockedBy: ['IIKU-90', 'PFWK-90']
  },
  'USEU-87': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이나현',
    unlockedBy: ['VILR-41', 'DSQO-10']
  }
};

// 피해자
export const victim = {
  name: '목사',
  age: 58,
  gender: '남성',
  occupation: '샛별이슬 교회 청년부 목사',
  hint: '피해자는 청년부를 이끄는 영향력 있는 목사님이었습니다.',
  detail: '심장 부정맥을 앓고 있었으며, 당일 산행 후 절벽 아래로 떨어져 사망했습니다.'
};

// 용의자들
export const suspects = [
  {
    id: 'S1',
    name: '최종덕',
    age: 23,
    gender: '남성',
    occupation: '샛별이슬 청년부 서기',
    notes: '피해자 목사와 매우 친밀한 관계였습니다. 헬스와 운동에 진심인 성실한 청년.',
  },
  {
    id: 'S2',
    name: '윤재은',
    age: 24,
    gender: '남성',
    occupation: '샛별이슬 청년부 찬양팀 팀장',
    notes: ''
  },
  {
    id: 'S3',
    name: '이지현',
    age: 26,
    gender: '여성',
    occupation: '샛별이슬 청년부 회계',
    notes: ''
  },
  {
    id: 'S4',
    name: '박희두',
    age: 28,
    gender: '여성',
    occupation: '샛별이슬 청년부 전도사',
    notes: ''
  },
  {
    id: 'S5',
    name: '이오랑',
    age: 25,
    gender: '여성',
    occupation: '샛별이슬 청년부 총무',
    notes: ''
  },
  {
    id: 'S6',
    name: '이나현',
    age: 25,
    gender: '여성',
    occupation: '샛별이슬 청년부 회장',
    notes: ''
  }
];
