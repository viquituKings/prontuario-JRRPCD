import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Proteção global para capturar erros assíncronos no carregamento inicial
window.addEventListener('error', (event) => {
  console.error('Erro global não tratado capturado:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rejeitada não tratada capturada:', event.reason);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

