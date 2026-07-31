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
    <ul className="flex flex-col gap-8 py-6">
      {features.map((feature) => {
        const Icon = feature.icon ? iconMap[feature.icon] ?? Monitor : Monitor;
        return (
          <li
            key={feature.id}
            className="flex flex-col gap-4 border-b border-border-subtle pb-6"
          >
            <div className="flex items-center gap-4">
              <Icon className="size-6 text-gray-500 dark:text-neutral-400 shrink-0" strokeWidth={1} />
              <div className="flex items-center gap-4 flex-wrap">
                <h4 className="font-display text-2xl md:text-3xl font-light tracking-wide text-foreground">{feature.name}</h4>
                {feature.highlight && (
                  <span className="rounded-none border border-border-subtle px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-gray-500 dark:text-neutral-400">
                    ÖNE ÇIKAN
                  </span>
                )}
              </div>
            </div>
            <p className="text-base font-light leading-relaxed text-gray-500 dark:text-neutral-400 md:pl-10">{feature.description}</p>
          </li>
        );
      })}
    </ul>
  );
}
