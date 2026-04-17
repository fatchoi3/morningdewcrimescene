export const evidenceMap = {
  'CLUE-01': {
    title: '깨진 십자가 목걸이',
    description: '피해자의 목에서 발견된 십자가 목걸이입니다. 내부에는 작은 숫자가 새겨져 있습니다.',
    detail: '목걸이의 안쪽에 적힌 63이라는 숫자가 다음 단서로 연결됩니다.'
  },
  'CLUE-02': {
    title: '혈흔이 묻은 장갑',
    description: '현장 주변에서 발견된 장갑. 양쪽 손가락 끝부분에 혈흔이 묻어 있습니다.',
    detail: '장갑은 왼손잡이에게 유리한 형태이며, 현장에 남겨진 발자국과 일치합니다.'
  },
  'CLUE-03': {
    title: '익명의 편지',
    description: '용의자가 남긴 것으로 보이는 짧은 편지. "진실은 어둠 속에 있다."라는 문장이 적혀 있습니다.',
    detail: '편지의 종이 질감과 잉크 종류는 범인이 종교적 배경을 가지고 있음을 시사합니다.'
  }
};

export const suspects = [
  {
    id: 'S1',
    name: '김윤서',
    age: 32,
    gender: '여성',
    occupation: '도서관 사서',
    notes: '차분한 성격이지만 피해자와 자주 만났다는 제보가 있습니다.',
    specialHint: '도서관 내부 CCTV는 3층 복도 쪽에 설치되어 있습니다.'
  },
  {
    id: 'S2',
    name: '박준호',
    age: 28,
    gender: '남성',
    occupation: '택배 기사',
    notes: '사건 당일, 도서관 근처에 배달을 하러 온 것으로 확인되었습니다.',
    specialHint: '그는 사건 시간에 1층 출입구에 있었습니다.'
  },
  {
    id: 'S3',
    name: '이서연',
    age: 25,
    gender: '여성',
    occupation: '대학생',
    notes: '사건 당일 도서관에서 공부를 하고 있었다는 목격자가 있습니다.',
    specialHint: '독서실 창가 쪽 좌석에 자주 앉았습니다.'
  }
];

export const locationInfo = {
  name: '은빛 도서관 2층 독서실',
  detail: '사건이 발생한 장소로, 창가 쪽에 여러 손님이 있었습니다. 바닥에는 떨어진 종이 조각이 있습니다.',
  hint: '창가 쪽 테이블 아래에서 추가 단서를 찾을 수 있습니다.'
};
