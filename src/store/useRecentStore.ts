import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Vehicle } from '../types/vehicle';

/** "Kaldığınız Yerden" şeridinde gösterilen en fazla araç (1.3) */
export const MAX_RECENT = 3;

interface RecentState {
  /** Araç doküman id'leri, en son incelenen önce */
  ids: string[];
  record: (id: string) => void;
  clear: () => void;
}

/**
 * 1.3 — Son incelenen araçlar. Yalnızca bu tarayıcıda (localStorage `recently-viewed`) tutulur; Firestore'a yazılmaz.
 * Depolama erişilemezse (gizli pencere vb.) zustand persist sessizce bellek içi çalışır (karşılaştırma tepsisi deseni).
 */
export const useRecentStore = create<RecentState>()(
  persist(
    (set) => ({
      ids: [],
      record: (id) =>
        set((state) => (state.ids[0] === id ? state : { ids: [id, ...state.ids.filter((x) => x !== id)].slice(0, MAX_RECENT) })),
      clear: () => set({ ids: [] }),
    }),
    {
      name: 'recently-viewed',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ ids: state.ids }),
      version: 1,
    },
  ),
);

/** Kayıtlı id'leri güncel katalogla eşleştirir (doküman id veya slug); katalogdan kalkmış araçlar atlanır */
export function resolveRecentVehicles(ids: string[], vehicles: Vehicle[]): Vehicle[] {
  return ids
    .map((key) => vehicles.find((v) => v.id === key) ?? vehicles.find((v) => v.slug === key))
    .filter((v): v is Vehicle => Boolean(v));
}
