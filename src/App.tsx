import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { PageTransition } from './components/layout/PageTransition';
import { HomePage } from './pages/HomePage';
import { VehicleDetailPage } from './pages/VehicleDetailPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { Configurator3DPage } from './pages/Configurator3DPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route element={<PageTransition />}>
            <Route index element={<HomePage />} />
            <Route path="arac/:slug" element={<VehicleDetailPage />} />
            <Route path="favoriler" element={<FavoritesPage />} />
            <Route path="3d-configurator" element={<Configurator3DPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
