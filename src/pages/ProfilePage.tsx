import { motion } from 'framer-motion';
import { User, Mail, Shield, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export function ProfilePage() {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-void pt-24 pb-20 px-4 md:px-8 lg:px-12"
    >
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-border-subtle bg-foreground/5 mb-6">
            <User className="size-8 text-foreground" strokeWidth={1} />
          </div>
          <h1 className="font-serif text-3xl font-light tracking-wide text-foreground">Profil Ayarları</h1>
          <p className="mt-2 text-sm text-muted">Kişisel bilgilerinizi ve hesap ayarlarınızı yönetin.</p>
        </header>

        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-6 rounded-none border border-border-subtle bg-surface p-6 md:p-10">
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted border-b border-border-subtle/30 pb-4">
              Kişisel Bilgiler
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-[10px] uppercase tracking-widest text-muted">Ad</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" strokeWidth={1.5} />
                  <input
                    id="firstName"
                    type="text"
                    defaultValue={user.displayName?.split(' ')[0] || ''}
                    className="w-full rounded-none border border-border-subtle bg-void px-10 py-3 text-sm font-light tracking-wide text-foreground outline-none focus:border-foreground transition-colors"
                    placeholder="Adınız"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="text-[10px] uppercase tracking-widest text-muted">Soyad</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" strokeWidth={1.5} />
                  <input
                    id="lastName"
                    type="text"
                    defaultValue={user.displayName?.split(' ').slice(1).join(' ') || ''}
                    className="w-full rounded-none border border-border-subtle bg-void px-10 py-3 text-sm font-light tracking-wide text-foreground outline-none focus:border-foreground transition-colors"
                    placeholder="Soyadınız"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-[10px] uppercase tracking-widest text-muted">E-posta Adresi</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" strokeWidth={1.5} />
                <input
                  id="email"
                  type="email"
                  defaultValue={user.email || ''}
                  disabled
                  className="w-full rounded-none border border-border-subtle bg-void/50 px-10 py-3 text-sm font-light tracking-wide text-muted outline-none cursor-not-allowed"
                  placeholder="ornek@email.com"
                />
              </div>
              <p className="text-[10px] text-muted/60 mt-1">E-posta adresi değiştirilemez.</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="role" className="text-[10px] uppercase tracking-widest text-muted">Hesap Türü</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" strokeWidth={1.5} />
                <input
                  id="role"
                  type="text"
                  defaultValue={isAdmin ? 'Yönetici' : 'Standart Kullanıcı'}
                  disabled
                  className="w-full rounded-none border border-border-subtle bg-void/50 px-10 py-3 text-sm font-light tracking-wide text-muted outline-none cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="group relative flex items-center gap-2 border border-foreground bg-foreground px-8 py-3 text-sm font-medium tracking-wide text-void transition-all hover:bg-void hover:text-foreground"
            >
              <Save className="size-4" />
              <span>Ayarları Kaydet</span>
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
