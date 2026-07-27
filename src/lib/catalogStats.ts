import { SEGMENT_OPTIONS } from '../data/segments';
import type { BodyType, Vehicle, VehicleSegment } from '../types/vehicle';

const BODY_TYPE_LABELS: Record<BodyType, string> = {
  sedan: 'Sedan',
  suv: 'SUV',
  hatchback: 'Hatchback',
  pickup: 'Pick-up',
};

export function countByBodyType(vehicles: Vehicle[], bodyType: BodyType): number {
  return vehicles.filter((v) => v.bodyType === bodyType).length;
}

export function getBodyTypesWithVehicles(vehicles: Vehicle[]): BodyType[] {
  const types: BodyType[] = ['sedan', 'suv', 'hatchback', 'pickup'];
  return types.filter((t) => countByBodyType(vehicles, t) > 0);
}

export function getSegmentsWithVehicles(vehicles: Vehicle[], bodyType: BodyType) {
  return SEGMENT_OPTIONS.filter(
    (seg) => seg.bodyType === bodyType && vehicles.some((v) => v.segment === seg.id),
  );
}

export function countActiveSegments(vehicles: Vehicle[]): number {
  return SEGMENT_OPTIONS.filter((seg) =>
    vehicles.some((v) => v.segment === seg.id),
  ).length;
}

export function getHeroStats(vehicles: Vehicle[]) {
  const bodyTypes = getBodyTypesWithVehicles(vehicles);
  return [
    { label: 'Kayıtlı', value: vehicles.length },
    ...bodyTypes.map((bodyType) => ({
      label: BODY_TYPE_LABELS[bodyType],
      value: countByBodyType(vehicles, bodyType),
    })),
  ];
}

export function segmentHasVehicles(vehicles: Vehicle[], segment: VehicleSegment): boolean {
  return vehicles.some((v) => v.segment === segment);
}
