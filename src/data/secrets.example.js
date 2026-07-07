// ─────────────────────────────────────────────────────────────────────────────
// secrets.example — 비밀팩 템플릿(플레이스홀더). 실제 정답을 담지 않는다.
//   정답을 저장소에 커밋하고 싶지 않을 때 사용하는 폴백:
//     1) .gitignore 에서 src/data/secrets.js 주석 해제
//     2) cp src/data/secrets.example.js src/data/secrets.js
//     3) secrets.js 의 값(비밀번호·발급번호)을 실제 값으로 채운다(로컬 전용)
//   secrets.js 가 없으면 vite/loadData 가 이 파일로 자동 폴백한다(플레이스홀더로 동작).
//   ※ 코드 키는 gameData 의 감식/폰 단서 코드와 일치해야 한다.
// ─────────────────────────────────────────────────────────────────────────────
export default {
  passwords: {
    'SHKB-77': '0000', 'FIBR-98': '0000', 'NTGB-51': '0000', 'GTNV-09': '0000',
    'TUCH-83': '0000', 'ODDM-57': '0000', 'NVYN-22': '0000', 'HIDN-37': '0000',
    'AQFE-59': '0000',
  },
  recover: {
    'LWUY-33': '0000', 'QIVS-92': '0000', 'HUOX-80': '0000',
  },
  lookups: {
    'LWUY-33': {
      answer: 'CHANGE-ME',
      result: {
        title: '(예시) 조회 결과',
        lines: ['이 값은 secrets.js 에서 실제 판정 내용으로 교체하세요.'],
      },
    },
  },
};
