import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Navbar } from './Navbar';

export function AppShell() {
  const location = useLocation();
  // Detay sayfası kendi mobil aksiyon barını gösterir (aynı yükseklikte), bu yüzden BottomNav orada gizli.
  const isDetail = location.pathname.startsWith('/arac/');

  return (
    <div className="relative min-h-dvh bg-void">
      <Navbar />
      {/*
        main bilinçli olarak z-index almıyor: z-index yeni bir stacking context açıp içindeki
        katmanları (modal, sticky bar) header'ın altına hapsediyordu. Katmanlar tailwind.config.js'teki
        merkezi z skalasıyla yönetiliyor; mobilde alt barın altında içerik kalmaması için pb-bottom-bar.
      */}
      <main className="relative pb-bottom-bar md:pb-8">
        <Outlet />
      </main>
      {!isDetail && <BottomNav />}
    </div>
  );
}
