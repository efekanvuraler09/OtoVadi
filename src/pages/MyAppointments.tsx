import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Car } from 'lucide-react';
import type { FirestoreError } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserTestDrives, type TestDriveRequest } from '../services/testDriveService';
import { LoadErrorState, LoadingState, StatusScreen } from '../components/ui/DataState';
import { primaryButtonClass } from '../components/ui/buttonStyles';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { TRANSITION, fade, fadeUp, staggerDelay } from '../lib/motion';

/** Randevu durumları: semantik tokenlar (her iki temada AA kontrastlı) */
const STATUS_STYLES = {
  pending: { label: 'Bekliyor', badge: 'border-warning/40 bg-warning/10 text-warning', bar: 'bg-warning' },
  approved: { label: 'Onaylandı', badge: 'border-success/40 bg-success/10 text-success', bar: 'bg-success' },
  rejected: { label: 'Reddedildi', badge: 'border-danger/40 bg-danger/10 text-danger', bar: 'bg-danger' },
} as const;

interface AppointmentsSnapshot {
  /** Hangi kullanıcı + deneme için alındığı; eski anlık görüntü yeni oturumda gösterilmez */
  key: string;
  items: TestDriveRequest[];
  error: FirestoreError | null;
}

export function MyAppointments() {
  const { user, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const [snapshot, setSnapshot] = useState<AppointmentsSnapshot | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const uid = user?.uid ?? null;
  const subscriptionKey = uid ? `${uid}:${retryToken}` : null;

  useEffect(() => {
    if (!uid) return;
    const key = `${uid}:${retryToken}`;
    // Sorgu sunucuda userId ile filtrelenir; başka kullanıcıların randevuları tarayıcıya inmez
    return subscribeToUserTestDrives(
      uid,
      (items) => setSnapshot({ key, items, error: null }),
      (error) => setSnapshot({ key, items: [], error }),
    );
  }, [uid, retryToken]);

  // Sayfa yenilendiğinde Firebase oturumu birkaç yüz ms sonra gelir; o ana kadar karar verme
  if (isAuthLoading) {
    return <LoadingState label="Oturum kontrol ediliyor..." />;
  }

  if (!user) {
    return (
      <StatusScreen
        eyebrow="Sürüş Randevularım"
        title="Randevularınızı görmek için giriş yapın"
        description="Test sürüşü taleplerinizi ve güncel durumlarını hesabınızla takip edebilirsiniz."
        actions={
          <button type="button" onClick={() => openAuthModal()} className={primaryButtonClass}>
            Giriş Yap
          </button>
        }
      />
    );
  }

  const current = snapshot?.key === subscriptionKey ? snapshot : null;
  const appointments = current?.items ?? [];

  return (
    <motion.div {...fade} transition={TRANSITION.base}>
      <PageContainer width="narrow">
        <PageHeader
          eyebrow="Hesabım"
          title="Sürüş Randevularım"
          description="Test sürüşü taleplerinizin güncel durumunu buradan takip edebilirsiniz."
        />

        {!current ? (
          <LoadingState compact label="Randevular yükleniyor..." />
        ) : current.error ? (
          <LoadErrorState
            compact
            title="Randevular yüklenemedi"
            description="Randevularınıza şu an ulaşamadık. Bağlantınızı kontrol edip tekrar deneyin; sorun sürerse birkaç dakika sonra yeniden deneyebilirsiniz."
            onRetry={() => setRetryToken((n) => n + 1)}
          />
        ) : appointments.length === 0 ? (
          <div className="border border-border-subtle bg-surface px-6 py-16 text-center">
            <Car className="mx-auto mb-4 size-10 text-muted" strokeWidth={1} aria-hidden />
            <h2 className="mb-2 font-display text-xl font-normal text-foreground">Henüz randevunuz yok</h2>
            <p className="text-sm text-secondary">Hayalinizdeki aracı bulup hemen bir test sürüşü planlayabilirsiniz.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {appointments.map((appointment, index) => {
              const status = STATUS_STYLES[appointment.status as keyof typeof STATUS_STYLES] ?? STATUS_STYLES.rejected;
              return (
              <motion.div
                key={appointment.id}
                {...fadeUp}
                transition={{ ...TRANSITION.base, delay: staggerDelay(index) }}
                className="relative overflow-hidden border border-border-subtle bg-surface p-6 pl-7 transition-colors hover:border-border-strong md:p-8 md:pl-9"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between md:justify-start gap-4">
                      <h2 className="font-display text-xl font-normal text-foreground md:text-2xl">
                        {appointment.vehicleName}
                      </h2>
                      <span className={`shrink-0 border px-3 py-1 text-2xs font-semibold uppercase tracking-eyebrow ${status.badge}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-8 gap-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <Calendar className="size-4" strokeWidth={1.5} />
                        <span className="tabular-nums">{appointment.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <Clock className="size-4" strokeWidth={1.5} />
                        <span className="tabular-nums">{appointment.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <MapPin className="size-4" strokeWidth={1.5} />
                        <span>{appointment.location} OtoVadi Center</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Durum şeridi */}
                <div className={`absolute inset-y-0 left-0 w-1 ${status.bar}`} aria-hidden />
              </motion.div>
              );
            })}
          </div>
        )}
      </PageContainer>
    </motion.div>
  );
}
