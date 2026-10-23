// ─────────────────────────────────────────────────────────────────────────────
// features/clues — 단서 열람 모달.
//   ClueModal이 진입점 — 타입별로 분기:
//     페이지형 / CCTV형(CctvModal) / 폰형(PhoneModal) / 지갑형(WalletModal) /
//     일정표형(ScheduleModal) / 필적대조형(HandwritingModal) / 기본형.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getClue, provider } from '../content.js';
import { Shell } from '../ui/overlays.jsx';
import { recoverHintFor } from '../../data/recoverHints.js';
import CctvModal from '../../components/CctvModal.jsx';

const PAGE_IMG_H = 170;   // 그림이 있는 쪽·없는 쪽의 높이를 맞추려고 늘 잡아 두는 자리

// ── 크게 보기 창 — 두 손가락으로 키우고 한 손가락으로 끈다. 단서 창 그림과 폰 사진(통장)이 같이 쓴다.
//   화면 폭에 맞추기만 해선 원래 그림이 이미 화면 폭이라 커지지 않았다(튜토리얼 3차 시험 셋), 통장 글씨는 2~3px(15회차).
function ZoomOverlay({ src, caption, onClose }) {
  const [tf, setTf] = useState({ s: 1, x: 0, y: 0 });
  const tfRef = useRef(tf); tfRef.current = tf;
  const imgRef = useRef(null);
  const ptrs = useRef(new Map());
  const gest = useRef(null);
  const moved = useRef(0);
  const lastTap = useRef(0);
  const [capOn, setCapOn] = useState(true);
  useEffect(() => { const id = setTimeout(() => setCapOn(false), 2600); return () => clearTimeout(id); }, []);
  // 그림 가장자리가 화면 안쪽으로 너무 들어오지 않게(넓혔더니 하얀 빈 곳만 보였다, 16·17회차)
  const clampT = (t) => {
    const el = imgRef.current; if (!el) return t;
    const r0 = el.getBoundingClientRect();
    const baseW = r0.width / (tfRef.current.s || 1), baseH = r0.height / (tfRef.current.s || 1);
    const mx = Math.max(0, (baseW * t.s - window.innerWidth) / 2 + 40), my = Math.max(0, (baseH * t.s - window.innerHeight) / 2 + 60);
    return { s: t.s, x: Math.max(-mx, Math.min(mx, t.x)), y: Math.max(-my, Math.min(my, t.y)) };
  };
  // 처음 배율 — 화면 높이에 맞춰 줄어든 길쭉한 그림(통장)은 폭에 맞춰 키우고 맨 위부터 보여 준다(16회차: 처음부터 양옆이 잘렸다)
  const onLoad = () => {
    const el = imgRef.current; if (!el) return;
    // 상자는 폭 100%·contain 이라 상자 크기가 아니라 실제로 그려진 그림 크기로 잰다
    const r = el.getBoundingClientRect();
    const ratio = el.naturalWidth && el.naturalHeight ? el.naturalWidth / el.naturalHeight : r.width / r.height;
    const drawnW = Math.min(r.width, r.height * ratio), drawnH = drawnW / ratio;
    const s0 = Math.max(1, Math.min(4, (window.innerWidth * 0.96) / drawnW));
    const y0 = s0 > 1 ? Math.max(0, (drawnH * s0 - window.innerHeight * 0.86) / 2) : 0;
    setTf({ s: s0, x: 0, y: y0 });
  };
  // 화면 가운데를 원점으로 한 좌표
  const rel = (x, y) => ({ x: x - window.innerWidth / 2, y: y - window.innerHeight / 2 });
  const zoomAt = (c, s1, base) => {
    const t = base || tfRef.current;
    const k = s1 / t.s;
    return { s: s1, x: c.x - (c.x - t.x) * k, y: c.y - (c.y - t.y) * k };
  };
  const onDown = (e) => { e.currentTarget.setPointerCapture?.(e.pointerId); ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); gest.current = null; moved.current = 0; };
  const onMove = (e) => {
    const p = ptrs.current.get(e.pointerId); if (!p) return;
    const pts = [...ptrs.current.values()];
    if (pts.length >= 2) {
      const [q1, q2] = pts; const dist = Math.hypot(q1.x - q2.x, q1.y - q2.y);
      const c = rel((q1.x + q2.x) / 2, (q1.y + q2.y) / 2);
      if (!gest.current) gest.current = { dist, base: tfRef.current, c };
      const s1 = Math.min(6, Math.max(1, gest.current.base.s * dist / gest.current.dist));
      setTf(zoomAt(gest.current.c, s1, gest.current.base));
    } else {
      setTf((t) => clampT({ ...t, x: t.x + (e.clientX - p.x), y: t.y + (e.clientY - p.y) }));
    }
    moved.current += Math.abs(e.clientX - p.x) + Math.abs(e.clientY - p.y);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };
  const onUp = (e) => {
    const was = ptrs.current.get(e.pointerId);
    ptrs.current.delete(e.pointerId); gest.current = null;
    if (ptrs.current.size > 0 || moved.current >= 8) return;
    // 두 번 탭 — 그 자리를 2.5배로(이미 크면 처음 크기로). 한 번 탭은 잠깐 기다렸다 닫는다
    const now = Date.now();
    if (now - lastTap.current < 320) {
      lastTap.current = 0;
      const t = tfRef.current;
      setTf(t.s > 1.5 ? { s: 1, x: 0, y: 0 } : zoomAt(rel(was?.x ?? e.clientX, was?.y ?? e.clientY), 2.5));
      return;
    }
    lastTap.current = now;
    setTimeout(() => { if (lastTap.current === now) onClose(); }, 330);
  };
  return createPortal(
    <div className="s-img-zoom" onClick={(e) => e.stopPropagation()}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      <img ref={imgRef} src={src} alt="" draggable={false} onLoad={onLoad} style={{ transform: `translate(${tf.x}px, ${tf.y}px) scale(${tf.s})` }} />
      {capOn && <div className="pz-cap">{caption ? `${caption} · ` : ''}한 손가락 = 밀기 · 두 손가락·두 번 탭 = 크게 · 한 번 탭 = 닫기</div>}
    </div>, document.body);
}

// ── 눌러서 크게 보는 그림 — 회계 장부·통장 사진의 작은 글씨를 못 읽었다(2026-10-14 14회차) ──
function ZoomImg({ src, style }) {
  const [big, setBig] = useState(false);
  return (
    <>
      <span className="s-zoom-wrap">
        <img src={src} alt="" style={style} className="s-zoomable" onClick={(e) => { e.stopPropagation(); setBig(true); }} />
        <span className="s-zoom-badge" aria-hidden>🔍 눌러서 크게</span>
      </span>
      {/* 단서 창 안에 띄우면 튜토리얼 말풍선이 그림 위에 겹쳤다(2차 시험) — 화면 맨 위에 띄운다 */}
      {big && <ZoomOverlay src={src} onClose={() => setBig(false)} />}
    </>
  );
}

// ── 여러 쪽 문서 — 한 화면에 이어서 ─────────────────────────────────────────
//   쪽을 하나씩 넘기던 것을 위아래로 이어 붙인다. 「1장은 탭 노동」이라는 말이 모든 유형에서 나왔고(2026-10-08~14
//   8~13회차), 첫 쪽만 보고 닫아 결정적인 쪽(목사님 일기 0419, 세린 성경 속 그림)을 놓쳤다.
//   쪽 안에 숨은 단서(unlocks)는 그 쪽이 화면에 보일 때만 들어온다 — 끝까지 내려 본 사람만 찾는 맛은 지킨다.
function PageStack({ pages, collectedSet, onCollect }) {
  const refs = useRef([]);
  // 관찰자는 처음 연 순간에 만들어진다 — 그때의 onCollect 를 그대로 쓰면 「문서를 열며 얻은 그 문서」가 빠진
  //   옛 목록으로 덮어써, 끝까지 읽은 사람의 성경책이 「안 조사」로 돌아갔다(2026-10-20 튜토리얼 2차 시험 셋 모두).
  const cbRef = useRef(onCollect);
  cbRef.current = onCollect;
  // 본 쪽 — 다 보기 전엔 아래에 「아직 안 본 쪽」을 붙인다(세린 성경책 마지막 쪽 그림을 놓치고 심문에서 먼저 들었다, 15회차)
  const [seen, setSeen] = useState(() => new Set([0]));
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const io2 = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (e.isIntersecting) setSeen((o) => (o.has(+e.target.dataset.i) ? o : new Set([...o, +e.target.dataset.i])));
    }), { threshold: 0.4 });
    refs.current.forEach((el) => el && io2.observe(el));
    return () => io2.disconnect();
  }, [pages]);
  // 「아래로 밀어」 안내는 실제로 넘칠 때만 — 한 화면에 다 들어가는 3쪽 다이어리에도 붙었다(튜토리얼 3차 시험)
  const [more, setMore] = useState(false);
  useEffect(() => {
    const check = () => { const sc = refs.current[0]?.closest('.s-modal'); setMore(!!sc && sc.scrollHeight > sc.clientHeight + 8); };
    const ids = [0, 200, 800].map((ms) => setTimeout(check, ms));
    window.addEventListener('resize', check);
    return () => { ids.forEach(clearTimeout); window.removeEventListener('resize', check); };
  }, [pages]);
  useEffect(() => {
    const want = pages.map((pg, i) => (pg.unlocks && !collectedSet.has(pg.unlocks) ? i : -1)).filter((i) => i >= 0);
    if (!want.length) return undefined;
    if (typeof IntersectionObserver === 'undefined') { want.forEach((i) => cbRef.current(pages[i].unlocks)); return undefined; }
    const io = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (!e.isIntersecting) return;
      const u = pages[+e.target.dataset.i]?.unlocks;
      if (u) cbRef.current(u);
      io.unobserve(e.target);
    }), { threshold: 0.5 });
    want.forEach((i) => refs.current[i] && io.observe(refs.current[i]));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages]);
  return (
    <>
      {pages.length > 1 && <p className="s-pager-more">📖 {pages.length}쪽{more ? ' — 아래로 밀어 끝까지 읽어 보세요' : ''}</p>}
      {pages.map((pg, i) => (
        <section key={i} className="s-page" data-i={i} ref={(el) => { refs.current[i] = el; }}>
          {pg.image && <ZoomImg src={pg.image} style={{ height: PAGE_IMG_H, width: '100%', objectFit: 'contain', marginBottom: 8 }} />}
          <div className="s-page-t">{pg.title}<span>{i + 1} / {pages.length}</span></div>
          <div className="s-detail">{pg.content}</div>
        </section>
      ))}
      {more && seen.size < pages.length && <div className="s-page-unread">📖 아직 안 본 쪽이 있어요 ({seen.size}/{pages.length}) — 아래로 밀어 보세요</div>}
    </>
  );
}

// ── 단서 열람 모달 ─────────────────────────────────────────────────────────
export function ClueModal({ code, collectedSet, onClose, onCollect, onOpen, recovered = [], onRecovered }) {
  const isBody = code === '__body__';
  const c = isBody ? null : getClue(code);

  // 열람 시 확보(신규면 수집 + 특수 연쇄)
  useEffect(() => { if (!isBody && !collectedSet.has(code)) onCollect(code); /* eslint-disable-next-line */ }, [code]);

  if (isBody) {
    return <Shell title="시신" onClose={onClose}><p className="s-detail">침대 위에서 숨진 채 발견되었습니다. 얼굴에 눌린 자국 · 협심증 발작 직후 정황. 성분·접촉흔은 개별 감식으로 확인하세요.</p></Shell>;
  }
  if (!c) return <Shell title="?" onClose={onClose}><p>단서를 찾을 수 없습니다.</p></Shell>;

  const tag = c.type && c.type !== '보통' ? <span className="s-tag">{c.type}</span> : null;
  const person = c.person && c.person !== '공용' ? <span className="s-tag">{c.person}</span> : null;

  // 페이지형 — 쪽을 이어서 보여 준다(PageStack)
  if (Array.isArray(c.pages) && c.pages.length) {
    return (
      <Shell title={<>{c.title}{tag}{person}</>} onClose={onClose}>
        <PageStack pages={c.pages} collectedSet={collectedSet} onCollect={onCollect} />
      </Shell>
    );
  }

  // CCTV형 — 실제 CCTV 열람대(2F 평면도 + 시간대별 인물 동선 마커, 목사방 쪽으로 사라짐)
  if (c.cctv?.timeline) {
    return (
      <CctvModal item={c} evidence={[...collectedSet].map((cd) => ({ code: cd }))}
        onCollect={(cd) => {
          const list = Array.isArray(cd) ? cd : [cd]; // 장면 자동 확보는 여러 장을 한 번에 넘긴다
          const r = onCollect(cd);
          const ok = list.every((x) => (r?.added || []).includes(x) || collectedSet.has(x));
          return { success: ok, message: ok ? `단서 확보! [${list.join(', ')}]` : '확보하지 못했습니다.' };
        }}
        autoCollect onClose={onClose} />
    );
  }

  // 폰형
  if (c.phone) {
    return <PhoneModal code={code} clue={c} collectedSet={collectedSet} onClose={onClose} recoveredInit={recovered.includes(code)} onRecovered={onRecovered} />;
  }

  // 지갑형 — 항목을 눌러 내용물 확인
  if (c.wallet) {
    return <WalletModal clue={c} onClose={onClose} />;
  }

  // 일정표형 — 면담 일정. 기본형으로 떨어지면 "눌러 확인하라"는 한 줄만 남고 면담 내용이 통째로 사라진다.
  if (c.schedule?.entries?.length) {
    return <ScheduleModal clue={c} title={<>{c.title}{tag}{person}</>} onClose={onClose} />;
  }

  // 필적 대조형 — 확보한 다이어리와 라벨 글씨를 비교. 기본형은 "비교해 보자"고만 하고 비교할 곳이 없다.
  if (c.handwriting?.options?.length) {
    return <HandwritingModal clue={c} title={<>{c.title}{tag}{person}</>} collectedSet={collectedSet} onClose={onClose} />;
  }

  // 기본형(이미지 + 상세/설명)
  return (
    <Shell title={<>{c.title}{tag}{person}</>} onClose={onClose}>
      {c.image && <ZoomImg src={c.image} />}
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
      {/* 상세 칸은 고르기 전에도 자리를 잡아 둔다 — 조건부로 통째 생겼다 사라지면 항목 격자가 위아래로 튄다 */}
      <div className="s-wallet-detail" style={{ minHeight: 84 }}>
        {it ? (
          <>
            {it.image && <img src={it.image} alt="" />}
            <div className="s-detail">{it.detail || '특별한 점은 없어 보인다.'}</div>
          </>
        ) : (
          <div style={{ color: 'var(--muted)', fontSize: '.85rem' }}>항목을 고르면 여기에 내용이 표시됩니다.</div>
        )}
      </div>
    </Shell>
  );
}

// ── 일정표 모달 — 면담 일정을 눌러 내용 확인 ──
//   펼침을 목록 아래가 아니라 누른 줄 바로 밑에 둔다 — 방금 고른 줄이 발밑에서 밀려나지 않게.
function ScheduleModal({ clue, title, onClose }) {
  const entries = clue.schedule?.entries || [];
  const [open, setOpen] = useState(() => new Set((clue.schedule?.entries || []).map((_, i) => i)));
  const toggle = (i) => setOpen((o) => { const n = new Set(o); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  return (
    <Shell title={title} onClose={onClose}>
      <p className="s-detail" style={{ marginBottom: 10 }}>{clue.detail || '면담 일정을 눌러 내용을 확인하세요.'}</p>
      {entries.map((e, i) => (
        <div key={i}>
          <button className="s-topic" style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => toggle(i)}>
            <span style={{ color: 'var(--gold)', fontWeight: 700, flex: 'none' }}>{e.time}</span>
            <span style={{ flex: 1, minWidth: 0 }}>{e.person} · {e.title}</span>
            <span style={{ color: 'var(--muted)', flex: 'none' }}>{open.has(i) ? '▾' : '›'}</span>
          </button>
          {open.has(i) && <div className="s-qa"><div className="s-detail">{e.content || '면담 내용이 따로 기재되어 있지 않다.'}</div></div>}
        </div>
      ))}
    </Shell>
  );
}

// ── 필적 대조 모달 — 확보한 다이어리하고만 비교할 수 있다 ──
//   결과 칸은 고르기 전에도 자리를 잡아 둔다 — 선택지를 바꿀 때마다 모달 높이가 출렁이지 않게.
function HandwritingModal({ clue, title, collectedSet, onClose }) {
  const hw = clue.handwriting || {};
  const options = hw.options || [];
  const [pick, setPick] = useState(null);
  const res = pick != null ? options[pick] : null;
  return (
    <Shell title={title} onClose={onClose}>
      <div className="s-detail" style={{ marginBottom: 10 }}>{clue.detail || '다른 사람의 필적과 비교해 보자.'}</div>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>🔍 {hw.prompt || '누구의 글씨와 비교해볼까요?'}</div>
      {options.map((o, i) => {
        const have = collectedSet.has(o.requires);
        return (
          <button key={i} className="s-topic" disabled={!have} onClick={() => setPick(i)}
            style={{ opacity: have ? 1 : .45, cursor: have ? 'pointer' : 'default', borderColor: pick === i ? 'var(--gold)' : undefined }}>
            {have ? `${o.who}의 다이어리` : `🔒 ${o.who}의 다이어리 — 아직 확보하지 못했다`}
          </button>
        );
      })}
      <div className="s-qa" style={{ minHeight: 92 }}>
        {res ? (
          <>
            <div className="q" style={{ color: res.correct ? 'var(--ok)' : 'var(--muted)' }}>{res.correct ? '✔ 필적 일치' : '✗ 불일치'} · {res.who}</div>
            <div className="s-detail">{res.result}</div>
          </>
        ) : (
          <div style={{ color: 'var(--muted)', fontSize: '.85rem' }}>확보한 다이어리하고만 비교할 수 있습니다. 더 모으면 비교할 수 있는 사람이 늘어납니다.</div>
        )}
      </div>
    </Shell>
  );
}

// ── 폰 모달 — 실제 휴대폰 화면처럼(홈 → 앱 → 상세) ─────────────────────────────
const PHONE_APP_ICON = { contacts: '📇', kakao: '💬', sms: '✉️', calls: '📞', browser: '🌐', photos: '🖼️', gallery: '🖼️', messages: '✉️' };
// 문자(sms)는 카톡과 같은 chats 구조라 대화 UI를 그대로 쓴다. 전화(calls)는 통화 기록.
const isChatApp = (t) => t === 'kakao' || t === 'sms';
// 톡서랍 복구 힌트 — QR 앱과 같은 표(src/data/recoverHints.js). 솔로만 따로 적어 두었다가 지안 폰을 엉뚱한 데로 보냈다(15회차).
const recoverHint = (code) => recoverHintFor(code);
function PhoneModal({ code, clue, onClose, recoveredInit = false, onRecovered }) {
  const apps = clue.phone.apps || [];
  const [appId, setAppId] = useState(null);   // null = 홈 화면
  const [chatIdx, setChatIdx] = useState(null); // 카톡: null = 대화 목록
  // 복구는 저장한다 — 창 안의 임시 상태라 다시 열면 또 잠겼고, 복구 안 한 폰을 내밀어도 「지운 대화까지」가 나왔다(16회차)
  const [recovered, setRecovered] = useState(recoveredInit);
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [fails, setFails] = useState(0);  // 3번 틀리면 힌트 — 난이도로 미리 정하지 않고 막힌 사람만 돕는다
  const [lookup, setLookup] = useState('');
  const [lookupRes, setLookupRes] = useState(null);
  const [zoom, setZoom] = useState(null); // 사진 확대
  const app = appId ? apps.find((a) => a.id === appId) : null;
  const recoverProtected = provider.isRecoverProtected(code);

  const tryRecover = async () => {
    const ok = await provider.verifyRecover(code, pw);
    if (ok) { setRecovered(true); setMsg(''); setFails(0); onRecovered?.(code); }
    else { setFails((n) => n + 1); setMsg('비밀번호가 맞지 않습니다.'); setPw(''); }
  };
  const tryLookup = async () => {
    const res = await provider.verifyLookup(code, lookup);
    setLookupRes(res.ok ? (res.result || '조회 결과가 확인되었습니다.') : (app?.lookup?.notFound || '조회되지 않습니다.'));
  };
  // 대화방까지 들어가면 홈(앱 목록)이 두 겹 위라 나올 때마다 두 번 눌러야 했다 — 한 번에 나가는 길을 따로 둔다.
  const home = () => { setAppId(null); setChatIdx(null); };
  const back = () => { if (isChatApp(app?.type) && chatIdx != null) setChatIdx(null); else home(); };
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
            <div className="s-phone-appbar">
              <button className="pab-back" onClick={back} aria-label="뒤로">‹</button>
              <span>{isChatApp(app.type) && chatIdx != null ? (app.chats?.[chatIdx]?.name || app.name) : (app.name || app.type)}</span>
              <button className="pab-back" style={{ marginLeft: 'auto', fontSize: '1.05rem' }} onClick={home} aria-label="앱 목록">🏠</button>
            </div>
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
                      {/* 결과가 { title, lines } 로 오는 조회가 있다 — 그대로 그리면 화면 전체가 꺼졌다
                          (2026-10-08 시험: 수료증 진위조회에서 까만 화면, 진행 불가) */}
                      {lookupRes && (typeof lookupRes === 'object'
                        ? <div className="pbr-res">{lookupRes.title && <b>{lookupRes.title}</b>}{(lookupRes.lines || []).map((l, i) => <div key={i}>{l}</div>)}</div>
                        : <p className="pbr-res">{lookupRes}</p>)}
                    </div>
                  )}
                </div>
              )}

              {isChatApp(app.type) && chatIdx == null && (
                <div className="s-kk-list">
                  {(app.chats || []).map((ch, i) => {
                    const locked = ch.deleted && recoverProtected && !recovered;
                    const last = (ch.messages || [])[(ch.messages || []).length - 1];
                    return (
                      <button key={i} className="s-kk-row" onClick={() => setChatIdx(i)}>
                        <span className="kk-av">{initial(ch.name)}</span>
                        <span className="kk-body">
                          <span className="kk-name">{ch.name}{ch.deleted && <span className="s-tag danger">{locked ? '삭제됨' : '복원됨'}</span>}</span>
                          <span className="kk-prev">{locked ? '🔒 삭제된 대화 — 눌러서 복구' : (last?.text || '')}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {isChatApp(app.type) && chatIdx != null && (() => {
                const ch = (app.chats || [])[chatIdx]; if (!ch) return null;
                const locked = ch.deleted && recoverProtected && !recovered;
                if (locked) return (
                  <div className="s-kk-recover">
                    <div className="kkr-lock">🔒 삭제된 대화</div>
                    <div className="kkr-desc">톡서랍 복구 비밀번호가 필요합니다.</div>
                    {/* 실마리는 처음부터 — 세 번 틀린 뒤에만 떠서 복구 방법을 끝내 몰랐다(2026-10-01 시험) */}
                    <div className="kkr-hint">🔑 실마리: {recoverHint(code)}</div>
                    <div className="s-pw"><input value={pw} onChange={(e) => setPw(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="복구 비밀번호 4자리" inputMode="numeric" maxLength={4} /><button className="s-btn sm" onClick={tryRecover}>복구</button></div>
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

              {/* 전화 — 통화 기록(문세린 폰의 13:31 112 신고·약혼자 통화가 여기 있다) */}
              {app.type === 'calls' && (
                <div className="s-kk-list">
                  {(app.calls || []).map((c, i) => {
                    const dir = c.direction === 'out' ? { m: '↗', k: '발신' }
                      : c.direction === 'missed' ? { m: '✖', k: '부재중' } : { m: '↙', k: '수신' };
                    return (
                      <div key={i} className={`s-kk-row call ${c.direction || 'in'}`}>
                        <span className="kk-av">{dir.m}</span>
                        <span className="kk-body">
                          <span className="kk-name">{c.name}</span>
                          <span className="kk-prev">{dir.k}{c.time ? ` · ${c.time}` : ''}{c.duration ? ` · ${c.duration}` : ''}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </>
        )}
      </div>
      {zoom && <ZoomOverlay src={zoom.image} caption={zoom.caption} onClose={() => setZoom(null)} />}
    </div>
  );
}
