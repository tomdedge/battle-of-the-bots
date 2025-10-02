import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Start MSW for E2E tests
if (process.env.REACT_APP_MSW_ENABLED === 'true') {
  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass'
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
