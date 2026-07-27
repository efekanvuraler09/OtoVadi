import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Navbar } from './Navbar';

export function AppShell() {
  const location = useLocation();
  const isDetail = location.pathname.startsWith('/arac/');

  return (
    <div className="relative min-h-dvh bg-void">
      <Navbar />
      <main className={`relative z-10 ${isDetail ? 'pb-8' : 'pb-24 md:pb-8'}`}>
        <Outlet />
      </main>
      {!isDetail && <BottomNav />}
    </div>
  );
}
