import { create } from 'zustand';
import type { Vehicle, VehicleSegment, BodyType } from '../types/vehicle';

function matchesSearch(vehicle: Vehicle, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    vehicle.brand,
    vehicle.model,
    vehicle.tagline,
    vehicle.shortDescription,
    vehicle.pricing.trim,
    ...vehicle.highlights,
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(q);
}

export function filterVehicles(
  vehicles: Vehicle[],
  query: string,
  segment: VehicleSegment | null,
  bodyType: BodyType | null
): Vehicle[] {
  return vehicles.filter((v) => {
    if (bodyType && v.bodyType !== bodyType) return false;
    if (segment && segment !== '-' && v.segment !== segment) return false;
    return matchesSearch(v, query);
  });
}

export function countBySegment(vehicles: Vehicle[], segment: VehicleSegment, bodyType: BodyType): number {
  return vehicles.filter((v) => {
    if (v.bodyType !== bodyType) return false;
    if (segment !== '-' && v.segment !== segment) return false;
    return true;
  }).length;
}

interface VehicleStore {
  isLoading: boolean;
  /** Firestore aboneliği hata verdiyse dolu olur (kullanıcıya gösterilmez, sadece durum bilgisi) */
  loadError: string | null;
  /** Artırıldığında FirestoreSync aboneliği yeniden kurar */
  retryToken: number;
  vehicles: Vehicle[];
  featuredVehicles: Vehicle[];
  favorites: string[];
  selectedVehicleId: string | null;
  selectedSegment: VehicleSegment | null;
  selectedBodyType: BodyType | null;
  searchQuery: string;
  setVehicles: (vehicles: Vehicle[]) => void;
  setLoadError: (code: string) => void;
  retryLoad: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (bodyType: BodyType | null, segment: VehicleSegment | null) => void;
  selectVehicle: (id: string | null) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  getVehicleBySlug: (slug: string) => Vehicle | undefined;
  getVehicleById: (id: string) => Vehicle | undefined;
}

export const useVehicleStore = create<VehicleStore>()(
  (set, get) => ({
    isLoading: true,
    loadError: null,
    retryToken: 0,
    vehicles: [],
    featuredVehicles: [],
    favorites: [],
    selectedVehicleId: null,
    selectedSegment: null,
    selectedBodyType: null,
    searchQuery: '',

    /** Firestore onSnapshot tarafından çağrılır */
    setVehicles: (vehicles) => set({
      isLoading: false,
      loadError: null,
      vehicles,
      featuredVehicles: vehicles.filter((v) => v.featured),
    }),

    /** onSnapshot hata callback'i: yüklemeyi bitirir, mevcut araçları korur */
    setLoadError: (code) => set({ isLoading: false, loadError: code }),

    retryLoad: () =>
      set((state) => ({ isLoading: true, loadError: null, retryToken: state.retryToken + 1 })),

    setSearchQuery: (query) => set({ searchQuery: query }),

    setSelectedCategory: (bodyType, segment) =>
      set({ selectedBodyType: bodyType, selectedSegment: segment, searchQuery: '' }),

    selectVehicle: (id) => set({ selectedVehicleId: id }),

    toggleFavorite: (id) =>
      set((state) => ({
        favorites: state.favorites.includes(id)
          ? state.favorites.filter((f) => f !== id)
          : [...state.favorites, id],
      })),

    isFavorite: (id) => get().favorites.includes(id),

    getVehicleBySlug: (slug) => get().vehicles.find((v) => v.slug === slug),
    
    getVehicleById: (id) => get().vehicles.find((v) => v.id === id),
  })
);
