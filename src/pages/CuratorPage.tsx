import { AutoCurator } from '../components/curator/AutoCurator';

export function CuratorPage() {
  return (
    // AppShell zaten <main> sağlıyor; iç içe <main> erişilebilirlik ağacını bozar
    <div className="w-full">
      <AutoCurator />
    </div>
  );
}
