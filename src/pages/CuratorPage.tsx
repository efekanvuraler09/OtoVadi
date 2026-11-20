import { AutoCurator } from '../components/curator/AutoCurator';

import { usePageMeta } from '../hooks/usePageMeta';
export function CuratorPage() {
  usePageMeta({
    title: 'Akıllı Keşif',
    description: 'Hayalinizdeki aracı kendi cümlelerinizle anlatın; yapay zekâ OtoVadi kataloğundan size en uygun modelleri seçsin.',
  });
  return (
    // AppShell zaten <main> sağlıyor; iç içe <main> erişilebilirlik ağacını bozar
    <div className="w-full">
      <AutoCurator />
    </div>
  );
}
