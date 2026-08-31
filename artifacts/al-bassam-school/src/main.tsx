import { createRoot } from 'react-dom/client';

import App from './App';
import { setBaseUrl } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import './index.css';

const frontendOnly = import.meta.env.VITE_FRONTEND_ONLY === 'true' || (!window.alBassamDesktop && !import.meta.env.VITE_API_URL);
const runtimeApiUrl = window.alBassamDesktop?.apiBaseUrl || import.meta.env.VITE_API_URL || '/api';
if (frontendOnly) setBaseUrl(null);
else setBaseUrl(runtimeApiUrl);

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
