import type { BodyType, Vehicle } from '../types/vehicle';

export function countByBodyType(vehicles: Vehicle[], bodyType: BodyType): number {
  return vehicles.filter((v) => v.bodyType === bodyType).length;
}
