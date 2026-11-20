import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Vehicle } from '../types/vehicle';
import { useVehicleStore } from '../store/useVehicleStore';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { VehicleCard, VehicleCardSkeleton } from '../components/vehicle/VehicleCard';
import { VehicleLoadError } from '../components/ui/DataState';
import { vehicleName } from '../utils/vehicleText';

type FilterId = 'all' | 'suv' | 'sedan' | 'eco';

const FILTERS: { id: FilterId; label: string; match: (v: Vehicle) => boolean }[] = [
  { id: 'all', label: 'Tümü', match: () => true },
  { id: 'suv', label: 'SUV', match: (v) => v.bodyType === 'suv' },
  { id: 'sedan', label: 'Sedan', match: (v) => v.bodyType === 'sedan' },
  {
    id: 'eco',
    label: 'Elektrikli / Hibrit',
    match: (v) => ['hybrid', 'electric', 'plug-in-hybrid'].includes(v.engine.fuelType),
  },
];

export function ModelsPage() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const isLoading = useVehicleStore((s) => s.isLoading);
  const loadError = useVehicleStore((s) => s.loadError);
  const [filter, setFilter] = useState<FilterId>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Araç içermeyen filtre sekmesi gösterilmez (ör. katalogda henüz elektrikli/hibrit yoksa)
  const filters = useMemo(
    () =>
      FILTERS.map((f) => ({ ...f, count: vehicles.filter(f.match).length })).filter(
        (f) => f.id === 'all' || f.count > 0,
      ),
    [vehicles],
  );
  const activeFilter = filters.find((f) => f.id === filter) ?? filters[0];

  const filteredVehicles = vehicles.filter((v) => {
    if (!activeFilter.match(v)) return false;
    const q = searchQuery.trim().toLocaleLowerCase('tr');
    if (!q) return true;
    return `${vehicleName(v)} ${v.tagline}`.toLocaleLowerCase('tr').includes(q);
  });

  return (
    <PageContainer>
      <PageHeader eyebrow="Katalog" title="Koleksiyonu Keşfedin" description={`${vehicles.length || '—'} modellik dijital showroom.`} />

      <div className="mb-10 flex flex-col gap-6 md:mb-12 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-h-12 w-full items-center gap-4 border border-border-subtle px-5 transition-colors focus-within:border-foreground hover:border-border-strong lg:max-w-md">
          <Search className="size-5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Marka, model veya anahtar kelime ara..."
            className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted"
            aria-label="Araç ara"
          />
        </div>

        <div role="tablist" aria-label="Gövde ve yakıt filtresi" className="-mx-4 flex gap-6 overflow-x-auto px-4 scrollbar-none md:mx-0 md:px-0">
          {filters.map((opt) => {
            const active = opt.id === activeFilter.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(opt.id)}
                className={`shrink-0 border-b pb-2 text-sm font-medium transition-colors ${
                  active ? 'border-foreground text-foreground' : 'border-transparent text-muted hover:text-foreground'
                }`}
              >
                {opt.label}
                <span className="ml-1.5 text-xs tabular-nums text-muted">{opt.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isLoading && vehicles.length === 0 ? (
        <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              <VehicleCardSkeleton />
            </li>
          ))}
        </ul>
      ) : loadError && vehicles.length === 0 ? (
        <VehicleLoadError compact />
      ) : filteredVehicles.length === 0 ? (
        <p className="border border-border-subtle px-6 py-16 text-center text-base text-muted">
          Bu kategoriye ait araç bulunamadı.
        </p>
      ) : (
        <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
          {filteredVehicles.map((vehicle, index) => (
            <li key={vehicle.id}>
              <VehicleCard vehicle={vehicle} index={index} priority={index < 3} />
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
