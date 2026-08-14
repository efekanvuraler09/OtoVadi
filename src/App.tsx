import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { PageTransition } from './components/layout/PageTransition';
import { HomePage } from './pages/HomePage';
import { VehicleDetailPage } from './pages/VehicleDetailPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { CuratorPage } from './pages/CuratorPage';
import { ModelsPage } from './pages/ModelsPage';
import { GaragePage } from './pages/GaragePage';
import { ProfilePage } from './pages/ProfilePage';
import { AboutPage } from './pages/AboutPage';
import { CarOfTheDayPage } from './pages/CarOfTheDayPage';
import { MyAppointments } from './pages/MyAppointments';
import { GarageProvider } from './context/GarageContext';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/ui/AuthModal';
import { subscribeVehicles } from './services/vehicleService';
import { useVehicleStore } from './store/useVehicleStore';

/** Firestore → Zustand gerçek zamanlı senkronizasyon */
function FirestoreSync() {
  const setVehicles = useVehicleStore((s) => s.setVehicles);

  useEffect(() => {
    const unsubscribe = subscribeVehicles((vehicles) => {
      setVehicles(vehicles);
    });
    return () => unsubscribe();
  }, [setVehicles]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <GarageProvider>
        <FirestoreSync />
        <BrowserRouter>
          <Routes>
            {/* Admin Routes (No Navbar/Footer) */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            
            {/* Main App Routes */}
            <Route element={<AppShell />}>
              <Route element={<PageTransition />}>
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
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
        <AuthModal />
      </GarageProvider>
    </AuthProvider>
  );
}

