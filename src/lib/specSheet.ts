import type { Vehicle } from '../types/vehicle';
import {
  specTrust,
  trustedDrivetrain,
  trustedEngineCode,
  trustedFuel,
  trustedSpec,
  trustedTransmission,
  type SpecKey,
} from './specTrust';
import { DRIVETRAIN_LABEL, FUEL_LABEL, TRANSMISSION_LABEL } from './specLabels';

/**
 * Faz 6 — Broşür (1.2) ve Özel Dosya (2.3) için yalnızca DOĞRULANMIŞ teknik künye satırları.
 * Şablon/eksik değerler satır olarak hiç basılmaz (kâğıtta "—" yerine yokluk daha temiz); sayısı dipnot için döner.
 */
export interface SpecRow {
  label: string;
  value: string;
}

export interface SpecSheet {
  engine: SpecRow[];
  dimensions: SpecRow[];
  /** Basılmayan (doğrulanmamış veya eksik) satır sayısı */
  omitted: number;
}

const fmt = (value: number, digits = 0) =>
  value.toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function buildSpecSheet(vehicle: Vehicle): SpecSheet {
  let omitted = 0;
  const rows: SpecRow[] = [];
  const push = (target: SpecRow[], label: string, value: string | null) => {
    if (value) target.push({ label, value });
    else omitted += 1;
  };
  const num = (key: SpecKey, unit: string, digits = 0) => {
    const value = trustedSpec(vehicle, key);
    return value === null ? null : `${fmt(value, digits)} ${unit}`;
  };

  const cc = trustedSpec(vehicle, 'displacementCc');
  const code = trustedEngineCode(vehicle);
  const engineText = [code, cc ? `${fmt(cc)} cm³` : null].filter(Boolean).join(' · ');
  push(rows, 'Motor', engineText || null);

  const hp = trustedSpec(vehicle, 'powerHp');
  const kw = trustedSpec(vehicle, 'powerKw');
  push(rows, 'Güç', hp ? `${fmt(hp)} HP${kw ? ` · ${fmt(kw)} kW` : ''}` : null);
  push(rows, 'Tork', num('torqueNm', 'Nm'));
  push(rows, '0–100 km/s', num('zeroTo100Kmh', 'sn', 1));
  push(rows, 'Maks. Hız', num('topSpeedKmh', 'km/s'));

  const fuel = trustedFuel(vehicle);
  push(rows, 'Yakıt', fuel ? (FUEL_LABEL[fuel] ?? fuel) : null);
  const transmission = trustedTransmission(vehicle);
  const gears = specTrust(vehicle).engine && vehicle.performance?.gears ? ` · ${vehicle.performance.gears} ileri` : '';
  push(rows, 'Şanzıman', transmission ? `${TRANSMISSION_LABEL[transmission] ?? transmission}${gears}` : null);
  const drivetrain = trustedDrivetrain(vehicle);
  push(rows, 'Çekiş', drivetrain ? (DRIVETRAIN_LABEL[drivetrain] ?? drivetrain) : null);

  const dimensions: SpecRow[] = [];
  push(dimensions, 'Uzunluk', num('lengthMm', 'mm'));
  push(dimensions, 'Genişlik', num('widthMm', 'mm'));
  push(dimensions, 'Yükseklik', num('heightMm', 'mm'));
  push(dimensions, 'Aks Mesafesi', num('wheelbaseMm', 'mm'));
  push(dimensions, 'Bagaj', num('bootCapacityL', 'L'));
  push(dimensions, 'Ağırlık', num('curbWeightKg', 'kg'));

  return { engine: rows, dimensions, omitted };
}
