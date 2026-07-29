import type { BodyType, VehicleSegment } from '../types/vehicle';

export interface SegmentOption {
  id: VehicleSegment;
  bodyType: BodyType;
  classLetter: string;
  label: string;
  shortLabel: string;
  description: string;
}

export const SEGMENT_OPTIONS: SegmentOption[] = [
  { id: 'b-sedan', bodyType: 'sedan', classLetter: 'B', label: 'B Segment Sedan', shortLabel: 'B Sedan', description: 'Kompakt sedan (Golf, 3 Serisi boyutu)' },
  { id: 'c-sedan', bodyType: 'sedan', classLetter: 'C', label: 'C Segment Sedan', shortLabel: 'C Sedan', description: 'Orta sedan (Passat, C-Serisi boyutu)' },
  { id: 'd-sedan', bodyType: 'sedan', classLetter: 'D', label: 'D Segment Sedan', shortLabel: 'D Sedan', description: 'Üst orta sedan (A6, 5 Serisi boyutu)' },
  { id: 'e-sedan', bodyType: 'sedan', classLetter: 'E', label: 'E Segment Sedan', shortLabel: 'E Sedan', description: 'Executive sedan (E-Serisi, S90 boyutu)' },
  { id: 'f-sedan', bodyType: 'sedan', classLetter: 'F', label: 'F Segment Sedan', shortLabel: 'F Sedan', description: 'Lüks üst segment (S-Serisi, 7 Serisi boyutu)' },
  { id: 'b-suv', bodyType: 'suv', classLetter: 'B', label: 'B Segment SUV', shortLabel: 'B SUV', description: 'Küçük crossover (CX-30, Q2 boyutu)' },
  { id: 'c-suv', bodyType: 'suv', classLetter: 'C', label: 'C Segment SUV', shortLabel: 'C SUV', description: 'Kompakt SUV (X3, Q5, GLC boyutu)' },
  { id: 'd-suv', bodyType: 'suv', classLetter: 'D', label: 'D Segment SUV', shortLabel: 'D SUV', description: 'Orta SUV (X5, GLE, Q7 boyutu)' },
  { id: 'e-suv', bodyType: 'suv', classLetter: 'E', label: 'E Segment SUV', shortLabel: 'E SUV', description: 'Büyük lüks SUV (X7, GLS, Escalade boyutu)' },
  { id: 'f-suv', bodyType: 'suv', classLetter: 'F', label: 'F Segment SUV', shortLabel: 'F SUV', description: 'Ultra lüks SUV (Cullinan, Range SV boyutu)' },
  { id: 'b-hatchback', bodyType: 'hatchback', classLetter: 'B', label: 'B Segment Hatchback', shortLabel: 'B HB', description: 'Küçük hatchback (Polo, Clio boyutu)' },
  { id: 'c-hatchback', bodyType: 'hatchback', classLetter: 'C', label: 'C Segment Hatchback', shortLabel: 'C HB', description: 'Kompakt hatchback (Golf, Leon boyutu)' },
  { id: 'd-hatchback', bodyType: 'hatchback', classLetter: 'D', label: 'D Segment Hatchback', shortLabel: 'D HB', description: 'Orta hatchback (Arteon, A5 Sportback boyutu)' },
  { id: 'pickup-midsize', bodyType: 'pickup', classLetter: 'M', label: 'Midsize Pick-up', shortLabel: 'Mid Pick-up', description: 'Orta boy pick-up (Ranger, Hilux boyutu)' },
  { id: 'pickup-fullsize', bodyType: 'pickup', classLetter: 'F', label: 'Fullsize Pick-up', shortLabel: 'Full Pick-up', description: 'Tam boy pick-up (F-150, RAM 1500 boyutu)' },
  { id: 'muscle-car', bodyType: 'muscle-car', classLetter: 'M', label: 'Muscle Cars', shortLabel: 'Muscle', description: 'Yüksek performanslı, geniş hacimli motorlu Amerikan efsaneleri' },
];

export function getSegmentOption(id: VehicleSegment): SegmentOption | undefined {
  return SEGMENT_OPTIONS.find((s) => s.id === id);
}

export function getSegmentsByBodyType(bodyType: BodyType): SegmentOption[] {
  return SEGMENT_OPTIONS.filter((s) => s.bodyType === bodyType);
}
