import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './i18n';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<div className="loading-state"><div className="spinner-green"></div><p>Cargando... / Loading...</p></div>}>
      <App />
    </Suspense>
  </React.StrictMode>,
);
