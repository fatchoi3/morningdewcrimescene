import { useEffect, useState } from 'react';

/**
 * ScheduleModal
 * 목사님 일정표 단서. 면담 일정 목록 → 항목을 누르면 면담 내용을 확인한다.
 *
 * item.schedule = {
 *   entries: [{ time, person, title, content }]
 * }
 */
function ScheduleModal({ item, onClose }) {
  const [openIdx, setOpenIdx] = useState(null);
  const entries = item.schedule?.entries || [];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (openIdx !== null) setOpenIdx(null);
        else onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, openIdx]);

  const entry = openIdx !== null ? entries[openIdx] : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="sched-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="닫기">✕</button>
        <div className="sched-titlebar">🗓️ {item.title || '목사님 일정표'}</div>

        {entry ? (
          <div className="sched-detail">
            <button className="sched-back" onClick={() => setOpenIdx(null)}>← 일정표로</button>
            <div className="sched-detail-head">
              <span className="sched-detail-time">{entry.time}</span>
              <span className="sched-detail-person">{entry.person}</span>
            </div>
            <h3 className="sched-detail-title">{entry.title}</h3>
            <p className="sched-detail-text">{entry.content || '면담 내용이 따로 기재되어 있지 않다.'}</p>
          </div>
        ) : (
          <>
            <p className="sched-help">면담 일정을 눌러 내용을 확인하세요.</p>
            <div className="sched-list">
              {entries.map((e, i) => (
                <button key={i} className="sched-row" onClick={() => setOpenIdx(i)}>
                  <span className="sched-time">{e.time}</span>
                  <span className="sched-info">
                    <span className="sched-person">{e.person}</span>
                    <span className="sched-row-title">{e.title}</span>
                  </span>
                  <span className="sched-go">›</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ScheduleModal;
