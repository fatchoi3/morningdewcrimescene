// ─────────────────────────────────────────────────────────────────────────────
// features/clues — 단서 열람 모달.
//   ClueModal이 진입점 — 타입별로 분기:
//     페이지형 / CCTV형(CctvModal) / 폰형(PhoneModal) / 지갑형(WalletModal) /
//     일정표형(ScheduleModal) / 필적대조형(HandwritingModal) / 기본형.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { getClue, provider } from '../content.js';
import { Shell } from '../ui/overlays.jsx';
import CctvModal from '../../components/CctvModal.jsx';

const PAGE_IMG_H = 170;   // 그림이 있는 쪽·없는 쪽의 높이를 맞추려고 늘 잡아 두는 자리

// 페이지형 본문 칸의 최소 높이 — 가장 긴 쪽을 기준으로 잡는다.
//   폰 세로(375px)에서 본문 폭 309px · 16px 글씨라 한 줄에 19자, 줄높이 28px.
//   본문은 white-space: pre-wrap 이라 명시적 줄바꿈도 한 줄을 차지한다 — 글자수만 세면
//   줄바꿈이 많은 쪽(브리핑)에서 197px 이나 어긋난다.
//   화면을 넘기면서까지 늘리지는 않는다 — 그러면 「다음 →」이 스크롤 아래로 숨는다.
//   그렇게 넘치는 쪽은 CSS 가 페이저를 바닥에 고정해(.s-pager sticky) 자리를 지킨다.
const pagerMinH = (pages, hasImage) => {
  const lines = (s) => (s || '').split('\n').reduce((n, ln) => n + Math.max(1, Math.ceil(ln.length / 19)), 0);
  const want = pages.reduce((n, p) => Math.max(n, lines(p.content)), 0) * 28;
  // 헤더·쪽 제목·페이저·안팎 여백으로 나가는 몫(실측 약 160px)과 그림 자리를 뺀 나머지가 상한
  const room = Math.round(window.innerHeight * 0.88) - 160 - (hasImage ? PAGE_IMG_H + 10 : 0);
  return Math.min(want, Math.max(140, room));
};

// ── 단서 열람 모달 ─────────────────────────────────────────────────────────
export function ClueModal({ code, collectedSet, onClose, onCollect, onOpen }) {
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
    const hasPageImage = c.pages.some((p) => p.image);
    if (pg?.unlocks && !collectedSet.has(pg.unlocks)) onCollect(pg.unlocks);
    return (
      <Shell title={<>{c.title}{tag}{person}</>} onClose={onClose}>
        {/* 그림이 한 쪽에만 있으면 그 쪽에서만 아래가 밀려 버튼이 도망간다 — 자리를 늘 잡아 둔다 */}
        {hasPageImage && (
          <div style={{ height: PAGE_IMG_H, marginBottom: 10 }}>
            {pg.image && <img src={pg.image} alt="" style={{ height: '100%', width: '100%', objectFit: 'contain', marginBottom: 0 }} />}
          </div>
        )}
        <div style={{ fontWeight: 800, marginBottom: 6 }}>{pg.title}</div>
        {/* 쪽마다 글 길이가 달라 「다음 →」이 손가락 밑에서 움직인다(실측 56px, 버튼 높이는 32px).
            그 단서의 가장 긴 쪽에 맞춰 본문 칸을 미리 잡아 두면 버튼이 제자리에 머문다. */}
        <div className="s-detail" style={{ minHeight: pagerMinH(c.pages, hasPageImage) }}>{pg.content}</div>
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
    return <PhoneModal code={code} clue={c} collectedSet={collectedSet} onClose={onClose} />;
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
  const [open, setOpen] = useState(null);
  return (
    <Shell title={title} onClose={onClose}>
      <p className="s-detail" style={{ marginBottom: 10 }}>{clue.detail || '면담 일정을 눌러 내용을 확인하세요.'}</p>
      {entries.map((e, i) => (
        <div key={i}>
          <button className="s-topic" style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => setOpen(open === i ? null : i)}>
            <span style={{ color: 'var(--gold)', fontWeight: 700, flex: 'none' }}>{e.time}</span>
            <span style={{ flex: 1, minWidth: 0 }}>{e.person} · {e.title}</span>
            <span style={{ color: 'var(--muted)', flex: 'none' }}>{open === i ? '▾' : '›'}</span>
          </button>
          {open === i && <div className="s-qa"><div className="s-detail">{e.content || '면담 내용이 따로 기재되어 있지 않다.'}</div></div>}
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
// 톡서랍 복구 힌트 — 폰마다 비번의 출처가 달라, 이미 막힌 사람을 엉뚱한 데로 보내면 안 된다.
// 목사 폰만 생일이 아니라 결혼기념일이고, 그 날짜는 목사님 일기장 뒷장에만 적혀 있다.
const recoverHint = (clue) => (clue.person === '목사'
  ? '생일이 아닙니다 — 목사님 일기장을 끝까지 넘겨, 잊은 적 없다는 기념일을 찾아보세요'
  : '상대의 생일 4자리 — 다이어리를 찾아보세요');
function PhoneModal({ code, clue, onClose }) {
  const apps = clue.phone.apps || [];
  const [appId, setAppId] = useState(null);   // null = 홈 화면
  const [chatIdx, setChatIdx] = useState(null); // 카톡: null = 대화 목록
  const [recovered, setRecovered] = useState(false);
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
    if (ok) { setRecovered(true); setMsg(''); setFails(0); }
    else { setFails((n) => n + 1); setMsg('비밀번호가 맞지 않습니다.'); }
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
                      {lookupRes && <p className="pbr-res">{lookupRes}</p>}
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
                          <span className="kk-prev">{locked ? '🔒 삭제된 대화 — 복구 필요' : (last?.text || '')}</span>
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
                    {fails >= 3 && <div className="kkr-hint">힌트: {recoverHint(clue)}</div>}
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
      {zoom && (
        <div className="s-phone-zoom" onClick={(e) => { e.stopPropagation(); setZoom(null); }}>
          <img src={zoom.image} alt="" /><div className="pz-cap">{zoom.caption}</div>
        </div>
      )}
    </div>
  );
}
