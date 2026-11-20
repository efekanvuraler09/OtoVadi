import { useCompareStore } from '../store/useCompareStore';
import type { Vehicle } from '../types/vehicle';

/** Bir aracı karşılaştırma tepsisine ekleme/çıkarma (VehicleCard, detay şeridi). */
export function useCompareToggle(vehicle: Pick<Vehicle, 'id'>) {
  const isSelected = useCompareStore((s) => s.ids.includes(vehicle.id));
  const toggleId = useCompareStore((s) => s.toggle);
  return { isSelected, toggle: () => toggleId(vehicle.id) };
}
