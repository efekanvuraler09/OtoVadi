import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import catalogData from '../data/vehicles.json';
import type { Vehicle, VehicleCatalog, VehicleSegment } from '../types/vehicle';

const catalog = catalogData as VehicleCatalog;

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
  setSearchQuery: (query: string) => void;
  setSelectedSegment: (segment: VehicleSegment | null) => void;
  selectVehicle: (id: string | null) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  getVehicleBySlug: (slug: string) => Vehicle | undefined;
  addVehicle: (vehicle: Vehicle) => void;
  removeVehicle: (id: string) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
}

export const useVehicleStore = create<VehicleStore>()(
  persist(
    (set, get) => ({
  vehicles: catalog.vehicles,
  featuredVehicles: catalog.vehicles.filter((v) => v.featured),
  favorites: [],
  selectedVehicleId: null,
  selectedSegment: null,
  searchQuery: '',

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

  addVehicle: (vehicle) => set((state) => ({ 
    vehicles: [...state.vehicles, vehicle] 
  })),

  removeVehicle: (id) => set((state) => ({
    vehicles: state.vehicles.filter((v) => v.id !== id)
  })),

  updateVehicle: (id, updates) => set((state) => ({
    vehicles: state.vehicles.map((v) => v.id === id ? { ...v, ...updates } : v)
  })),
    }),
    {
      name: 'otovadi_vehicles_storage',
    }
  )
);

export const catalogMeta = catalog.meta;
