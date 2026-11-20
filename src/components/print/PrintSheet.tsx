import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PrintSheetProps {
  /** Ekran okuyucular ve PDF anahat bilgisi için belge adı */
  label: string;
  children: ReactNode;
}

/**
 * Baskı belgesi kabı (1.2 / 2.3). body'ye portal edilir ve ekranda hiç görünmez (display: none). Yazdırırken
 * index.css'teki @media print kuralı body'nin diğer tüm çocuklarını (uygulama, modallar, toast) gizler, yalnızca bunu basar.
 * İçerik `.print-page` öğelerinden oluşur (A4 = 210 × 297 mm, kenar boşluğu sayfanın kendi padding'i).
 */
export function PrintSheet({ label, children }: PrintSheetProps) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="print-sheet bg-void font-sans text-foreground" role="document" aria-label={label}>
      {children}
    </div>,
    document.body,
  );
}

interface PrintPageProps {
  children: ReactNode;
  /**
   * page → tam bir A4 sayfası (flex sütun, altbilgi en alta yaslanır; broşür tek sayfaya sığacak şekilde tasarlanır, taşan kısım kesilir).
   * flow → blok akış; içerik uzarsa tarayıcı sonraki sayfaya temiz böler (Özel Dosya; flex sütun parçalanmasından kaçınılır).
   */
  fit?: 'page' | 'flow';
  className?: string;
}

/** A4 sayfa: matbaa kenar boşlukları (16 × 14 mm) */
export function PrintPage({ children, fit = 'page', className = '' }: PrintPageProps) {
  const layout = fit === 'page' ? 'flex h-[297mm] flex-col overflow-hidden' : 'block';
  return (
    <section className={`print-page mx-auto box-border w-[210mm] px-[16mm] py-[14mm] ${layout} ${className}`}>
      {children}
    </section>
  );
}

interface PrintHeaderProps {
  /** Sağ üstte, ör. "TEKNİK KÜNYE" */
  title: string;
  date: string;
}

/** Belge üst bandı: OTOVADİ · <BAŞLIK> ve tarih, altında ince çizgi */
export function PrintHeader({ title, date }: PrintHeaderProps) {
  return (
    <div className="flex items-baseline justify-between border-b border-foreground pb-3">
      <p className="text-2xs font-medium uppercase tracking-eyebrow text-foreground">
        OtoVadi <span className="text-muted">·</span> {title}
      </p>
      <p className="text-2xs tabular-nums text-muted">{date}</p>
    </div>
  );
}

interface PrintFooterProps {
  note: string;
}

/** Sayfa altı: zarif serif imza, adres ve temsili hesap uyarısı */
export function PrintFooter({ note }: PrintFooterProps) {
  return (
    // mt-auto: page düzeninde en alta yaslar; pt: flow düzeninde içerikle arasında boşluk bırakır
    <div className="print-avoid-break mt-auto pt-[3mm]">
      <div className="flex items-end justify-between gap-8 border-t border-border-subtle pt-4">
        <p className="max-w-[120mm] text-2xs leading-relaxed text-muted">{note}</p>
        <div className="shrink-0 text-right">
          <p className="font-display text-xl font-normal leading-none text-foreground">OtoVadi</p>
          <p className="mt-1 text-2xs uppercase tracking-eyebrow text-muted">
            Dijital Showroom · <span lang="en">otovadi.vercel.app</span>
          </p>
        </div>
      </div>
    </div>
  );
}
