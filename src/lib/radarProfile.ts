import type { Vehicle } from '../types/vehicle';
import type { DriverDNA } from '../utils/dnaEngine';
import { DEFAULT_UNIT_PRICE } from './tco';
import {
  approximateVehicleValueTry,
  brandTier,
  clamp,
  energyKind,
  estimateConsumption,
} from './vehicleMetrics';

/**
 * U11 — Ruh İkizi radarı. 5 eksen: araç puanları teknik veriden katalog içi normalizasyonla,
 * kullanıcı puanları test cevaplarından (DriverDNA) deterministik olarak hesaplanır. Aynı girdi her zaman aynı sonucu verir.
 */
export const RADAR_AXES = ['performance', 'comfort', 'economy', 'technology', 'prestige'] as const;
export type RadarAxis = (typeof RADAR_AXES)[number];
export type RadarProfile = Record<RadarAxis, number>;

const SEGMENT_COMFORT: Record<string, number> = { b: 35, c: 50, d: 66, e: 82, f: 94, '-': 55 };
const SEGMENT_PRESTIGE: Record<string, number> = { b: 25, c: 40, d: 62, e: 82, f: 95, '-': 60 };
const BODY_COMFORT: Record<string, number> = { suv: 10, sedan: 8, hatchback: 3, pickup: -6, 'muscle-car': -8 };

interface Range {
  min: number;
  max: number;
}

function rangeOf(values: (number | undefined)[]): Range {
  const valid = values.filter((n): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0);
  if (valid.length === 0) return { min: 0, max: 1 };
  return { min: Math.min(...valid), max: Math.max(...valid) };
}

/** 0–1 arası katalog içi konum; aralık sıfırsa orta değer */
function norm(value: number | undefined, { min, max }: Range): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 0.5;
  return max === min ? 0.5 : clamp((value - min) / (max - min), 0, 1);
}

/** 100 km'lik enerji maliyeti (varsayılan birim fiyatlarla, TL) — farklı yakıt tiplerini aynı ölçekte kıyaslar */
function energyCostPer100(vehicle: Vehicle): number {
  return estimateConsumption(vehicle).value * DEFAULT_UNIT_PRICE[energyKind(vehicle)];
}

export interface RadarContext {
  hp: Range;
  torque: Range;
  accel: Range;
  topSpeed: Range;
  wheelbase: Range;
  boot: Range;
  energyCost: Range;
  price: Range;
  multimedia: Range;
  year: Range;
}

/** Katalog aralıkları bir kez hesaplanır (useMemo ile) */
export function buildRadarContext(vehicles: Vehicle[]): RadarContext {
  return {
    hp: rangeOf(vehicles.map((v) => v.engine?.powerHp)),
    torque: rangeOf(vehicles.map((v) => v.engine?.torqueNm)),
    accel: rangeOf(vehicles.map((v) => v.performance?.zeroTo100Kmh)),
    topSpeed: rangeOf(vehicles.map((v) => v.performance?.topSpeedKmh)),
    wheelbase: rangeOf(vehicles.map((v) => v.dimensions?.wheelbaseMm)),
    boot: rangeOf(vehicles.map((v) => v.dimensions?.bootCapacityL)),
    energyCost: rangeOf(vehicles.map(energyCostPer100)),
    price: rangeOf(vehicles.map(approximateVehicleValueTry)),
    multimedia: rangeOf(vehicles.map((v) => (v.multimedia?.length ?? 0) + 1)),
    year: rangeOf(vehicles.map((v) => v.year)),
  };
}

const score = (value: number) => Math.round(clamp(value, 4, 98));

export function vehicleRadar(vehicle: Vehicle, ctx: RadarContext): RadarProfile {
  const { engine, performance: perf, dimensions } = vehicle;

  const performance =
    100 *
    (0.4 * norm(engine?.powerHp, ctx.hp) +
      0.3 * (1 - norm(perf?.zeroTo100Kmh, ctx.accel)) +
      0.15 * norm(engine?.torqueNm, ctx.torque) +
      0.15 * norm(perf?.topSpeedKmh, ctx.topSpeed));

  const automatic = perf?.transmission && perf.transmission !== 'manual' ? 5 : 0;
  const comfort =
    0.55 * (SEGMENT_COMFORT[vehicle.segment] ?? 55) +
    22 * norm(dimensions?.wheelbaseMm, ctx.wheelbase) +
    13 * norm(dimensions?.bootCapacityL, ctx.boot) +
    (BODY_COMFORT[vehicle.bodyType] ?? 0) +
    automatic;

  const economy =
    100 * (0.65 * (1 - norm(energyCostPer100(vehicle), ctx.energyCost)) + 0.35 * (1 - norm(approximateVehicleValueTry(vehicle), ctx.price)));

  const fuel = engine?.fuelType;
  const electrified = fuel === 'electric' ? 25 : fuel === 'plug-in-hybrid' ? 20 : fuel === 'hybrid' ? 12 : 0;
  const assists = Math.min(3, (vehicle.multimedia ?? []).filter((m) => m.category === 'driver-assist').length);
  const technology =
    100 * (0.45 * norm((vehicle.multimedia?.length ?? 0) + 1, ctx.multimedia) + 0.35 * norm(vehicle.year, ctx.year)) +
    electrified +
    5 * assists;

  const tier = brandTier(vehicle);
  const prestige =
    0.5 * (SEGMENT_PRESTIGE[vehicle.segment] ?? 60) +
    32 * norm(approximateVehicleValueTry(vehicle), ctx.price) +
    (tier === 'premium' ? 18 : tier === 'performance' ? 10 : 0) +
    (vehicle.bodyType === 'muscle-car' ? 6 : 0);

  return {
    performance: score(performance),
    comfort: score(comfort),
    economy: score(economy),
    technology: score(technology),
    prestige: score(prestige),
  };
}

/** Test cevaplarından türetilen kullanıcı profili (Ekonomi, performans/macera eğiliminin tersidir) */
export function userRadar(dna: DriverDNA): RadarProfile {
  return {
    performance: score(dna.performance),
    comfort: score(dna.comfort),
    economy: score(110 - 0.55 * dna.performance - 0.35 * dna.adventure),
    technology: score(dna.technology),
    prestige: score(dna.elegance),
  };
}

/** Eksen i'nin (üstten saat yönünde) birim vektörü: SVG radarı ve Story kartı aynı geometriyi kullanır */
export function axisVector(index: number, count = RADAR_AXES.length): { x: number; y: number } {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

export function radarPoints(profile: RadarProfile, cx: number, cy: number, radius: number): { x: number; y: number }[] {
  return RADAR_AXES.map((axis, i) => {
    const { x, y } = axisVector(i);
    const r = (profile[axis] / 100) * radius;
    return { x: cx + x * r, y: cy + y * r };
  });
}
