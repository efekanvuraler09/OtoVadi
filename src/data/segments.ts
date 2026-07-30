import type { BodyType, VehicleSegment } from '../types/vehicle';

export interface SegmentOption {
  segment: VehicleSegment;
  bodyType: BodyType;
  classLetter: string;
  label: string;
  shortLabel: string;
  description: string;
}

export const SEGMENT_OPTIONS: SegmentOption[] = [
  { segment: 'b', bodyType: 'sedan', classLetter: 'B', label: 'B Segment Sedan', shortLabel: 'B Sedan', description: 'Kompakt sedan (Golf, 3 Serisi boyutu)' },
  { segment: 'c', bodyType: 'sedan', classLetter: 'C', label: 'C Segment Sedan', shortLabel: 'C Sedan', description: 'Orta sedan (Passat, C-Serisi boyutu)' },
  { segment: 'd', bodyType: 'sedan', classLetter: 'D', label: 'D Segment Sedan', shortLabel: 'D Sedan', description: 'Üst orta sedan (A6, 5 Serisi boyutu)' },
  { segment: 'e', bodyType: 'sedan', classLetter: 'E', label: 'E Segment Sedan', shortLabel: 'E Sedan', description: 'Executive sedan (E-Serisi, S90 boyutu)' },
  { segment: 'f', bodyType: 'sedan', classLetter: 'F', label: 'F Segment Sedan', shortLabel: 'F Sedan', description: 'Lüks üst segment (S-Serisi, 7 Serisi boyutu)' },
  { segment: 'b', bodyType: 'suv', classLetter: 'B', label: 'B Segment SUV', shortLabel: 'B SUV', description: 'Küçük crossover (CX-30, Q2 boyutu)' },
  { segment: 'c', bodyType: 'suv', classLetter: 'C', label: 'C Segment SUV', shortLabel: 'C SUV', description: 'Kompakt SUV (X3, Q5, GLC boyutu)' },
  { segment: 'd', bodyType: 'suv', classLetter: 'D', label: 'D Segment SUV', shortLabel: 'D SUV', description: 'Orta SUV (X5, GLE, Q7 boyutu)' },
  { segment: 'e', bodyType: 'suv', classLetter: 'E', label: 'E Segment SUV', shortLabel: 'E SUV', description: 'Büyük lüks SUV (X7, GLS, Escalade boyutu)' },
  { segment: 'f', bodyType: 'suv', classLetter: 'F', label: 'F Segment SUV', shortLabel: 'F SUV', description: 'Ultra lüks SUV (Cullinan, Range SV boyutu)' },
  { segment: 'b', bodyType: 'hatchback', classLetter: 'B', label: 'B Segment Hatchback', shortLabel: 'B HB', description: 'Küçük hatchback (Polo, Clio boyutu)' },
  { segment: 'c', bodyType: 'hatchback', classLetter: 'C', label: 'C Segment Hatchback', shortLabel: 'C HB', description: 'Kompakt hatchback (Golf, Leon boyutu)' },
  { segment: 'd', bodyType: 'hatchback', classLetter: 'D', label: 'D Segment Hatchback', shortLabel: 'D HB', description: 'Orta hatchback (Arteon, A5 Sportback boyutu)' },
  { segment: '-', bodyType: 'pickup', classLetter: 'P', label: 'Pick-up Modelleri', shortLabel: 'Pick-up', description: 'Pick-up serisi (F-150, Ranger boyutu)' },
  { segment: '-', bodyType: 'muscle-car', classLetter: 'M', label: 'Muscle Cars', shortLabel: 'Muscle', description: 'Yüksek performanslı, geniş hacimli motorlu Amerikan efsaneleri' },
];

export function getSegmentOption(segment: VehicleSegment, bodyType: BodyType): SegmentOption | undefined {
  return SEGMENT_OPTIONS.find((s) => s.segment === segment && s.bodyType === bodyType);
}

export function getSegmentsByBodyType(bodyType: BodyType): SegmentOption[] {
  return SEGMENT_OPTIONS.filter((s) => s.bodyType === bodyType);
}
