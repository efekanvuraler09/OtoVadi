import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useVehicleStore } from '../../store/useVehicleStore';
import { primaryButtonClass, secondaryButtonClass } from './buttonStyles';

/* ── Genel durum ekranı (404, hata, boş durum) ───────────────────── */

interface StatusScreenProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Sayfa içinde bir bölüm olarak gösterilecekse true (daha az dikey boşluk, h2 başlık) */
  compact?: boolean;
}

export function StatusScreen({ eyebrow, title, description, actions, compact = false }: StatusScreenProps) {
  const Heading = compact ? 'h2' : 'h1';

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`mx-auto flex w-full max-w-xl flex-col items-center justify-center px-6 text-center ${
        compact ? 'py-16' : 'min-h-[calc(100svh-4rem)] py-20'
      }`}
    >
      {eyebrow && (
        <span className="mb-6 block font-display text-[11px] font-light uppercase tracking-[0.5em] text-muted">
          {eyebrow}
        </span>
      )}
      <Heading className="font-display text-3xl font-light tracking-wide text-foreground md:text-4xl">
        {title}
      </Heading>
      {description && (
        <p className="mt-4 max-w-md text-sm font-light leading-relaxed text-muted md:text-base">{description}</p>
      )}
      {actions && <div className="mt-10 flex flex-wrap items-center justify-center gap-4">{actions}</div>}
    </motion.section>
  );
}

/* ── Yükleniyor ──────────────────────────────────────────────────── */

interface LoadingStateProps {
  label?: string;
  compact?: boolean;
}

export function LoadingState({ label = 'Yükleniyor...', compact = false }: LoadingStateProps) {
  return (
    <div
      className={`flex w-full items-center justify-center bg-void ${compact ? 'py-16' : 'min-h-[calc(100svh-4rem)]'}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 animate-spin text-muted" />
        <p className="font-sans text-xs uppercase tracking-widest text-muted">{label}</p>
      </div>
    </div>
  );
}

/* ── Veri yüklenemedi ────────────────────────────────────────────── */

interface LoadErrorStateProps {
  onRetry: () => void;
  title?: string;
  description?: string;
  compact?: boolean;
}

export function LoadErrorState({
  onRetry,
  title = 'İçerik yüklenemedi',
  description = 'Bağlantınızı kontrol edip tekrar deneyin. Sorun sürerse birkaç dakika sonra yeniden deneyebilirsiniz.',
  compact = false,
}: LoadErrorStateProps) {
  return (
    <StatusScreen
      compact={compact}
      eyebrow="Bağlantı Sorunu"
      title={title}
      description={description}
      actions={
        <button type="button" onClick={onRetry} className={primaryButtonClass}>
          Tekrar Dene
        </button>
      }
    />
  );
}

/** Firestore araç aboneliği hata verdiğinde gösterilir; "Tekrar Dene" aboneliği yeniden kurar. */
export function VehicleLoadError({ compact = false }: { compact?: boolean }) {
  const retryLoad = useVehicleStore((s) => s.retryLoad);
  return <LoadErrorState onRetry={retryLoad} title="Araç verileri yüklenemedi" compact={compact} />;
}

/* ── Beklenmeyen arayüz hatası (Error Boundary fallback) ─────────── */

export function CrashScreen({ onRetry }: { onRetry?: () => void }) {
  return (
    <StatusScreen
      eyebrow="Beklenmeyen Hata"
      title="Bir şeyler ters gitti"
      description="Bu bölüm görüntülenirken bir sorun oluştu. Tekrar deneyebilir ya da ana sayfaya dönebilirsiniz."
      actions={
        <>
          {onRetry && (
            <button type="button" onClick={onRetry} className={primaryButtonClass}>
              Tekrar Dene
            </button>
          )}
          {/* Hata sonrası temiz başlangıç için tam sayfa yükleme bilinçli olarak tercih edildi */}
          <a href="/" className={secondaryButtonClass}>
            Ana Sayfa
          </a>
        </>
      }
    />
  );
}
