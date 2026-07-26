import type { Vehicle } from '../types/vehicle';

export function useAccent(vehicle: Pick<Vehicle, 'accentColor'>) {
  const isRed = vehicle.accentColor === 'red';

  return {
    isRed,
    text: isRed ? 'text-accent-red' : 'text-accent',
    bg: isRed ? 'bg-accent-red' : 'bg-accent',
    bgSoft: isRed ? 'bg-accent-red/15' : 'bg-accent/15',
    border: isRed ? 'border-accent-red/40' : 'border-accent/40',
    glow: isRed ? 'shadow-accent-red-glow' : 'shadow-accent-glow',
    gradient: isRed
      ? 'from-accent-red/30 to-accent-red/5'
      : 'from-accent/30 to-accent/5',
  };
}
