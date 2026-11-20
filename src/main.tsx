import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Self-host fontlar (latin + latin-ext → ğ ü ş ı İ ö ç ₺). Mercedes-Benz showroom estetiği: Serif Display + temiz Sans.
// font-display = Playfair Display (400/500; 600 kullanılmadığı için yüklenmez), font-sans = Inter (değişken)
import '@fontsource-variable/inter';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/500.css';
import './index.css';
import App from './App.tsx';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { CrashScreen } from './components/ui/DataState';

// P2: Yeni bir dağıtımdan sonra açık sekme eski (artık var olmayan) bir lazy parçayı isterse, sonsuz döngüye
// girmeden bir kez yenilenir. Vite bu durumda 'vite:preloadError' yayınlar.
window.addEventListener('vite:preloadError', (event) => {
  const KEY = 'otovadi-chunk-reload';
  try {
    if (sessionStorage.getItem(KEY)) return;
    sessionStorage.setItem(KEY, '1');
  } catch {
    return;
  }
  event.preventDefault();
  window.location.reload();
});

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
