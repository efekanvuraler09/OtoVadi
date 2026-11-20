/** Teknik alanların Türkçe etiketleri (detay, broşür, Özel Dosya ve AI bağlamı ortak kullanır) */
export const FUEL_LABEL: Record<string, string> = {
  petrol: 'Benzin',
  diesel: 'Dizel',
  hybrid: 'Hibrit',
  'plug-in-hybrid': 'Plug-in Hibrit',
  electric: 'Elektrik',
};

export const DRIVETRAIN_LABEL: Record<string, string> = {
  fwd: 'Önden Çekiş',
  rwd: 'Arkadan İtiş',
  awd: 'AWD',
  '4wd': '4x4',
};

export const TRANSMISSION_LABEL: Record<string, string> = {
  automatic: 'Otomatik',
  cvt: 'CVT',
  dct: 'Çift Kavrama',
  manual: 'Manuel',
};

/** Gün adı ve ayı yazıyla, ör. "20 Kasım 2026" */
export function formatLongDate(date: Date, locale = 'tr-TR'): string {
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}
