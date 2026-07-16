import { useEffect, useMemo, useRef, useState } from 'react';
import { soloContent } from './soloContent.js';
import { visibleStatements, pressOf, presentOn, relatedCodes, introOf } from './interrogation.js';
import { loadSave, saveSave, defaultState, clearSave } from './soloStore.js';
import { SceneBg, Avatar, StandingFigure, BriefingArt, EndingArt, HallBg } from './art.jsx';
import CctvModal from '../components/CctvModal.jsx';
import { DialogueBox, CommandBar } from './vn.jsx';

const { briefing, suspects, victim, locations, caseKey, provider, clueIcon, getClue, crimeSceneCodes, suspectIds, gamsikCodes, gamsikReady, startingClues } = soloContent;

// 수사 단계 — 자동 개방(퍼즐/탐정). 가이드는 처음부터 전부 개방.
//   1 = 1차 탐문(인물 방·1차 심문) → [중간 사건: 부검 소견] →
//   2 = 전면 조사(목사방·CCTV·휴대폰·감식 의뢰) →
//   3 = 2차 심문(감식 결과 도착, 새 증언 개방, 사건 파일 제출)
const STAGE_LABEL = { 1: '1차 탐문 · 인물 방과 심문', 2: '전면 조사 · 현장·CCTV·휴대폰', 3: '2차 심문 · 물증으로 추궁' };
const STAGE_BANNER = {
  2: '🔓 살인 사건 전환 — 목사님 방·CCTV·휴대폰·감식 의뢰실이 열렸습니다',
  3: '🔬 2차 심문 개방 — 감식 결과가 도착했고, 용의자들의 새 증언이 열렸습니다',
};
const SCENE_NEEDED = 3; // 단계 2→3: 목사방 현장 단서 이만큼 확보
const TRUST_MAX = 5;    // 신뢰도(HP)

function interrogatedCount(state) {
  const pressed = state.pressed || {}, broke = state.broke || {};
  // 추궁했거나(증언 눌러봄) 증거로 모순을 잡았으면 '심문함'으로 인정
  return suspectIds.filter((id) => (pressed[id] || []).length >= 1 || (broke[id] || []).length >= 1).length;
}
function sceneClueCount(state) {
  const got = new Set(state.collected || []);
  return crimeSceneCodes.filter((c) => got.has(c)).length;
}
// 진행도로부터 도달 단계 계산(단조 증가)
function computeStage(state) {
  if (interrogatedCount(state) < suspectIds.length) return 1;   // 6인 모두 심문해야 중간점검
  if (sceneClueCount(state) < SCENE_NEEDED) return 2;           // 현장 조사해야 2부(폰)
  return 3;
}
const stageHint = (locStage) => locStage === 2
  ? `🔒 1차 심문 후 개방 — 용의자 ${suspectIds.length}명을 모두 심문하세요`
  : locStage === 3
    ? `🔒 2차 심문 때 개방 — 목사님 방(현장)에서 단서 ${SCENE_NEEDED}개를 찾으세요`
    : '🔒 잠김';

const DIFFS = [
  { id: 'guide', name: '가이드', desc: '단서가 술술 열리고 비번 힌트도 보입니다. 부담 없이.' },
  { id: 'puzzle', name: '퍼즐', desc: '비번·연결을 스스로 풀어야 열립니다. 추리게임다운 도전.' },
  { id: 'detective', name: '탐정', desc: '힌트 최소. 모든 걸 스스로 엮어야 합니다.' },
];

// 장면 종류별 '표면 앵커' — 배경 가구/바닥에 맞춰 배치(깊을수록 s 작게).
//   x,y = 화면 % (하단 대사창을 피해 y≤70), s = 원근 배율. index로 결정적 매핑 → 늘 같은 자리.
//   인물이 있는 방은 우측(78%~)을 인물 자리로 비워둠.
const ANCHORS = {
  room: [
    { x: 15, y: 62, s: 1.06 }, { x: 70, y: 55, s: 1.0 }, { x: 39, y: 26, s: 0.68 }, { x: 45, y: 68, s: 1.04 },
    { x: 20, y: 31, s: 0.72 }, { x: 60, y: 66, s: 1.0 }, { x: 30, y: 56, s: 0.9 }, { x: 55, y: 42, s: 0.8 },
    { x: 24, y: 45, s: 0.84 }, { x: 66, y: 34, s: 0.74 }, { x: 50, y: 60, s: 0.96 }, { x: 12, y: 48, s: 0.85 },
  ],
  crime: [
    { x: 52, y: 50, s: 1.0 }, { x: 33, y: 63, s: 1.05 }, { x: 71, y: 60, s: 1.03 }, { x: 21, y: 47, s: 0.85 },
    { x: 60, y: 40, s: 0.78 }, { x: 44, y: 66, s: 1.04 }, { x: 82, y: 50, s: 0.9 }, { x: 15, y: 61, s: 1.0 },
    { x: 38, y: 37, s: 0.75 }, { x: 75, y: 35, s: 0.72 }, { x: 28, y: 55, s: 0.9 }, { x: 64, y: 55, s: 0.95 },
  ],
  cctv: [
    { x: 22, y: 30, s: 0.8 }, { x: 44, y: 30, s: 0.8 }, { x: 66, y: 31, s: 0.8 }, { x: 33, y: 52, s: 0.9 },
    { x: 55, y: 52, s: 0.9 }, { x: 77, y: 42, s: 0.82 }, { x: 20, y: 52, s: 0.88 }, { x: 50, y: 66, s: 1.0 },
    { x: 70, y: 64, s: 1.0 },
  ],
  lab: [
    { x: 24, y: 55, s: 0.95 }, { x: 40, y: 53, s: 0.92 }, { x: 56, y: 52, s: 0.9 }, { x: 70, y: 52, s: 0.9 },
    { x: 32, y: 66, s: 1.0 }, { x: 60, y: 64, s: 1.0 }, { x: 82, y: 57, s: 0.9 }, { x: 16, y: 59, s: 0.95 },
  ],
  phone: [
    { x: 20, y: 57, s: 0.95 }, { x: 37, y: 56, s: 0.95 }, { x: 54, y: 56, s: 0.95 }, { x: 71, y: 56, s: 0.95 },
    { x: 86, y: 57, s: 0.95 }, { x: 30, y: 68, s: 1.02 }, { x: 62, y: 68, s: 1.02 },
  ],
  common: [
    { x: 18, y: 52, s: 1.0 }, { x: 82, y: 52, s: 1.0 }, { x: 35, y: 44, s: 0.85 }, { x: 65, y: 44, s: 0.85 },
    { x: 50, y: 60, s: 1.05 }, { x: 26, y: 38, s: 0.72 }, { x: 74, y: 38, s: 0.72 }, { x: 50, y: 34, s: 0.66 },
  ],
};
const anchorKind = (loc) => (loc.showBody || loc.person === '목사') ? 'crime' : (ANCHORS[loc.kind] ? loc.kind : 'room');
const posFor = (loc, i) => { const a = ANCHORS[anchorKind(loc)]; return a[i % a.length]; };

// 방별 단서 핫스팟 정밀 좌표 — 그림 속 실제 소품 위치(전체 이미지 기준 %). 없는 코드는 posFor 스캐터로 폴백.
//   x,y = 이미지(16:9) 내 위치(%), s = 원근 배율. 그림에 소품이 없는 단서는 가구 위 등 자연스러운 위치에 배치.
const ROOM_HOTSPOTS = {
  'ROOM-JH': {
    'VNTD-61': { x: 40, y: 52, s: 1 },    // 책상 위 등산코스 지도(서류)
    'HPKM-53': { x: 52, y: 38, s: 0.95 }, // 검은 셰이커 텀블러
    'TYQD-94': { x: 37, y: 42.5, s: 0.9 },// 왼쪽 반투명 통(단백질)
    'OYJW-26': { x: 45.5, y: 44.5, s: 0.9 }, // 오른쪽 반투명 통(요힘빈)
    'NDVA-68': { x: 15, y: 73, s: 0.95 }, // 바닥 등산화 옆
    'EDEZ-28': { x: 48, y: 72, s: 0.9 },  // 책상 아래 수납상자
    'NMFM-21': { x: 90, y: 58, s: 1 },    // 침대 발치 침구
    'OIMO-99': { x: 60, y: 52, s: 0.85 }, // 책상 오른쪽
    'YPYZ-13': { x: 63, y: 70, s: 0.85 }, // 침대 옆 바구니
  },
  'ROOM-SR': {
    'NYBB-98': { x: 28, y: 40, s: 1 },
    'LBPG-31': { x: 44, y: 50, s: 1 },
    'GLUE-77': { x: 36, y: 47, s: 0.95 },
    'OLUX-30': { x: 56, y: 22, s: 0.9 },
    'SUIX-89': { x: 51, y: 41, s: 0.9 },
    'BCZN-89': { x: 54, y: 50, s: 0.85 },
    'UJVD-65': { x: 74, y: 56, s: 0.9 },
  },
  'ROOM-HW': {
    'UTUW-73': { x: 32, y: 51, s: 0.9 },
    'LUDP-77': { x: 42, y: 48, s: 0.85 },
    'VJMU-45': { x: 27, y: 41, s: 1 },
    'HTXI-85': { x: 54, y: 26, s: 0.9 },
    'JAJZ-77': { x: 67, y: 46, s: 0.85 },
    'MZKW-75': { x: 74, y: 56, s: 0.8 },
  },
  'ROOM-HJ': {
    'BXNP-29': { x: 43, y: 39, s: 0.98 },
    'IJRP-82': { x: 34, y: 50, s: 0.92 },
    'KPVH-32': { x: 28, y: 42, s: 0.95 },
    'LKUJ-60': { x: 57, y: 23, s: 0.95 },
    'BUFL-52': { x: 62, y: 44, s: 0.85 },
    'ESQN-14': { x: 73, y: 60, s: 0.9 },
  },
  'ROOM-GH': {
    'NBZL-83': { x: 49, y: 58, s: 1 },
    'AYMX-96': { x: 38, y: 52, s: 1 },
    'ZNUS-26': { x: 57, y: 24, s: 0.9 },
    'PEDR-58': { x: 31, y: 55, s: 0.95 },
    'KTGF-02': { x: 28, y: 43, s: 0.95 },
    'WORR-03': { x: 74, y: 53, s: 0.85 },
    'DZPL-78': { x: 88, y: 47, s: 0.85 }, // 성경책(펼치면 아이 그림 LWNR-86 확보)
  },
  'ROOM-EJ': {
    'VUDC-50': { x: 31, y: 53, s: 0.95 },
    'MZVN-14': { x: 41, y: 48, s: 0.95 },
    'UHRU-61': { x: 52, y: 45, s: 0.9 },
    'ALLZ-85': { x: 56, y: 22, s: 1 },
    'GYPV-39': { x: 11, y: 64, s: 1.05 },
    'LWFJ-99': { x: 66, y: 53, s: 0.8 },
    'IOVT-95': { x: 75, y: 41, s: 0.8 },
    'PMIK-13': { x: 88, y: 47, s: 0.85 },
  },
  'ROOM-PS': { // 실측: 책상은 화면 좌하(표면 y53~71), 침대·시신은 우측(중심 ~74,60)
    '__body__': { x: 74, y: 60, s: 1.15 }, // 시신 — 오른쪽 침대(담요 아래 형체)
    'SAJL-88': { x: 34, y: 53, s: 1 },     // 책상 위 은색 텀블러
    'TQPA-93': { x: 18, y: 61, s: 0.8 },   // 책상 왼쪽 작은 통
    'IWND-38': { x: 52, y: 52, s: 0.78 },  // 책상 뒤 바구니의 서류(처방전)
    'MEXF-73': { x: 46, y: 64, s: 1 },     // '설하정' 약통
    'HODM-06': { x: 42, y: 71, s: 0.9 },   // 접시의 쏟아진 알약(작은 약통)
    'GZYJ-12': { x: 58, y: 70, s: 0.85 },  // 책상 앞쪽 빈 곳(진단서 서류)
    'AVLP-75': { x: 31, y: 72, s: 0.75 },  // 책상 위 펜 앞 바닥(단추)
    'IHKX-61': { x: 90, y: 55, s: 1 },     // 침대 베개
    'PRBO-03': { x: 24, y: 58, s: 0.9 },   // 책상 위 낡은 책들(일기장)
    'HQIR-26': { x: 95, y: 64, s: 0.8 },   // 오른쪽 협탁(일정표)
    'LTXB-98': { x: 70, y: 63, s: 0.9 },   // 시신 손 부근(손톱 밑 이물질)
    'EUMM-81': { x: 78, y: 55, s: 0.9 },   // 시신 상체 옷깃
  },
  'LOC-CCTV': {
    'SIAH-72': { x: 50, y: 40, s: 1.25 },  // 책상 위 모니터 화면 — 누르면 CCTV 열람대(뷰어)
  },
};
const hotspotFor = (loc, code, i) => ROOM_HOTSPOTS[loc.id]?.[code] || posFor(loc, i);

const REVEAL = {
  order: ['S4', 'S5', 'S3', 'S6', 'S1', 'S2'],
  people: {
    S4: { role: '진범 · 직접 살해', text: '위조 수료증이 들통날 위기에 몰리자 응급약을 가짜로 바꾸고, 결국 베개로 목사를 질식시켰다. 끝까지 부인한다.' },
    S5: { role: '가담 · 라벨 교체', text: '빚과 횡령이 드러날 위기에, 최종현의 보충제 라벨을 바꿔 요힘빈을 먹게 했다. 죽일 생각까진 없었다.' },
    S3: { role: '가담 · 사인 무관', text: '동생을 지키려 목사 텀블러에 수면제를 탔다. 하지만 목사는 그 텀블러를 마시기 전에 죽었다 — 사인과 무관.' },
    S6: { role: '증거 인멸', text: '파혼·숨긴 비밀을 지키려, 이미 죽어 있던 목사의 폰 기록(톡서랍)을 지우고 신고를 늦췄다. 살인과는 무관.' },
    S1: { role: '무고', text: '자기가 준 음료 때문일까 떨었지만, 라벨을 바꾼 건 이사랑, 죽인 건 박희원. 도구로 이용됐을 뿐이다.' },
    S2: { role: '무고', text: '찬양곡 갈등으로 언쟁은 있었으나 질식과 무관. "내가 나올 때 목사는 멀쩡했다"는 증언이 오히려 단서.' },
  },
  essence: '여섯 사람이 각자 다른 이유로, 서로 모르게, 같은 날 같은 사람을 노렸다. 실제로 목사를 죽인 건 박희원의 베개였지만, 그 죽음을 만든 건 목사가 무심코 건드린 여섯 사람의 얽힌 원한 전부였다.',
};

// 그날의 진실 — 시간 순(엔딩 공개용)
const TIMELINE = [
  ['전날 밤', '이사랑이 언니의 송금 내역을 발견해 오해를 풀고, 횡령 위기를 이현지에게 고백.'],
  ['당일 아침', '목사가 찬조금 미입금을 발견 → 이사랑 면담, 수련회 후 재정 점검 예고.'],
  ['10:00', '최종현·목사 등산 출발 (방·복도가 한동안 빔).'],
  ['10:10~12', '박희원이 설하정 6알을 비타민으로 바꿔치기. 진짜 약은 자기 요일별 약통에 숨김.'],
  ['10:20', '이현지가 목사 텀블러에 졸피뎀 투입.'],
  ['10:25', '이사랑이 최종현 방에서 요힘빈↔단백질 라벨을 교체.'],
  ['12:40', '최종현이 (바뀐) "단백질" 음료를 목사에게 전달.'],
  ['12:41~45', '윤은재가 목사방에서 언쟁(손목 멍). 나올 때 목사는 멀쩡·음료 미복용.'],
  ['~12:50', '목사가 요힘빈 음료를 마심 → 컨디션 악화.'],
  ['13:10', '협심증 발작. 가짜 약을 눈치채고 품속 진짜 설하정 복용 후 안정.'],
  ['13:15', '박희원이 유리창으로 "실패"라 판단 → 진입 → 베개로 질식 (직접 사인).'],
  ['13:20', '이가현이 발견 → 이미 사망. 목사 폰 톡서랍(0419) 기록 삭제.'],
  ['13:31', '이가현이 119 신고 (진입~신고 공백이 의심을 부름).'],
];

const norm = (s) => String(s ?? '').trim().replace(/\s/g, '').toUpperCase();

// 풀블리드 VN 화면: 버튼·시트·오버레이가 아닌 곳을 탭하면 대사 넘김(대사창 tap 위임)
const isUiTap = (e) => !!e.target.closest('button, .aa-cmd, .aa-ask, .aa-present, .aa-record, .aa-dialogue, .aa-hp, .s-modal');

export default function SoloApp() {
  const [state, setState] = useState(() => loadSave() || defaultState());
  const [sceneId, setSceneId] = useState(null);
  const [suspectId, setSuspectId] = useState(null);
  const [modalCode, setModalCode] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { saveSave(state); }, [state]);

  const update = (patch) => setState((p) => ({ ...p, ...patch }));
  const collectedSet = useMemo(() => new Set(state.collected), [state.collected]);

  const showToast = (t) => { setToast(t); setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 2400); };

  // 현재 수사 단계(가이드=전부 개방, 그 외=진행도 기반 자동 개방)
  const progressStage = computeStage(state); // 진행도 기반(이벤트·감식 배달 판정용)
  const stage = (state.admin || state.difficulty === 'guide') ? 3 : progressStage; // 운영자 모드=전 구역 개방
  const [adminOpen, setAdminOpen] = useState(false);
  const ALL_CODES = useMemo(() => provider.getAllClues().map((c) => c.code), []);
  // 새 단계 개방 시 1회 배너 알림
  useEffect(() => {
    if (state.difficulty === 'guide') return;
    if (stage > (state.stageSeen || 1)) { showToast(STAGE_BANNER[stage]); update({ stageSeen: stage }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // 2차 심문 개방 시: 의뢰해 둔 감식 결과 일괄 도착
  useEffect(() => {
    if (stage < 3) return;
    const pending = (state.labReq || []).filter((c) => !collectedSet.has(c) && gamsikReady(c, state.collected));
    if (!pending.length) return;
    const set = new Set(state.collected);
    pending.forEach((c) => set.add(c));
    soloContent.computeAutoUnlocked(set); // 특수 연쇄
    for (const g of gamsikCodes) if (!pending.includes(g) && !collectedSet.has(g)) set.delete(g); // 미의뢰 감식은 제외
    update({ collected: [...set] });
    showToast(`🔬 감식 결과 ${pending.length}건 도착 — 수첩에서 확인하세요`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, state.labReq]);

  function collect(code) {
    if (collectedSet.has(code)) return { added: [] };
    const set = new Set(state.collected);
    set.add(code);
    const autos = soloContent.computeAutoUnlocked(set) || []; // set을 변형하며 특수/감식 연쇄 해금
    // 감식은 자동 수령하지 않는다 — 감식실에서 의뢰하면 2차 심문 때 결과 도착.
    const stripped = autos.filter((a) => gamsikCodes.has(a.code) && a.code !== code && !collectedSet.has(a.code));
    stripped.forEach((a) => set.delete(a.code));
    const kept = autos.filter((a) => !stripped.includes(a));
    update({ collected: [...set] });
    const c = getClue(code);
    showToast(`단서 확보: ${c?.title || code}${kept.length ? ` (+특수 ${kept.length})` : ''}`);
    return { added: [code, ...kept.map((a) => a.code)] };
  }

  const goHub = (tab) => { setSceneId(null); setSuspectId(null); update({ screen: 'hub', hubTab: tab || state.hubTab || 'places' }); };

  // 튜토리얼: 사건 기록을 열어봤다가 '현장'으로 돌아오면 기록 단계 완료 → 종현방 단계로
  const tutSawRecordRef = useRef(false);
  useEffect(() => {
    if (state.tutorialSeen) return;
    if (state.hubTab === 'notebook') tutSawRecordRef.current = true;
    else if (state.hubTab === 'places' && tutSawRecordRef.current && !state.tutRecordDone) update({ tutRecordDone: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.hubTab, state.tutorialSeen, state.tutRecordDone]);

  // ── 시작 ────────────────────────────────────────────────────────────────
  if (state.screen === 'start') {
    return (
      <div className="solo-wrap">
        <div className="s-start">
          <div className="s-eye">Crime Scene · Solo</div>
          <div className="s-title">{briefing.title}</div>
          <div className="s-sub">{briefing.subtitle}</div>
          <div className="s-section-t">난이도</div>
          <div className="s-diff">
            {DIFFS.map((d) => (
              <button key={d.id} className={state.difficulty === d.id ? 'on' : ''} onClick={() => update({ difficulty: d.id })}>
                <div className="dname">{d.name}</div>
                <div className="ddesc">{d.desc}</div>
              </button>
            ))}
          </div>
          {/* 새 수사 = 저장 초기화 후 시작(난이도만 유지) — 이어하기는 별도 버튼 */}
          <button className="s-btn" onClick={() => { clearSave(); setState({ ...defaultState(), difficulty: state.difficulty, started: true, screen: 'briefing', collected: [...startingClues] }); }}>
            {state.started ? '새 수사 시작 (처음부터)' : '수사 시작'}
          </button>
          {state.collected.length > 0 && (
            <button className="s-link" style={{ marginTop: 14 }} onClick={() => goHub()}>이어하기 (단서 {state.collected.length})</button>
          )}
          <button className="s-link" style={{ marginTop: 6, color: '#8a8880' }} onClick={() => { clearSave(); setState(defaultState()); }}>🔄 저장 초기화 (테스트용)</button>
        </div>
      </div>
    );
  }

  // ── 브리핑 (역전재판식 VN 시퀀스) ─────────────────────────────────────────
  if (state.screen === 'briefing') {
    return <BriefingVN onDone={() => goHub('places')} />;
  }

  // ── 엔딩 ────────────────────────────────────────────────────────────────
  if (state.screen === 'ending' && state.result) {
    const r = state.result;
    return (
      <div className="solo-wrap">
        <div className="s-body" style={{ paddingTop: 24 }}>
          <EndingArt good={r.culpritRight} />
          <div className="s-score">
            <div className="s-eye">사건 종결</div>
            <div className="big">{r.total} / {r.max}</div>
            <div style={{ color: r.culpritRight ? 'var(--ok)' : 'var(--danger)', fontWeight: 800, marginTop: 6 }}>
              {r.culpritRight ? '✓ 진범을 정확히 지목했습니다' : '✗ 진범을 놓쳤습니다'}
            </div>
            <div style={{ color: 'var(--muted)', marginTop: 6 }}>{r.grade}</div>
            <div style={{ marginTop: 10, fontSize: '.9rem', color: '#cfcabb' }}>진범 <b style={{ color: '#fff' }}>박희원</b> · 직접 사인 <b style={{ color: '#fff' }}>베개 질식</b></div>
          </div>
          <div className="s-reveal">
            <h2 style={{ textAlign: 'center' }}>사건의 전말</h2>
            {REVEAL.order.map((id) => {
              const s = suspects.find((x) => x.id === id);
              return (
                <div key={id} style={{ marginTop: 16 }}>
                  <h3>{s?.name} <span className="role">— {REVEAL.people[id].role}</span></h3>
                  <p style={{ lineHeight: 1.8 }}>{REVEAL.people[id].text}</p>
                </div>
              );
            })}
            <h3 style={{ borderBottom: '1px solid var(--line)', paddingBottom: 6, marginTop: 24 }}>🕰 그날의 진실 — 시간 순</h3>
            <div className="s-timeline">
              {TIMELINE.map(([t, d], i) => (
                <div className="s-tl2-row" key={i}>
                  <div className="s-tl2-t">{t}</div>
                  <div className="s-tl2-d">{d}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#0f0e0c', border: '1px solid var(--gold)', borderRadius: 12, padding: 18, marginTop: 22 }}>
              <div className="s-eye" style={{ color: 'var(--gold)' }}>사건의 본질</div>
              <p style={{ lineHeight: 1.9, marginBottom: 0 }}>{REVEAL.essence}</p>
            </div>
          </div>
          <div style={{ textAlign: 'center', margin: '24px 0' }}>
            <button className="s-btn ghost" onClick={() => goHub('casefile')}>사건 파일 다시 보기</button>
            <button className="s-btn" style={{ marginLeft: 8 }} onClick={() => { clearSave(); setState(defaultState()); }}>새 사건</button>
          </div>
        </div>
      </div>
    );
  }

  // ── 중간 사건 — 1차 심문(6인)을 마치면 부검 소견이 도착한다 ────────────────
  if (!state.eventSeen && !state.admin && progressStage >= 2 && !suspectId) {
    return <EventVN onDone={() => update({ eventSeen: true })} />;
  }

  // ── 메인(허브/장면/용의자) ────────────────────────────────────────────────
  const topH = sceneId ? (locations.all.find((l) => l.id === sceneId)?.label)
    : suspectId ? '용의자 심문'
    : state.hubTab === 'notebook' ? '사건 기록'
    : state.hubTab === 'casefile' ? '사건 파일'
    : '현장';

  // 튜토리얼 코치마크(첫 수사 · 종현방) — 문 클릭 → 소품 조사 → 인물 대화 순서로 유도
  let coach = null;
  if (!state.tutorialSeen && !suspectId && !modalCode) {
    const jhObjs = locations.rooms.find((l) => l.id === 'ROOM-JH')?.objects || [];
    const jhExamined = jhObjs.some((c) => collectedSet.has(c));
    if (!state.tutRecordDone) {
      // 1) 사건 기록을 먼저 열어 기본 단서(사건 개요)를 확인
      if (!sceneId && state.hubTab === 'notebook') coach = { sel: '[data-tut="field-tab"]', text: '사건 기록엔 사건 개요가 기본으로 들어 있어요. 단서·인물을 확인했으면 「현장」을 눌러 계속하세요', dim: false };
      else if (!sceneId) coach = { sel: '[data-tut="record-tab"]', text: '먼저 여기! 「사건 기록」에 사건 개요 등 기본 단서가 들어 있어요 — 눌러서 확인하세요' };
    } else {
      // 2) 종현방: 문 → 소품 → 대화
      if (!sceneId && state.hubTab === 'places') coach = { sel: '[data-tut="door"]', text: '이제 종현방을 눌러 들어가세요' };
      else if (sceneId === 'ROOM-JH' && !jhExamined) coach = { sel: '.aa-track .s-zone', text: '빛나는 소품을 눌러 단서를 조사하세요' };
      else if (sceneId === 'ROOM-JH' && jhExamined) coach = { sel: '.s-figure', text: '인물을 눌러 이야기를 시작하세요' };
    }
  }

  return (
    <div className="solo-wrap">
      <div className="s-top">
        {(sceneId || suspectId) ? (
          <button className="s-back" onClick={suspectId ? () => setSuspectId(null) : () => goHub()}>← 뒤로</button>
        ) : (
          <button className="s-back" onClick={() => update({ screen: 'start' })}>≡</button>
        )}
        <div className="s-h">{topH}{state.admin && <span className="s-admin-chip">ADMIN</span>}</div>
        <div className="s-count">단서 {state.collected.length}</div>
        <button className="s-back" title="운영자 모드(테스트)" style={{ marginLeft: 6 }} onClick={() => setAdminOpen(true)}>⚙</button>
        <button className="s-back" title="저장 초기화(테스트용)" style={{ marginLeft: 6 }}
          onClick={() => { if (window.confirm('저장을 초기화하고 처음부터 시작할까요?\n(단서·심문·진행 전부 삭제)')) { clearSave(); setState(defaultState()); } }}>⟲</button>
      </div>

      <div className="s-body">
        {suspectId ? (
          <CrossExamView key={suspectId} suspect={suspects.find((s) => s.id === suspectId)} state={state}
            phase={stage >= 3 ? 2 : 1}
            tutorialSeen={!!state.tutorialSeen} onTutorialSeen={() => update({ tutorialSeen: true })}
            onAsked={(stId) => { const a = { ...(state.askedQ || {}) }; a[suspectId] = [...new Set([...(a[suspectId] || []), stId])]; update({ askedQ: a }); }}
            location={sceneId ? locations.all.find((l) => l.id === sceneId) : null}
            collectedClues={state.collected.map((c) => getClue(c)).filter((c) => c && c.type !== '방')}
            onExit={() => (sceneId ? setSuspectId(null) : goHub('places'))}
            onPress={(stId) => {
              const r = pressOf(suspectId, stId);
              const pr = { ...(state.pressed || {}) };
              pr[suspectId] = [...new Set([...(pr[suspectId] || []), stId])];
              const patch = { pressed: pr };
              if (r.unlock) { const u = { ...(state.stUnlocked || {}) }; u[suspectId] = [...new Set([...(u[suspectId] || []), r.unlock])]; patch.stUnlocked = u; }
              update(patch);
              if (r.grants) collect(r.grants); // 대화로 증언 단서 확보
              return r; // 자식이 대사창에 결과 표시
            }}
            onPresent={(stId, code) => {
              const r = presentOn(suspectId, stId, code);
              if (r.result === 'contradict') {
                const bk = { ...(state.broke || {}) };
                const cur = bk[suspectId] || [];
                if (!cur.some((e) => e.id === stId)) bk[suspectId] = [...cur, { id: stId, text: r.text, confess: !!r.confess }];
                const patch = { broke: bk };
                if (r.unlock) { const u = { ...(state.stUnlocked || {}) }; u[suspectId] = [...new Set([...(u[suspectId] || []), r.unlock])]; patch.stUnlocked = u; }
                update(patch);
              } else if (r.result === 'wrong') {
                const tr = { ...(state.trust || {}) };
                const t = Math.max(0, (tr[suspectId] ?? TRUST_MAX) - 1);
                if (t <= 0) { tr[suspectId] = TRUST_MAX; update({ trust: tr }); setSuspectId(null); showToast('⚠ 신뢰도가 바닥났습니다 — 잠시 정비 후 다시 심문하세요'); }
                else { tr[suspectId] = t; update({ trust: tr }); }
              }
              return r; // 자식이 컷인/대사창에 결과 표시
            }} />
        ) : sceneId ? (
          <SceneView location={locations.all.find((l) => l.id === sceneId)} collectedSet={collectedSet}
            roomSuspect={suspects.find((s) => s.name === locations.all.find((l) => l.id === sceneId)?.person)}
            collectedClues={state.collected.map((c) => getClue(c)).filter((c) => c && c.type !== '방')}
            lab={{
              stage,
              requested: (code) => (state.labReq || []).includes(code),
              ready: (code) => gamsikReady(code, state.collected),
              request: (code) => { update({ labReq: [...new Set([...(state.labReq || []), code])] }); showToast('🔬 감식 의뢰 접수 — 결과는 2차 심문이 열리면 도착합니다'); },
            }}
            onTalk={(id) => setSuspectId(id)}
            onOpen={(code) => setModalCode(code)} onLockedToast={showToast}
            onBack={() => goHub()} />
        ) : state.hubTab === 'notebook' ? (
          <CaseRecord clues={state.collected.map((c) => getClue(c)).filter((x) => x && x.type !== '방')}
            onOpen={(code) => setModalCode(code)} notes={state.notes} onNotes={(v) => update({ notes: v })} />
        ) : state.hubTab === 'casefile' ? (
          <CaseFileView state={state} stageLocked={state.difficulty !== 'guide' && stage < 3} stageLabel={STAGE_LABEL[stage]}
            onSet={(sid, field, val) => update({ casefile: { ...(state.casefile || {}), [sid]: { ...(state.casefile?.[sid] || {}), [field]: val } } })}
            onSubmit={() => update({ submitted: true, result: scoreCase(state.casefile || {}), screen: 'ending' })} />
        ) : (
          <>
            <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', margin: '4px 0 6px' }}>
              <div style={{ fontWeight: 800, color: 'var(--gold)' }}>🔎 {STAGE_LABEL[stage]}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 3 }}>
                용의자 심문 {interrogatedCount(state)}/{suspectIds.length}
                {stage >= 2 ? ` · 현장 단서 ${sceneClueCount(state)}/${SCENE_NEEDED}` : ''}
                {' · '}
                {stage === 1 ? '다음: 6명 모두 1차 심문하면 사건이 움직입니다'
                  : stage === 2 ? `다음: 목사님 방 단서 ${SCENE_NEEDED}개 확보 시 2차 심문 개방 — 감식 의뢰를 잊지 마세요`
                  : '2차 심문: 새 증언을 추궁하고, 다 모였으면 사건 파일을 제출하세요'}
              </div>
            </div>
            <div className="s-section-t">숙소 · 복도를 둘러보며 이동하세요</div>
            <HallNav locations={locations} stage={stage} collectedSet={collectedSet}
              recommendPerson={!state.tutorialSeen && state.tutRecordDone ? '최종현' : null}
              onEnter={(id) => setSceneId(id)} onToast={showToast} />
          </>
        )}
      </div>

      {/* 하단 탭바 */}
      <div className="s-tabs">
        {[['places', '🗺️', '현장'], ['notebook', '📓', '사건기록'], ['casefile', '📂', '사건파일']].map(([id, ic, nm]) => (
          <button key={id} data-tut={id === 'notebook' ? 'record-tab' : id === 'places' ? 'field-tab' : undefined}
            className={!sceneId && !suspectId && state.hubTab === id ? 'on' : ''} onClick={() => goHub(id)}>
            <span className="ti">{ic}</span>{nm}
          </button>
        ))}
      </div>

      {modalCode && (
        <ClueModal code={modalCode} collectedSet={collectedSet} difficulty={state.difficulty}
          onClose={() => setModalCode(null)} onCollect={collect} onOpen={(c) => setModalCode(c)} />
      )}
      {toast && <div className="s-toast">{toast}</div>}
      {coach && <TutorialCoach targetSel={coach.sel} text={coach.text} dim={coach.dim} onSkip={() => update({ tutorialSeen: true, tutFinaleSeen: true })} />}
      {state.tutorialSeen && !state.tutFinaleSeen && !suspectId && !modalCode && (
        <TutorialFinale onClose={() => update({ tutFinaleSeen: true })} />
      )}
      {adminOpen && (
        <AdminPanel state={state} onClose={() => setAdminOpen(false)} onUpdate={update}
          onCollectAll={() => { update({ collected: [...new Set([...state.collected, ...ALL_CODES])] }); showToast('📦 모든 단서를 확보했습니다'); }}
          onClearClues={() => { update({ collected: [...startingClues] }); showToast('🧹 단서를 비웠습니다'); }}
          onReset={() => { if (window.confirm('저장을 초기화할까요?')) { clearSave(); setState(defaultState()); setAdminOpen(false); } }} />
      )}
    </div>
  );
}

// ── 운영자(테스트) 모드 패널 — 방입장·단서 취득을 쉽게 ──
function AdminPanel({ state, onClose, onUpdate, onCollectAll, onClearClues, onReset }) {
  return (
    <div className="s-modal-ov" onClick={onClose}>
      <div className="s-modal" onClick={(e) => e.stopPropagation()}>
        <div className="s-modal-h"><div className="mt">⚙ 운영자 모드 <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '.8rem' }}>(테스트용)</span></div><button className="mx" onClick={onClose}>✕</button></div>
        <div className="s-modal-b">
          <div className="s-adm-row">
            <div><div style={{ fontWeight: 800 }}>전 구역 개방</div><div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>단계 잠금 없이 모든 방·CCTV·휴대폰·감식·목사님 방 입장 + 2차 심문</div></div>
            <button className={`s-adm-toggle${state.admin ? ' on' : ''}`}
              onClick={() => onUpdate(state.admin ? { admin: false } : { admin: true, eventSeen: true, tutorialSeen: true, tutRecordDone: true, tutFinaleSeen: true })}>
              {state.admin ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="s-adm-actions">
            <button className="s-btn sm" onClick={onCollectAll}>📦 모든 단서 확보</button>
            <button className="s-btn sm ghost" onClick={onClearClues}>🧹 단서 비우기</button>
            <button className="s-btn sm ghost" onClick={() => onUpdate({ tutorialSeen: true, tutRecordDone: true, tutFinaleSeen: true })}>🎓 튜토리얼 스킵</button>
            <button className="s-btn sm ghost" onClick={onReset}>♻ 저장 초기화</button>
          </div>
          <p style={{ fontSize: '.76rem', color: 'var(--muted)', marginTop: 12, lineHeight: 1.6 }}>
            테스트 편의 기능입니다. ‘전 구역 개방’을 켜면 진행도와 무관하게 모든 장소에 바로 들어가고, ‘모든 단서 확보’로 사건 기록을 가득 채워 확인할 수 있어요.
          </p>
        </div>
      </div>
    </div>
  );
}

// 채점 — caseKey.answers 대비 role/method/motive 일치 카운트
function scoreCase(casefile) {
  const ans = caseKey.answers;
  let total = 0; const max = Object.keys(ans).length * 3;
  const per = {};
  for (const [id, a] of Object.entries(ans)) {
    const g = casefile[id] || {};
    const rc = g.role === a.role, mc = g.method === a.method, oc = g.motive === a.motive;
    per[id] = { role: rc, method: mc, motive: oc };
    total += (rc ? 1 : 0) + (mc ? 1 : 0) + (oc ? 1 : 0);
  }
  const culpritRight = casefile.S4?.role === '진범';
  const pct = total / max;
  const grade = pct >= 0.9 ? '명탐정' : pct >= 0.7 ? '유능한 수사관' : pct >= 0.4 ? '견습 수사관' : '재수사가 필요합니다';
  return { total, max, per, culpritRight, grade };
}

// ── 장소 카드 ─────────────────────────────────────────────────────────────
// ── 복도의 문(장소 진입) ───────────────────────────────────────────────────
function DoorCard({ loc, collectedSet, locked, isCrime, recommend, onClick }) {
  const total = loc.objects.length;
  const got = loc.objects.filter((c) => collectedSet.has(c)).length;
  const done = !locked && total > 0 && got === total;
  const icon = loc.kind === 'room' ? (isCrime ? '⚰️' : '🚪')
    : loc.kind === 'cctv' ? '📹' : loc.kind === 'phone' ? '📱' : loc.kind === 'lab' ? '🔬' : '🚶';
  return (
    <button className={`s-door${locked ? ' locked' : ''}${isCrime ? ' crime' : ''}`} onClick={onClick}>
      {recommend && <span className="s-door-rec">▼ 여기부터</span>}
      <div className="s-door-body">
        <span className="s-door-icon">{locked ? '🔒' : icon}</span>
        <span className="s-door-handle" />
        {isCrime && locked && <span className="s-door-tape" />}
      </div>
      <div className="s-door-plate">{loc.label}</div>
      <div className="s-door-stat">
        {locked ? (isCrime ? '통제 중' : loc.stage === 2 ? '사건 후 개방' : '2차 개방')
          : loc.kind === 'room' ? (done ? '✓ 탐색완료' : `단서 ${got}/${total}`)
          : '열람'}
      </div>
    </button>
  );
}

// ── T자 복도 네비게이션 (실사 배경 + 핫스팟) ─────────────────────────────────
//   main   : 양옆에 인물 방 6개 · 오른쪽 길→목사방 · 왼쪽 길→1층
//   pastor : 복도 끝 목사님 방(현장)
//   floor1 : CCTV 열람실 · 압수 소지품 (밖으로 나가면→감식 의뢰실)
//   lab    : 감식 의뢰실
// main.jpg 위 방문 위치(%): 좌벽 근→원, 우벽 근→원 (배경 16:9를 16:9 무대에 cover)
const HALL_DOORS = [
  { person: '최종현', x: 14, y: 58 },
  { person: '이가현', x: 30, y: 55 },
  { person: '윤은재', x: 38, y: 53 },
  { person: '박희원', x: 62, y: 53 },
  { person: '이현지', x: 70.5, y: 55 },
  { person: '이사랑', x: 86.5, y: 58 },
];

function HallHot({ x, y, icon, label, sub, locked, tone, recommend, onClick }) {
  return (
    <button className={`hall-hot${locked ? ' locked' : ''}${tone ? ' ' + tone : ''}`}
      data-tut={recommend ? 'door' : undefined}
      style={{ left: `${x}%`, top: `${y}%` }} onClick={onClick}>
      <span className="hall-hot-ic">{locked ? '🔒' : icon}</span>
      <span className="hall-hot-plate">{label}</span>
      {sub && <span className="hall-hot-sub">{sub}</span>}
    </button>
  );
}

function HallNav({ locations, stage, collectedSet, recommendPerson, onEnter, onToast }) {
  const [view, setView] = useState('main'); // main | pastor | floor1 | lab
  const roomByPerson = (person) => locations.rooms.find((l) => l.person === person);
  const pastor = locations.rooms.find((l) => l.person === '목사');
  const tool = (id) => locations.all.find((l) => l.id === id);
  const cctv = tool('LOC-CCTV'), phone = tool('LOC-PHONE'), lab = tool('LOC-LAB'), common = tool('LOC-COMMON');

  const subOf = (loc, isCrime) => {
    if (loc.stage > stage) return isCrime ? '통제 중' : loc.stage === 2 ? '사건 후 개방' : '2차 개방';
    if (loc.kind !== 'room') return '열람';
    const total = loc.objects.length, got = loc.objects.filter((c) => collectedSet.has(c)).length;
    return total > 0 && got === total ? '✓ 탐색완료' : `단서 ${got}/${total}`;
  };
  const enter = (loc, isCrime) => {
    if (!loc) return;
    if (loc.stage > stage) { onToast(isCrime ? '🚧 목사님 방은 경찰 통제 중입니다 — 부검 소견이 나오면 개방됩니다' : stageHint(loc.stage)); return; }
    onEnter(loc.id);
  };
  const here = view === 'main' ? '숙소 2층 복도 — 인물들의 방'
    : view === 'pastor' ? '복도 끝 — 목사님 방 (사건 현장)'
    : view === 'floor1' ? '1층 — CCTV 열람실 · 압수 소지품'
    : '건물 밖 — 감식 의뢰실';

  return (
    <>
      <div className="hall-stage">
        <HallBg name={view} />

        {view === 'main' && HALL_DOORS.map((d) => {
          const loc = roomByPerson(d.person);
          if (!loc) return null;
          return <HallHot key={d.person} x={d.x} y={d.y} icon="🚪" label={loc.label}
            sub={subOf(loc, false)} locked={loc.stage > stage}
            recommend={recommendPerson === d.person} onClick={() => enter(loc, false)} />;
        })}

        {view === 'pastor' && pastor && (
          <HallHot x={50} y={50} icon="⚰️" tone="crime" label={pastor.label}
            sub={subOf(pastor, true)} locked={pastor.stage > stage} onClick={() => enter(pastor, true)} />
        )}

        {view === 'floor1' && <>
          {cctv && <HallHot x={47} y={52} icon="📹" label={cctv.label} sub={subOf(cctv)} locked={cctv.stage > stage} onClick={() => enter(cctv)} />}
          {phone && <HallHot x={63} y={52} icon="📱" label={phone.label} sub={subOf(phone)} locked={phone.stage > stage} onClick={() => enter(phone)} />}
          {common && <HallHot x={13} y={62} icon="🚶" label={common.label} sub={subOf(common)} locked={common.stage > stage} onClick={() => enter(common)} />}
        </>}

        {view === 'lab' && lab && (
          <HallHot x={43} y={56} icon="🔬" label={lab.label} sub={subOf(lab)} locked={lab.stage > stage} onClick={() => enter(lab)} />
        )}

        <div className="hall-nav-row">
          {view === 'main' ? <>
            <button className="hall-arrow" onClick={() => setView('floor1')}>◀ 왼쪽 · 1층</button>
            <button className="hall-arrow" onClick={() => setView('pastor')}>오른쪽 · 목사님 방 ▶</button>
          </> : view === 'floor1' ? <>
            <button className="hall-arrow" onClick={() => setView('main')}>◀ 복도로</button>
            {lab && <button className="hall-arrow" onClick={() => setView('lab')}>감식 의뢰실 ▶</button>}
          </> : <>
            <button className="hall-arrow" onClick={() => setView(view === 'lab' ? 'floor1' : 'main')}>◀ {view === 'lab' ? '1층으로' : '복도로'}</button>
            <span />
          </>}
        </div>
      </div>
      <div className="hall-here">📍 {here}</div>
    </>
  );
}

// ── 브리핑 (역전재판식 VN 시퀀스) ─────────────────────────────────────────
function BriefingVN({ onDone }) {
  const beats = [
    { loc: '프롤로그', text: briefing.subtitle },
    ...briefing.lines.map((l) => ({ text: l })),
    { text: '당신은 수사관이다. 현장을 조사하고 용의자를 심문해, 누가·어떻게·왜 죽였는지 밝혀라.' },
  ];
  const [i, setI] = useState(0);
  const dlgRef = useRef(null);
  const beat = beats[Math.min(i, beats.length - 1)];
  const last = i >= beats.length - 1;
  return (
    <div className="aa-fs" onClick={(e) => { if (!isUiTap(e)) dlgRef.current?.tap(); }}>
      <div className="aa-stage"><BriefingArt fill /></div>
      <div className="aa-loc-chip">사건 브리핑 · {victim.name}({victim.age})</div>
      <DialogueBox ref={dlgRef} location={beat.loc} text={beat.text}
        onAdvance={() => { if (last) onDone(); else setI((n) => n + 1); }}
        hint={last ? '▶ 현장으로' : `${i + 1}/${beats.length} · 탭하여 다음`} />
      <CommandBar items={[{ icon: '⏭', label: '건너뛰기', onClick: onDone }]} />
    </div>
  );
}

// ── 중간 사건 — 1차 심문 완료 후 부검 소견 도착(살인 전환) 연출 ───────────────
function EventVN({ onDone }) {
  const beats = [
    { loc: '무전', text: '"…수사관님, 국과수입니다. 김호치 목사 1차 부검 소견이 나왔습니다."' },
    { loc: '부검 소견', text: '"사인은 단순 심장 발작이 아닙니다. 코와 입 주변의 압박흔, 안면의 점상출혈 — 질식 소견입니다."' },
    { loc: '수사 전환', text: '단순 발작사가 아니다. 사건은 지금부로 살인 사건으로 전환된다.' },
    { text: '통제 중이던 목사님 방이 개방되었다. 압수했던 CCTV 원본과 관계자 휴대폰도 열람할 수 있다.' },
    { text: '감식반이 합류했다. 채취물을 가져가면 감식 의뢰실에서 분석을 맡길 수 있다 — 단, 결과가 나오기까지는 시간이 걸린다.' },
    { text: '…낮의 진술들을 물증으로 검증할 차례다. 거짓말은 반드시 무너진다.' },
  ];
  const [i, setI] = useState(0);
  const dlgRef = useRef(null);
  const beat = beats[Math.min(i, beats.length - 1)];
  const last = i >= beats.length - 1;
  return (
    <div className="aa-fs" onClick={(e) => { if (!isUiTap(e)) dlgRef.current?.tap(); }}>
      <div className="aa-stage" style={{ background: 'radial-gradient(120% 100% at 50% 0%, #2a1214 0%, #140a0c 55%, #07050a 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 40% at 50% 30%, #c0585822, transparent 70%)', animation: 'aablink 2.2s ease-in-out infinite' }} />
      </div>
      <div className="aa-loc-chip" style={{ color: '#e07a7a', borderColor: '#e07a7a44' }}>🚨 중간 사건 · 부검 소견</div>
      <DialogueBox ref={dlgRef} location={beat.loc} text={beat.text}
        onAdvance={() => { if (last) onDone(); else setI((n) => n + 1); }}
        hint={last ? '▶ 전면 조사 시작' : `${i + 1}/${beats.length} · 탭하여 다음`} />
      <CommandBar items={[{ icon: '⏭', label: '건너뛰기', onClick: onDone }]} />
    </div>
  );
}

// ── 튜토리얼 코치마크 — 클릭할 곳만 밝히고 주변은 어둡게+클릭 차단, 깜빡이는 화살표 안내 ──
//   targetSel(선택자)의 실제 위치를 추적해 '구멍'을 내고, 나머지 4개 마스크가 클릭을 막는다.
function TutorialCoach({ targetSel, text, onSkip, dim = true }) {
  const [rect, setRect] = useState(null);
  useEffect(() => {
    let raf;
    const tick = () => {
      const el = document.querySelector(targetSel);
      if (el) { const r = el.getBoundingClientRect(); setRect({ x: r.left, y: r.top, w: r.width, h: r.height }); }
      else setRect(null);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [targetSel]);
  if (!rect || rect.w === 0) return null;
  const pad = 12;
  const hx = Math.max(0, rect.x - pad), hy = Math.max(0, rect.y - pad);
  const hw = rect.w + pad * 2, hh = rect.h + pad * 2;
  const below = hy < window.innerHeight * 0.5; // 타깃이 위쪽이면 말풍선을 아래에
  const cx = rect.x + rect.w / 2;
  const half = Math.min(230, window.innerWidth * 0.44); // 말풍선 반폭 — 화면 밖으로 안 나가게 클램프
  const tipLeft = Math.min(Math.max(cx, half + 8), window.innerWidth - half - 8);
  return (
    <div className="tut-coach">
      {dim && <>
        <div className="tut-mask" style={{ left: 0, top: 0, width: '100%', height: hy }} />
        <div className="tut-mask" style={{ left: 0, top: hy + hh, width: '100%', height: `calc(100% - ${hy + hh}px)` }} />
        <div className="tut-mask" style={{ left: 0, top: hy, width: hx, height: hh }} />
        <div className="tut-mask" style={{ left: hx + hw, top: hy, width: `calc(100% - ${hx + hw}px)`, height: hh }} />
      </>}
      <div className="tut-ring" style={{ left: hx, top: hy, width: hw, height: hh }} />
      <div className="tut-tip" style={{ left: tipLeft, top: below ? hy + hh + 6 : hy - 6, transform: below ? 'translate(-50%,0)' : 'translate(-50%,-100%)' }}>
        {below
          ? (<><div className="tut-arrow up" /><div className="tut-cap">{text}</div></>)
          : (<><div className="tut-cap">{text}</div><div className="tut-arrow down" /></>)}
      </div>
      <button className="tut-skip" onClick={onSkip}>튜토리얼 건너뛰기 ✕</button>
    </div>
  );
}

// ── 튜토리얼 마무리 멘트 — 첫 심문까지 마치면 한 번 표시 ──
function TutorialFinale({ onClose }) {
  return (
    <div className="tut-finale-ov">
      <div className="tut-finale">
        <div className="tf-badge">🎓 튜토리얼 완료</div>
        <h3>수사의 기본을 익혔습니다</h3>
        <p>이제 복도를 오가며 <b>용의자 6명의 방을 모두 조사하고 심문</b>하세요.<br />
          확보한 단서는 <b>사건 기록</b>에서 인물·유형별로 확인할 수 있습니다.<br />
          사건이 <b>살인</b>으로 전환되면 목사님 방·CCTV·휴대폰·감식 의뢰실이 열립니다.<br />
          충분히 조사했다면 <b>사건 파일</b>을 제출해 사건을 마무리하세요.</p>
        <button className="s-btn" onClick={onClose}>수사 시작</button>
      </div>
    </div>
  );
}

// ── 장면(역전재판식 풀블리드: 조사/이야기/이동 + 사건기록) ────────────────────
function SceneView({ location, collectedSet, roomSuspect, collectedClues, lab, onTalk, onOpen, onLockedToast, onBack }) {
  const [examine, setExamine] = useState(true);
  const [record, setRecord] = useState(false);
  const camRef = useRef(null);
  const trackRef = useRef(null);
  // 세로 화면: 트랙(방 이미지)이 뷰포트보다 넓으면 가운데로 스크롤 시작 — 좌우로 밀어 둘러본다
  useEffect(() => {
    const cam = camRef.current, tr = trackRef.current;
    if (cam && tr) cam.scrollLeft = Math.max(0, (tr.offsetWidth - cam.clientWidth) / 2);
  }, [location?.id]);
  if (!location) return null;
  const pannable = examine; // 조사 중에는 좌우 둘러보기
  const bodyPos = ROOM_HOTSPOTS[location.id]?.['__body__'] || { x: 50, y: 46, s: 1.1 };
  return (
    <div className="aa-fs">
      <div className="aa-cam" ref={camRef}>
        <div className="aa-track" ref={trackRef}>
          <SceneBg location={location} />

      {examine && location.showBody && (
        <button className="s-zone body" style={{ left: `${bodyPos.x}%`, top: `${bodyPos.y}%`, '--s': bodyPos.s }} onClick={() => onOpen('__body__')} aria-label="시신 조사">
          <span className="s-zone-ground" />
          <span className="s-zone-glow" />
          <span className="s-zone-lab">시신</span>
        </button>
      )}
      {examine && location.objects.map((code, i) => {
        const c = getClue(code); if (!c) return null;
        const have = collectedSet.has(code);
        const p = hotspotFor(location, code, i);
        const isGamsik = c.type === '감식';
        const req = isGamsik && lab ? lab.requested(code) : false;
        const zoneLab = have ? c.title
          : isGamsik && lab ? (req ? '🔬 분석 중…' : lab.ready(code) ? '🔬 감식 의뢰' : '채취물 필요')
          : '조사';
        return (
          <button key={code} className={`s-zone${have ? ' have' : ''}${req && !have ? ' req' : ''}`} style={{ left: `${p.x}%`, top: `${p.y}%`, '--s': p.s }}
            aria-label={zoneLab}
            onClick={() => {
              if (isGamsik && !have) {
                // 감식은 '의뢰 → 2차 심문 때 결과' 흐름 (2차 개방 후엔 즉시 결과)
                if (!lab || !lab.ready(code)) { onLockedToast('🧪 채취물이 부족합니다 — 관련 실물 단서를 먼저 확보하세요'); return; }
                if (lab.stage >= 3) { onOpen(code); return; }
                if (req) { onLockedToast('🔬 분석 중입니다 — 2차 심문이 열리면 결과가 도착합니다'); return; }
                lab.request(code); return;
              }
              onOpen(code);
            }}>
            <span className="s-zone-ground" />
            <span className="s-zone-glow" />
            {have && <span className="s-zone-check">✓</span>}
            <span className="s-zone-lab">{zoneLab}</span>
          </button>
        );
      })}
        </div>
      </div>

      <div className="aa-loc-chip">🔦 {location.label}</div>
      {pannable && <div className="aa-swipe-hint">← 밀어서 방을 둘러보기 →</div>}

      {roomSuspect && onTalk && (
        <button className="s-figure" onClick={() => onTalk(roomSuspect.id)} aria-label={`${roomSuspect.name}과 이야기한다`}>
          <span className="s-figure-tip">💬 이야기를 한다</span>
          <StandingFigure sid={roomSuspect.id} person={roomSuspect.name} image={roomSuspect.image} height={240} fallbackSize={110} />
          <span className="s-figure-lab">{roomSuspect.name}</span>
        </button>
      )}

      <DialogueBox location={location.label}
        text={examine ? ('그림 속 빛나는 곳을 눌러 조사하자.' + (roomSuspect ? ` ${roomSuspect.name}을(를) 누르면 이야기할 수 있다.` : '')) : '무엇을 할까?'} />

      <CommandBar items={[
        { icon: '🔍', label: '조사한다', active: examine, onClick: () => setExamine((e) => !e) },
        { icon: '📓', label: '사건기록', onClick: () => setRecord(true) },
        { icon: '🚶', label: '이동한다', onClick: onBack },
      ]} />

      {record && (
        <div className="aa-record">
          <button className="aa-close" onClick={() => setRecord(false)}>✕</button>
          <h3>사건 기록</h3>
          <CaseRecord clues={collectedClues} onOpen={(c) => { setRecord(false); onOpen(c); }} />
        </div>
      )}
    </div>
  );
}

function BodyNote({ body }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 12 }}>
      <button className="s-btn ghost sm" onClick={() => setOpen((o) => !o)}>🛏 {body.label || '시신'} 상세 {open ? '▲' : '▼'}</button>
      {open && <p className="s-detail" style={{ marginTop: 8, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: 12 }}>{body.detail}</p>}
    </div>
  );
}

// ── 단서 열람 모달 ─────────────────────────────────────────────────────────
function ClueModal({ code, collectedSet, difficulty, onClose, onCollect, onOpen }) {
  const isBody = code === '__body__';
  const c = isBody ? null : getClue(code);
  const [page, setPage] = useState(0);

  // 열람 시 확보(신규면 수집 + 특수 연쇄)
  useEffect(() => { if (!isBody && !collectedSet.has(code)) onCollect(code); /* eslint-disable-next-line */ }, [code]);

  if (isBody) {
    return <Shell title="시신" onClose={onClose}><p className="s-detail">침대 위에서 숨진 채 발견되었습니다. 얼굴에 눌린 자국 · 협심증 발작 직후 정황. 성분·접촉흔은 개별 감식으로 확인하세요.</p></Shell>;
  }
  if (!c) return <Shell title="?" onClose={onClose}><p>단서를 찾을 수 없습니다.</p></Shell>;

  const tag = c.type && c.type !== '보통' ? <span className="s-tag">{c.type}</span> : null;
  const person = c.person && c.person !== '공용' ? <span className="s-tag">{c.person}</span> : null;

  // 페이지형
  if (Array.isArray(c.pages) && c.pages.length) {
    const pg = c.pages[Math.min(page, c.pages.length - 1)];
    if (pg?.unlocks && !collectedSet.has(pg.unlocks)) onCollect(pg.unlocks);
    return (
      <Shell title={<>{c.title}{tag}{person}</>} onClose={onClose}>
        {pg.image && <img src={pg.image} alt="" />}
        <div style={{ fontWeight: 800, marginBottom: 6 }}>{pg.title}</div>
        <div className="s-detail">{pg.content}</div>
        <div className="s-pager">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← 이전</button>
          <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{page + 1} / {c.pages.length}</span>
          <button disabled={page >= c.pages.length - 1} onClick={() => setPage((p) => p + 1)}>다음 →</button>
        </div>
      </Shell>
    );
  }

  // CCTV형 — 실제 CCTV 열람대(2F 평면도 + 시간대별 인물 동선 마커, 목사방 쪽으로 사라짐)
  if (c.cctv?.timeline) {
    return (
      <CctvModal item={c} evidence={[...collectedSet].map((cd) => ({ code: cd }))}
        onCollect={(cd) => { const r = onCollect(cd); const ok = (r?.added || []).includes(cd) || collectedSet.has(cd); return { success: ok, message: ok ? `단서 확보! [${cd}]` : '확보하지 못했습니다.' }; }}
        onClose={onClose} />
    );
  }

  // 폰형
  if (c.phone) {
    return <PhoneModal code={code} clue={c} collectedSet={collectedSet} difficulty={difficulty} onClose={onClose} />;
  }

  // 지갑형 — 항목을 눌러 내용물 확인
  if (c.wallet) {
    return <WalletModal clue={c} onClose={onClose} />;
  }

  // 기본형(이미지 + 상세/설명)
  return (
    <Shell title={<>{c.title}{tag}{person}</>} onClose={onClose}>
      {c.image && <img src={c.image} alt="" />}
      <div className="s-detail">{c.detail || c.description || '특별한 설명이 없습니다.'}</div>
      {Array.isArray(c.unlockedBy) && c.unlockedBy.length > 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '.78rem', marginTop: 10 }}>🔗 연관 단서를 모으면 새로운 사실이 드러날 수 있습니다.</p>
      )}
    </Shell>
  );
}

// ── 지갑 모달 — 항목(사진·신분증 등)을 눌러 내용물 확인 ──
function WalletModal({ clue, onClose }) {
  const items = clue.wallet?.items || [];
  const [sel, setSel] = useState(null);
  const it = sel != null ? items[sel] : null;
  return (
    <Shell title={<>{clue.title}<span className="s-tag">지갑</span></>} onClose={onClose}>
      <p className="s-detail" style={{ marginBottom: 10 }}>{clue.detail || '지갑 속 항목을 눌러 내용물을 확인하세요.'}</p>
      <div className="s-wallet">
        {items.map((item, i) => (
          <button key={i} className={`s-wallet-item${sel === i ? ' on' : ''}`} onClick={() => setSel(sel === i ? null : i)}>
            <span className="wi-ic">{item.icon || '📄'}</span>
            <span className="wi-lb">{item.label}</span>
          </button>
        ))}
      </div>
      {it && (
        <div className="s-wallet-detail">
          {it.image && <img src={it.image} alt="" />}
          <div className="s-detail">{it.detail || '특별한 점은 없어 보인다.'}</div>
        </div>
      )}
    </Shell>
  );
}

function Shell({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="s-modal-ov" onClick={onClose}>
      <div className="s-modal" onClick={(e) => e.stopPropagation()}>
        <div className="s-modal-h"><div className="mt">{title}</div><button className="mx" onClick={onClose}>✕</button></div>
        <div className="s-modal-b">{children}</div>
      </div>
    </div>
  );
}

// ── 폰 모달 — 실제 휴대폰 화면처럼(홈 → 앱 → 상세) ─────────────────────────────
const PHONE_APP_ICON = { contacts: '📇', kakao: '💬', browser: '🌐', photos: '🖼️', gallery: '🖼️', messages: '✉️' };
function PhoneModal({ code, clue, difficulty, onClose }) {
  const apps = clue.phone.apps || [];
  const [appId, setAppId] = useState(null);   // null = 홈 화면
  const [chatIdx, setChatIdx] = useState(null); // 카톡: null = 대화 목록
  const [recovered, setRecovered] = useState(false);
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [lookup, setLookup] = useState('');
  const [lookupRes, setLookupRes] = useState(null);
  const [zoom, setZoom] = useState(null); // 사진 확대
  const app = appId ? apps.find((a) => a.id === appId) : null;
  const recoverProtected = provider.isRecoverProtected(code);

  const tryRecover = async () => {
    const ok = await provider.verifyRecover(code, pw);
    if (ok) { setRecovered(true); setMsg(''); } else setMsg('비밀번호가 맞지 않습니다.');
  };
  const tryLookup = async () => {
    const res = await provider.verifyLookup(code, lookup);
    setLookupRes(res.ok ? (res.result || '조회 결과가 확인되었습니다.') : (app?.lookup?.notFound || '조회되지 않습니다.'));
  };
  const back = () => { if (appId === 'kakao' && chatIdx != null) setChatIdx(null); else { setAppId(null); setChatIdx(null); } };
  const initial = (s) => (s || '?').replace(/\s.*$/, '').slice(0, 1);

  return (
    <div className="s-modal-ov" onClick={onClose}>
      <button className="s-phone-x" onClick={onClose} aria-label="닫기">✕</button>
      <div className="s-phone" onClick={(e) => e.stopPropagation()}>
        <div className="s-phone-status"><span>9:41</span><span className="pst-r">•••• 📶 🔋</span></div>

        {!app ? (
          <div className="s-phone-screen s-phone-home">
            <div className="s-phone-owner">📱 {clue.phone.owner || clue.title}</div>
            <div className="s-phone-sub">압수 휴대폰 · 앱을 눌러 확인하세요</div>
            <div className="s-app-grid">
              {apps.map((a) => (
                <button key={a.id} className="s-app-ic" onClick={() => { setAppId(a.id); setChatIdx(null); }}>
                  <span className="ai-badge">{PHONE_APP_ICON[a.type] || '📱'}</span>
                  <span className="ai-lb">{a.name || a.type}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="s-phone-appbar"><button className="pab-back" onClick={back} aria-label="뒤로">‹</button><span>{appId === 'kakao' && chatIdx != null ? (app.chats?.[chatIdx]?.name || app.name) : (app.name || app.type)}</span></div>
            <div className="s-phone-screen">

              {app.type === 'contacts' && (app.contacts || []).map((ct, i) => (
                <div key={i} className="s-phone-contact"><span className="pc-av">{initial(ct.name)}</span><span>{ct.name}</span></div>
              ))}

              {app.type === 'photos' && (
                <div className="s-phone-photos">
                  {(app.photos || []).map((ph, i) => (
                    <button key={i} className="pph" onClick={() => ph.image && setZoom(ph)}>
                      {ph.image ? <img src={ph.image} alt="" /> : <div className="pph-no">사진</div>}
                      <div className="pph-cap">{ph.caption}</div>
                    </button>
                  ))}
                </div>
              )}

              {app.type === 'browser' && (
                <div className="s-phone-browser">
                  {(app.searches || []).map((s, i) => (
                    <div key={i} className="pbr-card"><div className="pbr-q">🔍 {s.query}</div><div className="pbr-t">{s.title}</div><div className="pbr-s">{s.snippet}</div></div>
                  ))}
                  {app.lookup && (
                    <div className="pbr-lookup">
                      <div className="pbr-site">🌐 {app.lookup.site}</div>
                      <div className="pbr-desc">{app.lookup.desc}</div>
                      <div className="s-pw"><input value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder={app.lookup.placeholder || app.lookup.label} /><button className="s-btn sm" onClick={tryLookup}>조회</button></div>
                      {lookupRes && <p className="pbr-res">{lookupRes}</p>}
                    </div>
                  )}
                </div>
              )}

              {app.type === 'kakao' && chatIdx == null && (
                <div className="s-kk-list">
                  {(app.chats || []).map((ch, i) => {
                    const locked = ch.deleted && recoverProtected && !recovered;
                    const last = (ch.messages || [])[(ch.messages || []).length - 1];
                    return (
                      <button key={i} className="s-kk-row" onClick={() => setChatIdx(i)}>
                        <span className="kk-av">{initial(ch.name)}</span>
                        <span className="kk-body">
                          <span className="kk-name">{ch.name}{ch.deleted && <span className="s-tag danger">{locked ? '삭제됨' : '복원됨'}</span>}</span>
                          <span className="kk-prev">{locked ? '🔒 삭제된 대화 — 복구 필요' : (last?.text || '')}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {app.type === 'kakao' && chatIdx != null && (() => {
                const ch = (app.chats || [])[chatIdx]; if (!ch) return null;
                const locked = ch.deleted && recoverProtected && !recovered;
                if (locked) return (
                  <div className="s-kk-recover">
                    <div className="kkr-lock">🔒 삭제된 대화</div>
                    <div className="kkr-desc">톡서랍 복구 비밀번호가 필요합니다.</div>
                    {difficulty === 'guide' && <div className="kkr-hint">힌트: 상대의 생일 4자리(다이어리에서)</div>}
                    <div className="s-pw"><input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="복구 비밀번호 4자리" inputMode="numeric" /><button className="s-btn sm" onClick={tryRecover}>복구</button></div>
                    {msg && <div className="kkr-err">{msg}</div>}
                  </div>
                );
                return (
                  <div className="s-kk-chat">
                    {(ch.messages || []).map((m, j) => (
                      <div key={j} className={`s-kk-msg ${m.from === 'me' ? 'me' : 'them'}`}>
                        <span className="kkm-bubble">{m.text}</span>
                        {m.time && <span className="kkm-time">{m.time}</span>}
                      </div>
                    ))}
                  </div>
                );
              })()}

            </div>
          </>
        )}
      </div>
      {zoom && (
        <div className="s-phone-zoom" onClick={(e) => { e.stopPropagation(); setZoom(null); }}>
          <img src={zoom.image} alt="" /><div className="pz-cap">{zoom.caption}</div>
        </div>
      )}
    </div>
  );
}

// ── 수사 수첩 ──────────────────────────────────────────────────────────────
// ── 인물 카드(피해자/용의자 프로필) ──
function PersonCard({ p, role }) {
  return (
    <div className="s-person-card">
      <Avatar person={p.name} image={p.image} size={56} />
      <div className="pc-body">
        <div className="pc-name">{p.name} <span className="s-tag">{p.occupation}</span>{role && <span className="s-tag danger">{role}</span>}</div>
        <div className="pc-meta">{[p.age ? `${p.age}세` : '', p.gender, p.family].filter(Boolean).join(' · ')}</div>
        <div className="pc-notes">{p.notes || p.detail || ''}</div>
      </div>
    </div>
  );
}
function PeopleInfo() {
  return (
    <>
      <div className="s-section-t">피해자</div>
      <PersonCard p={victim} role="피해자" />
      <div className="s-section-t">용의자 ({suspects.length})</div>
      {suspects.map((s) => <PersonCard key={s.id} p={s} />)}
    </>
  );
}
// ── 단서 목록(인물별/유형별 전환) ──
function ClueGroups({ clues, onOpen }) {
  const [mode, setMode] = useState('person'); // person | type
  const keyOf = (c) => (mode === 'person' ? (c.person || '공용') : (c.type || '보통'));
  const groups = {};
  clues.forEach((c) => { (groups[keyOf(c)] ||= []).push(c); });
  return (
    <>
      <div className="s-seg">
        <button className={mode === 'person' ? 'on' : ''} onClick={() => setMode('person')}>인물별</button>
        <button className={mode === 'type' ? 'on' : ''} onClick={() => setMode('type')}>유형별</button>
      </div>
      {clues.length === 0 && <p style={{ color: 'var(--muted)' }}>아직 단서가 없습니다. 현장을 조사하세요.</p>}
      {Object.keys(groups).sort().map((g) => (
        <div key={g} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '.78rem', color: 'var(--muted)', margin: '8px 2px 4px' }}>{g} · {groups[g].length}</div>
          <div className="s-grid">
            {groups[g].map((c) => (
              <button key={c.code} className="s-card" onClick={() => onOpen(c.code)}>
                <div className="ck">{clueIcon(c)}</div>
                <div className="cn" style={{ fontSize: '.9rem' }}>{c.title}</div>
                <div className="cm">{mode === 'person' ? (c.type || '보통') : (c.person || '공용')}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
// ── 사건 기록 — 단서 정보 / 인물 정보 / 메모 ──
function CaseRecord({ clues, onOpen, notes, onNotes }) {
  const [tab, setTab] = useState('clues'); // clues | people | notes
  const hasNotes = typeof onNotes === 'function';
  return (
    <>
      <div className="s-record-tabs">
        <button className={tab === 'clues' ? 'on' : ''} onClick={() => setTab('clues')}>🔎 단서 정보 ({clues.length})</button>
        <button className={tab === 'people' ? 'on' : ''} onClick={() => setTab('people')}>👥 인물 정보</button>
        {hasNotes && <button className={tab === 'notes' ? 'on' : ''} onClick={() => setTab('notes')}>📝 메모</button>}
      </div>
      {tab === 'clues' && <ClueGroups clues={clues} onOpen={onOpen} />}
      {tab === 'people' && <PeopleInfo />}
      {tab === 'notes' && hasNotes && (
        <textarea value={notes || ''} onChange={(e) => onNotes(e.target.value)} placeholder="추리 메모를 자유롭게 적으세요…"
          style={{ width: '100%', minHeight: 160, marginTop: 8, background: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 10, padding: 12, fontFamily: 'inherit', fontSize: '.95rem' }} />
      )}
    </>
  );
}

// ── 사건 파일(최종 제출) ───────────────────────────────────────────────────
function CaseFileView({ state, stageLocked, stageLabel, onSet, onSubmit }) {
  const submitted = state.submitted && state.result;
  const per = state.result?.per || {};
  const filledAll = suspects.every((s) => { const g = state.casefile?.[s.id]; return g?.role && g?.method && g?.motive; });
  return (
    <>
      <div className="s-section-t">사건 파일 — 인물별로 판정하세요</div>
      <p style={{ color: 'var(--muted)', fontSize: '.84rem', marginTop: 0 }}>각 용의자의 <b>역할·한 일·동기</b>를 고르세요. 제출하면 채점되고 전말이 공개됩니다.</p>
      {suspects.map((s) => {
        const g = state.casefile?.[s.id] || {};
        const v = per[s.id];
        const cls = submitted ? (v && v.role && v.method && v.motive ? ' correct' : ' wrong') : '';
        return (
          <div key={s.id} className={`s-cf-row${cls}`}>
            <div className="s-cf-name">{s.name} <span className="s-tag">{s.occupation}</span></div>
            <div className="s-cf-field">
              <label>역할</label>
              <select value={g.role || ''} disabled={submitted} onChange={(e) => onSet(s.id, 'role', e.target.value)}>
                <option value="">선택…</option>
                {caseKey.roles.map((r) => (<option key={r} value={r}>{r}</option>))}
              </select>
            </div>
            <div className="s-cf-field">
              <label>한 일(결정적 행위)</label>
              <select value={g.method || ''} disabled={submitted} onChange={(e) => onSet(s.id, 'method', e.target.value)}>
                <option value="">선택…</option>
                {caseKey.methods.map((m) => (<option key={m.id} value={m.id}>{m.label}</option>))}
              </select>
            </div>
            <div className="s-cf-field">
              <label>동기</label>
              <select value={g.motive || ''} disabled={submitted} onChange={(e) => onSet(s.id, 'motive', e.target.value)}>
                <option value="">선택…</option>
                {caseKey.motives.map((m) => (<option key={m.id} value={m.id}>{m.label}</option>))}
              </select>
            </div>
            {submitted && v && (
              <div className="s-verdict">
                <span className={v.role ? 'c' : 'w'}>{v.role ? '✓' : '✗'} 역할</span>{' · '}
                <span className={v.method ? 'c' : 'w'}>{v.method ? '✓' : '✗'} 행위</span>{' · '}
                <span className={v.motive ? 'c' : 'w'}>{v.motive ? '✓' : '✗'} 동기</span>
              </div>
            )}
          </div>
        );
      })}
      {!submitted && (
        <div style={{ textAlign: 'center', margin: '18px 0' }}>
          {stageLocked ? (
            <div style={{ color: 'var(--muted)', fontSize: '.85rem', lineHeight: 1.7 }}>🔒 2부(전면 공개)까지 조사를 마쳐야 제출할 수 있습니다.<br />현재 단계: <b>{stageLabel}</b></div>
          ) : (
            <button className="s-btn" disabled={!filledAll} style={!filledAll ? { opacity: 0.5 } : {}} onClick={onSubmit}>
              {filledAll ? '사건 파일 제출 →' : '모든 인물을 채워주세요'}
            </button>
          )}
        </div>
      )}
    </>
  );
}

// ── 용의자 심문 (방 안 대화형 — 질문 선택 → 대답 → 캐묻기/그 말에 증거) ────────
//   질문 목록에서 골라 물으면 인물이 대답한다. 수상하면 「캐묻는다」로 파고들고,
//   거짓이다 싶으면 「이 말에 증거」로 지금 그 대답에 단서를 들이댄다(모순!).
//   ❗=새로 열린 질문 · ✅=모순을 밝힌 질문. 「이만 마친다」로 방에 복귀(반복 없음).
function CrossExamView({ suspect, location, state, collectedClues, phase = 1, tutorialSeen, onTutorialSeen, onAsked, onPress, onPresent, onExit }) {
  const [curId, setCurId] = useState(null); // 지금 붙잡고 있는 질문(진술 id) — null = 질문 목록
  // 대사창 오버라이드: { text, kind } — 진입 시 인사말(1차/2차 다름)부터
  const [line, setLine] = useState(() => (suspect ? { text: introOf(suspect.id, phase), kind: 'intro' } : null));
  const [picker, setPicker] = useState(false);
  const [cutin, setCutin] = useState(null); // 모순! 컷인
  const [record, setRecord] = useState(false);
  const [shake, setShake] = useState(false);
  const [isTutorial] = useState(() => !tutorialSeen); // 이 심문이 첫(튜토리얼) 심문인가 — 화면 표시용
  const dlgRef = useRef(null); // 화면 아무 데나 탭 → 대사 넘김 위임
  // 첫 심문에 진입하면 코치마크 종료(이후 나가면 마무리 멘트) — 인트로를 안 넘겨도 확실히 처리
  useEffect(() => { if (!tutorialSeen) onTutorialSeen?.(); /* eslint-disable-next-line */ }, []);

  const sid = suspect?.id;
  const collected = state.collected || [];
  const unlocked = state.stUnlocked?.[sid] || [];
  const pressedIds = state.pressed?.[sid] || [];
  const askedIds = state.askedQ?.[sid] || [];
  const broke = state.broke?.[sid] || [];
  const trust = state.trust?.[sid] ?? TRUST_MAX;
  const statements = sid ? visibleStatements(sid, collected, unlocked, phase) : [];
  const brokeOf = (id) => broke.find((e) => e.id === id);
  const confessed = broke.some((e) => e.confess);

  const cur = curId ? statements.find((s) => s.id === curId) : null;
  const bk = cur ? brokeOf(cur.id) : null;

  // 이 인물과 관련 있는 '증거'만 제시 목록에 노출(모순·반응 코드 + 인물 소속 단서, 증언은 제외)
  const rel = sid ? relatedCodes(sid) : new Set();
  const isRelated = (c) => c.type !== '증언' && (rel.has(c.code) || c.person === suspect?.name);
  const presentable = collectedClues.filter(isRelated);

  if (!suspect) return null;

  const toMenu = () => { setLine(null); setCurId(null); setPicker(false); };

  // 대사 넘김: 인사말→(첫 심문이면 안내)→질문 목록 / 대답·반응을 읽고 나면 질문 목록
  const advance = () => {
    if (line) {
      if (line.kind === 'intro' && !tutorialSeen) {
        onTutorialSeen?.();
        setLine({ kind: 'guide', text: '(수사 노트) 질문을 골라 이야기를 듣자.\n수상한 대답은 「🔎 캐묻는다」로 파고들고, 거짓이다 싶으면 「📁 이 말에 증거」로 단서를 들이대자.\n❗ 표시가 붙은 새 질문이 열리면 놓치지 말 것.' });
        return;
      }
      if (line.kind === 'intro' || line.kind === 'guide') { setLine(null); return; }
      toMenu();
      return;
    }
    if (cur) toMenu();
  };

  const doPress = () => {
    if (!cur) return;
    setPicker(false);
    const r = onPress(cur.id) || {};
    let extra = '';
    if (r.grants) { const t = getClue(r.grants); if (t) extra += `\n🗣 증언 확보 — ${t.title}`; }
    if (r.unlock) extra += '\n❗ 새로운 질문이 열렸다.';
    setLine({ text: (r.text || '…') + extra, kind: 'press' });
  };

  const doPresent = (code) => {
    if (!cur) return;
    setPicker(false);
    const r = onPresent(cur.id, code) || {};
    if (r.result === 'contradict') {
      setCutin('모순!');
      setTimeout(() => setCutin((c) => (c === '모순!' ? null : c)), 1300);
      setLine({ text: (r.text || '') + (r.confess ? '\n⚖️ …(관여를 인정합니다.)' : '') + (r.unlock ? '\n❗ 새로운 질문이 열렸다.' : ''), kind: 'break' });
    } else if (r.result === 'soft') {
      setLine({ text: r.text || '', kind: 'soft' });
    } else {
      setShake(true); setTimeout(() => setShake(false), 480);
      const c = getClue(code);
      const own = c && c.person === suspect.name;
      setLine({ text: own
        ? '…그건 제 물건이 맞는데요. 지금 이 얘기랑 무슨 상관이죠?'
        : '그건 제 것도 아닌데… 왜 저한테 보여주시는 거예요?', kind: 'wrong' });
    }
  };

  const menuOpen = !line && !cur;
  const qLabel = (s) => s.q || (s.text.length > 18 ? s.text.slice(0, 18) + '…' : s.text);

  const dlgText = line ? line.text
    : cur ? cur.text
    : (statements.length ? '무엇을 물어볼까. (아래에서 질문을 고르자)' : '…(지금은 물어볼 것이 없다. 단서를 모으거나 수사가 진행되면 질문이 생긴다.)');
  const dlgLoc = line
    ? (line.kind === 'break' ? '❗ 모순을 짚었다' : line.kind === 'wrong' ? '심기가 불편하다' : line.kind === 'guide' ? '수사 노트' : line.kind === 'intro' ? (phase >= 2 ? '2차 심문' : '심문 시작') : '캐묻는다')
    : cur ? (bk ? '✅ 밝혀낸 이야기' : `${suspect.name}의 대답`) : '질문 선택';
  const speakerName = (line && line.kind !== 'guide') || cur ? suspect.name : null;
  const dlgHint = (line || cur) ? '탭하여 계속 ▶' : '';

  return (
    <div className={`aa-fs${shake ? ' aa-shake' : ''}`}
      onClick={(e) => { if (!isUiTap(e)) dlgRef.current?.tap(); }}>
      <div className="aa-stage">
        {location ? <SceneBg location={location} />
          : <div className="aa-court" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 50% 0%, #1a2233 0%, #0a0e16 60%, #05070b 100%)' }} />}
      </div>
      <div className="aa-loc-chip">⚖️ {location?.label ? `${location.label} · ` : ''}{suspect.name} {phase >= 2 ? '2차 심문' : '심문'}</div>
      {isTutorial && <div className="aa-tut-chip">📖 튜토리얼 — 처음이니 차근차근</div>}
      <div className="aa-hp" title="신뢰도">
        <span style={{ color: '#e8706e' }}>{'♥'.repeat(trust)}</span><span style={{ opacity: .28 }}>{'♡'.repeat(TRUST_MAX - trust)}</span>
      </div>

      {/* 상반신 프레이밍 — 인물을 크게 그리고 하반신은 대사창 뒤로 잠기게(역전재판식) */}
      <div className="aa-room-fig bust">
        {confessed && <div className="aa-court-tag">⚖️ 관여 자백</div>}
        <StandingFigure sid={sid} person={suspect.name} image={suspect.image} height={620} fallbackSize={160} />
      </div>

      {cutin && <div className="aa-cutin"><span>{cutin}</span></div>}

      {/* 질문 선택지 — 대답/반응을 읽는 중엔 숨김. ✔=이미 들은 질문 */}
      {menuOpen && (
        <div className="aa-ask">
          <div className="aa-ask-h">🎙 무엇을 물어볼까{isTutorial ? ' · 📖 튜토리얼' : ''}</div>
          {statements.map((s) => {
            const b = brokeOf(s.id);
            const isNew = s.hidden && !askedIds.includes(s.id) && !pressedIds.includes(s.id) && !b;
            const asked = askedIds.includes(s.id) || pressedIds.includes(s.id);
            const cls = b ? 'done' : isNew ? 'new' : asked ? 'asked' : '';
            const mark = b ? '✅ ' : isNew ? '❗ ' : asked ? '✔ ' : '💬 ';
            return (
              <button key={s.id} className={cls} onClick={() => { onAsked?.(s.id); setCurId(s.id); }}>
                {mark}{qLabel(s)}
              </button>
            );
          })}
          <button className="end" onClick={onExit}>↩ 이만 마친다 — 방으로 돌아간다</button>
        </div>
      )}

      <DialogueBox ref={dlgRef} location={dlgLoc} speaker={speakerName} text={dlgText}
        onAdvance={(line || cur) ? advance : undefined} hint={dlgHint} />

      <CommandBar items={cur ? [
        { icon: '🔎', label: '캐묻는다', onClick: doPress },
        !bk && { icon: '📁', label: '이 말에 증거', active: picker, onClick: () => { setLine(null); setPicker((p) => !p); } },
        { icon: '↩', label: '다른 질문', onClick: toMenu },
        { icon: '📑', label: '사건기록', onClick: () => { setPicker(false); setRecord(true); } },
      ] : [
        { icon: '📑', label: '사건기록', onClick: () => setRecord(true) },
        { icon: '↩', label: '돌아가기', onClick: onExit },
      ]} />

      {picker && cur && !bk && (
        <div className="aa-present">
          <div className="aa-present-h">
            <span>이 말에 들이댈 증거 — “{cur.text.length > 24 ? cur.text.slice(0, 24) + '…' : cur.text}”</span>
            <button className="aa-close" onClick={() => setPicker(false)}>✕</button>
          </div>
          {presentable.length === 0
            ? <p style={{ color: 'var(--muted)', fontSize: '.85rem', padding: '4px 2px' }}>이 인물과 관련된 단서가 아직 없습니다. 현장·대화로 단서를 더 모으세요.</p>
            : <div className="s-grid">
                {presentable.map((c) => (
                  <button key={c.code} className="s-card" onClick={() => doPresent(c.code)}>
                    <div className="ck">{clueIcon(c)}</div>
                    <div className="cn" style={{ fontSize: '.82rem' }}>{c.title}</div>
                    <div className="cm">{c.person}</div>
                  </button>
                ))}
              </div>}
        </div>
      )}

      {record && (
        <div className="aa-record">
          <button className="aa-close" onClick={() => setRecord(false)}>✕</button>
          <h3>사건 기록 · 이 인물에게 들이댈 증거 ({collectedClues.length})</h3>
          {collectedClues.length === 0
            ? <p style={{ color: 'var(--muted)' }}>아직 확보한 단서가 없습니다. 현장을 조사하거나 인물과 대화하세요.</p>
            : <div className="s-grid">
                {collectedClues.map((c) => {
                  const relv = isRelated(c);
                  return (
                    <button key={c.code} className="s-card" style={relv ? { borderColor: 'var(--gold)' } : { opacity: .6 }}
                      onClick={() => { if (relv) { setRecord(false); setPicker(true); } }}>
                      <div className="ck">{clueIcon(c)}</div>
                      <div className="cn" style={{ fontSize: '.82rem' }}>{c.title}</div>
                      <div className="cm">{c.type === '증언' ? '증언' : relv ? '이 인물과 관련' : c.person}</div>
                    </button>
                  );
                })}
              </div>}
        </div>
      )}
    </div>
  );
}
