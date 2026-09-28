// ─────────────────────────────────────────────────────────────────────────────
// ui/dialog — 게임 안의 알림·확인·팝업 창 하나로 통일.
//   window.alert / window.confirm 은 쓰지 않는다(브라우저 기본 창은 게임 분위기를
//   깨고 모바일에서 도메인까지 노출된다). 대신 같은 톤의 창을 띄우고 Promise 로 답을 받는다.
//
//   const dlg = useDialog();
//   await dlg.alert('감식 결과가 도착했습니다');                 // 확인 하나
//   if (await dlg.confirm('저장을 초기화할까요?')) { … }          // 확인/취소 → true|false
//   await dlg.popup({ title: '⭐ 추리 단서', body: <p>…</p> });   // 임의 내용
//
//   문자열만 넘기면 본문으로, 객체면 { title, body, ok, cancel, tone } 로 세밀하게.
//   tone: 'danger' 면 확인 버튼이 붉은색(되돌릴 수 없는 것).
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const DialogCtx = createContext(null);

const normalize = (opts) => (typeof opts === 'string' ? { body: opts } : (opts || {}));

export function DialogProvider({ children }) {
  const [dlg, setDlg] = useState(null); // { kind, title, body, ok, cancel, tone, resolve }

  // 답을 한 번만 돌려준다 — 배경 탭·ESC·버튼이 겹쳐 두 번 닫혀도 안전하게
  const settle = useCallback((value) => {
    setDlg((cur) => { cur?.resolve?.(value); return null; });
  }, []);

  const api = useMemo(() => {
    const open = (kind, opts) => new Promise((resolve) => setDlg({ kind, ...normalize(opts), resolve }));
    return {
      alert: (opts) => open('alert', opts),
      confirm: (opts) => open('confirm', opts),
      popup: (opts) => open('popup', opts),
      close: () => settle(null),
    };
  }, [settle]);

  // ESC = 취소(확인 창에서는 false), 되돌릴 수 없는 쪽으로 기울지 않게
  useEffect(() => {
    if (!dlg) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') settle(dlg.kind === 'confirm' ? false : null);
      if (e.key === 'Enter' && dlg.kind !== 'popup') settle(dlg.kind === 'confirm' ? true : null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dlg, settle]);

  const isConfirm = dlg?.kind === 'confirm';
  const dismiss = () => settle(isConfirm ? false : null);

  return (
    <DialogCtx.Provider value={api}>
      {children}
      {dlg && (
        <div className="s-modal-ov s-dialog-ov" onClick={dismiss} role="presentation">
          <div className="s-modal s-dialog" onClick={(e) => e.stopPropagation()}
            role={isConfirm ? 'alertdialog' : 'dialog'} aria-modal="true" aria-label={dlg.title || '알림'}>
            {dlg.title && (
              <div className="s-modal-h">
                <div className="mt">{dlg.title}</div>
                <button className="mx" onClick={dismiss} aria-label="닫기">✕</button>
              </div>
            )}
            <div className="s-modal-b">
              {typeof dlg.body === 'string' ? <p style={{ margin: 0 }}>{dlg.body}</p> : dlg.body}
              <div className="s-dialog-acts">
                {isConfirm && (
                  <button className="s-dialog-btn ghost" onClick={() => settle(false)}>{dlg.cancel || '취소'}</button>
                )}
                <button className={`s-dialog-btn${dlg.tone === 'danger' ? ' danger' : ''}`} autoFocus
                  onClick={() => settle(isConfirm ? true : null)}>{dlg.ok || (isConfirm ? '확인' : '알겠어요')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogCtx.Provider>
  );
}

/** 알림·확인·팝업을 띄운다. DialogProvider 안에서만 쓸 수 있다. */
export function useDialog() {
  const ctx = useContext(DialogCtx);
  if (!ctx) throw new Error('useDialog: DialogProvider 안에서만 쓸 수 있습니다');
  return ctx;
}
