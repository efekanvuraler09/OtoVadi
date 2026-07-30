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

export function SpecGrid({ vehicle }: SpecGridProps) {
  const specs = [
    { label: 'Motor', value: `${vehicle.engine.displacementCc} cc` },
    { label: 'Güç', value: `${vehicle.engine.powerHp} hp` },
    { label: 'Tork', value: `${vehicle.engine.torqueNm} Nm` },
    { label: 'Yakıt', value: fuelLabels[vehicle.engine.fuelType] ?? vehicle.engine.fuelType },
    { label: '0–100', value: `${vehicle.performance.zeroTo100Kmh} sn` },
    { label: 'Maks. Hız', value: `${vehicle.performance.topSpeedKmh} km/s` },
    { label: 'Çekiş', value: drivetrainLabels[vehicle.performance.drivetrain] ?? vehicle.performance.drivetrain },
    { label: 'Vites', value: vehicle.performance.transmission },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4 py-6">
      {specs.map(({ label, value }) => (
        <div
          key={label}
          className="flex flex-col gap-2 border-b border-neutral-800/50 pb-4"
        >
          <dt className="font-display text-lg md:text-xl text-neutral-400 capitalize">{label}</dt>
          <dd className="text-4xl md:text-5xl font-light tracking-wide text-white">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
