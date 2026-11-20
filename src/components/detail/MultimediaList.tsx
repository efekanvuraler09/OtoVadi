import {
  Monitor,
  Volume2,
  Wifi,
  Radar,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import type { MultimediaFeature } from '../../types/vehicle';

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
  accentColor?: 'blue' | 'red';
}

export function MultimediaList({ features }: MultimediaListProps) {
  return (
    <ul className="flex flex-col gap-6">
      {features.map((feature) => {
        const Icon = feature.icon ? iconMap[feature.icon] ?? Monitor : Monitor;
        return (
          <li
            key={feature.id}
            className="flex flex-col gap-4 border-b border-border-subtle pb-6"
          >
            <div className="flex items-center gap-4">
              <Icon className="size-6 shrink-0 text-muted" strokeWidth={1.25} />
              <div className="flex items-center gap-4 flex-wrap">
                <h4 className="font-display text-lg font-normal text-foreground md:text-xl">{feature.name}</h4>
                {feature.highlight && (
                  <span className="border border-border-subtle px-2 py-1 text-2xs font-medium uppercase tracking-eyebrow text-muted">
                    ÖNE ÇIKAN
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm leading-relaxed text-secondary md:pl-10 md:text-base">{feature.description}</p>
          </li>
        );
      })}
    </ul>
  );
}
