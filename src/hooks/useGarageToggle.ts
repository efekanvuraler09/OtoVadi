import { useAuth } from '../context/AuthContext';
import { useGarage } from '../context/GarageContext';
import type { Vehicle } from '../types/vehicle';

/** Bir aracı garaja ekleme/çıkarma mantığı (giriş yapılmamışsa giriş modalını açar). */
export function useGarageToggle(vehicle: Pick<Vehicle, 'id' | 'slug' | 'brand' | 'model'>) {
  const { garagedSlugs, addVehicle, removeVehicle, loadingSlug } = useGarage();
  const { user, openAuthModal } = useAuth();

  // Geçiş döneminde hem id hem slug ile kaydedilmiş kayıtları destekle
  const isGaraged = garagedSlugs.includes(vehicle.id) || garagedSlugs.includes(vehicle.slug);
  const isBusy = loadingSlug === vehicle.slug;

  const toggle = () => {
    if (!user) {
      openAuthModal('Bu ayrıcalığı yaşamak için lütfen giriş yapın.');
      return;
    }
    if (isBusy) return;

    const name = `${vehicle.brand} ${vehicle.model}`;
    if (isGaraged) {
      removeVehicle(vehicle.slug, name);
    } else {
      addVehicle(vehicle.slug, name);
    }
  };

  return { isGaraged, isBusy, toggle };
}
