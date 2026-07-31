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
    <ul className="flex flex-col gap-6 py-6">
      {materials.map((item, i) => (
        <li
          key={`${item.zone}-${i}`}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6"
        >
          <div className="flex flex-col gap-2">
            <span className="font-display text-lg md:text-xl text-gray-500 dark:text-neutral-400 capitalize">{zoneLabels[item.zone]}</span>
            <span className="text-3xl md:text-4xl font-light tracking-wide text-foreground">{item.material}</span>
            {item.finish && (
              <span className="text-sm tracking-widest text-gray-500 dark:text-neutral-500 uppercase">{item.finish}</span>
            )}
          </div>
          <div className="flex flex-col md:items-end gap-2 mt-2 md:mt-0">
            <span className="text-2xl font-light text-foreground">{item.colorName}</span>
            {item.sustainable && (
              <span className="inline-block rounded-none border border-border-subtle px-3 py-1.5 text-[10px] uppercase tracking-widest text-gray-500 dark:text-neutral-400">
                SÜRDÜRÜLEBİLİR
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
