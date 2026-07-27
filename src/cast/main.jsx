import React from 'react';
import ReactDOM from 'react-dom/client';
import CastEditor from './CastEditor.jsx';
import './cast.css';

ReactDOM.createRoot(document.getElementById('cast-root')).render(
  <React.StrictMode>
    <CastEditor />
  </React.StrictMode>
);
