import { lazy, Suspense, useEffect } from 'react';
import type { ComponentType } from 'react';
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { RouteBoundary } from './components/layout/RouteBoundary';
import { ScrollManager } from './components/layout/ScrollManager';
import { PageFallback } from './components/ui/DataState';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { GarageProvider } from './context/GarageContext';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/ui/AuthModal';
import { subscribeVehicles } from './services/vehicleService';
import { useVehicleStore } from './store/useVehicleStore';
import { TRANSITION } from './lib/motion';
import { loadDossier, loadModels, loadVehicleDetail } from './lib/routeLoaders';

/**
 * P2: Ana sayfa ve 404 dışındaki tüm sayfalar ayrı JS parçalarına bölünür (React.lazy).
 * Sayfalar isimli export kullandığı için default'a eşlenir. Yükleme durumu RouteBoundary içindeki Suspense'tedir.
 */
function lazyPage<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazy(() => load().then((mod) => ({ default: mod[name] })));
}

const VehicleDetailPage = lazyPage(loadVehicleDetail, 'VehicleDetailPage');
const ModelsPage = lazyPage(loadModels, 'ModelsPage');
const ComparisonPage = lazyPage(() => import('./pages/ComparisonPage'), 'ComparisonPage');
const CuratorPage = lazyPage(() => import('./pages/CuratorPage'), 'CuratorPage');
const GaragePage = lazyPage(() => import('./pages/GaragePage'), 'GaragePage');
const ProfilePage = lazyPage(() => import('./pages/ProfilePage'), 'ProfilePage');
const AboutPage = lazyPage(() => import('./pages/AboutPage'), 'AboutPage');
const CarOfTheDayPage = lazyPage(() => import('./pages/CarOfTheDayPage'), 'CarOfTheDayPage');
const SoulTwinPage = lazyPage(() => import('./pages/SoulTwinPage'), 'SoulTwinPage');
const CollectionsPage = lazyPage(() => import('./pages/CollectionsPage'), 'CollectionsPage');
const CollectionDetailPage = lazyPage(() => import('./pages/CollectionDetailPage'), 'CollectionDetailPage');
const MyAppointments = lazyPage(() => import('./pages/MyAppointments'), 'MyAppointments');
const DossierPage = lazyPage(loadDossier, 'DossierPage');
const AdminLogin = lazyPage(() => import('./pages/admin/AdminLogin'), 'AdminLogin');
const AdminDashboard = lazyPage(() => import('./pages/admin/AdminDashboard'), 'AdminDashboard');

/** Ana sayfadan en sık gidilen iki sayfanın parçası tarayıcı boşta kalınca önceden indirilir */
function PrefetchCommonRoutes() {
  useEffect(() => {
    const prefetch = () => {
      void loadVehicleDetail().catch(() => undefined);
      void loadModels().catch(() => undefined);
    };
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(prefetch, 2500);
    return () => clearTimeout(timer);
  }, []);
  return null;
}

/** Firestore → Zustand gerçek zamanlı senkronizasyon */
function FirestoreSync() {
  const setVehicles = useVehicleStore((s) => s.setVehicles);
  const setLoadError = useVehicleStore((s) => s.setLoadError);
  // "Tekrar Dene" butonu bu değeri artırır → abonelik yeniden kurulur
  const retryToken = useVehicleStore((s) => s.retryToken);

  useEffect(() => {
    const unsubscribe = subscribeVehicles(setVehicles, (error) => {
      setLoadError(error.code);
    });
    return () => unsubscribe();
  }, [setVehicles, setLoadError, retryToken]);

  return null;
}

export default function App() {
  return (
    // LazyMotion + domAnimation: tam motion paketi yerine yalnızca kullanılan özellikler (animate/exit/hover/tap/inView).
    // strict: yanlışlıkla motion.div kullanılırsa hata verir; bileşenlerde m.div kullanılır (layout/drag yok).
    // reducedMotion="user": işletim sisteminde "hareketi azalt" açıksa transform animasyonları kapanır (opaklık kalır).
    // Varsayılan geçiş, transition belirtmeyen tüm motion bileşenlerine ortak süre/eğriyi verir (lib/motion.ts).
    <LazyMotion features={domAnimation} strict>
    <MotionConfig reducedMotion="user" transition={TRANSITION.base}>
    <AuthProvider>
      <GarageProvider>
        <FirestoreSync />
        <PrefetchCommonRoutes />
        <BrowserRouter>
          <ScrollManager />
          {/* Admin rotaları AppShell dışında olduğu için kendi Suspense'i var; site sayfalarınınki RouteBoundary'de */}
          <Suspense fallback={<PageFallback fullScreen />}>
          <Routes>
            {/* Admin Routes (No Navbar/Footer) */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* Main App Routes */}
            <Route element={<AppShell />}>
              <Route element={<RouteBoundary />}>
                <Route index element={<HomePage />} />
                <Route path="arac/:id" element={<VehicleDetailPage />} />
                <Route path="modeller" element={<ModelsPage />} />
                <Route path="karsilastir" element={<ComparisonPage />} />
                <Route path="hakkimizda" element={<AboutPage />} />
                <Route path="kesif" element={<CuratorPage />} />
                <Route path="garajim" element={<GaragePage />} />
                <Route path="profil" element={<ProfilePage />} />
                <Route path="randevularim" element={<MyAppointments />} />
                <Route path="gunun-araci" element={<CarOfTheDayPage />} />
                <Route path="ruh-ikizi" element={<SoulTwinPage />} />
                <Route path="koleksiyonlar" element={<CollectionsPage />} />
                <Route path="koleksiyonlar/:slug" element={<CollectionDetailPage />} />
                <Route path="dosya" element={<DossierPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
          </Routes>
          </Suspense>
        </BrowserRouter>
        <AuthModal />
      </GarageProvider>
    </AuthProvider>
    </MotionConfig>
    </LazyMotion>
  );
}

