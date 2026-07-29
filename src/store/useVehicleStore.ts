import { create } from 'zustand';
import type { Vehicle, VehicleSegment } from '../types/vehicle';

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
): Vehicle[] {
  return vehicles.filter((v) => {
    if (segment && v.segment !== segment) return false;
    return matchesSearch(v, query);
  });
}

export function countBySegment(vehicles: Vehicle[], segment: VehicleSegment): number {
  return vehicles.filter((v) => v.segment === segment).length;
}

interface VehicleStore {
  vehicles: Vehicle[];
  featuredVehicles: Vehicle[];
  favorites: string[];
  selectedVehicleId: string | null;
  selectedSegment: VehicleSegment | null;
  searchQuery: string;
  setVehicles: (vehicles: Vehicle[]) => void;
  setSearchQuery: (query: string) => void;
  setSelectedSegment: (segment: VehicleSegment | null) => void;
  selectVehicle: (id: string | null) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  getVehicleBySlug: (slug: string) => Vehicle | undefined;
}

export const useVehicleStore = create<VehicleStore>()(
  (set, get) => ({
    vehicles: [],
    featuredVehicles: [],
    favorites: [],
    selectedVehicleId: null,
    selectedSegment: null,
    searchQuery: '',

    /** Firestore onSnapshot tarafından çağrılır */
    setVehicles: (vehicles) => set({
      vehicles,
      featuredVehicles: vehicles.filter((v) => v.featured),
    }),

    setSearchQuery: (query) => set({ searchQuery: query }),

    setSelectedSegment: (segment) =>
      set({ selectedSegment: segment, searchQuery: '' }),

    selectVehicle: (id) => set({ selectedVehicleId: id }),

    toggleFavorite: (id) =>
      set((state) => ({
        favorites: state.favorites.includes(id)
          ? state.favorites.filter((f) => f !== id)
          : [...state.favorites, id],
      })),

    isFavorite: (id) => get().favorites.includes(id),

    getVehicleBySlug: (slug) => get().vehicles.find((v) => v.slug === slug),
  })
);
