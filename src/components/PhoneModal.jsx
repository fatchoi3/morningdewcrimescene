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
 *       { id, type:'calls',   name, calls:    [{ name, direction:'out'|'in'|'missed', time?, duration? }] },
 *     ]
 *   }
 */

const APP_META = {
  browser: { label: '인터넷', icon: '🌐', color: '#2db400' },
  kakao: { label: '카카오톡', icon: '💬', color: '#ffe812' },
  sms: { label: '메시지', icon: '✉️', color: '#34c759' },
  photos: { label: '사진', icon: '🖼️', color: '#ff5e57' },
  contacts: { label: '연락처', icon: '📇', color: '#5b8def' },
  calls: { label: '전화', icon: '📞', color: '#4cd964' },
};

/* 연락처(주소록) 앱 — 다른 인물을 어떤 이름으로 저장했는지 */
function ContactsApp({ app }) {
  return (
    <div className="contacts">
      <div className="contacts-header">연락처</div>
      <div className="contacts-list">
        {app.contacts.map((c, i) => (
          <div key={i} className="contacts-item">
            <span className="contacts-avatar">{(c.name || '?')[0]}</span>
            <span className="contacts-info">
              <span className="contacts-name">{c.name}</span>
              {c.who && <span className="contacts-who">{c.who}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 전화 앱 — 통화 기록(발신/수신/부재중) 목록 */
function CallsApp({ app }) {
  const calls = app.calls || [];
  const ICON = { out: '↗', in: '↙', missed: '✖' };
  const LABEL = { out: '발신', in: '수신', missed: '부재중' };
  return (
    <div className="calls">
      <div className="calls-header">통화 기록</div>
      <div className="calls-list">
        {calls.map((c, i) => {
          const dir = c.direction || 'out';
          return (
            <div key={i} className={`calls-item calls-item--${dir}`}>
              <span className="calls-avatar">{(c.name || '?')[0]}</span>
              <span className="calls-info">
                <span className="calls-name">{c.name}</span>
                <span className="calls-meta">
                  {ICON[dir]} {LABEL[dir]}{c.duration ? ` · ${c.duration}` : ''}
                </span>
              </span>
              {c.time && <span className="calls-time">{c.time}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

/* 메시지(카카오톡 / 문자) 앱 — 대화방 목록 → 대화 내용
 * 카카오톡: deleted:true 대화방은 잠겨 있고, '톡서랍'으로 복구해야 열린다.
 *   - app.recoverPassword 있으면 비밀번호 입력, 없으면 확인(예)만으로 복구. */
function MessagesApp({ app, variant }) {
  const [openIdx, setOpenIdx] = useState(null);
  const [drawer, setDrawer] = useState(false);   // 톡서랍 패널 열림
  const [recovered, setRecovered] = useState(false);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  const isKakao = variant === 'kakao';
  const chats = app.chats || [];
  const hasDeleted = chats.some((c) => c.deleted);
  const needPw = !!app.recoverPassword;

  const doRecover = () => {
    if (needPw && pw.trim() !== String(app.recoverPassword)) {
      setErr('비밀번호가 일치하지 않습니다.');
      return;
    }
    setRecovered(true);
    setDrawer(false);
    setErr('');
    setPw('');
  };

  // 톡서랍 패널
  if (drawer) {
    return (
      <div className={`msg msg--${variant}`}>
        <div className="msg-header">
          <button className="msg-back" onClick={() => { setDrawer(false); setErr(''); setPw(''); }} aria-label="뒤로">←</button>
          <span className="msg-header-name">🗄️ 톡서랍</span>
        </div>
        <div className="td-lock">
          <div className="td-icon">🗄️</div>
          <div className="td-title">삭제된 대화 복구</div>
          <p className="td-desc">
            삭제된 대화 데이터 전체를 복구하시겠습니까?
            {needPw && <><br />복구하려면 비밀번호를 입력하세요.</>}
          </p>
          {needPw && (
            <div className="td-form">
              <input
                type="password"
                inputMode="numeric"
                name="td-pw"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-form-type="other"
                data-1p-ignore
                value={pw}
                placeholder="비밀번호"
                onChange={(e) => { setPw(e.target.value); setErr(''); }}
                onKeyDown={(e) => e.key === 'Enter' && doRecover()}
              />
            </div>
          )}
          <button className="td-recover-btn" type="button" onClick={doRecover}>
            {needPw ? '복구하기' : '예, 전체 복구합니다'}
          </button>
          {err && <p className="td-err">{err}</p>}
        </div>
      </div>
    );
  }

  // 대화 내용 보기
  if (openIdx !== null) {
    const chat = chats[openIdx];
    return (
      <div className={`msg msg--${variant}`}>
        <div className="msg-header">
          <button className="msg-back" onClick={() => setOpenIdx(null)} aria-label="뒤로">←</button>
          <span className="msg-header-name">{chat.name}{chat.deleted && recovered ? ' (복구됨)' : ''}</span>
        </div>
        <div className="msg-messages">
          {chat.messages.map((m, i) => (
            <div key={i} className={`msg-row ${m.from === 'me' ? 'me' : 'them'}`}>
              {m.from !== 'me' && isKakao && <span className="msg-name">{chat.name}</span>}
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

  // 대화방 목록
  return (
    <div className={`msg msg--${variant}`}>
      <div className="msg-list-header">{isKakao ? '채팅' : '메시지'}</div>
      {isKakao && hasDeleted && (
        <button className="msg-drawer-btn" type="button" onClick={() => setDrawer(true)}>
          🗄️ 톡서랍 {recovered ? '· 복구 완료' : '· 삭제된 대화 복구'}
        </button>
      )}
      <div className="msg-list">
        {chats.map((c, i) => {
          const locked = c.deleted && !recovered;
          const last = c.messages[c.messages.length - 1];
          return (
            <button
              key={i}
              className={`msg-chat-item ${locked ? 'msg-chat-item--locked' : ''}`}
              onClick={() => { if (!locked) setOpenIdx(i); }}
            >
              <span className="msg-avatar">{locked ? '🔒' : (c.name?.[0] ?? '?')}</span>
              <span className="msg-chat-info">
                <span className="msg-chat-name">
                  {c.name}{c.deleted ? (recovered ? ' (복구됨)' : ' (삭제됨)') : ''}
                </span>
                <span className="msg-chat-last">
                  {locked
                    ? '삭제된 대화입니다. 톡서랍에서 복구하세요.'
                    : (last?.deleted ? '삭제된 메시지입니다.' : last?.text)}
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
    // 휴지통의 사진이라도 image가 있으면 '복구된 사진'으로 보여준다.
    const showImg = p.image && !errored[openIdx];
    return (
      <div className="photos">
        <div className="photos-view-bar">
          <button className="photos-back" onClick={() => setOpenIdx(null)} aria-label="뒤로">←</button>
          <span>{p.deleted ? '🗑️ 휴지통' : '사진'}</span>
        </div>
        <div className="photos-view">
          {showImg ? (
            <img src={p.image} alt={p.caption} onError={() => setErrored((e) => ({ ...e, [openIdx]: true }))} />
          ) : (
            <div className="photos-placeholder photos-placeholder--lg">{p.deleted ? '🗑️' : '🖼️'}</div>
          )}
        </div>
        <p className="photos-caption">
          {p.deleted && p.image ? `[복구된 사진] ${p.caption || ''}` : (p.deleted ? '삭제된 사진 (복구 불가)' : p.caption)}
        </p>
      </div>
    );
  }

  const tile = (p, i) => {
    const showImg = p.image && !p.deleted && !errored[i]; // 휴지통 밖은 정상 표시
    return (
      <button key={i} className={`photos-tile ${p.deleted ? 'photos-tile--trash' : ''}`} onClick={() => setOpenIdx(i)}>
        {showImg ? (
          <img src={p.image} alt={p.caption} onError={() => setErrored((e) => ({ ...e, [i]: true }))} />
        ) : (
          <span className="photos-placeholder">{p.deleted ? '🗑️' : '🖼️'}</span>
        )}
      </button>
    );
  };

  const normal = [];
  const trash = [];
  app.photos.forEach((p, i) => { (p.deleted ? trash : normal).push(tile(p, i)); });

  return (
    <div className="photos">
      <div className="photos-grid">{normal}</div>
      {trash.length > 0 && (
        <>
          <div className="photos-section">🗑️ 휴지통 (최근 삭제)</div>
          <div className="photos-grid">{trash}</div>
        </>
      )}
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
                  {current.type === 'contacts' && <ContactsApp app={current} />}
                  {current.type === 'calls' && <CallsApp app={current} />}
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
