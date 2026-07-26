import {
  Monitor,
  Volume2,
  Wifi,
  Radar,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import type { MultimediaFeature } from '../../types/vehicle';
import { useAccent } from '../../hooks/useAccent';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  monitor: Monitor,
  'volume-2': Volume2,
  wifi: Wifi,
  radar: Radar,
  sparkles: Sparkles,
  smartphone: Smartphone,
};

interface MultimediaListProps {
  features: MultimediaFeature[];
  accentColor: 'blue' | 'red';
}

export function MultimediaList({ features, accentColor }: MultimediaListProps) {
  const accent = useAccent({ accentColor });

  return (
    <ul className="flex flex-col gap-3">
      {features.map((feature) => {
        const Icon = feature.icon ? iconMap[feature.icon] ?? Monitor : Monitor;
        return (
          <li
            key={feature.id}
            className={`rounded-2xl border p-4 ${
              feature.highlight
                ? `${accent.border} bg-white/5`
                : 'border-glass-border bg-transparent'
            }`}
          >
            <div className="flex gap-3">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accent.bgSoft}`}
              >
                <Icon className={`size-5 ${accent.text}`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground">{feature.name}</h4>
                  {feature.highlight && (
                    <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${accent.bgSoft} ${accent.text}`}>
                      Öne çıkan
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted">{feature.description}</p>
                <p className="mt-1.5 text-[10px] capitalize text-muted/80">{feature.category}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
