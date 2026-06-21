export const evidenceMap = {
  'LSUX-91': {
    title: '게임 설명서',
    description: '게임의 기본 규칙과 플레이 방법이 담긴 설명서입니다.',
    detail: '',
    image: '/images/clue-01.svg',
    type: '보통',
    person: '공용',
    pages: [
      {
        title: '크라임씬 미스터리란?',
        image: '/images/manual/intro.svg',
        content: '현장에 숨겨진 QR 코드나 단서 코드를 찾아 증거를 수집하는 오프라인 추리 게임입니다.\n\n팀원들과 함께 현장을 탐색하며 증거를 모으고, 수집한 정보를 바탕으로 범인과 사건의 진실을 밝혀내세요.\n\n이 설명서는 사건 개요·게임 진행 규칙과 앱 사용법을 안내합니다. 화살표 버튼으로 페이지를 넘기세요.'
      },
      {
        title: '사건 개요',
        image: '/images/manual/case.svg',
        content: '수련회 마지막 날, 샛별이슬 교회 청년부 담임 김호치(58) 목사님이 개인 방에서 숨진 채 발견되었습니다.\n\n목사님은 협심증 병력이 있었지만, 부검 결과 단순 발작사로 보기 어려운 정황이 드러났습니다.\n\n사건 당시 현장에 있던 청년부 임원 6명이 용의자입니다. 여러분은 수사팀이 되어 단서를 모으고 진실을 추리합니다.'
      },
      {
        title: '게임 진행 순서',
        image: '/images/manual/flow.svg',
        content: '① 브리핑 (5분) — 사건 개요와 규칙 안내\n\n② 1부 (60분) — 용의자 1:1 심문 (핸드폰 금지)\n\n③ 중간 점검 (15~20분) — 팀 토의 및 핵심 단서 일부 공개\n\n④ 2부 (60분) — 자유 탐문 (핸드폰 해금)\n\n⑤ 발표·채점 (10분) — 추리 발표 및 정답 공개'
      },
      {
        title: '1부 — 1:1 심문',
        image: '/images/manual/part1.svg',
        content: '1부에서는 용의자를 한 명씩 1:1로 심문합니다.\n\n이 시간 동안에는 용의자의 핸드폰을 확인할 수 없습니다. 진술과 가방·소지품 위주로 단서를 수집하세요.\n\n각 용의자의 진술을 받아 적고, 말과 증거 사이의 모순을 기록해 두면 2부에서 큰 도움이 됩니다.'
      },
      {
        title: '중간 점검',
        image: '/images/manual/mid.svg',
        content: '1부가 끝나면 팀끼리 모여 지금까지 모은 단서를 정리하고 토의합니다.\n\n이 시간에 진행자가 감식·부검 1차 소견 등 핵심 단서 일부를 공개합니다.\n\n공개되는 부검 중간 소견에 따라 사건의 방향이 크게 바뀔 수 있으니 주목하세요.'
      },
      {
        title: '2부 — 자유 탐문',
        image: '/images/manual/part2.svg',
        content: '2부에서는 자유롭게 모든 용의자를 탐문할 수 있습니다.\n\n이제 용의자의 핸드폰을 열어 카카오톡·검색 기록·갤러리 등을 확인할 수 있습니다.\n\n2부 중반에는 부검 최종 결과(직접 사인)가 공개됩니다. 모든 단서를 종합해 진범을 좁혀가세요.'
      },
      {
        title: '단서 귀속(❓) & 특수 단서',
        image: '/images/manual/clue.svg',
        content: '복도·예배당 등 현장에서 발견되는 일부 단서는 처음엔 누구의 것인지 알 수 없는 "귀속 미상(❓)" 상태입니다.\n\n해당 단서를 올바른 용의자에게 제시하면 귀속이 확정되고 추가 정보가 풀립니다.\n\n또한 서로 관련된 보통 단서 2개를 모두 모으면 [특수 단서]가 자동으로 해금됩니다.'
      },
      {
        title: '공개',
        image: '/images/manual/reveal.svg',
        content: '2부가 끝나면 팀별로 추리를 발표합니다.\n\n누가·왜·어떻게 범행했는지를 수집한 단서를 근거로 설명하세요.\n\n진행자가 정답과 숨은 진실을 공개하며, 단서 활용도와 추리의 정확도를 기준으로 채점합니다.'
      },
      {
        title: 'QR 코드 스캔',
        image: '/images/manual/qr.svg',
        content: '화면 왼쪽의 [카메라로 QR 스캔] 버튼을 누르면 카메라 팝업이 열립니다.\n\n카메라를 현장의 QR 코드에 가까이 가져다 대면 자동으로 인식하여 증거를 수집합니다.\n\n인식에 성공하면 팝업이 자동으로 닫히고 수집 결과가 메시지로 표시됩니다.\n\n실내가 어두울 경우 조명을 켜거나 QR 코드와의 거리를 조정해 보세요.'
      },
      {
        title: '코드 직접 입력',
        image: '/images/manual/input.svg',
        content: 'QR 코드 스캔이 어려운 경우 [코드 직접 입력] 필드에 단서 코드를 입력할 수 있습니다.\n\n코드 형식 예시: CLUE-01, CLUE-02, CLUE-03\n\n입력 후 [확인] 버튼을 누르거나 Enter 키를 누르면 증거가 수집됩니다.\n\n코드는 대소문자를 구분하지 않습니다.'
      },
      {
        title: '수집된 증거 확인',
        image: '/images/manual/list.svg',
        content: '화면 오른쪽 [수집된 증거] 탭에서 지금까지 모은 증거 목록을 확인할 수 있습니다.\n\n탭 옆 괄호 안의 숫자가 현재 수집된 증거 수입니다.\n\n목록의 항목을 탭하면 증거 이미지와 상세 설명이 담긴 팝업이 열립니다.\n\n수집한 증거는 앱을 닫아도 자동으로 저장됩니다.'
      },
      {
        title: '공통 정보 & 초기화',
        image: '/images/manual/info.svg',
        content: '[공통 정보] 탭에서 피해자와 용의자의 기본 정보를 확인할 수 있습니다.\n\n이름 칩을 탭하면 해당 인물의 직업·나이·특별 단서 등 상세 정보가 표시됩니다.\n\n게임을 처음부터 다시 시작하려면 오른쪽 상단 [초기화] 버튼을 누르세요. 수집된 증거가 모두 삭제됩니다.'
      }
    ]
  },

  // =============================================
  // 공용 CCTV 열람대 — 시간대별 영상. 인물 클릭 시 해당 용의자 CCTV 단서 확보
  // =============================================
  'SIAH-72': {
    title: 'CCTV 열람대',
    description: '수련회 당일 복도·예배당 등에 설치된 CCTV를 시간대별로 열람할 수 있다.',
    detail: '화면 속 인물을 누르면, 그 시간·위치와 일치하는 용의자의 CCTV 단서를 확보할 수 있다. (목사님 방 내부에는 CCTV가 없다.)',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '공용',
    cctv: {
      timeline: [
        {
          time: '12:20',
          location: '',
          scene: '한 인물이 남자 숙소(최종현 방) 방향으로 들어갔다가, 약 1분 20초 뒤 손에 무언가를 들고 나온다.',
          people: [
            { look: '여성 — 손에 무언가 들고 이동', who: '이사랑', unlocks: 'NQBT-91', x: 95, y: 150 }
          ]
        },
        {
          time: '12:35',
          location: '목사님 방 앞 복도',
          scene: '한 인물이 목사님 방 쪽에서 나와, 복도에서 손을 옷에 닦으며 빠르게 지나간다.',
          people: [
            { look: '여성 — 손을 닦으며 황급히 이동', who: '이현지', unlocks: 'NKCD-95', x: 305, y: 138 }
          ]
        },
        {
          time: '13:10~13:40',
          location: '식당·숙소 주변',
          scene: '두 인물이 따로따로 식당과 숙소 주변을 서성인다.',
          people: [
            { look: '여성 A — 핸드폰을 자주 확인하며 배회', who: '이사랑', unlocks: 'TTNA-35', x: 180, y: 140 },
            { look: '여성 B — 예배당 입구를 초조하게 서성임', who: '이현지', unlocks: 'TQMW-03', x: 322, y: 152 }
          ]
        },
        {
          time: '14:40',
          location: '목사님 방 앞 복도',
          scene: '한 인물이 목사님 방 복도를 수 차례 오가며, 방 문 앞에서 잠시 멈춰 선다.',
          people: [
            { look: '여성 — 방 문 앞에서 멈칫거림', who: '박희원', unlocks: 'LGYR-78', x: 290, y: 132 }
          ]
        },
        {
          time: '14:45',
          location: '목사님 방 근처',
          scene: '한 인물이 목사님 방으로 들어간다. 한참 뒤에야 다시 나온다. (방 내부는 CCTV에 잡히지 않음)',
          people: [
            { look: '여성 — 방으로 진입 후 한참 머무름', who: '이가현', unlocks: 'DVCS-80', x: 325, y: 134 }
          ]
        }
      ]
    }
  },

  // =============================================
  // 공용 / 피해자(목사) 단서 — 부검·현장·목사 유품
  // ※ 화면에서 '목사(피해자)' 전용 탭에 표시
  // =============================================
  'COMB-55': { // 부검 1차 소견 (처음 공개)
    title: '부검 1차 소견',
    description: '',
    detail: '심정지 정황. 혈중 요힘빈 고농도 검출. 동시에 정품 니트로글리세린(설하정) 성분도 검출됨 — 목사가 어디선가 진짜 약을 복용한 정황. 협심증 발작 흔적 확인. 단, 코·입 주변에 미세 압박흔이 있어 정밀 감식 중.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '목사',
    unlockedBy: []
  },
  'SAJL-88': { // 현장(목사 방) — 텀블러
    title: '개인 텀블러',
    description: '책상 위에서 개인 텀블러를 발견했다.',
    detail: '방은 항상 열려있다. 안에 내용물이 담겨있다. 하얀 가루가 보인다.',
    image: '/images/텀블러.jpg',
    type: '보통',
    person: '목사'
  },
  'LONS-62': { // 부검 확정 — 질식사 (2부 중반 투하)
    title: '부검 확정 — 질식사',
    description: '',
    detail: '정밀 감식 결과: 사인은 질식. 코·입 주변 압박흔과 안면 점출혈 확인. 심장 발작은 사망의 직접 원인이 아님.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '목사',
    unlockedBy: []
  },
  'TQPA-93': { //
    title: '쉐이크 통',
    description: '',
    detail: '종현의 것으로 보이는 쉐이크 통이 목사님 책상 위에서 발견되었다. 내용물이 있다.',
    image: '/images/쉐이크통.png',
    type: '보통',
    person: '목사'
  },
  'LWUY-33': { // 목사 핸드폰 — 지문 인식으로 풀림. 카톡에 삭제된 대화(김멋짐·이가현) → 톡서랍 복구
    title: '목사님 핸드폰',
    description: '잠금이 풀린 채 발견된 목사님의 핸드폰.',
    detail: '카톡과 사진을 확인할 수 있다. 카카오톡에 삭제된 대화가 있는 듯하다.',
    image: '',
    type: '보통',
    person: '목사',
    phone: {
      owner: '김호치 목사님의 핸드폰',
      apps: [
        {
          id: 'contacts',
          type: 'contacts',
          name: '연락처',
          contacts: [
            { name: '종현이 (서기)', who: '최종현' },
            { name: '윤은재 찬양팀장', who: '윤은재' },
            { name: '이현지 회계', who: '이현지' },
            { name: '박희원 전도사', who: '박희원' },
            { name: '이사랑 총무', who: '이사랑' },
            { name: '이가현 회장', who: '이가현' },
            { name: '멋짐 형제(○○교회)', who: '김멋짐' }
          ]
        },
        {
          id: 'kakao',
          type: 'kakao',
          name: '카카오톡',
          recoverPassword: '0419',   // 결혼기념일 4월 19일 — 목사님 일기장(PRBO-03)에서 유도
          chats: [
            {
              name: '박 목사 (지인)',
              messages: [
                { from: 'them', text: '호치 목사님, 잘 지내시죠?', time: '3일 전' },
                { from: 'them', text: '다름이 아니라... 그쪽 박희원 전도사님 말인데요.', time: '3일 전' },
                { from: 'them', text: '수료증 자격이 좀 의심스럽다는 얘기가 있어요. 확인은 해 보셨어요?', time: '3일 전' },
                { from: 'me', text: '아, 그래요? 안 그래도 좀 이상한 점이 있었는데...', time: '3일 전' },
                { from: 'me', text: '수련회 끝나면 교단에 직접 알아봐야겠네요.', time: '3일 전' }
              ]
            },
            {
              name: '김멋짐 형제',
              deleted: true,
              messages: [
                { from: 'me', text: '멋짐 형제, 전에 말한 자매 말인데... 좀 걱정이 돼서요.', time: '4일 전' },
                { from: 'me', text: '가현이가 애도 있고, 곧 결혼도 한다더라고요.', time: '4일 전' },
                { from: 'them', text: '...네? 그게 무슨 말씀이세요. 그 자매가 이가현 회장이라고요?', time: '4일 전' },
                { from: 'me', text: '멋짐 형제도 가현이를 아시는군요!', time: '4일 전' },
                { from: 'them', text: '......', time: '4일 전' }
              ]
            },
            {
              name: '이가현 회장',
              deleted: true,
              messages: [
                { from: 'them', text: '당신 때문에 이렇게 됐잖아요!', time: '이틀 전' },
                { from: 'them', text: '대체 무슨 권리로 멋짐이한테 그런 얘길 해요?', time: '이틀 전' },
                { from: 'them', text: '책임지세요. 제 인생 다 망가졌어요.', time: '이틀 전' }
              ]
            }
          ]
        },
        {
          id: 'photos',
          type: 'photos',
          name: '사진',
          photos: [
            { caption: '청년부 통장 사진 — 찬조금 입금 내역이 없음.', image: '/images/phone/bankbook.jpg' },
            { caption: '박희원 전도사 수료증 — 발급 번호가 교단 DB와 불일치.', image: '/images/phone/certificate.jpg' },
            { caption: '아이가 가현을 "엄마"라 부르는 사진 — 가현 약혼 파혼의 빌미.', image: '/images/phone/daughter.jpg', deleted: true }
          ]
        }
      ]
    }
  },
  'PRBO-03': {
    title: '목사님 일기장',
    description: '목사님이 며칠에 걸쳐 적어 온 일기. 화살표로 페이지를 넘겨 읽어보세요.',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '목사',
    pages: [
      {
        title: '3월 28일 (금)',
        content: '아침마다 약을 챙기는 일이 이제 습관이 됐다. 협심증 약은 늘 가까이 둬야 마음이 놓인다.\n\n아내가 싸준 도시락을 들고 뒷산을 한 바퀴 돌았다. 봄볕이 참 좋다. 건강이 허락하는 한 이 아침 산책만은 거르지 말아야지.'
      },
      {
        title: '4월 2일 (수)',
        content: '큰딸에게서 전화가 왔다. 분가한 지도 벌써 몇 해인데 목소리는 여전히 어리게 들린다.\n\n올해 7월 7일이면 그 애도 서른이다. 생일엔 온 가족이 모이기로 했다. 아내가 벌써부터 메뉴를 고민한다.'
      },
      {
        title: '4월 9일 (목)',
        content: '막내 아들 녀석이 새 직장에 적응하느라 고생인 모양이다. 11월 23일 생일엔 좋아하는 책이라도 한 권 부쳐줘야겠다.\n\n저녁엔 아내와 오랜만에 동네 한 바퀴를 걸었다. 별일 없이 흘러가는 하루가 가장 큰 복이다.'
      },
      {
        title: '4월 15일 (화)',
        content: '요즘 성경을 처음부터 다시 필사하고 있다. 손이 더뎌도 마음이 차분해진다.\n\n아내가 "올해 기념일엔 어디 갈까" 하고 묻는다. 매년 같은 질문인데도 매년 같은 설렘이다.'
      },
      {
        title: '4월 18일 (금)',
        content: '내일은 아내와 결혼한 지 28년 되는 날. 4월 19일이다.\n\n나는 무슨 일이 있어도 이 날짜만큼은 잊은 적이 없다. 지갑이며 사물함이며, 잠가 둬야 할 것은 늘 이 날짜 네 자리에 맞춰 둔다. 내일은 아내와 조용히 둘이서 시간을 보내야지.'
      }
    ]
  },
  'TARB-53': { // 목사님 방 위치·구조
    title: '목사님 방 위치·구조',
    description: '',
    detail: '방 문에 작은 유리창. 방 내부엔 CCTV 없음. 단, 방 바깥 복도는 CCTV가 있다.',
    image: '/images/방구조.png',
    type: '보통',
    person: '목사'
  },
  'HQIR-26': { // 목사님 일정표 — 면담 일정. 항목 클릭 시 면담 내용 확인
    title: '목사님 일정표',
    description: '',
    detail: '면담 일정을 눌러 각 면담 내용을 확인할 수 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '목사',
    schedule: {
      entries: [
        { time: '전날 13:00', person: '이사랑 총무', title: '재정 관련 면담 (15분)', content: '기타 항목 2000만원 지출 영수증을 요구. 면담 후 이사랑이 불안한 표정으로 나오는 것이 목격됨.' },
        { time: '전날 13:20', person: '이현지 회계', title: '재정 관련 면담 (15분)', content: '회계 업무 보고. 동생(이사랑) 일을 조용히 처리해 달라 부탁했으나 목사님이 거절함.' },
        { time: '전날 14:00', person: '박희원 전도사', title: '전도사 자격 관련 면담 (15분)', content: '수료증 자격 의심을 통보. "수련회 끝나면 교단에 알아보겠다." 면담 후 박희원의 표정이 굳음.' },
        { time: '전날 15:00', person: '이가현 회장', title: '개인 면담 (20분)', content: '면담 내용은 일정표에 미기재. 다만 이 면담 이후 가현이 목사님과 눈도 마주치지 않았다고 함.' }
      ]
    }
  },
  'IWND-38': { 
    title: '설하정 처방전',
    description: '책상 위에서 처방전을 발견했다.',
    detail: '협심증 응급약 설하정 처방전이다. 정품 알약은 "GTN" 각인이 있다고 적혀 있다. 발작 시 혀 밑에 넣어 복용한다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '목사'
  },
  'LTXB-98': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '목사'
  },
  'MEXF-73': {
    title: '설하정 약통',
    description: '책상 위에서 설하정 약통을 발견했다.',
    detail: '협심증 응급약 설하정 통이다. 겉에는 딸기향 함유라고 적혀 있고 노란 알약이 5알밖에 남아있지 않다. 옅은 딸기향이 난다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '목사'
  },
  'HODM-06': {
    title: '작은 약통',
    description: '침대 근처 바닥에서 발견한 작은 약통이다.',
    detail: '알약이 2알 밖에 남아있지 않다. 하얀 알약에 "GTN" 각인이 새겨져있다. 통을 열었을 때 특유의 딸기향이 진하게 났다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '목사',
  },
  'GZYJ-12': { //목사 협심증 진단서
    title: '목사님 협심증 진단서',
    description: '목사님 책상 위에 놓여져 있다. 누구든 볼 수 있는 듯 하다.',
    detail: 'OO병원 진단서: 협심증. 발작 시 니트로글리세린 설하정을 혀 밑에 즉시 복용하라는 지시가 적혀 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '목사'
  },
  'IHKX-61': { // 현장(목사 방, 2부) — 베개 위치 이상 (핵심)
    title: '베개 위치',
    description: '',
    detail: '침대에서 목사님이 배게를 제대로 배고 있지 않았다. 심정지로 고통스러워서 그런 듯하다.',
    image: '/images/clue-03.svg',
    type: '일반',
    person: '목사',
    unlockedBy: []
  },
  'CKKT-40': { // 문 유리창
    title: '문 유리창 ',
    description: '',
    detail: '목사님 방 문에는 작은 직사각형 유리창이 있다. 복도에서 방 안이 보인다.',
    image: '/images/clue-03.svg',
    type: '일반',
    person: '목사',
    unlockedBy: ['LGYR-78']
  },
  'PMUZ-94': { 
    title: '의문의 섬유',
    description: '',
    detail: '목사님 베개 커버에서 섬유가 발견되었다.',
    image: '/images/clue-03.svg',
    type: '일반',
    person: '목사',
    unlockedBy: []
  },
  'EUMM-81': { //
    title: '목사 옷깃 구겨짐',
    description: '',
    detail: '목사님 셔츠 옷깃이 한쪽만 구겨지고 늘어났다. 누군가 손으로 잡아당긴 흔적이 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '목사'
  },
  'AVLP-75': { // 현장(목사 방) — 바닥의 단추 (❓→윤은재)
    title: '바닥의 단추',
    description: '',
    detail: '목사님 셔츠에서 떨어진 단추 1개가 방 바닥에 떨어져 있음.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '목사'
  },

  // =============================================
  // 이사랑 (공범 — 요힘빈 라벨 교체) — 보통 단서
  // =============================================
  'NQBT-91': { // 복도 CCTV
    title: 'CCTV 화면 캡처',
    description: '',
    detail: '12:20경 이사랑이 최종현 방 방향으로 이동. 손에 무언가 들고 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이사랑'
  },
  'ILPN-45': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이사랑'
  },
  'NYBB-98': { // 이사랑 가방 — 핵심 물증
    title: '파우치',
    description: '화장품 파우치. 안에 금속 스패출러, 속눈썹 풀, 스킨, 앰플, 쿠션 등이 있다.',
    detail: '스패출러와 파우치 안쪽에 흰 가루가 묻어있음 (요힘빈 파우더와 동일 성분 — 감식 연계).',
    image: '/images/이사랑_파우치.jpg',
    type: '보통',
    person: '이사랑'
  },
  'OLUX-30': { //
    title: '옷가지',
    description: '',
    detail: '여벌 옷과 양말. 특이사항 없음. ',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이사랑'
  },
  'QNGX-77': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이사랑'
  },
  'LPQL-80': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이사랑'
  },
  'QIVS-92': { // 이사랑 열린 핸드폰 (PECG-06 해금 후). 톡서랍 비번 = 현지 생일 0302
    title: '열린 핸드폰',
    description: '',
    detail: '인터넷 검색 내역, 카카오톡 대화, 메시지, 사진 등을 확인할 수 있다. 카카오톡에 삭제된 대화가 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이사랑',
    phone: {
      owner: '이사랑의 핸드폰',
      apps: [
        {
          id: 'contacts',
          type: 'contacts',
          name: '연락처',
          contacts: [
            { name: '호치목사님🙏', who: '김호치 목사' },
            { name: '현지 언니❤', who: '이현지' },
            { name: '종현이', who: '최종현' },
            { name: '은재 오빠', who: '윤은재' },
            { name: '희원 전도사님', who: '박희원' },
            { name: '가현 회장님', who: '이가현' }
          ]
        },
        {
          id: 'browser',
          type: 'browser',
          name: '인터넷',
          searches: [
            {
              query: '요힘빈 심장 부작용',
              title: '요힘빈, 심장에 미치는 영향',
              snippet: '요힘빈은 교감신경을 자극해 심박수와 혈압을 끌어올립니다. 특히 협심증 등 심혈관 질환자에게는 흉통·발작을 유발할 수 있어 복용이 금기시됩니다.',
              image: '/images/yohimbine.jpg'
            },
            {
              query: '협심증 환자 요힘빈 위험',
              title: '협심증 환자의 요힘빈 복용 경고',
              snippet: '협심증 환자가 요힘빈을 복용하면 관상동맥 경련과 급성 심근 허혈로 이어질 수 있습니다. 발작 시에는 상체를 세워 안정시켜야 하며, 눕히면 위험합니다.'
            },
            {
              query: '요힘빈 효과 발현 시간',
              title: '요힘빈 흡수·발현 시간',
              snippet: '경구 복용 시 보통 20~40분 내에 효과가 나타나기 시작합니다.'
            }
          ]
        },
        {
          id: 'kakao',
          type: 'kakao',
          name: '카카오톡',
          recoverPassword: '0302',
          chats: [
            {
              name: '김호치 목사님',
              messages: [
                { from: 'them', text: '이사랑 총무님, 내일 재정 관련해서 잠깐 면담 가능할까요?', time: '오후 2:14' },
                { from: 'me', text: '네 목사님, 시간 괜찮습니다.', time: '오후 2:20' },
                { from: 'them', text: '기타 항목 지출이 2000만원인데 영수증이 없어서요. 챙겨와 주세요.', time: '오후 2:21' },
                { from: 'me', text: '...네, 알겠습니다.', time: '오후 2:45' }
              ]
            },
            {
              name: '현지 언니❤',
              deleted: true,
              messages: [
                { from: 'me', text: '언니… 나 할 말 있어.', time: '전날 21:10' },
                { from: 'me', text: '나 그동안 언니가 상속 포기하고 발 뺀 거… 우리 버린 줄 알았어.', time: '전날 21:11' },
                { from: 'me', text: '근데 통장 정리하다가 봤어. 언니가 내 빚… 몇 년째 갚아온 거.', time: '전날 21:12' },
                { from: 'me', text: '왜 말 안 했어. 나 진짜 언니 원망했는데.', time: '전날 21:12' },
                // ↓ 언니의 장문 고백 (반전의 핵심) — 이사랑 폰에 남아있음
                { from: 'them', text: '…알아버렸구나.', time: '전날 21:30' },
                { from: 'them', text: '엄마 아빠 빚 남기고 가셨을 때, 언니는 이미 내 빚이 있었잖아. 내가 상속받으면 내 채권자들이 그 몫까지 가져갔어. 그럼 너까지 더 깊이 빠졌을 거야.', time: '전날 21:31' },
                { from: 'them', text: '그래서 법적으로만 빠진 거야. 너 혼자 정리할 길이라도 트려고.', time: '전날 21:31' },
                { from: 'them', text: '대신… 내 월급에서 조금씩이라도 계속 보냈어. 한 번도 너 놓은 적 없어.', time: '전날 21:32' },
                { from: 'them', text: '미안해. 다가가서 설명하면 너한테 더 짐이 될까 봐. 그게 더 무서웠어.', time: '전날 21:33' },
                { from: 'me', text: '언니…', time: '전날 21:40' },
                // ↓ 회계 장부 걱정 (살인 동기 촉발)
                { from: 'me', text: '근데 언니. 나 큰일 났어. 목사님이 찬조금 장부 보재.', time: '전날 21:45' },
                { from: 'me', text: '나 그 돈… 손 댔어. 빚 막으려고.', time: '전날 21:46' },
                { from: 'them', text: '그러게 왜 그랬어… 그래도 언니가 어떻게든 막아볼게. 너 절대 안 다치게.', time: '전날 22:00' },
                { from: 'them', text: '걱정 마. 언니가 알아서 할게.', time: '전날 22:05' },
                { from: 'me', text: 'ㅜㅜㅜ', time: '전날 22:36' },
              ]
            }
          ]
        },
        {
          id: 'sms',
          type: 'sms',
          name: '메시지',
          chats: [
            {
              name: '대출상담센터',
              messages: [
                { from: 'them', text: '[Web발신] 고객님, 현재 신용등급으로는 추가 대출이 불가합니다.', time: '3일 전' },
                { from: 'them', text: '조건 변경 시 재상담 가능합니다.', time: '3일 전' }
              ]
            }
          ]
        },
        {
          id: 'photos',
          type: 'photos',
          name: '사진',
          photos: [
            { caption: '수련회 한 달 전, 해외여행에서.', image: '/images/phone/isarang_travel.jpg' },
            { caption: '새로 산 고가 화장품과 파우치.', image: '/images/phone/isarang_cosmetics.jpg' }
          ]
        }
      ]
    }
  },
  'SUIX-89': { // 이사랑 방
    title: '빚 독촉장',
    description: '이사랑 가방 안쪽에서 나온 봉투.',
    detail: '본인(이사랑) 명의로 집중된 채무 독촉장. 부모에게서 넘어온 빚으로, 금액은 1억 4천만원이다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이사랑'
  },
  'HKVQ-36': { 
    title: '종현 방 접근 이유',
    description: '점심에 종현 방에 들어간 이유를 진술했다.',
    detail: '점심에 밥 대신 단백질 먹으려고 들어갔다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이사랑'
  },
  'TTNA-35': { // 복도 CCTV
    title: '배회하는 이사랑',
    description: '',
    detail: '오후 1시~1시 40분, 식당·숙소 배회. 핸드폰 자주 확인.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이사랑'
  },
  'BCZN-89': { // 이사랑 다이어리 — 생일 8월 15일(0815) 노출 → 현지 폰 톡서랍 비번
    title: '이사랑의 다이어리',
    description: '이사랑이 며칠에 걸쳐 적어 온 다이어리. 화살표로 페이지를 넘겨 읽어보세요.',
    detail: '',
    image: '/images/이사랑_다이어리.jpg',
    type: '보통',
    person: '이사랑',
    pages: [
      {
        title: '4월 5일',
        content: '또 카드값 알림이 왔다. 이번 달도 빠듯하다.\n\n그래도 예쁜 건 못 참겠다. 새로 나온 쿠션이랑 앰플을 샀다. 언니가 알면 또 한소리 하겠지.'
      },
      {
        title: '4월 12일',
        content: '요즘 통장을 보면 가슴이 답답하다. 메우긴 메워야 하는데 방법이 없다.\n\n언니가 "내가 알아서 할게" 하고 다독여줬다. 세상에 언니랑 나, 둘뿐이니까. 우린 서로밖에 없다.'
      },
      {
        title: '4월 16일',
        content: '오늘 애들이랑 생일 얘기가 나왔다. 내 생일은 8월 15일, 광복절이라 아무도 안 까먹는다 ㅋㅋ\n\n매년 그날엔 언니가 케이크를 사 온다. 올해도 그래주겠지.'
      }
    ]
  },
  'UJVD-65': { 
    title: '성경책',
    description: '',
    detail: '밑줄과 포스트잇이 붙은 성경책. 청년부원이면 누구나 가진 평범한 소지품. ',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이사랑'
  },

  // =============================================
  // 이사랑 (공범) — 특수 단서
  // =============================================
  'RPHG-17': {
    title: '아침 섭취 진술',
    description: '',
    detail: '"아침에 마시겠다고 해서 알아서 타 마시라고 한 적 있다." — 이사랑이 보충제 통에 접근한 선례.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이사랑',
    unlockedBy: []
  },
  'DQAY-71': { // 파우더 성분 감식
    title: '파우더 성분 감식',
    description: '',
    detail: '이사랑 파우치의 흰 가루 = 요힘빈. 라벨 교체 시 접촉한 것으로 해석.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이사랑',
    unlockedBy: []
  },
  'CGRT-19': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이사랑',
    unlockedBy: ['IJRP-82', 'SAQU-86']
  },
  'KKEG-81': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이사랑',
    unlockedBy: ['BCZN-89', 'QNGX-77']
  },
  'MMBH-53': { //
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이사랑',
    unlockedBy: ['NQBT-91', 'ILPN-45']
  },
  'OAUS-95': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이사랑',
    unlockedBy: []
  },

  // =============================================
  // 최종현 (핵심 용의자 · 무고 · 도구로 이용됨) — 보통 단서
  // =============================================
  'VNTD-61': { // 가방
    title: '등산코스 지도',
    description: '숙소 근처에 있는 산의 등산코스 지도.',
    detail: '목사님 선호 코스 표시.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현'
  },
  'NDVA-68': { // 가방
    title: '등산 장갑',
    description: '최종현의 가방에 있는 등산용 장갑.',
    detail: '흰 가루·흙먼지 묻음.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현'
  },
  'HPKM-53': { // 가방 — 쉐이크 통
    title: '쉐이크 통',
    description: '',
    detail: '평소 두 개 (목사님 것까지) 가지고 다니는데 지금은 하나만 있다.',
    image: '/images/깨끗_쉐이크통.png',
    type: '보통',
    person: '최종현'
  },
  'TYQD-94': { // 가방 — 요힘빈 통 (핵심, 라벨 교체됨)
    title: '플라스틱 통 [단백질]',
    description: '종현의 가방 안에서 발견되었다.".',
    detail: '라벨에 "단백질"이라고 적혀있다. 안에 플라스틱 스쿱이 들어있다.',
    image: '/images/protein.jpg',
    type: '보통',
    person: '최종현',
    tapReveal: { taps: 5, text: '라벨지가 통에서 너무 쉽게 떨어져버렸다.', image: '/images/protein_peeled.jpg' }
  },
  'OYJW-26': { // 가방 — 단백질 통 (핵심, 라벨 교체됨)
    title: '플라스틱 통 [요힘빈]',
    description: '종현의 가방 안에서 발견되었다.',
    detail: '라벨에 "요힘빈"이라고 적혀있다. 안에 플라스틱 스쿱이 들어있다.',
    image: '/images/yohimbine.jpg',
    type: '보통',
    person: '최종현',
    tapReveal: { taps: 5, text: '라벨지가 통에서 너무 쉽게 떨어져버렸다.', image: '/images/yohimbine_peeled.jpg' }
  },
  'EDEZ-28': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현'
  },
  'WSIE-85': {
    title: '최종현 핸드폰',
    description: '최종현 핸드폰이다.',
    detail: '카카오톡, 인터넷 검색내용, 사진 등을 확인할 수 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현',
    phone: {
      owner: '최종현의 핸드폰',
      apps: [
        {
          id: 'contacts',
          type: 'contacts',
          name: '연락처',
          contacts: [
            { name: '호치쌤❤', who: '김호치 목사' },
            { name: '사랑이 누나', who: '이사랑' },
            { name: '현지 누나', who: '이현지' },
            { name: '은재 형', who: '윤은재' },
            { name: '희원 쌤', who: '박희원' },
            { name: '가현 누나', who: '이가현' }
          ]
        },
        {
          id: 'browser',
          type: 'browser',
          name: '인터넷',
          searches: [
            {
              query: '요힘빈 부작용',
              title: '요힘빈 부작용 정리',
              snippet: '두근거림, 불안, 혈압 상승 등이 보고됩니다. 평소 복용량을 지키면 대체로 안전하나, 심장질환자는 주의가 필요합니다.'
            }
          ]
        },
        {
          id: 'kakao',
          type: 'kakao',
          name: '카카오톡',
          chats: [
            {
              name: '김호치 목사님',
              messages: [
                { from: 'them', text: '종현아, 이번 청년부 재정 공지 좀 단톡에 올려줄래?', time: '오전 10:12' },
                { from: 'me', text: '네 목사님! 바로 올릴게요', time: '오전 10:15' },
                { from: 'them', text: '항상 고맙다 ㅎㅎ 다음에 또 같이 등산 가자', time: '오전 10:16' },
                { from: 'me', text: '좋아요! 제가 보충제 음료 챙겨갈게요 ㅋㅋ', time: '오전 10:18' }
              ]
            }
          ]
        },
        {
          id: 'photos',
          type: 'photos',
          name: '사진',
          photos: [
            { caption: '배경화면 — 목사님과 등산에서 함께 찍은 사진.', image: '/images/phone/choi_hiking.jpg' }
          ]
        }
      ]
    }
  },
  'TEOX-99': { 
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현'
  },
  'DBHK-86': { //
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현'
  },
  'ASPQ-07': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현'
  },
  'XVNT-80': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현'
  },
  'EPMQ-78': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현'
  },
  'NMFM-21': { 
    title: '옷가지',
    description: '',
    detail: '여벌 옷과 양말. 특이사항 없음. ',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현'
  },

  // =============================================
  // 최종현 — 특수 단서
  // =============================================
  'OICI-93': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '최종현',
    unlockedBy: []
  },
  'OIMO-99': { //
    title: '성경책',
    description: '',
    detail: '밑줄과 포스트잇이 붙은 성경책. 청년부원이면 누구나 가진 평범한 소지품. ',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현',
    unlockedBy: ['OICI-93']
  },
  'YPYZ-13': { //
    title: '파우치',
    description: '',
    detail: '세면 파우치. 칫솔·면도기·선크림 등. ',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현',
    unlockedBy: ['ODDM-57']
  },
  'RMKW-05': { 
    title: '라벨 재부착 흔적 [초히든]',
    description: '목사님께 드린 건 단백질이 아니였다.',
    detail: '두 통 라벨 모서리에 이중 접착 흔적이 보인다. 누군가 교체한 것 같다.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '최종현',
    unlockedBy: ['OICI-93', 'TYQD-94', 'ODDM-57']
  },
  'ODDM-57': { 
    title: '보충제 성분 분석 [중간공개]',
    description: '',
    detail: '목사님께 드린 통의 성분: 요힘빈 고함량 검출, ',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '최종현',
    unlockedBy: []
  },

  // =============================================
  // 이현지 (독립 범행 시도 · 이사랑 언니 · 직접 사인 무관) — 보통 단서
  // =============================================
  'BXNP-29': { // 가방 — 졸피뎀 약통
    title: '졸피뎀 약통',
    description: '강력한 수면제로 알려진 졸피뎀(Zolpidem) 약통. 이현지의 가방에서 발견되었다.',
    detail: '강력 수면제. 처방전 없음. 주변: "수면 장애 처음 듣는다."',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지'
  },
  'BUFL-52': { // 이현지 다이어리 — 생일 3월 2일(0302) 노출 → 사랑 폰 톡서랍 비번
    title: '이현지의 다이어리',
    description: '이현지가 며칠에 걸쳐 적어 온 다이어리. 화살표로 페이지를 넘겨 읽어보세요.',
    detail: '',
    image: '/images/이현지_다이어리.jpg',
    type: '보통',
    person: '이현지',
    pages: [
      {
        title: '3월 2일',
        content: '오늘은 내 생일, 3월 2일.\n\n딱히 챙기는 걸 좋아하진 않지만 사랑이가 미역국을 끓여줬다. 그거면 됐다. 조용한 하루가 제일 편하다.'
      },
      {
        title: '3월 20일',
        content: '회계 장부를 정리하다 한숨이 나왔다. 사랑이는 왜 이렇게 무모할까.\n\n그래도 하나뿐인 내 동생이다. 내가 막아줄 수 있는 데까진 막아야지.'
      },
      {
        title: '4월 14일',
        content: '요즘 마음이 무겁다. 들키면 안 되는 일이 자꾸 늘어난다.\n\n조용히, 티 나지 않게. 늘 그래왔듯이 처리하면 된다.'
      }
    ]
  },
  'HUOX-80': { // 이현지 핸드폰. 톡서랍 비번 = 사랑 생일 0815
    title: '이현지 핸드폰',
    description: '이현지 핸드폰이다.',
    detail: '인터넷 검색, 카카오톡 대화, 사진 등을 확인할 수 있다. 카카오톡에 삭제된 대화가 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지',
    phone: {
      owner: '이현지의 핸드폰',
      apps: [
        {
          id: 'contacts',
          type: 'contacts',
          name: '연락처',
          contacts: [
            { name: '김호치 목사님', who: '김호치 목사' },
            { name: '사랑이❤', who: '이사랑' },
            { name: '최종현 서기', who: '최종현' },
            { name: '윤은재 팀장', who: '윤은재' },
            { name: '박희원 전도사', who: '박희원' },
            { name: '이가현 회장', who: '이가현' }
          ]
        },
        {
          id: 'browser',
          type: 'browser',
          name: '인터넷',
          searches: [
            {
              query: '졸피뎀 물에 잘 녹나요?',
              title: '졸피뎀 용해성',
              snippet: '졸피뎀 정제는 물에 비교적 잘 녹는 편이며, 미세한 흰색 침전이 남을 수 있습니다.'
            },
            {
              query: '부검하면 수면제 검출되나요?',
              title: '부검과 약물 검출',
              snippet: '혈액·위 내용물 분석으로 수면제 성분이 검출될 수 있습니다. 투여량에 따라 검출 농도가 달라집니다.'
            }
          ]
        },
        {
          id: 'kakao',
          type: 'kakao',
          name: '카카오톡',
          recoverPassword: '0815',
          chats: [
            {
              name: '사랑이❤',
              deleted: true,
              messages: [
                { from: 'them', text: '언니… 나 할 말 있어.', time: '전날 21:10' },
                { from: 'them', text: '나 그동안 언니가 상속 포기하고 발 뺀 거… 우리 버린 줄 알았어.', time: '전날 21:11' },
                { from: 'them', text: '근데 통장 정리하다가 봤어. 언니가 내 빚… 몇 년째 갚아온 거.', time: '전날 21:12' },
                { from: 'them', text: '왜 말 안 했어. 나 진짜 언니 원망했는데.', time: '전날 21:12' },
                // ↓ 언니의 장문 고백 (반전의 핵심) — 이사랑 폰에 남아있음
                { from: 'me', text: '…알아버렸구나.', time: '전날 21:30' },
                { from: 'me', text: '엄마 아빠 빚 남기고 가셨을 때, 언니는 이미 내 빚이 있었잖아. 내가 상속받으면 내 채권자들이 그 몫까지 가져갔어. 그럼 너까지 더 깊이 빠졌을 거야.', time: '전날 21:31' },
                { from: 'me', text: '그래서 법적으로만 빠진 거야. 너 혼자 정리할 길이라도 트려고.', time: '전날 21:31' },
                { from: 'me', text: '대신… 내 월급에서 조금씩이라도 계속 보냈어. 한 번도 너 놓은 적 없어.', time: '전날 21:32' },
                { from: 'me', text: '미안해. 다가가서 설명하면 너한테 더 짐이 될까 봐. 그게 더 무서웠어.', time: '전날 21:33' },
                { from: 'them', text: '언니…', time: '전날 21:40' },
                // ↓ 회계 장부 걱정 (살인 동기 촉발)
                { from: 'them', text: '근데 언니. 나 큰일 났어. 목사님이 찬조금 장부 보재.', time: '전날 21:45' },
                { from: 'them', text: '나 그 돈… 손 댔어. 빚 막으려고.', time: '전날 21:46' },
                { from: 'me', text: '그러게 왜 그랬어… 그래도 언니가 어떻게든 막아볼게. 너 절대 안 다치게.', time: '전날 22:00' },
                { from: 'me', text: '걱정 마. 언니가 알아서 할게.', time: '전날 22:05' },
                { from: 'them', text: 'ㅜㅜㅜ', time: '전날 22:36' },
              ]
            }
          ]
        },
        {
          id: 'photos',
          type: 'photos',
          name: '사진',
          photos: [
            { caption: '잠금화면 — 이사랑과 함께 찍은 자매 사진.', image: '/images/phone/sisters.jpg' },
            { caption: '동생 빚 송금 내역서 — 수년치 계좌이체 내역. 발신 "이현지", 동생(이사랑) 명의 대출 상환으로 매달 끊김 없이 송금. 언니가 동생 빚을 몰래 갚아온 증거.', image: '/images/송금내역.jpg' },
            { caption: '법원 상속포기 심판문 사본 — 신청인 "이현지", 부모 사망 직후 날짜. 표면적으로는 "언니가 빚 무서워 발 뺐다"로 읽히지만, 실제는 동생을 지키려는 선택이었다.', image: '/images/상속포기심판문.jpg' }
          ]
        }
      ]
    }
  },
  'ESQN-14': {
    title: '성경책',
    description: '',
    detail: '밑줄과 포스트잇이 붙은 성경책. 청년부원이면 누구나 가진 평범한 소지품. ',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지'
  },
  'IJRP-82': { // 가방 — 회계 장부
    title: '회계 장부',
    description: '뭔가 허술해 보이는 회계 장부.',
    detail: '수기로 기록된 회계 장부이다.',
    image: '/images/회계장부.jpg',
    type: '보통',
    person: '이현지'
  },
  
  'LKUJ-60': {
    title: '옷가지',
    description: '',
    detail: '여벌 옷과 양말. 특이사항 없음. ',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지'
  },
  'SAQU-86': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지'
  },
  'TQMW-03': { // 예배당 CCTV
    title: '배회하는 이현지',
    description: '',
    detail: '오후 예배당 입구·식당 배회. 초조해 보인다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지'
  },
  'BBMD-95': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지'
  },
  'NKCD-95': { // 복도 CCTV (2부) — 손 닦는 이현지 (핵심)
    title: '손 닦는 이현지 (CCTV)',
    description: '',
    detail: '12:35경 이현지가 목사님 방 근처 복도에서 손을 옷에 닦으며 빠르게 이동하는 장면.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지'
  },
  'KPVH-32': { 
    title: '파우치',
    description: '',
    detail: '화장품 파우치. 스킨·로션·쿠션 등 일상 화장품. ',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지'
  },
  'KZPG-76': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지'
  },

  // =============================================
  // 이현지 — 특수 단서
  // =============================================
  'CFBP-50': { 
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이현지',
    unlockedBy: []
  },
  'NVYN-22': {
    title: '목사님 텀블러 성분 감식',
    description: '',
    detail: '졸피뎀 검출.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이현지',
    unlockedBy: ['SAJL-88', 'BBMD-95']
  },
  'EVDJ-35': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이현지',
    unlockedBy: []
  },
  'AKNZ-48': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이현지',
    unlockedBy: []
  },

  // =============================================
  // 박희원 (주범 — 응급약 교체 + 베개 질식) — 보통 단서
  // =============================================
  'UTUW-73': { // 방 — 요일별 약통 (핵심)
    title: '요일별 약통',
    description: '희원의 방에서 발견된 약통이다. 요일별로 나누어져 있다.',
    detail: '월·화·수·목·금·토 칸으로 나뉜 약통. 칸을 열면 비타민C·루테인·오메가3 같은 영양제와 어디서 본적이 있는 알약이 섞여 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },
  'JAJZ-77': { //
    title: '성경책',
    description: '희원의 방에서 발견된 성경책이다.',
    detail: '밑줄과 메모가 빼곡한 성경책.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },
  'VJMU-45': { //
    title: '화장품 파우치',
    description: '희원의 방에서 발견된 화장품 파우치이다.',
    detail: '스킨·로션·선크림 등 여성 화장품. 평범한 세면 용품.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },
  'HTXI-85': { // 방 
    title: '옷가지',
    description: '희원의 가방에서 발견된 옷가지이다.',
    detail: '여벌 셔츠와 양말.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },
  'LUDP-77': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },
  'YJWR-74': { //핸드폰
    title: '박희원 핸드폰',
    description: '박희원의 핸드폰이다.',
    detail: '인터넷 검색과 카카오톡을 확인할 수 있다. 카카오톡에 삭제된 대화가 있는 듯하다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원',
    phone: {
      owner: '박희원의 핸드폰',
      apps: [
        {
          id: 'contacts',
          type: 'contacts',
          name: '연락처',
          contacts: [
            { name: '담임목사님', who: '김호치 목사' },
            { name: '이사랑 총무', who: '이사랑' },
            { name: '이현지 회계', who: '이현지' },
            { name: '최종현 서기', who: '최종현' },
            { name: '윤은재 팀장', who: '윤은재' },
            { name: '이가현 회장', who: '이가현' }
          ]
        },
        {
          id: 'browser',
          type: 'browser',
          name: '인터넷',
          searches: [
            {
              query: '협심증 발작 자세',
              title: '협심증 발작 시 올바른 자세',
              snippet: '발작 시에는 상체를 약간 세워 안정을 취해야 하며, 완전히 눕는 자세는 위험합니다.'
            },
            {
              query: '질식 흔적 부검 감별',
              title: '질식사 부검 소견',
              snippet: '안면·결막 점출혈, 코·입 주변 압박흔 등으로 질식 여부를 감별합니다.'
            },
            {
              query: '비타민C 알약 외형',
              title: '비타민C 정제 외형',
              snippet: '흰색 원형 정제가 일반적이며, 표면에 별도의 각인이 없는 제품이 많습니다.'
            }
          ]
        },
        {
          id: 'kakao',
          type: 'kakao',
          name: '카카오톡',
          chats: [
            {
              // 사건 전날 자격 면담 직후 — 압박과 어색해진 관계가 드러난다
              name: '담임목사님',
              messages: [
                { from: 'them', text: '박 전도사, 오늘 면담은 사적인 감정으로 한 게 아니에요.', time: '전날 14:30' },
                { from: 'them', text: '수료증 발급 번호가 교단 DB와 맞지 않더군요. 수련회 끝나면 교단에 직접 확인 절차를 밟겠습니다.', time: '전날 14:31' },
                { from: 'me', text: '목사님, 제가 그동안 얼마나 충성스럽게 사역했는지 아시잖아요.', time: '전날 14:40' },
                { from: 'me', text: '한 번만 눈감아 주실 수는 없으신가요...', time: '전날 14:41' },
                { from: 'them', text: '자격은 자격입니다. 원칙대로 처리하는 게 모두를 위한 길이에요.', time: '전날 15:02' },
                { from: 'them', text: '수련회 잘 마칩시다.', time: '전날 15:02' }
              ]
            },
            {
              // 톡서랍 복구로 드러나는 핵심 단서 — 위조 정황(동기) + 사건 당일 행적
              name: '○○ (자격 안내)',
              deleted: true,
              messages: [
                { from: 'me', text: '저번에 그 수료증 건요... 교단에서 발급번호 조회하면 바로 드러나나요?', time: '3일 전' },
                { from: 'them', text: '번호 안 맞으면 조회하는 즉시 걸립니다. 갑자기 왜요?', time: '3일 전' },
                { from: 'me', text: '아니에요. 그냥 확인차요.', time: '3일 전' },
                { from: 'me', text: '...만약 조회 전에 일이 정리되면, 굳이 들출 사람은 없겠죠?', time: '3일 전' },
                { from: 'them', text: '그게 무슨 말이에요?', time: '3일 전' },
                { from: 'me', text: '아무것도요. 신경 쓰지 마세요.', time: '이틀 전', deleted: true }
              ]
            }
          ]
        }
      ]
    }
  },
  'LGYR-78': { // 복도 CCTV
    title: '복도 배회 목격',
    description: '',
    detail: '오후에 목사님 방 복도에 배회하고 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },
  'MZKW-75': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },
  'NPEP-67': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },
  'XPYZ-94': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },
  'QBPB-43': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },

  // =============================================
  // 박희원 — 특수 단서
  // =============================================
  'JXCA-09': { //
    title: '알약 대조',
    description: '',
    detail: '박희원 요일별 약통의 약과 목사님 설화정 통에 있는 약의 모양이 일치한다.',
    image: '',
    type: '특수',
    person: '박희원',
    unlockedBy: ['UTUW-73', 'MEXF-73', 'IWND-38']
  },
  'UWIB-79': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '박희원',
    unlockedBy: ['YJWR-74']
  },
  'DHJX-82': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '박희원',
    unlockedBy: []
  },
  'IAXK-55': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '박희원',
    unlockedBy: []
  },
  'JYYL-62': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '박희원',
    unlockedBy: []
  },
  'QXVW-79': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '박희원',
    unlockedBy: []
  },

  // =============================================
  // 윤은재 (감정 동기 의혹 · 무고 · 발작 촉진 가능성만) — 보통 단서
  // =============================================
  'BXCI-79': { // 다른 용의자가 말해줌
    title: '언쟁 목격 진술',
    description: '',
    detail: '목사 방에서 큰 소리, 문 쾅 닫힘. 윤은재가 나오는 것 목격.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재'
  },
  'IOVT-95': { //
    title: '은재의 손목 든 멍',
    description: '',
    detail: '은재의 손목에 푸르게 멍이 들었다. 얼핏 보면 손 모양인 것 같다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재'
  },
  'VUDC-50': { // 방
    title: '거부 도장이 찍힌 제안서',
    description: '',
    detail: '고가의 마이크와 음향 장비를 구입하자는 제안서. 목사님이 거부 도장을 찍었다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재'
  },
  'UHRU-61': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재'
  },
  'GRVG-56': {// ( 2부 해금 )
    title: '윤은재 핸드폰',
    description: '',
    detail: '검색기록과 카톡을 확인할 수 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재',
    phone: {
      owner: '윤은재의 핸드폰',
      apps: [
        {
          id: 'contacts',
          type: 'contacts',
          name: '연락처',
          contacts: [
            { name: '목사님(찬양곡;;)', who: '김호치 목사' },
            { name: '종현이', who: '최종현' },
            { name: '사랑이', who: '이사랑' },
            { name: '현지', who: '이현지' },
            { name: '희원 쌤', who: '박희원' },
            { name: '가현 누나', who: '이가현' }
          ]
        },
        {
          id: 'browser',
          type: 'browser',
          name: '인터넷',
          searches: [
            {
              query: '요힘빈 심장 위험',
              title: '요힘빈과 심장 건강',
              snippet: '요힘빈은 심박수와 혈압을 높여 심장에 부담을 줄 수 있습니다. 심장질환이 있는 경우 복용을 피해야 합니다.'
            }
          ]
        },
        {
          id: 'kakao',
          type: 'kakao',
          name: '카카오톡',
          chats: [
            {
              name: '막내 종현',
              messages: [
                { from: 'me', text: '종현아 요즘 요힘빈 보충제 먹으려는데 어때?', time: '오후 1:30' },
                { from: 'them', text: '심장 안 좋으면 위험하대여, 형 심장 관련 병 없어요?', time: '오후 1:31' },
                { from: 'me', text: '나는 괜찮지. 넌 괜찮아?', time: '오후 1:34' },
                { from: 'them', text: '아 저는 멀쩡해요 ㅋㅋㅋ 감사합니다~!', time: '오후 1:35' }
              ]
            },
            {
              name: '친구 (동기)',
              messages: [
                { from: 'me', text: '목사님이랑 또 부딪혔어. 찬양곡 건으로.', time: '어제' },
                { from: 'them', text: '또? 너 진짜 고생 많다 ㅠㅠ', time: '어제' },
                { from: 'me', text: '이번엔 진짜 절대 못 참아.', time: '어제' }
              ]
            }
          ]
        }
      ]
    }
  },
  'GYPV-39': { // 수중 — 운동화 흙
    title: '운동화 흙',
    description: '',
    detail: '당일 산 입구까지 간 황토 흙.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재'
  },
  'LWFJ-99': { // 방 — 라벨 없는 약봉투
    title: '약봉투',
    description: '약국에서 처방받은 약 봉투이다. 약만 보고 어떤 약인지 모르겠다.',
    detail: '텔미사르탄 (Telmisartan), 발사르탄 (Valsartan) ,트윈스타, 엑스포지, 카르베디롤 등이 적혀 있다.',
    image: '/images/처방약.png',
    type: '보통',
    person: '윤은재'
  },
  'MZVN-14': { 
    title: '성경책',
    description: '',
    detail: '밑줄과 포스트잇이 붙은 성경책. 청년부원이면 누구나 가진 평범한 소지품. ',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재'
  },
  'HWGJ-12': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재'
  },
  'JSYT-91': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재'
  },

  // =============================================
  // 윤은재 — 특수 단서
  // =============================================
  'AQFE-59': { // 약봉투 처방전 확인 (AZVU-48 추궁)
    title: '약봉투 처방전 확인',
    description: '',
    detail: '부모님 고혈압약 처방전.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '윤은재',
    unlockedBy: ['LWFJ-99']
  },
  'PMIK-13': { 
    title: '파우치',
    description: '',
    detail: '세면 파우치. 칫솔·면도기·선크림 등. ',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재',
    unlockedBy: []
  },
  'YKBP-76': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '윤은재',
    unlockedBy: []
  },
  'ALLZ-85': {
    title: '옷가지',
    description: '',
    detail: '여벌 옷과 양말. 특이사항 없음. ',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재',
    unlockedBy: ['VUDC-50', 'BXCI-79']
  },
  'NZLL-84': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '윤은재',
    unlockedBy: []
  },
  'ITIE-02': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '윤은재',
    unlockedBy: []
  },

  // =============================================
  // 이가현 (증거 인멸 · 신고 10분 지연) — 보통 단서
  // =============================================
  'NBZL-83': { // 지갑 — 클릭해서 내용물 확인 (딸 사진 포함)
    title: '가현의 지갑',
    description: '',
    detail: '지갑 속 항목을 눌러 내용물을 확인할 수 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현',
    wallet: {
      owner: '가현의 지갑',
      items: [
        { label: '아이 사진', icon: '🧒', image: '/images/phone/daughter.jpg', detail: '귀여운 5살 여자아이 사진. 가현은 "조카"라고 한다. 청년들: "너무 닮았다."' },
        { label: '신분증', icon: '🪪', detail: '이가현. 주민등록증.' },
        { label: '체크카드', icon: '💳', detail: '○○은행 체크카드 1장.' },
        { label: '약혼반지 영수증', icon: '🧾', detail: '약혼반지 결제 영수증. 약혼자 "김멋짐". 최근 날짜.' }
      ]
    }
  },
  'WORR-03': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현'
  },
  'LWNR-86': { //
    title: '아이가 그린 그림 편지',
    description: '',
    detail: '가현의 소지품에서 나온 5살 아이의 그림 편지. 삐뚤빼뚤한 글씨로 "엄마 사랑해"라고 적혀 있다. "조카"라기엔 호칭이 이상하다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현'
  },
  'AYMX-96': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현'
  },
  'TCGA-87': {
    title: '이가현 핸드폰',
    description: '',
    detail: '인터넷 검색, 카카오톡 대화, 사진 등을 확인할 수 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현',
    phone: {
      owner: '이가현의 핸드폰',
      apps: [
        {
          id: 'contacts',
          type: 'contacts',
          name: '연락처',
          contacts: [
            { name: '김호치 목사', who: '김호치 목사' },
            { name: '멋짐❤', who: '약혼자 김멋짐' },
            { name: '사랑 총무', who: '이사랑' },
            { name: '현지 회계', who: '이현지' },
            { name: '종현이', who: '최종현' },
            { name: '은재', who: '윤은재' },
            { name: '희원 전도사', who: '박희원' }
          ]
        },
        {
          id: 'browser',
          type: 'browser',
          name: '인터넷',
          searches: [
            {
              query: '삭제된 카톡 복구 불가',
              title: '삭제된 카카오톡 복구',
              snippet: '서버에 백업이 없으면 삭제된 대화는 복구가 어렵습니다. 상대방 기기에 기록이 남을 수 있습니다.'
            },
            {
              query: '변사 목격자 신고 의무',
              title: '변사체 발견 시 신고 의무',
              snippet: '변사체를 발견한 사람은 지체 없이 신고해야 하며, 신고 지연 시 책임을 물을 수 있습니다.'
            }
          ]
        },
        {
          id: 'kakao',
          type: 'kakao',
          name: '카카오톡',
          chats: [
            {
              name: '김멋짐',
              messages: [
                { from: 'them', text: '가현아, 우리... 더는 안 될 것 같아.', time: '이틀 전' },
                { from: 'me', text: '갑자기 무슨 소리야', time: '이틀 전' },
                { from: 'them', text: '애기 얘기, 왜 나한테 말 안 했어. 다 들었어.', time: '이틀 전' },
                { from: 'me', text: '그건... 내가 설명할게. 제발.', time: '이틀 전' },
                { from: 'them', text: '미안해. 그만하자.', time: '이틀 전' }
              ]
            },
            {
              name: '김호치 목사님',
              messages: [
                { from: 'me', text: '당신 때문에 이렇게 됐잖아요!', time: '이틀 전' },
                { from: 'me', text: '대체 무슨 권리로 멋짐이한테 그런 얘길 해요?', time: '이틀 전' },
                { from: 'me', text: '책임지세요. 제 인생 다 망가졌어요.', time: '이틀 전' }
              ]
            }
          ]
        },
        {
          id: 'photos',
          type: 'photos',
          name: '사진',
          photos: [
            { caption: '딸과 함께 찍은 사진.', image: '/images/phone/daughter.jpg', deleted: true },
            { caption: '최근 삭제된 항목', deleted: true },
            { caption: '최근 삭제된 항목', deleted: true }
          ]
        }
      ]
    }
  },
  'ZNUS-26': { // 
    title: '옷가지',
    description: '',
    detail: '여벌 옷과 양말. 특이사항 없음. ',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현'
  },
  'YZET-89': { // 공용 게시 — 시신 발견 경위
    title: '시신 발견 경위',
    description: '',
    detail: '"예배당 쪽에 볼 일이 있어서 갔다가 소리가 이상해 들어갔어요. 이미 쓰러져 계셨어요." ',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현'
  },
  'DVCS-80': { // CCTV — 신고 지연
    title: '신고 지연 — 시간 공백',
    description: '',
    detail: '목사 방 내부는 안 보이지만 근처를 찍는 CCTV에 가현이 방에 들어간 시각이 찍혔다. 그 시각과 신고 시각의 차이가 너무 커서 의심을 받는다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현'
  },
  'TNNK-17': { // 다른 용의자가 진술
    title: '목사와 냉각된 관계',
    description: '',
    detail: '수련회날부터 목사님과 눈도 안 마주 친다고 한다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현'
  },
  'LCPE-70': {
    title: '아이 예방접종 수첩',
    description: '',
    detail: '가현의 가방에서 나온 5세 아이의 예방접종 수첩. 보호자 란에 "이가현"이 적혀 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현'
  },

  // =============================================
  // 이가현 — 특수 단서
  // =============================================
  'WVBG-31': { //
    title: '어린이집 비상연락망',
    description: '',
    detail: '아이가 다니는 어린이집의 비상연락망 사본. "주 보호자 — 이가현(엄마)"로 기재되어 있다. 조카가 아니라 친자임을 가리킨다.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이가현',
    unlockedBy: ['NBZL-83', 'LCPE-70']
  },
  'KMRV-41': { 
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이가현',
    unlockedBy: []
  },
  'QMCH-44': { 
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이가현',
    unlockedBy: ['DVCS-80', 'TCGA-87']
  },
  'DZPL-78': {
    title: '성경책',
    description: '',
    detail: '밑줄과 포스트잇이 붙은 성경책. 청년부원이면 누구나 가진 평범한 소지품. ',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현',
    unlockedBy: ['TCGA-87', 'DVCS-80']
  },
  'KTGF-02': { 
    title: '파우치',
    description: '',
    detail: '화장품 파우치. 스킨·로션·쿠션 등 일상 화장품. ',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현',
    unlockedBy: ['LCPE-70', 'LWNR-86']
  },
  'RSMR-72': {
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이가현',
    unlockedBy: ['NBZL-83', 'LCPE-70']
  }
};

// 피해자
export const victim = {
  id: 'victim',
  name: '김호치 목사',
  age: 58,
  gender: '남성',
  occupation: '샛별이슬 교회 청년부 담임 목사',
  image: '/images/people/victim.jpg', // 사진 파일을 이 경로에 넣으면 표시됩니다 (없으면 이름 첫 글자로 대체)
  family: '아내와 함께 거주, 장성한 자녀 둘은 분가했습니다.',
  hint: '피해자는 청년부를 이끄는 영향력 있는 목사님이었습니다.',
  detail: '청년부를 오래 이끌어 온 원칙주의자 목사님. 재정과 사역 자격 문제에 엄격해, 수련회를 앞두고 여러 임원과 개인 면담을 가졌습니다. 협심증 병력이 있었으며, 수련회 당일 개인 방에서 사망한 채 발견되었습니다.'
};

// 용의자들
export const suspects = [
  {
    id: 'S1',
    name: '최종현',
    age: 23,
    gender: '남성',
    occupation: '샛별이슬 청년부 서기',
    image: '/images/people/s1.png',
    family: '부모님 함께 살며 누나 한 명이 있다.',
    notes: '청년부 막내. 싹싹하고 밝은 분위기 메이커입니다. 피해자 목사님과 가장 친밀해 자주 함께 등산했고, 보충제 음료도 직접 챙겨 드리곤 했습니다.',
  },
  {
    id: 'S2',
    name: '윤은재',
    age: 24,
    gender: '남성',
    occupation: '샛별이슬 청년부 찬양팀 팀장',
    image: '/images/people/s2.png',
    family: '부모님과 함께 거주하며 외동아들이다.',
    notes: '솔직하고 다혈질인 찬양팀 팀장. 목사님과 찬양곡 선정 문제로 몇 달째 부딪혔고, 수련회 당일에도 목사님 방에서 언성을 높이며 크게 다투고 나왔다는 목격담이 있습니다.'
  },
  {
    id: 'S3',
    name: '이현지',
    age: 26,
    gender: '여성',
    occupation: '샛별이슬 청년부 회계',
    image: '/images/people/s3.png',
    family: '',
    notes: '말수가 적고 꼼꼼한 회계 담당. 좀처럼 속을 드러내지 않습니다. 총무 이사랑과 유독 가깝게 지내며, 목사님과의 특별한 마찰은 알려진 바 없습니다.'
  },
  {
    id: 'S4',
    name: '박희원',
    age: 28,
    gender: '여성',
    occupation: '샛별이슬 청년부 전도사',
    image: '/images/people/s4.png',
    family: '부모님과 남동생, 여동생이 있다.',
    notes: '차분하고 모범적인 전도사. 평소 목사님을 깍듯이 따랐지만, 수련회 날을 기점으로 목사님을 대하는 태도가 눈에 띄게 어색해졌다고 합니다.'
  },
  {
    id: 'S5',
    name: '이사랑',
    age: 25,
    gender: '여성',
    occupation: '샛별이슬 청년부 총무',
    image: '/images/people/s5.png',
    family: '',
    notes: '사교적이고 씀씀이가 큰 총무. 행사·총무 업무를 도맡습니다. 수련회 날을 기점으로 목사님과 마주치기를 피하며 어색해하는 모습이 보였습니다.'
  },
  {
    id: 'S6',
    name: '이가현',
    age: 25,
    gender: '여성',
    occupation: '샛별이슬 청년부 회장',
    image: '/images/people/s6.png',
    family: '미혼으로, 부모님과는 왕래가 드뭅니다.',
    notes: '책임감 강하고 리더십 있는 청년부 회장. 그러나 수련회 날을 기점으로 목사님과 눈도 마주치지 않을 만큼 사이가 어색해졌습니다.'
  }
];
