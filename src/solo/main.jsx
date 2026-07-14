import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SoloApp from './SoloApp.jsx';
import './solo.css';

createRoot(document.getElementById('solo-root')).render(
  <StrictMode>
    <SoloApp />
  </StrictMode>,
);

// PWA 서비스워커 — 프로덕션에서만 등록(개발 HMR 방해 방지)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  });
}

