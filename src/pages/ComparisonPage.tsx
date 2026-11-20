import { ComparisonEngine } from '../components/comparison/ComparisonEngine';
import { usePageMeta } from '../hooks/usePageMeta';

export function ComparisonPage() {
  usePageMeta({
    title: 'Düello: Araç Karşılaştırma',
    description: 'İki veya üç aracı kafa kafaya karşılaştırın: güç, tork, hızlanma, tüketim ve fiyatta kim önde, farklar ne kadar?',
  });
  // AppShell zaten <main> sağlar; burada ikinci bir <main> açılmaz
  return <ComparisonEngine />;
}
