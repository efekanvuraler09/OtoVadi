export type FuelType = 'petrol' | 'diesel' | 'hybrid' | 'plug-in-hybrid' | 'electric';
export type Drivetrain = 'fwd' | 'rwd' | 'awd' | '4wd';
export type Transmission = 'automatic' | 'cvt' | 'dct' | 'manual';
export type BodyType = 'sedan' | 'suv' | 'hatchback' | 'pickup';

/** Klasman: B/C/D/E/F + gövde tipi (sedan veya suv) */
export type VehicleSegment =
  | 'b-sedan'
  | 'c-sedan'
  | 'd-sedan'
  | 'e-sedan'
  | 'f-sedan'
  | 'b-suv'
  | 'c-suv'
  | 'd-suv'
  | 'e-suv'
  | 'f-suv'
  | 'b-hatchback'
  | 'c-hatchback'
  | 'd-hatchback'
  | 'pickup-midsize'
  | 'pickup-fullsize';

export interface AudioTrack {
  id: string;
  label: string;
  description: string;
  /** Public path under /public */
  src: string;
  durationSeconds: number;
  format: 'mp3' | 'ogg' | 'wav';
  recordedAt?: string;
  microphone?: string;
}

export interface VehicleAudio {
  idle: AudioTrack;
  exhaust: AudioTrack;
  /** Optional rev / acceleration sample */
  rev?: AudioTrack;
}

export interface EngineSpec {
  code: string;
  displacementCc: number;
  cylinders: number;
  configuration: string;
  aspiration: 'naturally-aspirated' | 'turbocharged' | 'supercharged' | 'twin-turbo' | 'electric';
  powerHp: number;
  powerKw: number;
  torqueNm: number;
  redlineRpm?: number;
  fuelType: FuelType;
  emissionStandard?: string;
}

export interface PerformanceSpec {
  zeroTo100Kmh: number;
  topSpeedKmh: number;
  transmission: Transmission;
  gears: number;
  drivetrain: Drivetrain;
}

export interface MultimediaFeature {
  id: string;
  name: string;
  category: 'infotainment' | 'audio' | 'connectivity' | 'driver-assist' | 'comfort';
  description: string;
  icon?: string;
  highlight?: boolean;
}

export interface InteriorMaterial {
  zone: 'seats' | 'dashboard' | 'door-panels' | 'steering' | 'headliner' | 'floor';
  material: string;
  finish?: string;
  colorName: string;
  sustainable?: boolean;
}

export interface TechnicalSection {
  id: string;
  title: string;
  items: { label: string; value: string }[];
}

export interface VehicleDimensions {
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  wheelbaseMm: number;
  bootCapacityL: number;
  curbWeightKg: number;
}

export interface VehicleMedia {
  heroImage: string;
  gallery: string[];
  thumbnail: string;
  colorHex: string;
}

export interface VehicleColorOption {
  id: string;
  name: string;
  hex: string;
  metallic?: boolean;
}

export interface VehicleWheelOption {
  id: string;
  name: string;
  sizeInch: number;
}

export interface VehicleConfigurator {
  colors: VehicleColorOption[];
  wheels: VehicleWheelOption[];
  defaultColorId?: string;
  defaultWheelId?: string;
  /** Opsiyonel 360° kare dizisi: {basePath}/01.webp … {frameCount}.webp */
  spinFrames?: {
    basePath: string;
    frameCount: number;
    extension?: string;
  };
  interiorImage?: string;
}

export interface VehiclePricing {
  currency: 'EUR' | 'USD' | 'TRY';
  msrp: number;
  trim: string;
}

export interface Vehicle {
  id: string;
  slug: string;
  brand: string;
  model: string;
  year: number;
  segment: VehicleSegment;
  bodyType: BodyType;
  bodyStyle: string;
  tagline: string;
  shortDescription: string;
  pricing: VehiclePricing;
  media: VehicleMedia;
  audio: VehicleAudio;
  engine: EngineSpec;
  performance: PerformanceSpec;
  dimensions: VehicleDimensions;
  multimedia: MultimediaFeature[];
  interiorMaterials: InteriorMaterial[];
  technicalSections: TechnicalSection[];
  highlights: string[];
  featured: boolean;
  accentColor: 'blue' | 'red';
  configurator?: VehicleConfigurator;
}

export interface VehicleCatalogMeta {
  version: string;
  lastUpdated: string;
  locale: string;
  availableSegments: VehicleSegment[];
}

export interface VehicleCatalog {
  meta: VehicleCatalogMeta;
  vehicles: Vehicle[];
}
