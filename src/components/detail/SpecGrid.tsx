import type { Vehicle } from '../../types/vehicle';
import {
  hasUnverifiedSpecs,
  trustedDrivetrain,
  trustedFuel,
  trustedSpec,
  trustedTransmission,
  type SpecKey,
} from '../../lib/specTrust';
import { DRIVETRAIN_LABEL, FUEL_LABEL, TRANSMISSION_LABEL } from '../../lib/specLabels';
import { UnverifiedNote } from './UnverifiedNote';

interface SpecGridProps {
  vehicle: Vehicle;
}

const number = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 });

/** Doğrulanmamış / eksik değerde "—" (Cila 1): şablon rakam gerçek gibi sunulmaz */
const numeric = (vehicle: Vehicle, key: SpecKey) => {
  const value = trustedSpec(vehicle, key);
  return value === null ? null : number.format(value);
};

export function SpecGrid({ vehicle }: SpecGridProps) {
  const fuel = trustedFuel(vehicle);
  const drivetrain = trustedDrivetrain(vehicle);
  const transmission = trustedTransmission(vehicle);

  const specs: { label: string; value: string | null; unit?: string }[] = [
    { label: 'Motor', value: numeric(vehicle, 'displacementCc'), unit: 'cc' },
    { label: 'Güç', value: numeric(vehicle, 'powerHp'), unit: 'HP' },
    { label: 'Tork', value: numeric(vehicle, 'torqueNm'), unit: 'Nm' },
    { label: 'Yakıt', value: fuel ? (FUEL_LABEL[fuel] ?? fuel) : null },
    { label: '0–100', value: numeric(vehicle, 'zeroTo100Kmh'), unit: 'sn' },
    { label: 'Maks. Hız', value: numeric(vehicle, 'topSpeedKmh'), unit: 'km/s' },
    { label: 'Çekiş', value: drivetrain ? (DRIVETRAIN_LABEL[drivetrain] ?? drivetrain) : null },
    { label: 'Vites', value: transmission ? (TRANSMISSION_LABEL[transmission] ?? transmission) : null },
  ];

  return (
    <div>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
        {specs.map(({ label, value, unit }) => (
          <div key={label} className="flex flex-col gap-2 border-b border-border-subtle pb-4">
            <dt className="stat-label">{label}</dt>
            <dd className="stat-value text-2xl md:text-3xl">
              {value === null ? (
                <span className="text-muted" aria-label="Doğrulanmamış">
                  —
                </span>
              ) : (
                <>
                  {value}
                  {unit && <span className="ml-1 text-base text-muted">{unit}</span>}
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {hasUnverifiedSpecs(vehicle) && <UnverifiedNote className="mt-6" />}
    </div>
  );
}
