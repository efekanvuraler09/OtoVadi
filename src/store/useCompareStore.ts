import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Vehicle } from '../types/vehicle';

/** Karşılaştırma tepsisindeki en fazla araç sayısı (U7) */
export const MAX_COMPARE = 3;

export interface CompareNotice {
  /** Aynı mesaj art arda geldiğinde zamanlayıcının yeniden başlaması için */
  id: number;
  text: string;
}

interface CompareState {
  /** Araç doküman id'leri (sıra = eklenme sırası) */
  ids: string[];
  notice: CompareNotice | null;
  /** Ekler ya da çıkarır; tepsi doluysa ekleme yapmaz ve bildirim gösterir */
  toggle: (id: string) => 'added' | 'removed' | 'full';
  remove: (id: string) => void;
  clear: () => void;
  dismissNotice: () => void;
}

/**
 * U7 — Global karşılaştırma tepsisi. Liste localStorage'da kalıcıdır (sekme kapansa da korunur);
 * depolama erişilemezse (gizli pencere vb.) zustand persist sessizce bellek içi çalışır.
 */
export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      notice: null,

      toggle: (id) => {
        const { ids } = get();
        if (ids.includes(id)) {
          set({ ids: ids.filter((x) => x !== id) });
          return 'removed';
        }
        if (ids.length >= MAX_COMPARE) {
          set({ notice: { id: Date.now(), text: `En fazla ${MAX_COMPARE} aracı karşılaştırabilirsiniz. Yeni araç eklemek için birini çıkarın.` } });
          return 'full';
        }
        set({ ids: [...ids, id], notice: null });
        return 'added';
      },

      remove: (id) => set((state) => ({ ids: state.ids.filter((x) => x !== id) })),
      clear: () => set({ ids: [], notice: null }),
      dismissNotice: () => set({ notice: null }),
    }),
    {
      name: 'compare-tray',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ ids: state.ids }),
      version: 1,
    },
  ),
);

/** Kayıtlı id'leri güncel katalogla eşleştirir; katalogdan kalkmış araçlar sessizce atlanır. */
export function resolveCompareVehicles(ids: string[], vehicles: Vehicle[]): Vehicle[] {
  return ids
    .map((id) => vehicles.find((v) => v.id === id))
    .filter((v): v is Vehicle => Boolean(v));
}

/** Düello bağlantısı: paylaşılabilir ?a=&b=&c= parametreleri (slug) */
export function duelHref(vehicles: Vehicle[]): string {
  const params = new URLSearchParams();
  vehicles.slice(0, MAX_COMPARE).forEach((v, i) => params.set(['a', 'b', 'c'][i], v.slug || v.id));
  return `/karsilastir?${params.toString()}`;
}
