// ─────────────────────────────────────────────────────────────────────────────
// features/clues — 단서 열람 모달.
//   ClueModal이 진입점 — 타입별로 분기:
//     페이지형 / CCTV형(CctvModal) / 폰형(PhoneModal) / 지갑형(WalletModal) / 기본형.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { getClue, provider } from '../content.js';
import { Shell } from '../ui/overlays.jsx';
import CctvModal from '../../components/CctvModal.jsx';

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
    return <PhoneModal code={code} clue={c} collectedSet={collectedSet} onClose={onClose} />;
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

// ── 폰 모달 — 실제 휴대폰 화면처럼(홈 → 앱 → 상세) ─────────────────────────────
const PHONE_APP_ICON = { contacts: '📇', kakao: '💬', sms: '✉️', calls: '📞', browser: '🌐', photos: '🖼️', gallery: '🖼️', messages: '✉️' };
// 문자(sms)는 카톡과 같은 chats 구조라 대화 UI를 그대로 쓴다. 전화(calls)는 통화 기록.
const isChatApp = (t) => t === 'kakao' || t === 'sms';
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
  const back = () => { if (isChatApp(app?.type) && chatIdx != null) setChatIdx(null); else { setAppId(null); setChatIdx(null); } };
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
            <div className="s-phone-appbar"><button className="pab-back" onClick={back} aria-label="뒤로">‹</button><span>{isChatApp(app.type) && chatIdx != null ? (app.chats?.[chatIdx]?.name || app.name) : (app.name || app.type)}</span></div>
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
                    {fails >= 3 && <div className="kkr-hint">힌트: 상대의 생일 4자리 — 다이어리를 찾아보세요</div>}
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

              {/* 전화 — 통화 기록(이가현 폰의 13:31 112 신고·약혼자 통화가 여기 있다) */}
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
