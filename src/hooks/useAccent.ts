import type { Vehicle } from '../types/vehicle';

export function useAccent(_vehicle: Pick<Vehicle, 'accentColor'>) {
  return {
    isRed: false,
    text: 'text-foreground',
    bg: 'bg-foreground',
    bgSoft: 'bg-foreground/10',
    border: 'border-border-subtle',
    glow: '',
    gradient: '',
  };
}
