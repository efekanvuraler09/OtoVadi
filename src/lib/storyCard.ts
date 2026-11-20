import type { Vehicle } from '../types/vehicle';
import { vehicleBrand, vehicleModel } from '../utils/vehicleText';
import { trustedSpec } from './specTrust';
import { RADAR_AXES, axisVector, radarPoints, type RadarAxis, type RadarProfile } from './radarProfile';

/**
 * Y3 — Ruh İkizi 9:16 Instagram Story kartı (1080×1920 PNG). Harici paket yok: saf Canvas 2D.
 * Bu modül yalnızca "Story Kartı İndir/Paylaş" tıklanınca dinamik import edilir (sayfa parçasını şişirmez).
 *
 * CORS: Araç fotoğrafı crossOrigin="anonymous" ile denenir. Sunucu izin vermezse görsel hiç yüklenmez (onerror)
 * ya da 1×1 test tuvalinde getImageData hata verir → fotoğraf ATLANIR ve tipografik stüdyo kartı çizilir.
 * Ana tuval asla kirlenmez; yine de toBlob güvenlik hatası verirse kart fotoğrafsız yeniden çizilir.
 */

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

const DISPLAY = '"Playfair Display", serif';
const SANS = '"Inter Variable", "Inter", system-ui, sans-serif';
const BG_TOP = '#141414';
const BG_MID = '#080808';
const BG_BOTTOM = '#020202';
const white = (alpha: number) => `rgba(255, 255, 255, ${alpha})`;

export interface StoryCardInput {
  vehicle: Vehicle;
  affinityPercent: number;
  vehicleProfile: RadarProfile;
  userProfile: RadarProfile;
  axisLabels: Record<RadarAxis, string>;
  /** Eksen etiketlerini büyük harfe çevirmek için (tr → "TEKNOLOJİ") */
  locale: string;
}

export interface StoryCardResult {
  blob: Blob;
  /** Fotoğraf CORS izniyle karta eklenebildi mi */
  withPhoto: boolean;
}

/* ── Yardımcılar ─────────────────────────────────────────────────── */

async function ensureFonts(sample: string): Promise<void> {
  if (!document.fonts?.load) return;
  try {
    await Promise.all([
      document.fonts.load(`400 96px ${DISPLAY}`, sample),
      document.fonts.load(`300 64px ${SANS}`, '0123456789%,.'),
      document.fonts.load(`500 24px ${SANS}`, 'OTOVADİ · RUH İKİZİ ĞÜŞÖÇ'),
    ]);
  } catch {
    // Font yüklenemezse sistem yazı tipiyle devam edilir
  }
}

function loadCorsImage(src: string | undefined, timeoutMs = 6000): Promise<HTMLImageElement | null> {
  const url = src?.trim();
  if (!url || !/^https?:|^\//i.test(url)) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    const timer = window.setTimeout(() => resolve(null), timeoutMs);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(img.naturalWidth > 0 ? img : null);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

/** Görsel tuvali kirletir mi? Ayrı 1×1 tuvalde denenir; ana kart etkilenmez. */
function isCanvasSafe(img: HTMLImageElement): boolean {
  try {
    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    const ctx = probe.getContext('2d');
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0, 1, 1);
    ctx.getImageData(0, 0, 1, 1);
    return true;
  } catch {
    return false;
  }
}

/** Harf aralıklı metin (ctx.letterSpacing her tarayıcıda yok) */
function drawSpaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: 'left' | 'center' | 'right' = 'center',
): number {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
  let cursor = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  chars.forEach((c, i) => {
    ctx.fillText(c, cursor, y);
    cursor += widths[i] + spacing;
  });
  ctx.textAlign = prevAlign;
  return total;
}

interface Run {
  text: string;
  digit: boolean;
}

/** Model adındaki rakamlar Inter ile çizilir (Playfair'in eski stil rakamları "320i"yi "32oi" gibi gösterir; tüm rakamlar Inter kuralı) */
function splitRuns(text: string): Run[] {
  return text
    .split(/(\d+(?:[.,]\d+)?)/)
    .filter(Boolean)
    .map((part) => ({ text: part, digit: /^\d/.test(part) }));
}

function runFont(run: Run, size: number): string {
  return run.digit ? `300 ${Math.round(size * 0.9)}px ${SANS}` : `400 ${size}px ${DISPLAY}`;
}

function measureRuns(ctx: CanvasRenderingContext2D, runs: Run[], size: number): number {
  return runs.reduce((sum, run) => {
    ctx.font = runFont(run, size);
    return sum + ctx.measureText(run.text).width;
  }, 0);
}

function drawRuns(ctx: CanvasRenderingContext2D, runs: Run[], size: number, centerX: number, y: number): void {
  let cursor = centerX - measureRuns(ctx, runs, size) / 2;
  ctx.textAlign = 'left';
  for (const run of runs) {
    ctx.font = runFont(run, size);
    ctx.fillText(run.text, cursor, y);
    cursor += ctx.measureText(run.text).width;
  }
}

/** Model adını en fazla 2 satıra ve 880 px genişliğe sığdırır */
function fitName(ctx: CanvasRenderingContext2D, name: string): { lines: Run[][]; size: number } {
  const maxWidth = 880;
  const single = splitRuns(name);
  for (let size = 124; size >= 84; size -= 4) {
    if (measureRuns(ctx, single, size) <= maxWidth) return { lines: [single], size };
  }
  const words = name.split(' ');
  let best: { lines: Run[][]; width: number } | null = null;
  for (let i = 1; i < words.length; i += 1) {
    const lines = [splitRuns(words.slice(0, i).join(' ')), splitRuns(words.slice(i).join(' '))];
    const width = Math.max(...lines.map((l) => measureRuns(ctx, l, 100)));
    if (!best || width < best.width) best = { lines, width };
  }
  const lines = best?.lines ?? [single];
  for (let size = 100; size >= 56; size -= 4) {
    if (Math.max(...lines.map((l) => measureRuns(ctx, l, size))) <= maxWidth) return { lines, size };
  }
  return { lines, size: 56 };
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number): void {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/* ── Katmanlar ───────────────────────────────────────────────────── */

function drawBackground(ctx: CanvasRenderingContext2D): void {
  const bg = ctx.createLinearGradient(0, 0, 0, STORY_HEIGHT);
  bg.addColorStop(0, BG_TOP);
  bg.addColorStop(0.45, BG_MID);
  bg.addColorStop(1, BG_BOTTOM);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  // Stüdyo ışığı
  const glow = ctx.createRadialGradient(540, 520, 0, 540, 520, 760);
  glow.addColorStop(0, white(0.07));
  glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  // İnce çerçeve ve köşe işaretleri
  ctx.strokeStyle = white(0.14);
  ctx.lineWidth = 1;
  ctx.strokeRect(56.5, 56.5, STORY_WIDTH - 113, STORY_HEIGHT - 113);
  ctx.strokeStyle = white(0.55);
  ctx.lineWidth = 2;
  const tick = 30;
  for (const [cx, cy, dx, dy] of [
    [56, 56, 1, 1],
    [STORY_WIDTH - 56, 56, -1, 1],
    [56, STORY_HEIGHT - 56, 1, -1],
    [STORY_WIDTH - 56, STORY_HEIGHT - 56, -1, -1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx * tick, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * tick);
    ctx.stroke();
  }
}

function drawStamp(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = white(0.8);
  ctx.font = `500 26px ${SANS}`;
  ctx.textBaseline = 'alphabetic';
  const width = drawSpaced(ctx, 'OTOVADİ · RUH İKİZİ', 540, 158, 9);
  ctx.strokeStyle = white(0.25);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(540 - width / 2 - 120, 149.5);
  ctx.lineTo(540 - width / 2 - 28, 149.5);
  ctx.moveTo(540 + width / 2 + 28, 149.5);
  ctx.lineTo(540 + width / 2 + 120, 149.5);
  ctx.stroke();
}

function drawPhoto(ctx: CanvasRenderingContext2D, img: HTMLImageElement, top: number, height: number): void {
  const x = 104;
  const w = STORY_WIDTH - 208;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, top, w, height);
  ctx.clip();
  drawCover(ctx, img, x, top, w, height);
  // Kenarlar sahneye karışsın
  const fadeBottom = ctx.createLinearGradient(0, top + height * 0.55, 0, top + height);
  fadeBottom.addColorStop(0, 'rgba(8, 8, 8, 0)');
  fadeBottom.addColorStop(1, 'rgba(8, 8, 8, 1)');
  ctx.fillStyle = fadeBottom;
  ctx.fillRect(x, top, w, height);
  const fadeTop = ctx.createLinearGradient(0, top, 0, top + 90);
  fadeTop.addColorStop(0, 'rgba(18, 18, 18, 0.85)');
  fadeTop.addColorStop(1, 'rgba(18, 18, 18, 0)');
  ctx.fillStyle = fadeTop;
  ctx.fillRect(x, top, w, height);
  ctx.restore();
  ctx.strokeStyle = white(0.12);
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, top + 0.5, w - 1, height - 1);
}

/** Fotoğraf yoksa: eş merkezli halkalar, ızgara çizgileri ve monogramla editoryal stüdyo kompozisyonu */
function drawEditorialGeometry(ctx: CanvasRenderingContext2D, top: number, height: number, affinity: number): void {
  const cx = 540;
  const cy = top + height / 2;
  const maxR = Math.min(height / 2 - 10, 300);

  ctx.save();
  ctx.lineWidth = 1;
  [0.32, 0.55, 0.78, 1].forEach((f, i) => {
    ctx.strokeStyle = white(0.05 + i * 0.03);
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * f, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Dış halkada derece işaretleri; uyum oranı kadar yay vurgulanır
  for (let deg = 0; deg < 360; deg += 6) {
    const a = (deg * Math.PI) / 180 - Math.PI / 2;
    const long = deg % 30 === 0;
    const r1 = maxR + 8;
    const r2 = maxR + (long ? 26 : 16);
    ctx.strokeStyle = white(long ? 0.4 : 0.16);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.stroke();
  }
  ctx.strokeStyle = white(0.85);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, maxR, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * affinity) / 100);
  ctx.stroke();

  // Artı işareti ve köşegenler
  ctx.lineWidth = 1;
  ctx.strokeStyle = white(0.08);
  ctx.beginPath();
  ctx.moveTo(104, cy);
  ctx.lineTo(STORY_WIDTH - 104, cy);
  ctx.moveTo(cx, top);
  ctx.lineTo(cx, top + height);
  ctx.moveTo(cx - maxR * 0.72, cy - maxR * 0.72);
  ctx.lineTo(cx + maxR * 0.72, cy + maxR * 0.72);
  ctx.moveTo(cx + maxR * 0.72, cy - maxR * 0.72);
  ctx.lineTo(cx - maxR * 0.72, cy + maxR * 0.72);
  ctx.stroke();

  // Monogram
  ctx.fillStyle = BG_MID;
  ctx.fillRect(cx - 230, cy - 50, 460, 100);
  ctx.fillStyle = white(0.85);
  ctx.font = `400 60px ${DISPLAY}`;
  ctx.textBaseline = 'middle';
  drawSpaced(ctx, 'OTOVADİ', cx, cy + 2, 16);
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

function drawRadar(
  ctx: CanvasRenderingContext2D,
  input: StoryCardInput,
  cy: number,
): void {
  const cx = 540;
  const R = 160;
  const upper = (s: string) => s.toLocaleUpperCase(input.locale === 'tr' ? 'tr-TR' : input.locale);

  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = white(0.13);
  for (const ring of [0.25, 0.5, 0.75, 1]) {
    ctx.beginPath();
    RADAR_AXES.forEach((_, i) => {
      const v = axisVector(i);
      const x = cx + v.x * R * ring;
      const y = cy + v.y * R * ring;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  }
  RADAR_AXES.forEach((_, i) => {
    const v = axisVector(i);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + v.x * R, cy + v.y * R);
    ctx.stroke();
  });

  const polygon = (profile: RadarProfile) => {
    const pts = radarPoints(profile, cx, cy, R);
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    return pts;
  };

  // Kullanıcı (kesikli)
  polygon(input.userProfile);
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = white(0.5);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);

  // Araç (dolu)
  const pts = polygon(input.vehicleProfile);
  ctx.fillStyle = white(0.12);
  ctx.fill();
  ctx.strokeStyle = white(0.95);
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Etiketler
  RADAR_AXES.forEach((axis, i) => {
    const v = axisVector(i);
    const lx = cx + v.x * (R + 28);
    const ly = cy + v.y * (R + 28);
    const align: 'left' | 'center' | 'right' = Math.abs(v.x) < 0.2 ? 'center' : v.x > 0 ? 'left' : 'right';
    const nameY = v.y < -0.5 ? ly - 34 : v.y > 0.5 ? ly + 18 : ly - 6;

    ctx.fillStyle = white(0.6);
    ctx.font = `500 22px ${SANS}`;
    drawSpaced(ctx, upper(input.axisLabels[axis]), lx, nameY, 4, align);

    const own = String(input.vehicleProfile[axis]);
    const theirs = ` · ${input.userProfile[axis]}`;
    ctx.font = `500 28px ${SANS}`;
    const ownW = ctx.measureText(own).width;
    ctx.font = `400 28px ${SANS}`;
    const theirsW = ctx.measureText(theirs).width;
    const total = ownW + theirsW;
    const start = align === 'center' ? lx - total / 2 : align === 'right' ? lx - total : lx;
    ctx.textAlign = 'left';
    ctx.font = `500 28px ${SANS}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(own, start, nameY + 34);
    ctx.font = `400 28px ${SANS}`;
    ctx.fillStyle = white(0.45);
    ctx.fillText(theirs, start + ownW, nameY + 34);
  });
  ctx.restore();
}

function drawLegend(ctx: CanvasRenderingContext2D, y: number): void {
  ctx.save();
  ctx.font = `400 22px ${SANS}`;
  ctx.textAlign = 'left';
  const a = 'Ruh ikiziniz';
  const b = 'Siz';
  const aw = ctx.measureText(a).width;
  const bw = ctx.measureText(b).width;
  const total = 36 + 12 + aw + 48 + 36 + 12 + bw;
  let x = 540 - total / 2;
  ctx.fillStyle = white(0.15);
  ctx.strokeStyle = white(0.95);
  ctx.lineWidth = 2;
  ctx.fillRect(x, y - 16, 36, 18);
  ctx.strokeRect(x, y - 16, 36, 18);
  x += 48;
  ctx.fillStyle = white(0.6);
  ctx.fillText(a, x, y);
  x += aw + 48;
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = white(0.55);
  ctx.beginPath();
  ctx.moveTo(x, y - 7);
  ctx.lineTo(x + 36, y - 7);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillText(b, x + 48, y);
  ctx.restore();
}

function drawStats(ctx: CanvasRenderingContext2D, vehicle: Vehicle, top: number): void {
  const fmt = (n: number | null, digits = 0) =>
    n !== null ? n.toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '—';
  // Doğrulanmamış (şablon) değerler kartta "—" (Cila 1)
  const stats = [
    { label: 'GÜÇ', value: fmt(trustedSpec(vehicle, 'powerHp')), unit: 'HP' },
    { label: 'TORK', value: fmt(trustedSpec(vehicle, 'torqueNm')), unit: 'Nm' },
    { label: '0–100 KM/S', value: fmt(trustedSpec(vehicle, 'zeroTo100Kmh'), 1), unit: 'sn' },
  ];

  ctx.save();
  ctx.strokeStyle = white(0.14);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(104, top - 0.5);
  ctx.lineTo(STORY_WIDTH - 104, top - 0.5);
  ctx.moveTo(390.5, top + 24);
  ctx.lineTo(390.5, top + 130);
  ctx.moveTo(690.5, top + 24);
  ctx.lineTo(690.5, top + 130);
  ctx.stroke();

  stats.forEach((stat, i) => {
    const cx = 240 + i * 300;
    ctx.fillStyle = white(0.55);
    ctx.font = `500 21px ${SANS}`;
    drawSpaced(ctx, stat.label, cx, top + 52, 4);

    ctx.font = `300 60px ${SANS}`;
    const vw = ctx.measureText(stat.value).width;
    ctx.font = `400 24px ${SANS}`;
    const uw = ctx.measureText(stat.unit).width;
    const start = cx - (vw + 10 + uw) / 2;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = `300 60px ${SANS}`;
    ctx.fillText(stat.value, start, top + 120);
    ctx.fillStyle = white(0.55);
    ctx.font = `400 24px ${SANS}`;
    ctx.fillText(stat.unit, start + vw + 10, top + 120);
  });
  ctx.restore();
}

function render(input: StoryCardInput, photo: HTMLImageElement | null): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D desteklenmiyor');
  ctx.textBaseline = 'alphabetic';

  const brand = vehicleBrand(input.vehicle).toLocaleUpperCase('en-US');
  const model = vehicleModel(input.vehicle) || brand;
  const { lines, size } = fitName(ctx, model);
  // İki satırlık adlarda görsel alan kısalır, alt blok yerinde kalır
  const extra = lines.length > 1 ? Math.round(size * 0.95) : 0;
  const visualTop = 220;
  const visualHeight = 440 - extra;

  drawBackground(ctx);
  drawStamp(ctx);
  if (photo) drawPhoto(ctx, photo, visualTop, visualHeight);
  else drawEditorialGeometry(ctx, visualTop, visualHeight, input.affinityPercent);

  // Başlık bloğu
  let y = visualTop + visualHeight + 92;
  ctx.fillStyle = white(0.55);
  ctx.font = `500 23px ${SANS}`;
  drawSpaced(ctx, 'SİZİN RUH İKİZİNİZ', 540, y, 8);
  y += 58;
  ctx.fillStyle = white(0.85);
  ctx.font = `500 30px ${SANS}`;
  drawSpaced(ctx, brand, 540, y, 10);
  y += Math.round(size * 1.02);
  ctx.fillStyle = '#ffffff';
  lines.forEach((line, i) => {
    drawRuns(ctx, line, size, 540, y + i * Math.round(size * 0.95));
  });
  y += (lines.length - 1) * Math.round(size * 0.95);

  // Uyum oranı: büyük rakam + yanında "UYUM" etiketi (tek satır, ortalı)
  y += 128;
  const affinityText = `%${input.affinityPercent}`;
  ctx.font = `300 104px ${SANS}`;
  const numberWidth = ctx.measureText(affinityText).width;
  ctx.font = `500 21px ${SANS}`;
  const labelWidth = [...'UYUM'].reduce((w, c) => w + ctx.measureText(c).width, 0) + 8 * 3;
  const affinityStart = 540 - (numberWidth + 22 + labelWidth) / 2;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = `300 104px ${SANS}`;
  ctx.fillText(affinityText, affinityStart, y);
  ctx.fillStyle = white(0.55);
  ctx.font = `500 21px ${SANS}`;
  drawSpaced(ctx, 'UYUM', affinityStart + numberWidth + 22, y - 10, 8, 'left');

  drawRadar(ctx, input, 1332);
  drawLegend(ctx, 1585);
  drawStats(ctx, input.vehicle, 1625);

  ctx.fillStyle = white(0.6);
  ctx.font = `400 24px ${SANS}`;
  drawSpaced(ctx, 'otovadi.vercel.app', 540, 1830, 5);

  return canvas;
}

function toPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG üretilemedi'))), 'image/png');
    } catch (error) {
      // Kirlenmiş tuval: SecurityError
      reject(error);
    }
  });
}

/** Kartı üretir. Fotoğraf CORS izni yoksa sessizce tipografik karta düşer; asla tuval güvenlik hatası fırlatmaz. */
export async function createSoulTwinStory(input: StoryCardInput): Promise<StoryCardResult> {
  const name = `${vehicleBrand(input.vehicle)} ${vehicleModel(input.vehicle)}`;
  const [, loaded] = await Promise.all([
    ensureFonts(name),
    loadCorsImage(input.vehicle.media?.heroImage || input.vehicle.media?.thumbnail),
  ]);
  const photo = loaded && isCanvasSafe(loaded) ? loaded : null;

  if (photo) {
    try {
      return { blob: await toPngBlob(render(input, photo)), withPhoto: true };
    } catch {
      // Beklenmedik kirlenme: fotoğrafsız yeniden dene
    }
  }
  return { blob: await toPngBlob(render(input, null)), withPhoto: false };
}
