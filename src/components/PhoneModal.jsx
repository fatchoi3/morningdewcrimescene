import { useEffect, useState } from 'react';

/**
 * PhoneModal
 * 핸드폰 단서를 실제 스마트폰처럼 표시한다.
 * 홈 화면의 앱 아이콘 → 앱 화면으로 진입한다.
 * 한 인물의 모든 핸드폰 단서(검색·카톡·문자·사진)를 이 하나의 폰에 모은다.
 *
 * 데이터 형식 (evidenceMap 항목의 phone 필드):
 *   phone: {
 *     owner: '이사랑의 핸드폰',
 *     apps: [
 *       { id, type:'browser', name, searches: [{ query, title?, snippet, image? }] },
 *       { id, type:'kakao',   name, chats:    [{ name, messages: [{ from:'me'|'them', text, time?, deleted? }] }] },
 *       { id, type:'sms',     name, chats:    [{ name, messages: [{ from:'me'|'them', text, time?, deleted? }] }] },
 *       { id, type:'photos',  name, photos:   [{ image?, caption, deleted? }] },
 *     ]
 *   }
 */

const APP_META = {
  browser: { label: '인터넷', icon: '🌐', color: '#2db400' },
  kakao: { label: '카카오톡', icon: '💬', color: '#ffe812' },
  sms: { label: '메시지', icon: '✉️', color: '#34c759' },
  photos: { label: '사진', icon: '🖼️', color: '#ff5e57' },
};

/* 인터넷(브라우저) 앱 — 검색 기록 목록 → 검색 결과 페이지 */
function BrowserApp({ app }) {
  const [openIdx, setOpenIdx] = useState(null);

  if (openIdx !== null) {
    const s = app.searches[openIdx];
    return (
      <div className="browser">
        <div className="browser-bar">
          <button className="browser-back" onClick={() => setOpenIdx(null)} aria-label="뒤로">←</button>
          <span className="browser-url">🔍 {s.query}</span>
        </div>
        <div className="browser-page">
          {s.image && <img className="browser-image" src={s.image} alt={s.query} />}
          <h3 className="browser-result-title">{s.title || s.query}</h3>
          <p className="browser-result-text">{s.snippet}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="browser">
      <div className="browser-bar">
        <span className="browser-url">🔍 최근 검색 기록</span>
      </div>
      <div className="browser-history">
        {app.searches.map((s, i) => (
          <button key={i} className="browser-search-item" onClick={() => setOpenIdx(i)}>
            <span className="browser-search-icon">🔍</span>
            <span className="browser-search-q">{s.query}</span>
            <span className="browser-search-go">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* 메시지(카카오톡 / 문자) 앱 — 대화방 목록 → 대화 내용 */
function MessagesApp({ app, variant }) {
  const [openIdx, setOpenIdx] = useState(null);

  if (openIdx !== null) {
    const chat = app.chats[openIdx];
    return (
      <div className={`msg msg--${variant}`}>
        <div className="msg-header">
          <button className="msg-back" onClick={() => setOpenIdx(null)} aria-label="뒤로">←</button>
          <span className="msg-header-name">{chat.name}</span>
        </div>
        <div className="msg-messages">
          {chat.messages.map((m, i) => (
            <div key={i} className={`msg-row ${m.from === 'me' ? 'me' : 'them'}`}>
              {m.from !== 'me' && variant === 'kakao' && <span className="msg-name">{chat.name}</span>}
              <div className="msg-line">
                <span className={`msg-bubble ${m.deleted ? 'deleted' : ''}`}>
                  {m.deleted ? '삭제된 메시지입니다.' : m.text}
                </span>
                {m.time && <span className="msg-time">{m.time}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`msg msg--${variant}`}>
      <div className="msg-list-header">{variant === 'sms' ? '메시지' : '채팅'}</div>
      <div className="msg-list">
        {app.chats.map((c, i) => {
          const last = c.messages[c.messages.length - 1];
          return (
            <button key={i} className="msg-chat-item" onClick={() => setOpenIdx(i)}>
              <span className="msg-avatar">{c.name?.[0] ?? '?'}</span>
              <span className="msg-chat-info">
                <span className="msg-chat-name">{c.name}</span>
                <span className="msg-chat-last">
                  {last?.deleted ? '삭제된 메시지입니다.' : last?.text}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* 사진(갤러리) 앱 — 썸네일 그리드 → 전체 보기 */
function PhotosApp({ app }) {
  const [openIdx, setOpenIdx] = useState(null);
  const [errored, setErrored] = useState({});

  if (openIdx !== null) {
    const p = app.photos[openIdx];
    const showImg = p.image && !p.deleted && !errored[openIdx];
    return (
      <div className="photos">
        <div className="photos-view-bar">
          <button className="photos-back" onClick={() => setOpenIdx(null)} aria-label="뒤로">←</button>
          <span>{openIdx + 1} / {app.photos.length}</span>
        </div>
        <div className="photos-view">
          {showImg ? (
            <img src={p.image} alt={p.caption} onError={() => setErrored((e) => ({ ...e, [openIdx]: true }))} />
          ) : (
            <div className="photos-placeholder photos-placeholder--lg">{p.deleted ? '🗑️' : '🖼️'}</div>
          )}
        </div>
        <p className="photos-caption">{p.deleted ? '삭제된 사진 (복구 불가)' : p.caption}</p>
      </div>
    );
  }

  return (
    <div className="photos">
      <div className="photos-grid">
        {app.photos.map((p, i) => {
          const showImg = p.image && !p.deleted && !errored[i];
          return (
            <button key={i} className="photos-tile" onClick={() => setOpenIdx(i)}>
              {showImg ? (
                <img src={p.image} alt={p.caption} onError={() => setErrored((e) => ({ ...e, [i]: true }))} />
              ) : (
                <span className="photos-placeholder">{p.deleted ? '🗑️' : '🖼️'}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PhoneModal({ item, onClose }) {
  const [appId, setAppId] = useState(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (appId) setAppId(null);
        else onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, appId]);

  const apps = item.phone.apps || [];
  const current = apps.find((a) => a.id === appId) || null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="phone-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close phone-close" onClick={onClose} aria-label="닫기">✕</button>

        <div className="phone-frame">
          <div className="phone-notch" />
          <div className="phone-statusbar">
            <span>9:41</span>
            <span className="phone-statusbar-icons">●●● 📶 🔋</span>
          </div>

          <div className="phone-screen">
            {!current && (
              <div className="phone-home">
                <div className="phone-owner">{item.phone.owner || item.title}</div>
                <div className="phone-app-grid">
                  {apps.map((a) => {
                    const meta = APP_META[a.type] || {};
                    return (
                      <button key={a.id} className="phone-app" onClick={() => setAppId(a.id)}>
                        <span className="phone-app-icon" style={{ background: meta.color }}>
                          {a.icon || meta.icon || '📱'}
                        </span>
                        <span className="phone-app-label">{a.name || meta.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="phone-hint">앱을 눌러 내용을 확인하세요</div>
              </div>
            )}

            {current && (
              <div className="phone-app-view">
                <div className="phone-app-topbar">
                  <button className="phone-home-btn" onClick={() => setAppId(null)} aria-label="홈">⌂</button>
                  <span className="phone-app-title">{current.name || APP_META[current.type]?.label}</span>
                </div>
                <div className="phone-app-body">
                  {current.type === 'browser' && <BrowserApp app={current} />}
                  {current.type === 'kakao' && <MessagesApp app={current} variant="kakao" />}
                  {current.type === 'sms' && <MessagesApp app={current} variant="sms" />}
                  {current.type === 'photos' && <PhotosApp app={current} />}
                </div>
              </div>
            )}
          </div>

          <div className="phone-homebar" />
        </div>
      </div>
    </div>
  );
}

export default PhoneModal;
