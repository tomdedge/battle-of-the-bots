import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import './index.css';

// Start MSW for E2E tests (only in development)
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_MSW_ENABLED === 'true') {
  import('./mocks/browser').then(({ worker }) => {
    worker.start({
      onUnhandledRequest: 'bypass'
    });
  }).catch(() => {
    // MSW not available, continue without it
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Only register service worker in production, not in Docker
if (process.env.NODE_ENV === 'production' && !window.location.hostname.includes('localhost')) {
  serviceWorkerRegistration.register();
} else {
  serviceWorkerRegistration.unregister();
}
