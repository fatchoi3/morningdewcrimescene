import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SoloApp from './SoloApp.jsx';
import './solo.css';

createRoot(document.getElementById('solo-root')).render(
  <StrictMode>
    <SoloApp />
  </StrictMode>,
);
