import type { Vehicle } from '../../types/vehicle';

interface SpecGridProps {
  vehicle: Vehicle;
}

const fuelLabels: Record<string, string> = {
  petrol: 'Benzin',
  diesel: 'Dizel',
  hybrid: 'Hibrit',
  'plug-in-hybrid': 'Plug-in Hibrit',
  electric: 'Elektrik',
};

const drivetrainLabels: Record<string, string> = {
  fwd: 'Önden Çekiş',
  rwd: 'Arkadan İtiş',
  awd: 'AWD',
  '4wd': '4x4',
};

const transmissionLabels: Record<string, string> = {
  automatic: 'Otomatik',
  cvt: 'CVT',
  dct: 'Çift Kavrama',
  manual: 'Manuel',
};

const number = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 });

export function SpecGrid({ vehicle }: SpecGridProps) {
  const specs: { label: string; value: string; unit?: string }[] = [
    { label: 'Motor', value: number.format(vehicle.engine.displacementCc), unit: 'cc' },
    { label: 'Güç', value: number.format(vehicle.engine.powerHp), unit: 'HP' },
    { label: 'Tork', value: number.format(vehicle.engine.torqueNm), unit: 'Nm' },
    { label: 'Yakıt', value: fuelLabels[vehicle.engine.fuelType] ?? vehicle.engine.fuelType },
    { label: '0–100', value: number.format(vehicle.performance.zeroTo100Kmh), unit: 'sn' },
    { label: 'Maks. Hız', value: number.format(vehicle.performance.topSpeedKmh), unit: 'km/s' },
    { label: 'Çekiş', value: drivetrainLabels[vehicle.performance.drivetrain] ?? vehicle.performance.drivetrain },
    { label: 'Vites', value: transmissionLabels[vehicle.performance.transmission] ?? vehicle.performance.transmission },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
      {specs.map(({ label, value, unit }) => (
        <div key={label} className="flex flex-col gap-2 border-b border-border-subtle pb-4">
          <dt className="stat-label">{label}</dt>
          <dd className="stat-value text-2xl md:text-3xl">
            {value}
            {unit && <span className="ml-1 text-base text-muted">{unit}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
