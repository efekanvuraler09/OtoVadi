import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function AppShell() {
  const location = useLocation();
  const isDetail = location.pathname.startsWith('/arac/');

  return (
    <div className="relative min-h-dvh bg-void">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-accent-red/8 blur-[100px]" />
      </div>

      <main className={`relative z-10 ${isDetail ? 'pb-8' : 'pb-24 md:pb-8'}`}>
        <Outlet />
      </main>
      {!isDetail && <BottomNav />}
    </div>
  );
}
