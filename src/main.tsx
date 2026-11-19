import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { CrashScreen } from './components/ui/DataState';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Son savunma hattı: sağlayıcılar/Navbar seviyesindeki hatalar için. Sayfa hataları RouteBoundary'de yakalanır. */}
    <ErrorBoundary
      fallback={() => (
        <div className="flex min-h-dvh items-center bg-void">
          <CrashScreen onRetry={() => window.location.reload()} />
        </div>
      )}
    >
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
