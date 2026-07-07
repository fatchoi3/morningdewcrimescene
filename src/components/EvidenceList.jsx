import { useState, useEffect, useRef } from 'react';
import PhoneModal from './PhoneModal.jsx';
import CctvModal from './CctvModal.jsx';
import WalletModal from './WalletModal.jsx';
import ScheduleModal from './ScheduleModal.jsx';
import { provider } from '../services/index.js';

/**
 * ImageLightbox
 * 단서 이미지를 전체화면으로 크게 보여주는 라이트박스.
 * 오버레이/이미지 아무 곳이나 탭하거나 ✕ 로 닫는다.
 * (ESC 키 처리는 라이트박스를 띄운 부모 모달이 소유 — 모달과 동시에 닫히지 않도록)
 */
function ImageLightbox({ src, alt, onClose }) {
  if (!src) return null;
  return (
    <div className="lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <button className="lightbox-close" onClick={onClose} aria-label="확대 닫기">✕</button>
      <img src={src} alt={alt || ''} className="lightbox-img" />
      <div className="lightbox-hint">아무 곳이나 탭하면 닫힙니다</div>
    </div>
  );
}

/**
 * ManualModal
 * pages 배열이 있는 증거 아이템에 표시되는 페이지네이션 설명서 팝업.
 * 이전/다음 버튼으로 페이지를 이동하며, ESC 또는 오버레이 클릭으로 닫는다.
 */
function ManualModal({ item, onClose, onCollect }) {
  const [page, setPage] = useState(0);
  const pages = item.pages;
  const total = pages.length;
  const current = pages[page];
  const firedRef = useRef(new Set()); // 이번 열람에서 이미 확보 처리한 unlocks 코드
  const [unlockNotice, setUnlockNotice] = useState('');
  const [lightbox, setLightbox] = useState(false); // 페이지 이미지 확대(라이트박스)

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        // 라이트박스가 열려 있으면 ESC는 라이트박스만 닫는다
        if (lightbox) setLightbox(false);
        else onClose();
        return;
      }
      if (lightbox) return; // 라이트박스 열림 중에는 페이지 이동 막기
      if (e.key === 'ArrowRight') setPage((p) => Math.min(p + 1, total - 1));
      if (e.key === 'ArrowLeft') setPage((p) => Math.max(p - 1, 0));
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, total, lightbox]);

  // 특정 페이지(예: 성경책 속 그림 편지)를 펼치면 연결된 단서를 자동으로 확보한다.
  useEffect(() => {
    const code = current?.unlocks;
    if (!code) { setUnlockNotice(''); return; }
    if (onCollect && !firedRef.current.has(code)) {
      firedRef.current.add(code);
      const res = onCollect(code);
      setUnlockNotice(res?.message || '');
    }
  }, [page, current, onCollect]);

  return (
    <>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel manual-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="닫기">✕</button>

        <div className="modal-code">[{item.code}] {item.title || '사용 설명서'}</div>

        {/* 페이지 인디케이터 */}
        <div className="manual-pagination-dots">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`manual-dot ${i === page ? 'manual-dot--active' : ''}`}
              onClick={() => setPage(i)}
              aria-label={`${i + 1}페이지`}
            />
          ))}
        </div>

        {/* 페이지 본문 */}
        <div className="manual-content">
          {current.image && (
            <div
              className="manual-image-wrap"
              onClick={() => setLightbox(true)}
              style={{ cursor: 'pointer' }}
              title="탭하면 크게 볼 수 있어요"
            >
              <img src={current.image} alt={current.title} className="manual-image" />
              <span className="modal-image-zoom-hint">🔍 크게</span>
            </div>
          )}
          <h2 className="manual-title">{current.title}</h2>
          <div className="manual-body">
            {current.content.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          {current.unlocks && unlockNotice && (
            <div className="manual-unlock-notice">🔍 {unlockNotice}</div>
          )}
        </div>

        {/* 이전 / 다음 버튼 */}
        <div className="manual-nav">
          <button
            type="button"
            className="manual-nav-btn"
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
          >
            ← 이전
          </button>
          <span className="manual-page-count">{page + 1} / {total}</span>
          <button
            type="button"
            className="manual-nav-btn"
            onClick={() => setPage((p) => Math.min(p + 1, total - 1))}
            disabled={page === total - 1}
          >
            다음 →
          </button>
        </div>
      </div>
    </div>
    {lightbox && current.image && (
      <ImageLightbox src={current.image} alt={current.title} onClose={() => setLightbox(false)} />
    )}
    </>
  );
}

/**
 * StandardModal
 * 일반 증거 아이템의 이미지·설명 팝업.
 * item.tapReveal = { taps, text } 가 있으면 사진을 taps회 터치 시 숨은 이벤트가 표시된다.
 * 완료 상태(tapDone)와 영구 저장·해금 판정은 App이 소유하며, 완료 시 onTapComplete(code)로 알린다.
 */
function StandardModal({ item, onClose, tapDone = {}, onTapComplete }) {
  const reveal = item.tapReveal;
  const [taps, setTaps] = useState(0);
  const [revealed, setRevealed] = useState(() => (reveal ? !!tapDone[item.code] : false));
  const [lightbox, setLightbox] = useState(false); // 이미지 확대(라이트박스) 열림 여부

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key !== 'Escape') return;
      // 라이트박스가 열려 있으면 ESC는 라이트박스만 닫는다 (단서 모달은 유지)
      if (lightbox) setLightbox(false);
      else onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, lightbox]);

  const need = reveal?.taps || 5;
  const tappable = reveal && !revealed; // 탭-투-리빌(숨은 단서) 연출이 진행 중인 상태
  const currentSrc = revealed && reveal?.image ? reveal.image : item.image;

  const handleImgTap = () => {
    // 탭-투-리빌 단서는 기존 "N번 두드리기" 연출을 그대로 유지
    if (tappable) {
      const n = taps + 1;
      setTaps(n);
      if (n >= need) {
        setRevealed(true);
        // 완료 플래그 저장 + tapReveal 기반 특수 단서 해금 판정은 App에 위임
        onTapComplete?.(item.code);
      }
      return;
    }
    // 그 외(일반 단서 또는 이미 공개된 단서)는 이미지를 크게 본다
    setLightbox(true);
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose} aria-label="닫기">✕</button>
          <div className="modal-code">[{item.code}]</div>
          <h2 className="modal-title">{item.title}</h2>

          {item.image && (
            <div
              className="modal-image-wrap"
              onClick={handleImgTap}
              style={{ cursor: 'pointer' }}
              title={tappable ? '사진을 살펴보세요' : '탭하면 크게 볼 수 있어요'}
            >
              <img
                src={currentSrc}
                alt={item.title}
                className={`modal-image${item.image.includes('길잡이') ? ' modal-image--guide' : ''}`}
              />
              {!tappable && <span className="modal-image-zoom-hint">🔍 크게</span>}
            </div>
          )}

          <p className="modal-description">{item.description}</p>
          <div className="modal-detail">
            <span className="modal-detail-label">추가 정보</span>
            <p>{item.detail}</p>
          </div>

          {revealed && (
            <div className="modal-event">
              <span className="modal-event-label">⚠️ 발견</span>
              <p>{reveal.text}</p>
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <ImageLightbox src={currentSrc} alt={item.title} onClose={() => setLightbox(false)} />
      )}
    </>
  );
}

/**
 * HandwritingModal
 * 필적 대조 미니게임. item.handwriting.options 의 다이어리 중,
 * 참가자가 "수집한(보유한)" 다이어리만 활성 선택지로 노출된다(미보유는 잠김).
 * 선택 시 매핑된 대조 결과 텍스트를 즉시 표시한다.
 *
 * item.handwriting = {
 *   prompt: '누구의 글씨와 비교해볼까요?',
 *   options: [{ who, requires(다이어리 코드), correct?, result }]
 * }
 */
function HandwritingModal({ item, evidence = [], onClose }) {
  const hw = item.handwriting || {};
  const options = hw.options || [];
  const collected = new Set(evidence.map((e) => e.code));
  const [result, setResult] = useState(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="닫기">✕</button>
        <div className="modal-code">[{item.code}] {item.title}</div>
        <p className="modal-description">{item.detail}</p>

        <div style={{ fontWeight: 700, margin: '10px 0 8px' }}>🔍 {hw.prompt || '누구의 글씨와 비교해볼까요?'}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {options.map((o) => {
            const has = collected.has(o.requires);
            const picked = result && result.who === o.who;
            return (
              <button
                key={o.who}
                type="button"
                disabled={!has}
                onClick={() => has && setResult(o)}
                title={has ? '' : '해당 다이어리를 먼저 수집해야 비교할 수 있습니다'}
                style={{
                  padding: '7px 12px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700,
                  cursor: has ? 'pointer' : 'not-allowed',
                  border: picked ? '2px solid #1b5fae' : '1px solid #d0ccc4',
                  background: !has ? '#efeee9' : picked ? '#e6f0ff' : '#fff',
                  color: !has ? '#a8a39a' : '#333',
                }}
              >
                {has ? '' : '🔒 '}{o.who}의 다이어리
              </button>
            );
          })}
        </div>

        {result && (
          <div
            style={{
              marginTop: 14, padding: '12px 14px', borderRadius: 8, lineHeight: 1.6,
              background: result.correct ? '#eafaf0' : '#f7f6f3',
              borderLeft: `3px solid ${result.correct ? '#1a7a3a' : '#b9b3a8'}`,
            }}
          >
            <span style={{ fontWeight: 800, color: result.correct ? '#1a7a3a' : '#8a857c' }}>
              {result.correct ? '✔ 필적 일치' : '✗ 불일치'} · {result.who}
            </span>
            <p style={{ marginTop: 6 }}>{result.result}</p>
          </div>
        )}

        <p style={{ marginTop: 12, fontSize: '0.8rem', color: '#8a857c' }}>
          수집한 다이어리만 비교할 수 있습니다. 더 많은 다이어리를 모으면 선택지가 늘어납니다.
        </p>
      </div>
    </div>
  );
}

/**
 * GamsikModal
 * 감식 단서. 결과(detail)가 가려져 있고, 단서별 운영자 비밀번호(item.password) 입력 시 공개된다.
 * 운영자도 비밀번호를 입력해야 결과가 공개되며, 운영자 모드(adminMode)에서는
 * 입력을 돕도록 비밀번호가 화면에 표시된다. (비번이 없는 단서는 기본 공개)
 * 한 번 공개되면 tapDone(영구 저장)에 기록되어, 모달을 닫았다 다시 열어도
 * 초기화 버튼을 누르기 전까지 계속 공개 상태로 유지된다.
 */
const MAX_GAMSIK_TRIES = 5; // 비밀번호 오답 허용 횟수 (초과 시 잠금)

function GamsikModal({ item, onClose, adminMode = false, tapDone = {}, onTapComplete, tries = 0, onWrong }) {
  const protectedClue = provider.isGamsikProtected(item.code); // 비번 필요 여부(정답은 provider가 소유)
  const [revealed, setRevealed] = useState(!protectedClue || !!tapDone[item.code]);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [attempts, setAttempts] = useState(tries); // 누적 오답 횟수 (재오픈 시 영속값에서 시작)

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // 5회 이상 틀리면 운영자 모드 여부와 무관하게 잠금 (운영자는 잠금 화면의 '결과 공개' 버튼으로 해제 가능)
  const locked = attempts >= MAX_GAMSIK_TRIES;

  const submit = async () => {
    if (locked) return;
    if (!pw.trim()) { setErr('비밀번호를 입력하세요.'); return; }  // 빈값은 오답으로 세지 않음
    // 검증은 provider가 수행(정답은 로컬 secrets 또는 B단계에서 서버가 소유)
    const ok = await provider.verifyGamsik(item.code, pw);
    if (ok) {
      setRevealed(true);
      setErr('');
      onTapComplete?.(item.code); // 공개 상태를 영구 저장 (초기화 전까지 유지)
      return;
    }
    // 오답 — 누적 횟수 증가 후 영구 저장 (모달을 닫았다 다시 열거나 새로고침해도 유지)
    const next = attempts + 1;
    setAttempts(next);
    setPw('');
    onWrong?.(item.code);
    // 오답 횟수를 (현재 / 최대) 형태로 안내. 5회째면 아래에서 잠금 화면으로 전환되어 이 메시지는 보이지 않는다.
    setErr(`비밀번호가 일치하지 않습니다. (${next} / ${MAX_GAMSIK_TRIES})`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="닫기">✕</button>
        <div className="modal-code">[{item.code}] 🔬 감식 단서</div>
        <h2 className="modal-title">{item.title}</h2>
        {item.description && <p className="modal-description">{item.description}</p>}

        {revealed ? (
          <div className="modal-detail">
            <span className="modal-detail-label">감식 결과</span>
            <p>{item.detail}</p>
          </div>
        ) : locked ? (
          <div className="gamsik-lock">
            <div className="gamsik-lock-icon">⛔</div>
            <p className="gamsik-lock-desc">
              비밀번호를 {MAX_GAMSIK_TRIES}회 이상 틀려 더 이상 입력할 수 없습니다.<br />
              진행자에게 문의하세요.
            </p>
            {adminMode && (
              <>
                <p className="gamsik-lock-admin">🛠 운영자 모드 · 비밀번호: <strong>{provider.debugSecret(item.code)}</strong></p>
                <button
                  type="button"
                  className="control-button"
                  onClick={() => { setRevealed(true); onTapComplete?.(item.code); }}
                >
                  🛠 운영자: 결과 공개
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="gamsik-lock">
            <div className="gamsik-lock-icon">🔒</div>
            <p className="gamsik-lock-desc">운영자 전용 감식 결과입니다. 진행자에게 받은 비밀번호를 입력하세요.</p>
            {adminMode && protectedClue && (
              <p className="gamsik-lock-admin">🛠 운영자 모드 · 비밀번호: <strong>{provider.debugSecret(item.code)}</strong></p>
            )}
            <div className="gamsik-lock-form">
              <input
                type="password" inputMode="numeric" name="gamsik-pw"
                autoComplete="new-password" autoCorrect="off" autoCapitalize="off"
                spellCheck={false} data-lpignore="true" data-form-type="other" data-1p-ignore
                value={pw} placeholder="비밀번호"
                onChange={(e) => { setPw(e.target.value); setErr(''); }}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
              <button type="button" className="control-button" onClick={submit}>결과 공개</button>
            </div>
            {err && <p className="gamsik-lock-err">{err}</p>}
            {attempts > 0 && !err && (
              <p className="gamsik-lock-tries">비밀번호 오답 {attempts} / {MAX_GAMSIK_TRIES}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// cctv > wallet > schedule > handwriting > 감식 > phone > pages > 기본 순으로 적절한 모달을 선택해 렌더링
function EvidenceModal({ item, evidence, onCollect, onClose, tapDone, onTapComplete, adminMode, gamsikTries = {}, onGamsikWrong }) {
  if (item.cctv) return <CctvModal item={item} evidence={evidence} onCollect={onCollect} onClose={onClose} />;
  if (item.wallet) return <WalletModal item={item} onClose={onClose} />;
  if (item.schedule) return <ScheduleModal item={item} onClose={onClose} />;
  if (item.handwriting) return <HandwritingModal item={item} evidence={evidence} onClose={onClose} />;
  if (item.type === '감식') return <GamsikModal item={item} onClose={onClose} adminMode={adminMode} tapDone={tapDone} onTapComplete={onTapComplete} tries={gamsikTries[item.code] || 0} onWrong={onGamsikWrong} />;
  if (item.phone) return <PhoneModal item={item} onClose={onClose} onView={onTapComplete} />;
  if (item.pages) return <ManualModal item={item} onClose={onClose} onCollect={onCollect} />;
  return <StandardModal item={item} onClose={onClose} tapDone={tapDone} onTapComplete={onTapComplete} />;
}

function EvidenceList({ evidence, specialUnlockKey = 0, unlockKinds = { special: true, gamsik: true }, onCollect, tapDone = {}, onTapComplete, cctvCodes = [], adminMode = false, gamsikTries = {}, onGamsikWrong }) {
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('normal'); // 'normal' | 'cctv' | 'special' | 'gamsik'
  const [personFilter, setPersonFilter] = useState('전체'); // 인물별 필터 칩

  if (evidence.length === 0) {
    return <p>아직 수집한 증거가 없습니다. QR 코드를 스캔해 증거를 찾으세요.</p>;
  }

  // CCTV에서 획득되는 단서 코드 집합 (별도 'CCTV' 탭으로 분리)
  const cctvSet = new Set(cctvCodes);
  // 보통(=일반 소지품) / CCTV / 특수(길잡이형) / 감식(분석 결과) 분리
  const normalEvidence = evidence.filter((item) => item.type === '보통' && !cctvSet.has(item.code));
  const cctvEvidence = evidence.filter((item) => cctvSet.has(item.code));
  const specialEvidence = evidence.filter((item) => item.type === '특수');
  const gamsikEvidence = evidence.filter((item) => item.type === '감식');

  // 특수 단서 해금 여부 확인.
  // unlockedBy에 적힌 선행 단서를 모두 보유하면 해금된다.
  // (선행 단서가 2개면 2개 모두, 1개면 1개만 — 가이드의 단일 트리거 특수 단서 대응)
  const isSpecialUnlocked = (special) => {
    // unlockedByAny: 하나라도 보유하면 해금 (OR)
    if (Array.isArray(special.unlockedByAny) && special.unlockedByAny.length > 0) {
      return special.unlockedByAny.some((code) => evidence.some((it) => it.code === code));
    }
    if (!special.unlockedBy || special.unlockedBy.length === 0) return true;
    const need = Math.min(2, special.unlockedBy.length);
    const unlockedCount = special.unlockedBy.filter((code) =>
      evidence.some((item) => item.code === code)
    ).length;
    return unlockedCount >= need;
  };

  // 탭 전환 — 인물 칩 선택은 제일 앞 칩(전체)으로 초기화
  const changeTab = (type) => {
    setFilterType(type);
    setPersonFilter('전체');
  };

  // 현재 필터에 따라 표시할 증거 결정
  const displayEvidence = filterType === 'normal' ? normalEvidence
    : filterType === 'cctv' ? cctvEvidence
    : filterType === 'special' ? specialEvidence
    : gamsikEvidence;

  // 인물 필터 칩 — 현재 탭에 존재하는 person만 노출(고정 순서)
  const PERSON_ORDER = ['공용', '목사', '최종현', '윤은재', '이현지', '박희원', '이사랑', '이가현'];
  const presentPersons = PERSON_ORDER.filter((p) => displayEvidence.some((i) => i.person === p));

  const byPerson = personFilter === '전체'
    ? displayEvidence
    : displayEvidence.filter((i) => i.person === personFilter);

  const filtered = (query.trim()
    ? byPerson.filter((item) => {
        const q = query.trim().toLowerCase();
        return (
          item.code.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          (item.person && item.person.toLowerCase().includes(q))
        );
      })
    : byPerson
  ).slice().reverse();

  return (
    <>
      {/* 보통 / CCTV / 특수 / 감식 단서 필터 탭 */}
      <div className="tab-list evidence-tabs" style={{ marginBottom: '12px' }}>
        <button
          type="button"
          className={`tab-button ${filterType === 'normal' ? 'active' : ''}`}
          onClick={() => changeTab('normal')}
        >
          보통 단서 ({normalEvidence.length})
        </button>
        <button
          type="button"
          className={`tab-button ${filterType === 'cctv' ? 'active' : ''}`}
          onClick={() => changeTab('cctv')}
        >
          CCTV ({cctvEvidence.length})
        </button>
        <button
          key={`s-${unlockKinds.special ? specialUnlockKey : 'x'}`}
          type="button"
          className={`tab-button ${filterType === 'special' ? 'active' : ''}${specialUnlockKey > 0 && unlockKinds.special ? ' tab-button--sparkle' : ''}`}
          onClick={() => changeTab('special')}
        >
          특수 단서 ({specialEvidence.length})
        </button>
        <button
          key={`g-${unlockKinds.gamsik ? specialUnlockKey : 'x'}`}
          type="button"
          className={`tab-button ${filterType === 'gamsik' ? 'active' : ''}${specialUnlockKey > 0 && unlockKinds.gamsik ? ' tab-button--sparkle' : ''}`}
          onClick={() => changeTab('gamsik')}
        >
          감식 단서 ({gamsikEvidence.length})
        </button>
      </div>

      {/* 인물별 필터 칩 (한 줄, 가로 스크롤) */}
      <div className="person-chips">
        <button
          type="button"
          className={`person-chip ${personFilter === '전체' ? 'active' : ''}`}
          onClick={() => setPersonFilter('전체')}
        >
          전체
        </button>
        {presentPersons.map((p) => (
          <button
            key={p}
            type="button"
            className={`person-chip ${personFilter === p ? 'active' : ''}`}
            onClick={() => setPersonFilter(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="form-group" style={{ marginBottom: '4px' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="단서명, 코드 또는 인물로 검색"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-lpignore="true"
          data-form-type="other"
          data-1p-ignore
        />
      </div>

      <div className="evidence-scroll">
        {filtered.length === 0 && (
          <p style={{ color: '#666666', fontSize: '0.9rem' }}>
            {filterType === 'special'
              ? '아직 해금된 특수 단서가 없습니다. 관련 단서를 모으면 자동으로 해금됩니다. (일부는 진행자가 부여)'
              : filterType === 'gamsik'
              ? '아직 감식 단서가 없습니다. 성분·처방 분석은 관련 단서를 모으거나 진행자가 공개하면 확인됩니다.'
              : filterType === 'cctv'
              ? '아직 CCTV 단서가 없습니다. CCTV 열람대에서 인물을 확인해 확보하세요.'
              : '검색 결과가 없습니다.'}
          </p>
        )}
        {filtered.map((item) => {
          // 운영자 모드에선 이미 수집한 단서는 선행조건과 무관하게 항상 열람 가능
          const unlocked = adminMode || filterType === 'normal' || filterType === 'cctv' || isSpecialUnlocked(item);

          return (
            <div
              key={item.code}
              className={`evidence-item evidence-item--clickable ${!unlocked ? 'evidence-item--locked' : ''}`}
              onClick={() => unlocked && setSelected(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && unlocked && setSelected(item)}
              style={{ opacity: unlocked ? 1 : 0.6, cursor: unlocked ? 'pointer' : 'not-allowed' }}
            >
              <div className="evidence-code">
                {unlocked ? `[${item.code}]` : '🔒'} {item.title}
                {unlocked && item.person && (
                  <span className="evidence-person">{item.person}</span>
                )}
                {unlocked && item.type === '감식' && (
                  <span style={{ marginLeft: 6, fontSize: '0.68rem', fontWeight: 700, padding: '1px 7px', borderRadius: 9, background: '#e6f0ff', color: '#1b5fae' }}>🔬 감식</span>
                )}
                {unlocked && item.type === '특수' && (
                  <span style={{ marginLeft: 6, fontSize: '0.68rem', fontWeight: 700, padding: '1px 7px', borderRadius: 9, background: '#fef3e2', color: '#9a5b00' }}>특수</span>
                )}
              </div>
              {unlocked && <div className="evidence-tap-hint">탭하여 자세히 보기 →</div>}
            </div>
          );
        })}
      </div>

      {selected && (
        <EvidenceModal
          item={selected}
          evidence={evidence}
          onCollect={onCollect}
          onClose={() => setSelected(null)}
          tapDone={tapDone}
          onTapComplete={onTapComplete}
          adminMode={adminMode}
          gamsikTries={gamsikTries}
          onGamsikWrong={onGamsikWrong}
        />
      )}
    </>
  );
}

export default EvidenceList;
