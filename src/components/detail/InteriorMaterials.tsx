import type { InteriorMaterial } from '../../types/vehicle';

const zoneLabels: Record<InteriorMaterial['zone'], string> = {
  seats: 'Koltuklar',
  dashboard: 'Gösterge Paneli',
  'door-panels': 'Kapı Panelleri',
  steering: 'Direksiyon',
  headliner: 'Tavan Döşemesi',
  floor: 'Zemin / Paspas',
};

interface InteriorMaterialsProps {
  materials: InteriorMaterial[];
}

export function InteriorMaterials({ materials }: InteriorMaterialsProps) {
  return (
    <ul className="flex flex-col gap-6">
      {materials.map((item, i) => (
        <li
          key={`${item.zone}-${i}`}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6"
        >
          <div className="flex flex-col gap-2">
            <span className="stat-label">{zoneLabels[item.zone]}</span>
            <span className="font-display text-xl font-normal text-foreground md:text-2xl">{item.material}</span>
            {item.finish && (
              <span className="text-sm text-muted">{item.finish}</span>
            )}
          </div>
          <div className="flex flex-col md:items-end gap-2 mt-2 md:mt-0">
            <span className="text-lg text-foreground">{item.colorName}</span>
            {item.sustainable && (
              <span className="inline-block border border-border-subtle px-3 py-1.5 text-2xs font-medium uppercase tracking-eyebrow text-success">
                SÜRDÜRÜLEBİLİR
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
