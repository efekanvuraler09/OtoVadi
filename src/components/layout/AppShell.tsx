import { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Navbar } from './Navbar';
import { CompareTray } from '../compare/CompareTray';
import { resolveCompareVehicles, useCompareStore } from '../../store/useCompareStore';
import { useVehicleStore } from '../../store/useVehicleStore';

export function AppShell() {
  const location = useLocation();
  // Detay sayfası kendi mobil aksiyon barını gösterir (aynı yükseklikte), bu yüzden BottomNav orada gizli.
  const isDetail = location.pathname.startsWith('/arac/');
  const isCompare = location.pathname.startsWith('/karsilastir');

  const compareIds = useCompareStore((s) => s.ids);
  const vehicles = useVehicleStore((s) => s.vehicles);
  const compareVehicles = useMemo(() => resolveCompareVehicles(compareIds, vehicles), [compareIds, vehicles]);
  // Düello sayfasında tepsi gizlenir (seçimi sayfa kendisi yönetir)
  const trayVisible = !isCompare && compareVehicles.length > 0;

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
        {/* Karşılaştırma tepsisi açıkken sayfanın son içeriği tepsinin altında kalmasın */}
        {trayVisible && <div className="h-20 md:h-24" aria-hidden />}
      </main>
      {!isDetail && <BottomNav />}
      <CompareTray vehicles={compareVehicles} visible={trayVisible} />
    </div>
  );
}
