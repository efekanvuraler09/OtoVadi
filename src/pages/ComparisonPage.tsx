import { ComparisonEngine } from '../components/comparison/ComparisonEngine';

import { usePageMeta } from '../hooks/usePageMeta';
export function ComparisonPage() {
  usePageMeta({
    title: 'Araç Karşılaştırma',
    description: 'İki aracı performans, boyut, donanım ve fiyat açısından yan yana karşılaştırın.',
  });
  return (
    <main className="w-full">
      <ComparisonEngine />
    </main>
  );
}
