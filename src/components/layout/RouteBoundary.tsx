import { Outlet, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { CrashScreen } from '../ui/DataState';

/**
 * Sayfa içeriğini sarar:
 * - Her rota değişiminde (pathname) sayfayı tek sefer mount eder; böylece /arac/a → /arac/b
 *   geçişinde sayfa state'i sıfırlanır. (Eski AnimatePresence + <Outlet key> kurgusu çıkış
 *   sırasında yeni sayfayı da render ettiği için sayfalar iki kez mount oluyordu.)
 * - Sayfada oluşan render hatalarını yakalar; Navbar ve alt menü görünür kalır.
 *
 * Giriş animasyonları her sayfanın kendi motion bileşenlerinde tanımlı olduğu için korunur.
 */
export function RouteBoundary() {
  const { pathname } = useLocation();

  return (
    <ErrorBoundary key={pathname} fallback={(reset) => <CrashScreen onRetry={reset} />}>
      <Outlet />
    </ErrorBoundary>
  );
}
