import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SoloApp from './SoloApp.jsx';
import { DialogProvider } from './ui/dialog.jsx';
import './solo.css';

createRoot(document.getElementById('solo-root')).render(
  <StrictMode>
    {/* 알림·확인·팝업은 전부 이 안에서 — window.alert/confirm 은 쓰지 않는다 */}
    <DialogProvider>
      <SoloApp />
    </DialogProvider>
  </StrictMode>,
);

// PWA 서비스워커 — 프로덕션에서만 등록(개발 HMR 방해 방지)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // 하위 경로 배포에서도 맞도록 base 기준으로 등록한다(루트 배포면 그대로 '/sw.js').
    const base = import.meta.env.BASE_URL || '/';
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {});
  });
}

