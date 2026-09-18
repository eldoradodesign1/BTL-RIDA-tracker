import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js', {scope: './'})
      .then((registration) => {
        console.info('[PWA] Service worker registered:', registration.scope);
      })
      .catch((error) => {
        console.error('[PWA] Service worker registration failed:', error);
      });
  });
}
