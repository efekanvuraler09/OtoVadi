import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Car } from 'lucide-react';
import type { FirestoreError } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserTestDrives, type TestDriveRequest } from '../services/testDriveService';
import { LoadErrorState, LoadingState, StatusScreen } from '../components/ui/DataState';
import { primaryButtonClass } from '../components/ui/buttonStyles';

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-void pt-24 pb-20 px-4 md:px-8 lg:px-12"
    >
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-border-subtle bg-foreground/5 mb-6">
            <Calendar className="size-8 text-foreground" strokeWidth={1} />
          </div>
          <h1 className="font-serif text-3xl font-light tracking-wide text-foreground">Sürüş Randevularım</h1>
          <p className="mt-2 text-sm text-muted">Test sürüşü taleplerinizin güncel durumunu buradan takip edebilirsiniz.</p>
        </header>

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
          <div className="text-center py-16 border border-border-subtle bg-surface/10">
            <Car className="size-12 text-muted mx-auto mb-4 stroke-[1]" />
            <h3 className="font-display text-xl font-light text-foreground mb-2">Henüz Randevunuz Yok</h3>
            <p className="text-muted text-sm">Hayalinizdeki aracı bulup hemen bir test sürüşü planlayabilirsiniz.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {appointments.map((appointment) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative overflow-hidden border border-border-subtle bg-surface/10 hover:bg-surface/30 transition-colors p-6 md:p-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between md:justify-start gap-4">
                      <h2 className="font-display text-2xl font-medium text-foreground">
                        {appointment.vehicleName}
                      </h2>
                      <span className={`px-3 py-1 text-[10px] uppercase tracking-wider border ${
                        appointment.status === 'pending' ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/5' :
                        appointment.status === 'approved' ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/5' :
                        'border-red-500/50 text-red-500 bg-red-500/5'
                      }`}>
                        {appointment.status === 'pending' ? 'Bekliyor' : appointment.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-8 gap-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <Calendar className="size-4" strokeWidth={1.5} />
                        <span className="font-sans tracking-wide">{appointment.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <Clock className="size-4" strokeWidth={1.5} />
                        <span className="font-sans tracking-wide">{appointment.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <MapPin className="size-4" strokeWidth={1.5} />
                        <span className="font-sans tracking-wide">{appointment.location} OtoVadi Center</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative Side Element */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  appointment.status === 'pending' ? 'bg-yellow-500' :
                  appointment.status === 'approved' ? 'bg-emerald-500' :
                  'bg-red-500'
                }`} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
