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
    { label: 'Motor', value: `${vehicle.engine.displacementCc} cc · ${vehicle.engine.configuration}` },
    { label: 'Güç', value: `${vehicle.engine.powerHp} hp (${vehicle.engine.powerKw} kW)` },
    { label: 'Tork', value: `${vehicle.engine.torqueNm} Nm` },
    { label: 'Yakıt', value: fuelLabels[vehicle.engine.fuelType] ?? vehicle.engine.fuelType },
    { label: '0–100', value: `${vehicle.performance.zeroTo100Kmh} sn` },
    { label: 'Maks. Hız', value: `${vehicle.performance.topSpeedKmh} km/s` },
    { label: 'Çekiş', value: drivetrainLabels[vehicle.performance.drivetrain] ?? vehicle.performance.drivetrain },
    { label: 'Vites', value: `${vehicle.performance.gears} vites · ${vehicle.performance.transmission}` },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {specs.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-xl border border-glass-border bg-white/5 px-3 py-3"
        >
          <dt className="text-[10px] uppercase tracking-wider text-muted">{label}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
