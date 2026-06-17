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
  // 공용 / 피해자(목사) 단서 — 부검·현장·목사 유품
  // ※ 화면에서 '목사(피해자)' 전용 탭에 표시
  // =============================================
  'BGSU-22': { // 부검 1차 소견 (중간 점검 공개)
    title: '부검 1차 소견 [중간공개]',
    description: '',
    detail: '심정지 사망. 혈중 요힘빈 고농도 검출. 협심증 발작 흔적 확인. 단, 코·입 주변에 미세 압박흔이 있어 정밀 감식 중.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '목사',
    unlockedBy: []
  },
  'JSIK-99': { // 부검 확정 — 질식사 (2부 중반 투하)
    title: '부검 확정 — 질식사 [2부 투하]',
    description: '',
    detail: '정밀 감식 결과: 사인은 질식. 코·입 주변 압박흔과 안면 점출혈 확인. 심장 발작은 사망의 직접 원인이 아님.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '목사',
    unlockedBy: []
  },
  'SHOE-67': { // 현장 공용 단서 — 박희원·이가현 동시 지목
    title: '방 안 신발 자국 2종',
    description: '',
    detail: '목사님 방 바닥에 서로 다른 두 신발 자국. 하나는 남성 사이즈(박희원 추정), 하나는 여성 사이즈(이가현 추정). 두 사람이 각각 방에 들어갔음을 동시에 가리키는 공용 현장 단서.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '목사'
  },
  'PKTK-01': { // 목사 핸드폰 — 박희원 자격 의심 (지문 인식, 현장에서 풀린 상태)
    title: '목사님 핸드폰 — 지인 목사 카톡',
    description: '지문 인식 잠금이 풀린 채 발견된 목사님의 핸드폰.',
    detail: '지인 목사가 보낸 카톡: "그 전도사(박희원) 자격이 좀 의심스럽다, 확인해 봤냐". 목사가 박희원의 전도사 자격을 의심하게 된 경위 — 박희원의 살해 동기로 연결.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '목사',
    phone: {
      owner: '김호치 목사님의 핸드폰',
      apps: [
        {
          id: 'kakao',
          type: 'kakao',
          name: '카카오톡',
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
              name: '김멋짐',
              messages: [
                { from: 'me', text: '멋짐 형제, 가현이 말인데... 좀 걱정이 돼서요.', time: '4일 전' },
                { from: 'me', text: '가현이가 애도 있고, 곧 결혼도 한다더라고요. 알고는 있나 해서.', time: '4일 전' },
                { from: 'them', text: '...네? 그게 무슨 말씀이세요.', time: '4일 전' }
              ]
            },
            {
              name: '이가현 회장',
              messages: [
                { from: 'them', text: '당신 때문에 이렇게 됐잖아요!', time: '이틀 전' },
                { from: 'them', text: '대체 무슨 권리로 멋짐이한테 그런 얘길 해요?', time: '이틀 전' }
              ]
            }
          ]
        },
        {
          id: 'photos',
          type: 'photos',
          name: '사진',
          photos: [
            { caption: '청년부 통장 사진 — 찬조금 입금 내역이 없음.' },
            { caption: '최근 삭제된 항목', deleted: true }
          ]
        }
      ]
    }
  },
  'DOOR-05': { // 목사님 방 위치·구조
    title: '목사님 방 위치·구조',
    description: '',
    detail: '방 문에 작은 유리창. 방 내부엔 CCTV 없음. 단, 방 바깥 복도·근처는 CCTV가 촬영 중 — 누가 몇 시에 들어갔는지는 알 수 있음.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '목사'
  },

  // =============================================
  // 이사랑 (공범 — 요힘빈 라벨 교체) — 보통 단서
  // =============================================
  'YUQO-48': { // 복도 CCTV (중간 공개)
    title: 'CCTV 화면 캡처',
    description: '복도 쪽 CCTV 화면이다.',
    detail: '12:20경 이사랑이 최종현 방 방향으로 이동. 약 1분 20초 후 복귀. 손에 무언가 들고 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이사랑'
  },
  'SESE-63': { // 공용 게시판 — 회계 장부 사본
    title: '청년부 회계 장부',
    description: '',
    detail: '"찬조금 기타" 200만원 지출. 영수증 없음. 이사랑 총무 직인.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이사랑'
  },
  'MPAH-32': { // 이사랑 가방 — 핵심 물증
    title: '파우치',
    description: '화장품 파우치. 안에 금속 스패출러, 속눈썹 풀, 스킨, 앰플, 쿠션 등이 있다.',
    detail: '스패출러와 파우치 안쪽에 흰 가루가 묻어있음 (요힘빈 파우더와 동일 성분 — 감식 연계).',
    image: '/images/이사랑_파우치.jpg',
    type: '보통',
    person: '이사랑'
  },
  'YBBU-45': { // 예배당 일정표 (이름 명시 → 자동 귀속)
    title: '전날 면담 기록',
    description: '',
    detail: '목사 일정표: "재정 관련 면담 — 이사랑 총무 (15분)".',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이사랑'
  },
  'PECG-06': { // 이사랑 수중 핸드폰 (2부 해금)
    title: '핸드폰',
    description: '',
    detail: '검색 기록·카카오톡. 직접 열어달라고 해야 함.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이사랑'
  },
  'PQSH-34': { // 이사랑 열린 핸드폰 (PECG-06 해금 후)
    title: '열린 핸드폰',
    description: '',
    detail: '검색: "요힘빈 심장 부작용", "협심증 환자 요힘빈 위험", "요힘빈 효과 발현 시간".',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이사랑',
    phone: {
      owner: '이사랑의 핸드폰',
      apps: [
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
          chats: [
            {
              name: '김호치 목사님',
              messages: [
                { from: 'them', text: '이사랑 총무님, 내일 재정 관련해서 잠깐 면담 가능할까요?', time: '오후 2:14' },
                { from: 'me', text: '네 목사님, 시간 괜찮습니다.', time: '오후 2:20' },
                { from: 'them', text: '기타 항목 지출이 200만원인데 영수증이 없어서요. 챙겨와 주세요.', time: '오후 2:21' },
                { from: 'me', text: '...네, 알겠습니다.', time: '오후 2:45' }
              ]
            },
            {
              name: '현지 언니',
              messages: [
                { from: 'them', text: '목사님이 또 장부 얘기 하셨어?', time: '오전 11:02' },
                { from: 'me', text: '응... 영수증 가져오라고 하셔', time: '오전 11:03' },
                { from: 'them', deleted: true },
                { from: 'me', deleted: true },
                { from: 'them', text: '내가 알아서 정리할게. 걱정 마.', time: '오전 11:20' }
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
            { caption: '수련회 한 달 전, 해외여행에서.' },
            { caption: '새로 산 고가 화장품과 파우치.' }
          ]
        }
      ]
    }
  },
  'PGSD-57': { // 이사랑 방 — 노이즈
    title: '고가 화장품',
    description: '',
    detail: '급여 대비 고가 화장품. 빼돌린 자금 사용 추정. (노이즈)',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이사랑'
  },
  'CASI-77': { // [예약] 내용은 이사랑 핸드폰(PQSH-34)의 사진 앱에 흡수됨. 코드는 추후 사용 위해 보존.
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이사랑'
  },
  'VHBT-17': { // 복도 CCTV (2부)
    title: '배회하는 이사랑',
    description: '',
    detail: '오후 1시~1시 40분 식당·숙소 배회. 핸드폰 자주 확인.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이사랑'
  },
  'ZTHB-21': { // 이사랑 가방 — 잠긴 다이어리
    title: '이사랑의 다이어리',
    description: '',
    detail: '미니 자물쇠로 잠겨있다. 종이가 틈으로 삐져나와 있다. 열어달라고 해야겠다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이사랑'
  },
  'DEBT-61': { // [예약] 내용은 이사랑 핸드폰(PQSH-34)의 메시지 앱에 흡수됨. 코드는 추후 사용 위해 보존.
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이사랑'
  },

  // =============================================
  // 이사랑 (공범) — 특수 단서
  // =============================================
  'EKQZ-25': { // 진술 — 최종현에게 질문 시
    title: '아침 섭취 진술',
    description: '',
    detail: '"아침에 마시겠다고 해서 와서 알아서 타 마시라고 한 적 있다." — 이사랑이 보충제 통에 접근한 선례.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이사랑',
    unlockedBy: []
  },
  'MFRQ-48': { // 파우더 성분 감식 (중간 공개)
    title: '파우더 성분 감식 [중간공개]',
    description: '',
    detail: '이사랑 파우치의 흰 가루 = 요힘빈. 라벨 교체 시 접촉한 것으로 해석.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이사랑',
    unlockedBy: ['MPAH-32', 'PQSH-34']
  },
  'LOVN-56': { // 통장-회계 불일치 (핵심)
    title: '통장-회계 불일치',
    description: '',
    detail: '청년부 통장에는 찬조금 입금 내역이 없는데, 이사랑 회계 기록에만 찬조금이 적혀 있음. 빼돌림이 드러나는 결정적 단서. (CLFL-13은 이현지 소지)',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이사랑',
    unlockedBy: ['GFFZ-13', 'CLFL-13']
  },
  'WJIE-77': { // 열린 다이어리
    title: '열린 다이어리',
    description: '이사랑의 다이어리 한 페이지에 적힌 암호 같은 메모.',
    detail: '당일 날짜에 두 개의 원이 화살표로 연결된 그림. 라벨 교체 계획 기록으로 해석 가능.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이사랑',
    unlockedBy: ['ZTHB-21', 'YBBU-45']
  },
  'IRPH-46': { // [확인 필요 — v17 단서, v20 미등장. 코드 보존]
    title: '회계 영수증 무더기',
    description: '',
    detail: '약 200만원 어치 영수증이다. 장부 "기타" 항목과 일치.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이사랑',
    unlockedBy: ['YUQO-48', 'SESE-63']
  },
  'JDNI-38': { // [확인 필요 — v17 단서, v20 미등장. 코드 보존]
    title: '면담 내용 상세',
    description: '',
    detail: '면담 후에 불안한 표정으로 나왔다.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이사랑',
    unlockedBy: []
  },

  // =============================================
  // 최종현 (핵심 용의자 · 무고 · 도구로 이용됨) — 보통 단서
  // =============================================
  'DBVZ-30': { // 가방 — 노이즈
    title: '등산코스 지도',
    description: '숙소 근처에 있는 산의 등산코스 지도.',
    detail: '목사님 선호 코스 표시. (노이즈)',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현'
  },
  'WZOI-51': { // 가방 — 노이즈
    title: '등산 장갑',
    description: '최종현의 가방에 있는 등산용 장갑.',
    detail: '흰 가루·흙먼지 묻음. (노이즈)',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현'
  },
  'TPNJ-25': { // 가방 — 쉐이크 통
    title: '쉐이크 통',
    description: '',
    detail: '평소 두 개(목사님 것까지) 가지고 다니는데 지금은 하나만 있다. 흰 가루 묻음.',
    image: '/images/쉐이크통.png',
    type: '보통',
    person: '최종현'
  },
  'QZXY-18': { // 가방 — 요힘빈 통 (핵심, 라벨 교체됨)
    title: '요힘빈 보충제 통',
    description: '현재 라벨: "단백질(WPI)".',
    detail: '실제 내용물: 요힘빈 고함량. 라벨 교체됨.',
    image: 'public/images/요힘빈.jpg',
    type: '보통',
    person: '최종현'
  },
  'JZLM-98': { // 가방 — 단백질 통 (핵심, 라벨 교체됨)
    title: '단백질 통',
    description: '현재 라벨: "요힘빈 다이어트".',
    detail: '실제 내용물: 단백질(WPI). 라벨 교체됨. 안에 플라스틱 스쿱이 들어있다.',
    image: 'public/images/단백질.jpg',
    type: '보통',
    person: '최종현'
  },
  'VGIG-44': { // 방 — 핸드폰 (2부 해금)
    title: '핸드폰',
    description: '배경 사진이 최종현과 피해자 목사가 함께 찍은 사진인 스마트폰.',
    detail: '카카오톡·통화 기록 있음. 열어달라고 해야겠다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현'
  },
  'KBUT-19': { // 열린 핸드폰
    title: '열린 핸드폰',
    description: '카카오톡, 최근 검색 기록을 열람할 수 있다.',
    detail: '카카오톡: 목사님과 청년부 재정 공지 대화. 검색: "요힘빈 부작용" — 본인 복용 약 확인 목적.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현',
    phone: {
      owner: '최종현의 핸드폰',
      apps: [
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
            { caption: '배경화면 — 목사님과 등산에서 함께 찍은 사진.' }
          ]
        }
      ]
    }
  },
  'AOYY-73': { // 다른 용의자 수중 — 불안한 최종현
    title: '불안한 최종현',
    description: '',
    detail: '오후 내내 극도의 불안 상태. 이현지에게 일정 위임.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현'
  },
  'WNEP-79': { // 공용 게시판 — 음료 전달 목격 (이름 명시)
    title: '음료 전달 목격',
    description: '',
    detail: '"종현이 방 앞에서 뭔가 타서 목사님한테 드리는 거 봤어요."',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현'
  },
  'LQKZ-03': { // 최종현 수중 — 요힘빈 위험성 (적극 설명)
    title: '요힘빈 위험성',
    description: '',
    detail: '협심증 환자에게 복용 후 20~40분 내 심장 발작 유발 가능. 발작 시에는 반드시 상체를 세워 안정해야 하며, 완전히 누우면 위험하다. (최종현이 적극 설명)',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현'
  },
  'CUPR-40': { // 현장(목사 방, 2부) — 음료 컵 잔여물 (핵심)
    title: '음료 컵 잔여물',
    description: '',
    detail: '목사님이 마신 음료 컵. 바닥에 흰 가루 잔여물. 성분 감식 시 요힘빈 검출 — 최종현이 직접 탄 그 음료임을 입증.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현'
  },
  'FNGP-52': { // 현장(목사 방) — 컵의 최종현 지문 (감식 자동 귀속)
    title: '컵의 최종현 지문',
    description: '',
    detail: '음료 컵에서 최종현 지문 검출. 최종현이 음료를 직접 전달했음을 물증으로 확정. (단, 라벨 교체는 최종현 소행 아님)',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현'
  },
  'SCUP-63': { // 최종현 가방 — 여분 스쿱
    title: '여분 스쿱',
    description: '',
    detail: '보충제 통에 들어있어야 할 작은 스쿱이 가방 바닥에 따로 떨어져 있음. 두 통의 스쿱 크기 비교 단서로 연결.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '최종현'
  },

  // =============================================
  // 최종현 — 특수 단서
  // =============================================
  'SHFK-09': { // 두 보충제 통 → 자동 해금
    title: '똑같은 스쿱 크기',
    description: '단백질 통과 요힘빈 통의 스쿱 크기가 같다.',
    detail: '두 통 스쿱 크기 동일. 1스쿱 용량이 다른데 왜 같은 크기의 스쿱이 들어가 있는지 의문이다.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '최종현',
    unlockedBy: ['QZXY-18', 'JZLM-98']
  },
  'TWSI-17': { // 진술 — SHFK-09 질문 시
    title: '최종현 진술 — 스쿱',
    description: '"요힘빈 통에 작은 스쿱 있었을 거예요. 주로 단백질 스쿱 써요."',
    detail: '"요힘빈 통에 작은 스쿱 있었을 거예요. 주로 단백질 스쿱 써요."',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '최종현',
    unlockedBy: ['SHFK-09']
  },
  'OXTC-68': { // 진술 — 성분분석 후 질문
    title: '최종현 진술 — 전달 당시',
    description: '',
    detail: '"라벨에 단백질이라고 적혀있어서... 그냥 드렸어요." (말 잘 못 이음)',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '최종현',
    unlockedBy: ['MMSY-80']
  },
  'TMYO-78': { // 초히든 — 라벨 재부착 흔적
    title: '라벨 재부착 흔적 [초히든]',
    description: '',
    detail: '두 통 라벨 모서리에 이중 접착 흔적. 누군가 교체했을 가능성.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '최종현',
    unlockedBy: ['SHFK-09', 'QZXY-18']
  },
  'MMSY-80': { // 보충제 성분 분석 (중간 공개)
    title: '보충제 성분 분석 [중간공개]',
    description: '',
    detail: '음료 통 성분: 요힘빈 고함량 검출. 단백질 성분 없음. 라벨과 내용물 불일치.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '최종현',
    unlockedBy: []
  },

  // =============================================
  // 이현지 (독립 범행 시도 · 이사랑 언니 · 직접 사인 무관) — 보통 단서
  // =============================================
  'ELML-43': { // 가방 — 졸피뎀 약통
    title: '졸피뎀 약통',
    description: '강력한 수면제로 알려진 졸피뎀(Zolpidem) 약통. 이현지의 가방에서 발견되었다.',
    detail: '강력 수면제. 처방전 없음. 주변: "수면 장애 처음 듣는다."',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지'
  },
  'VXDA-53': { // 방 — 핸드폰 (2부 해금)
    title: '핸드폰',
    description: '잠금화면: 이사랑과 찍은 자매 사진.',
    detail: '잠긴 카카오톡, 통화 기록, 최근 검색 기록이 있다. 열어달라고 해야겠다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지'
  },
  'HJFI-23': { // 열린 핸드폰
    title: '열린 핸드폰',
    description: '잠긴 카카오톡과 갤러리를 제외하고 통화 기록, 최근 검색 기록은 열람할 수 있다.',
    detail: '검색: "졸피뎀 물에 잘 녹나요?", "부검하면 수면제 검출되나요?". 이사랑과의 카카오톡.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지',
    phone: {
      owner: '이현지의 핸드폰',
      apps: [
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
          chats: [
            {
              name: '사랑이',
              messages: [
                { from: 'me', text: '사랑아, 목사님이 또 재정 조사 얘기 하셨다며?', time: '오전 10:40' },
                { from: 'them', text: '응... 언니 나 어떡해', time: '오전 10:41' },
                { from: 'them', deleted: true },
                { from: 'me', deleted: true },
                { from: 'me', text: '걱정 마. 언니가 알아서 할게.', time: '오전 10:55' }
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
                { from: 'them', text: '[Web발신] 고객님, 현재 신용등급으로는 추가 대출이 불가합니다.', time: '4일 전' }
              ]
            }
          ]
        },
        {
          id: 'photos',
          type: 'photos',
          name: '사진',
          photos: [
            { caption: '잠금화면 — 이사랑과 함께 찍은 자매 사진.' }
          ]
        }
      ]
    }
  },
  'HTBE-10': { // [예약] 내용은 이현지 핸드폰(HJFI-23)의 카카오톡 앱에 흡수됨. 코드는 추후 사용 위해 보존.
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지'
  },
  'GFFZ-13': { // 가방 — 회계 장부
    title: '회계 장부',
    description: '뭔가 허술해 보이는 회계 장부.',
    detail: '허술한 회계 기록. 이 단서만 물어보면 짜증냄.',
    image: '/images/회계장부.jpg',
    type: '보통',
    person: '이현지'
  },
  'KBDD-44': { // 현장(목사 방) — 텀블러 (핵심, ❓→이현지)
    title: '목사님 개인 텀블러',
    description: '',
    detail: '방은 항상 열려있다. 안에 액체 담겨있다. 이현지가 이 근처에서 뭔가 하는 모습 목격됨.',
    image: '/images/텀블러.jpg',
    type: '보통',
    person: '이현지'
  },
  'OJMG-85': { // [예약] 내용은 이현지 핸드폰(HJFI-23)의 메시지 앱에 흡수됨. 코드는 추후 사용 위해 보존.
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지'
  },
  'CLFL-13': { // [예약] 내용은 목사님 핸드폰(PKTK-01)의 사진 앱에 흡수됨. LOVN-56 해금 트리거로 코드 보존.
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지'
  },
  'BGYS-92': { // 예배당 CCTV (2부)
    title: '배회하는 이현지',
    description: '',
    detail: '오후 예배당 입구·식당 배회. 목사님 텀블러 마시러 안 와서 초조.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지'
  },
  'FCPL-08': { // 방 화장실 휴지통 — 빈 졸피뎀 캡슐 포일 (핵심)
    title: '빈 졸피뎀 캡슐 포일',
    description: '',
    detail: '졸피뎀 캡슐 포일 — 4칸 중 3칸이 비어있음. 약통에 남은 알약 수와 대조하면 투입량 추산 가능. 직접 투입의 물질 증거.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지'
  },
  'WRST-55': { // 복도 CCTV (2부) — 손 닦는 이현지 (핵심)
    title: '손 닦는 이현지 (CCTV)',
    description: '',
    detail: '12:35경 이현지가 목사님 방 근처 복도에서 손을 옷에 닦으며 빠르게 이동하는 장면. 텀블러 투입 직후로 추정되는 시각.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지'
  },
  'DCUP-22': { // 방 쓰레기통 — 약 녹인 종이컵
    title: '약 녹인 종이컵',
    description: '',
    detail: '구겨진 종이컵 내부에 흰 잔여물. 졸피뎀을 미리 물에 녹인 용기로 추정. 졸피뎀 성분 미량 검출.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지'
  },
  'FREG-71': { // 가방(지갑 속) — 가족관계증명서 (핵심)
    title: '가족관계증명서',
    description: '',
    detail: '이현지 지갑에 접혀 있던 가족관계증명서. 이사랑이 친동생으로 기재. 자매 관계를 입증하는 물증 — 독립 범행이 동생 보호 동기임을 확정.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이현지'
  },

  // =============================================
  // 이현지 — 특수 단서
  // =============================================
  'GIQA-02': {
    title: '이사랑-이현지 자매 관계',
    description: '',
    detail: '이현지와 이사랑은 친자매. 독립 범행이 동생 보호 목적임 확인.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이현지',
    unlockedBy: ['HJFI-23', 'LOVN-56']
  },
  'PPSO-17': {
    title: '목사님 텀블러 성분 감식',
    description: '',
    detail: '졸피뎀 검출. 투입 실행 확인. 그러나 목사님은 마시기 전 이미 사망 — 직접 사인 무관.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이현지',
    unlockedBy: ['KBDD-44', 'FCPL-08']
  },
  'XXUL-79': {
    title: '텀블러 근처 목격 증언',
    description: '',
    detail: '"현지 언니가 목사님 방 안 텀블러 근처에서 뭔가 하는 거 봤어요. 방이 열려있어서 보였어요."',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이현지',
    unlockedBy: ['ELML-43', 'WRST-55']
  },
  'MYDH-62': {
    title: '이현지 전날 면담 기록',
    description: '',
    detail: '목사 일정표: "재정 관련 면담 — 이현지 회계 (15분)". 동생 일 해달라 부탁했으나 거절.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이현지',
    unlockedBy: ['HTBE-10', 'LOVN-56']
  },

  // =============================================
  // 박희원 (주범 — 응급약 교체 + 베개 질식) — 보통 단서
  // =============================================
  'PILL-30': { // 방 — 요일별 약통 (핵심)
    title: '요일별 약통',
    description: '',
    detail: '월·화·수·목·금·토 칸으로 나뉜 약통. 칸을 열면 비타민C·루테인·오메가3 같은 영양제와 함께 협심증 설하정 6알이 섞여 있다. 목사님 약통에서 빼낸 진짜 설하정으로 의심.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },
  'WUQZ-78': { // 현장(목사 방) — 설하정 약통 이상 (핵심, ❓→박희원)
    title: '목사님 설하정 약통 이상',
    description: '',
    detail: '협심증 응급약 설하정 통인데, 안에 든 6알이 설하정이 아닌 비타민C 정제로 보임. 누군가 알약을 바꿔치기한 정황.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },
  'BIBL-22': { // 방 — 노이즈
    title: '성경책',
    description: '',
    detail: '밑줄과 메모가 빼곡한 성경책. 전도사다운 소지품. 사건과 무관. (노이즈)',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },
  'POU2-18': { // 방 — 노이즈
    title: '화장품 파우치',
    description: '',
    detail: '스킨·로션·선크림 등 남성 화장품. 평범한 세면 용품. 사건과 무관. (노이즈)',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },
  'CLOT-37': { // 방 — 노이즈 (단, SLFB-07과 구분)
    title: '옷가지',
    description: '',
    detail: '여벌 셔츠와 양말. 특이사항 없음. (소매 섬유 감식 SLFB-07과 혼동 주의 — 그건 입고 있던 셔츠)',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },
  'LVRY-41': { // 수중 — 핸드폰 (2부 해금)
    title: '핸드폰',
    description: '',
    detail: '검색 기록·메모 확인 가능. 직접 열어달라고 해야 함.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },
  'KDGY-11': { // 열린 핸드폰
    title: '열린 핸드폰',
    description: '',
    detail: '검색: "협심증 발작 자세", "질식 흔적 부검 감별", "비타민C 알약 외형".',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원',
    phone: {
      owner: '박희원의 핸드폰',
      apps: [
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
        }
      ]
    }
  },
  'WCFG-46': { // 복도 CCTV (중간 공개) — 핵심
    title: '복도 배회 목격',
    description: '',
    detail: '박희원이 오후에 목사님 방 복도를 수 차례 오간 것이 포착됨. 방 문 앞에서 잠시 멈추는 모습.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },
  'LHSC-06': { // 진술 — 노이즈
    title: '목사 협심증 인지',
    description: '',
    detail: '"목사님이 직접 말씀하셨어요." 전도사 신분이라 알게 됨. (노이즈)',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },
  // [확인 필요] 아래 박희원 단서들은 v17 잔존 코드. v20 미등장이나 코드 보존을 위해 유지.
  'AZPL-94': {
    title: '목사 방 청소 자원봉사 기록',
    description: '',
    detail: '다른 청년 대신 자진 교체 신청. 목사 방 30분 단독 체류. 유일한 약병 접근 인물.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },
  'BRZD-12': {
    title: '정품 니트로글리세린 발견',
    description: '',
    detail: 'GTN 각인 정품 알약 6알. 희원 본인 처방 아님. 약병에서 빼낸 것으로 추정.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },
  'DSHM-31': {
    title: '위조 수료증 의혹 서류',
    description: '',
    detail: '수료증 발급 번호 교단 DB 불일치. 목사가 전날 면담에서 통보. 수련회 이후 보고 예정.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },
  'LZWX-93': {
    title: '전도사 자격 관련 면담 기록',
    description: '',
    detail: '목사 일정표: "전도사 자격 관련 면담 — 박희원 (15분)". 면담 후 표정 굳음 목격.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '박희원'
  },

  // =============================================
  // 박희원 — 특수 단서
  // =============================================
  'PLWX-33': { // 현장(목사 방, 2부) — 베개 위치 이상 (핵심)
    title: '베개 위치 이상',
    description: '',
    detail: '침대 베개가 바닥 옆에 떨어져 있음. 목사님 얼굴 주변 피부에 섬유 눌림 흔적. 일반 심정지와 다른 정황.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '박희원',
    unlockedBy: []
  },
  'WNDW-91': { // 문 유리창 (WCFG-46 후 방 문 조사)
    title: '문 유리창 — 내부 관찰 가능',
    description: '',
    detail: '목사님 방 문에는 작은 직사각형 유리창이 있다. 복도에서 방 안이 보인다. 박희원이 이를 통해 내부를 관찰했을 가능성.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '박희원',
    unlockedBy: ['WCFG-46']
  },
  'SWAP-41': { // 설하정 교차 대조 (핵심)
    title: '설하정 교차 대조',
    description: '',
    detail: '박희원 요일별 약통의 설하정 6알 = 목사님 약통에서 사라진 설하정 6알. 목사님 약통엔 비타민C가 들어있음. 박희원이 둘을 맞바꿨음이 확정된다.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '박희원',
    unlockedBy: ['PILL-30', 'WUQZ-78']
  },
  'MCMM-13': { // 맥거핀 — 검색어 해명
    title: '검색어 해명',
    description: '',
    detail: '"걱정돼서요." 그러나 "질식 흔적 부검 감별" 검색은 걱정과 전혀 무관.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '박희원',
    unlockedBy: ['KDGY-11']
  },
  'QAWG-10': { // 복도 진입 시각 확인
    title: '복도 진입 시각 확인',
    description: '',
    detail: '복도 CCTV: 박희원이 목사님 방에 들어가는 시각 포착 가능. 방 내부 CCTV 없어 이후 행동은 확인 불가.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '박희원',
    unlockedBy: ['WCFG-46', 'WNDW-91']
  },
  'SLFB-07': { // 보상형 초히든 — 소매 섬유 감식
    title: '소매 섬유 감식 [보상형]',
    description: '',
    detail: '박희원 셔츠 소매에서 목사님 베개 커버와 동일한 미세 섬유 검출. 직접 살해의 결정적 물증. ※추리에 대한 보상으로만 공개 — 먼저 제시하지 말 것.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '박희원',
    unlockedBy: ['PLWX-33', 'WNDW-91']
  },
  // [확인 필요] 박희원 v17 잔존 특수 단서 (코드 보존)
  'PGZT-09': {
    title: '정품 알약 소지 이유 해명',
    description: '',
    detail: '"목사님 부탁으로 약국서 사다 드린 거예요." 카톡 확인 시 부탁 메시지 실재. 단, 짐에 있고 약병은 교체된 모순 해소 안 됨.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '박희원',
    unlockedBy: ['BRZD-12']
  },
  'ACNJ-83': {
    title: '수료증 원본 제출 — 위조 확정',
    description: '',
    detail: '원본도 발급 번호 불일치. 신학교 직접 확인: 해당 번호 수료생 없음. 위조 확정. 동기 강화.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '박희원',
    unlockedBy: ['DSHM-31', 'LZWX-93']
  },
  'JQOO-57': {
    title: '박희원 행동 타임라인',
    description: '',
    detail: '면담 통보(전날) → 청소 자원(당일 아침) → 복도 배회(오후) → 방 진입(오후) 순서.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '박희원',
    unlockedBy: ['WUQZ-78', 'AZPL-94']
  },

  // =============================================
  // 윤은재 (감정 동기 의혹 · 무고 · 발작 촉진 가능성만) — 보통 단서
  // =============================================
  'LCSX-35': { // 공용 게시판 — 언쟁 목격
    title: '언쟁 목격 진술',
    description: '',
    detail: '목사 방에서 큰 소리, 문 쾅 닫힘. 윤은재가 나오는 것 목격.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재'
  },
  'COLR-77': { // 현장(목사 방) — 구겨진 옷깃 (핵심, ❓→윤은재)
    title: '목사 옷깃 구겨짐',
    description: '',
    detail: '목사님 셔츠 옷깃이 한쪽만 구겨지고 늘어남. 누군가 손으로 잡아당긴 흔적. 윤은재 옷깃 사건과 연결되나, 사망 시각보다 이른 자국.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재'
  },
  'FBYE-30': { // 현장(목사 방) — 옷깃 윤은재 지문 (감식 자동 귀속)
    title: '옷깃의 미세 지문',
    description: '',
    detail: '목사님 옷깃에서 윤은재 지문 부분 검출. 옷깃을 잡았다는 물증. 단 질식과는 무관한 위치.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재'
  },
  'HARI-19': { // 현장(목사 방) — 바닥의 단추 (❓→윤은재)
    title: '바닥의 단추',
    description: '',
    detail: '목사님 셔츠에서 떨어진 단추 1개가 방 바닥에 떨어져 있음. 옷깃을 강하게 잡아당긴 정황과 일치.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재'
  },
  'UCGX-01': { // 방 — 거부 도장 기획안
    title: '거부 도장 기획안',
    description: '',
    detail: '목사 반려 도장 2번.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재'
  },
  'XZIU-65': { // 수중 — 핸드폰 (2부 해금)
    title: '핸드폰',
    description: '',
    detail: '검색·카카오톡. 직접 열어달라고 해야 함.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재'
  },
  'KLLF-63': { // 열린 핸드폰
    title: '열린 핸드폰',
    description: '',
    detail: '검색기록과 카톡을 확인할 수 있다.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재',
    phone: {
      owner: '윤은재의 핸드폰',
      apps: [
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
  'JOHG-57': { // 수중 — 운동화 흙
    title: '운동화 흙',
    description: '',
    detail: '당일 산 입구까지 간 황토 흙.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재'
  },
  'AZVU-48': { // 방 — 라벨 없는 약봉투 (맥거핀)
    title: '약봉투',
    description: '약국에서 처방받은 약 봉투이다. 약만 보고 어떤 약인지 모르겠다.',
    detail: '텔미사르탄 (Telmisartan), 발사르탄 (Valsartan) ,트윈스타, 엑스포지, 카르베디롤 등이 적혀 있다.',
    image: '/images/처방약.png',
    type: '보통',
    person: '윤은재'
  },
  'EISF-00': { // [예약] 내용은 윤은재 핸드폰(KLLF-63)의 카카오톡(친구) 대화에 흡수됨. CTGS-92 해금 트리거로 코드 보존.
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재'
  },
  'LUVX-47': { // 공용 게시판 — 방 출입 목격 (이름 명시)
    title: '목사 방 출입 목격',
    description: '',
    detail: '"은재가 목사님 방으로 들어가는 거 봤어요."',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재'
  },
  'MAKA-55': { // 공용 게시판 — 옷깃 목격 (핵심, ❓→윤은재)
    title: '옷깃 잡는 장면 진술',
    description: '',
    detail: '"한 손으로 목사님 옷깃을 잡는 것을 봤어요."',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '윤은재'
  },

  // =============================================
  // 윤은재 — 특수 단서
  // =============================================
  'UUSQ-85': { // 약봉투 처방전 확인 (AZVU-48 추궁)
    title: '약봉투 처방전 확인',
    description: '',
    detail: '부모님 고혈압약 처방전. 심장약·요힘빈과 무관.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '윤은재',
    unlockedBy: ['AZVU-48']
  },
  'SXAH-88': { // 검색어 전후 카톡
    title: '검색어 전후 카톡',
    description: '',
    detail: '팀원 카톡 직전 확인 — 답변용 검색임 입증.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '윤은재',
    unlockedBy: ['AZVU-48', 'MAKA-55']
  },
  'CTGS-92': { // 언쟁 의도 진술
    title: '언쟁 의도 진술',
    description: '',
    detail: '"때려치운다는 말은 진심이 아니에요. 화가 났던 거예요."',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '윤은재',
    unlockedBy: ['LCSX-35', 'EISF-00']
  },
  'OLCG-88': { // 맥거핀
    title: '수첩 메모 전후 맥락 [맥거핀]',
    description: '',
    detail: '목사가 아닌 팀원 갈등 메모. 맥거핀.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '윤은재',
    unlockedBy: ['UCGX-01', 'LCSX-35']
  },
  'DBEL-94': { // 의학 소견 — 직접 사인 무관 (윤은재 배제)
    title: '의학 소견 — 직접 사인 무관',
    description: '',
    detail: '옷깃 잡는 행위는 협심증 발작의 직접 원인이 될 수 없음. 심리적 촉진 가능성만 있음.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '윤은재',
    unlockedBy: ['MAKA-55', 'COLR-77']
  },
  'DRNK-21': { // 음료 미복용 타임라인 (MAKA-55 추궁 후)
    title: '은재 진술 — 음료 미복용 타임라인',
    description: '',
    detail: '"제가 나올 때까지 목사님은 음료를 안 드셨어요. 멀쩡하셨어요." — 요힘빈 복용 시각을 14:05 이후로 고정. 은재의 무고 입증 + 타임라인 확정의 이중 기능 단서.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '윤은재',
    unlockedBy: ['MAKA-55']
  },

  // =============================================
  // 이가현 (증거 인멸 · 신고 10분 지연) — 보통 단서
  // =============================================
  'IIKU-90': { // 가방 — 딸 사진
    title: '딸 사진',
    description: '',
    detail: '귀여운 5살 여자아이 사진. 가현은 "조카"라 주장. 다른 청년: "너무 닮았다."',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현'
  },
  'PFWK-90': { // 예배당 일정표 (이름 명시)
    title: '목사 면담 기록',
    description: '',
    detail: '목사 일정표: "개인 면담 — 이가현 회장 (20분)". 내용: 미기재.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현'
  },
  'ACGT-90': { // [예약] 내용은 목사님 핸드폰(PKTK-01)의 카카오톡 앱에 흡수됨. GMTK-02 해금 트리거로 코드 보존.
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현'
  },
  'VGLV-69': { // 수중 — 핸드폰 (2부 해금)
    title: '핸드폰',
    description: '',
    detail: '삭제된 파일 기록 있음. 카카오톡·검색 기록.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현'
  },
  'MJTJ-51': { // 열린 핸드폰
    title: '열린 핸드폰',
    description: '',
    detail: '검색: "삭제된 카톡 복구 불가", "변사 목격자 신고 의무". 삭제 흔적.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현',
    phone: {
      owner: '이가현의 핸드폰',
      apps: [
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
            }
          ]
        },
        {
          id: 'photos',
          type: 'photos',
          name: '사진',
          photos: [
            { caption: '최근 삭제된 항목', deleted: true },
            { caption: '최근 삭제된 항목', deleted: true },
            { caption: '최근 삭제된 항목', deleted: true }
          ]
        }
      ]
    }
  },
  'JKVN-96': { // [예약] 내용은 목사님 핸드폰(PKTK-01)의 사진(삭제 항목)에 흡수됨. KVRU-70 해금 트리거로 코드 보존.
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현'
  },
  'CXGY-03': { // 공용 게시 — 시신 발견 경위
    title: '시신 발견 경위',
    description: '',
    detail: '"예배당 쪽에 볼 일이 있어서 갔다가 소리가 이상해 들어갔어요. 이미 쓰러져 계셨어요." — 이가현 최초 진술.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현'
  },
  'QWRO-64': { // 근처 CCTV — 신고 지연 (핵심)
    title: '신고 지연 — 시간 공백',
    description: '',
    detail: '목사 방 내부는 안 보이지만 근처를 찍는 CCTV에 가현이 방에 들어간 시각이 찍힘. 그 시각과 신고 시각 차이가 너무 커서 의심을 받음.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현'
  },
  'VILR-41': { // 진술 — 노이즈
    title: '목사와 냉각된 관계',
    description: '',
    detail: '최근 2주간 목사님과 눈도 안 마주침. 면담 이후 감정 변화. (노이즈)',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현'
  },
  'DSQO-10': { // [확인 필요 — v17 단서. 파혼 정황 보조] 코드 보존
    title: '파혼 문자',
    description: '',
    detail: '약혼자 김멋짐으로부터 파혼 문자. "더 이상 함께할 수 없다." 날짜: 수련회 이틀 전.',
    image: '/images/clue-03.svg',
    type: '보통',
    person: '이가현'
  },

  // =============================================
  // 이가현 — 특수 단서
  // =============================================
  'GMTK-02': { // [예약] 내용은 목사님 핸드폰(PKTK-01)의 카카오톡 앱에 흡수됨. 코드·해금관계는 추후 사용 위해 보존.
    title: '',
    description: '',
    detail: '',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이가현',
    unlockedBy: ['ACGT-90', 'DSQO-10']
  },
  'KVRU-70': { // 삭제된 카톡 복구 [클라이막스]
    title: '삭제된 카톡 복구 [클라이막스]',
    description: '',
    detail: '복구된 기록: 목사-김멋짐 대화와 가현의 "당신 때문에" 카톡. 가현이 사망 후 폰을 풀어 지웠음 확인.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이가현',
    unlockedBy: ['JKVN-96', 'MJTJ-51']
  },
  'XWTW-80': { // 가현 진입·신고 시각 공백
    title: '가현 진입·신고 시각 공백',
    description: '',
    detail: '근처 CCTV: 진입 시각 → 신고까지 큰 공백. "바깥에 있었다"는 진술과 불일치 — 방 안에서 폰을 조작한 시간.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이가현',
    unlockedBy: ['CXGY-03', 'QWRO-64']
  },
  'WEPC-44': { // 가현 진술 — 방에서 한 행동 (KVRU-70 제시 후)
    title: '가현 진술 — 방에서 한 행동',
    description: '',
    detail: '"목사님 폰이 지문이라 손대니 풀렸어요. 김멋짐이랑 나눈 얘기, 제 기록 다 지웠어요. 신고는 그 다음에 했어요."',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이가현',
    unlockedBy: ['KVRU-70']
  },
  // [확인 필요] 이가현 v17 잔존 특수 단서 (코드 보존)
  'BEHF-48': {
    title: '약혼자 진술',
    description: '',
    detail: '"목사님한테 연락 받았어요. 가현씨 이전 결혼과 딸 이야기."',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이가현',
    unlockedBy: ['DSQO-10', 'PFWK-90']
  },
  'USEU-87': {
    title: '딸 존재 확인',
    description: '',
    detail: '교회 어린이반 출석부: 같은 성 5세 아이. 보호자 란에 "이가현" 기재.',
    image: '/images/clue-03.svg',
    type: '특수',
    person: '이가현',
    unlockedBy: ['IIKU-90', 'DSQO-10']
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
  hint: '피해자는 청년부를 이끄는 영향력 있는 목사님이었습니다.',
  detail: '협심증 병력이 있었으며, 수련회 당일 개인 방에서 사망했습니다. 직접 사인은 질식사입니다.'
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
    notes: '피해자 목사님과 매우 친밀한 관계였습니다. 요힘빈 다이어트 보충제와 단백질 보충제를 복용 중이며, 목사님께도 보충제를 챙겨 드리곤 했습니다.',
  },
  {
    id: 'S2',
    name: '윤은재',
    age: 24,
    gender: '남성',
    occupation: '샛별이슬 청년부 찬양팀 팀장',
    image: '/images/people/s2.png',
    notes: '목사님과 찬양곡 선정 문제로 몇 달째 갈등을 겪고 있었습니다.'
  },
  {
    id: 'S3',
    name: '이현지',
    age: 26,
    gender: '여성',
    occupation: '샛별이슬 청년부 회계',
    image: '/images/people/s3.png',
    notes: '청년부 재정을 꼼꼼하게 관리하는 회계 담당입니다.'
  },
  {
    id: 'S4',
    name: '박희원',
    age: 28,
    gender: '여성',
    occupation: '샛별이슬 청년부 전도사',
    image: '/images/people/s4.png',
    notes: '차분하고 협조적인 모습의 청년부 전도사입니다.'
  },
  {
    id: 'S5',
    name: '이사랑',
    age: 25,
    gender: '여성',
    occupation: '샛별이슬 청년부 총무',
    image: '/images/people/s5.png',
    notes: '청년부 행사 및 총무 업무를 담당하고 있습니다.'
  },
  {
    id: 'S6',
    name: '이가현',
    age: 25,
    gender: '여성',
    occupation: '샛별이슬 청년부 회장',
    image: '/images/people/s6.png',
    notes: '청년부 회장으로 리더십 있는 모습을 보입니다.'
  }
];
