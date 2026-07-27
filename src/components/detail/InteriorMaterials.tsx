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
    <ul className="flex flex-col gap-2">
      {materials.map((item, i) => (
        <li
          key={`${item.zone}-${i}`}
          className="flex items-start justify-between gap-4 rounded-none border border-border-subtle bg-transparent px-4 py-3"
        >
          <div>
            <p className="text-xs font-medium text-muted">{zoneLabels[item.zone]}</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{item.material}</p>
            {item.finish && (
              <p className="text-[10px] text-muted">{item.finish}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-foreground">{item.colorName}</p>
            {item.sustainable && (
              <span className="mt-1 inline-block rounded-none bg-foreground/10 px-1.5 py-0.5 text-[9px] font-medium text-foreground/70">
                Sürdürülebilir
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
