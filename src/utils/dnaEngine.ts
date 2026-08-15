import type { Vehicle } from '../types/vehicle';

/* ══════════════════════════════════════════════════════════════════
   SÜRÜCÜ DNA MOTORu — Harici API kullanmadan istemci tarafı
   araç-kişilik eşleştirme algoritması.
   ══════════════════════════════════════════════════════════════════ */

/* ── Tip Tanımları ───────────────────────────────────────────────── */

export interface DriverDNA {
  performance: number;  // 0-100
  elegance: number;     // 0-100
  adventure: number;    // 0-100
  comfort: number;      // 0-100
  technology: number;   // 0-100
}

export type DNADimension = keyof DriverDNA;

export interface QuestionOption {
  id: 'a' | 'b';
  label: string;
  description: string;
  imageQuery: string; // semantik görsel ipucu
}

export interface DNAQuestion {
  id: number;
  prompt: string;
  optionA: QuestionOption;
  optionB: QuestionOption;
  /** Seçenek A'nın etkilediği boyutlar (pozitif puan) */
  effectA: Partial<DriverDNA>;
  /** Seçenek B'nın etkilediği boyutlar (pozitif puan) */
  effectB: Partial<DriverDNA>;
}

/* ── Soru Havuzu ─────────────────────────────────────────────────── */

export const DNA_QUESTIONS: DNAQuestion[] = [
  {
    id: 1,
    prompt: 'Bir pazar sabahı. Direksiyon sizde. Nereye çevirirsiniz?',
    optionA: {
      id: 'a',
      label: 'Sahil Yolu',
      description: 'Camlar açık, tuzlu rüzgâr, sonsuz mavi',
      imageQuery: 'coastal-road',
    },
    optionB: {
      id: 'b',
      label: 'Dağ Virajları',
      description: 'Keskin dönüşler, yükselen adrenalin, zirve',
      imageQuery: 'mountain-road',
    },
    effectA: { comfort: 25, elegance: 15 },
    effectB: { adventure: 25, performance: 15 },
  },
  {
    id: 2,
    prompt: 'Bir kapı açılıyor. İçeride sizi ne karşılasın?',
    optionA: {
      id: 'a',
      label: 'Sessiz Lüks',
      description: 'Siyah deri, ahşap detaylar, mutlak sessizlik',
      imageQuery: 'luxury-interior',
    },
    optionB: {
      id: 'b',
      label: 'Ham Güç',
      description: 'Karbon fiber, Alcantara, motorun nefesi',
      imageQuery: 'sport-interior',
    },
    effectA: { elegance: 25, comfort: 15 },
    effectB: { performance: 25, adventure: 10 },
  },
  {
    id: 3,
    prompt: 'Şehrin ortasında. Işıklar kırmızıya döndü.',
    optionA: {
      id: 'a',
      label: 'Anın Keyfini Çıkar',
      description: 'Müziğe dalarım, kahvemi yudumlarım',
      imageQuery: 'city-calm',
    },
    optionB: {
      id: 'b',
      label: 'Geri Sayımı Başlat',
      description: 'Gözüm sayaçta, refleksler hazır',
      imageQuery: 'city-speed',
    },
    effectA: { comfort: 20, technology: 15 },
    effectB: { performance: 20, adventure: 10 },
  },
  {
    id: 4,
    prompt: 'Yolculuk sizin için ne anlama gelir?',
    optionA: {
      id: 'a',
      label: 'Varış Noktası',
      description: 'Güvenli, verimli, zamanında',
      imageQuery: 'destination',
    },
    optionB: {
      id: 'b',
      label: 'Yolun Kendisi',
      description: 'Her kilometre bir deneyim',
      imageQuery: 'open-road',
    },
    effectA: { technology: 25, comfort: 10 },
    effectB: { adventure: 20, performance: 15 },
  },
  {
    id: 5,
    prompt: 'İdeal arabanız bir müzik türü olsaydı?',
    optionA: {
      id: 'a',
      label: 'Jazz',
      description: 'Katmanlı, sofistike, zamansız',
      imageQuery: 'jazz',
    },
    optionB: {
      id: 'b',
      label: 'Rock',
      description: 'Ham, güçlü, doğrudan',
      imageQuery: 'rock',
    },
    effectA: { elegance: 25, technology: 10 },
    effectB: { performance: 20, adventure: 15 },
  },
];

/* ── DNA Boyut Etiketleri ────────────────────────────────────────── */

export const DNA_LABELS: Record<DNADimension, string> = {
  performance: 'Performans',
  elegance: 'Zarafet',
  adventure: 'Macera',
  comfort: 'Konfor',
  technology: 'Teknoloji',
};

/* ── Kullanıcı Cevaplarından DNA Hesaplama ───────────────────────── */

export function calculateDNA(answers: ('a' | 'b')[]): DriverDNA {
  const dna: DriverDNA = {
    performance: 30,
    elegance: 30,
    adventure: 30,
    comfort: 30,
    technology: 30,
  };

  answers.forEach((answer, index) => {
    const question = DNA_QUESTIONS[index];
    if (!question) return;

    const effect = answer === 'a' ? question.effectA : question.effectB;

    for (const [key, value] of Object.entries(effect)) {
      dna[key as DNADimension] += value as number;
    }
  });

  // Normalize: 0-100 aralığında tut
  for (const key of Object.keys(dna) as DNADimension[]) {
    dna[key] = Math.min(100, Math.max(0, dna[key]));
  }

  return dna;
}

/* ── Araçtan DNA Profili Çıkarma ─────────────────────────────────── */

function extractVehicleDNA(vehicle: Vehicle): DriverDNA {
  const { engine, performance: perf, bodyType, multimedia, interiorMaterials } = vehicle;

  // Performans: güç, tork, hızlanma bazlı
  const powerScore = Math.min(100, (engine.powerHp / 500) * 100);
  const accelScore = Math.min(100, Math.max(0, (10 - perf.zeroTo100Kmh) / 7) * 100);
  const performanceScore = powerScore * 0.5 + accelScore * 0.5;

  // Zarafet: segment, iç mekan malzeme çeşitliliği
  const segmentElegance: Record<string, number> = { b: 20, c: 35, d: 55, e: 75, f: 95, '-': 50 };
  const materialScore = Math.min(100, (interiorMaterials.length / 6) * 100);
  const eleganceScore = (segmentElegance[vehicle.segment] ?? 50) * 0.6 + materialScore * 0.4;

  // Macera: gövde tipi, çekiş sistemi
  const bodyAdventure: Record<string, number> = { suv: 85, pickup: 90, 'muscle-car': 70, hatchback: 45, sedan: 30 };
  const driveAdventure = perf.drivetrain === 'awd' || perf.drivetrain === '4wd' ? 80 : 35;
  const adventureScore = (bodyAdventure[bodyType] ?? 40) * 0.6 + driveAdventure * 0.4;

  // Konfor: ağırlık (daha ağır = daha konforlu genelde), segment, bagaj
  const weightComfort = Math.min(100, (vehicle.dimensions.curbWeightKg / 2200) * 100);
  const bootComfort = Math.min(100, (vehicle.dimensions.bootCapacityL / 600) * 100);
  const comfortScore = weightComfort * 0.3 + (segmentElegance[vehicle.segment] ?? 50) * 0.4 + bootComfort * 0.3;

  // Teknoloji: multimedya sayısı, sürücü destek
  const multimediaScore = Math.min(100, (multimedia.length / 12) * 100);
  const technologyScore = multimediaScore;

  return {
    performance: Math.round(performanceScore),
    elegance: Math.round(eleganceScore),
    adventure: Math.round(adventureScore),
    comfort: Math.round(comfortScore),
    technology: Math.round(technologyScore),
  };
}

/* ── DNA Benzerlik Hesaplama (Kosinüs Uzaklığı Varyantı) ─────── */

function calculateAffinity(userDNA: DriverDNA, vehicleDNA: DriverDNA): number {
  const dimensions: DNADimension[] = ['performance', 'elegance', 'adventure', 'comfort', 'technology'];

  let dotProduct = 0;
  let magUser = 0;
  let magVehicle = 0;

  for (const dim of dimensions) {
    dotProduct += userDNA[dim] * vehicleDNA[dim];
    magUser += userDNA[dim] ** 2;
    magVehicle += vehicleDNA[dim] ** 2;
  }

  const magnitude = Math.sqrt(magUser) * Math.sqrt(magVehicle);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/* ── Ana Eşleştirme Fonksiyonu ───────────────────────────────────── */

export interface MatchResult {
  vehicle: Vehicle;
  vehicleDNA: DriverDNA;
  affinity: number; // 0-1
}

export function findSoulTwin(userDNA: DriverDNA, vehicles: Vehicle[]): MatchResult {
  if (vehicles.length === 0) {
    throw new Error('Araç listesi boş');
  }

  let bestMatch: MatchResult = {
    vehicle: vehicles[0],
    vehicleDNA: extractVehicleDNA(vehicles[0]),
    affinity: 0,
  };

  for (const vehicle of vehicles) {
    const vehicleDNA = extractVehicleDNA(vehicle);
    const affinity = calculateAffinity(userDNA, vehicleDNA);

    if (affinity > bestMatch.affinity) {
      bestMatch = { vehicle, vehicleDNA, affinity };
    }
  }

  return bestMatch;
}
