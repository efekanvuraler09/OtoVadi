import type { Vehicle } from '../types/vehicle';

/**
 * Firestore'daki bazı marka/model alanları baştaki tab veya sondaki boşlukla kaydedilmiş ("\tVolkswagen", "Astra ").
 * Arayüzde gösterilen tüm araç metinleri bu yardımcılardan geçer; veri kendisi değiştirilmez.
 */
export function cleanText(value?: string | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

export function vehicleBrand(vehicle: Pick<Vehicle, 'brand'>): string {
  return cleanText(vehicle.brand);
}

export function vehicleModel(vehicle: Pick<Vehicle, 'model'>): string {
  return cleanText(vehicle.model);
}

/** "Marka Model" (boşluklar normalize edilmiş) */
export function vehicleName(vehicle: Pick<Vehicle, 'brand' | 'model'>): string {
  return cleanText(`${vehicle.brand} ${vehicle.model}`);
}
