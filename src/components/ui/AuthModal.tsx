import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

type Tab = 'login' | 'register';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authToastMessage } = useAuth();
  
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useBodyScrollLock(isAuthModalOpen);

  const resetState = () => {
    setEmail('');
    setPassword('');
    setError(null);
    setSuccess(false);
    setShowPassword(false);
    setActiveTab('login');
  };

  const handleClose = () => {
    resetState();
    closeAuthModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError('İşlem başarısız. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  // Portal: modal ve toast her zaman body seviyesinde, merkezi z skalasına göre katmanlanır.
  return createPortal(
    <>
      <AnimatePresence>
        {isAuthModalOpen && (
          <div
            key="auth-modal"
            className="fixed inset-0 z-modal flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Giriş yap veya kayıt ol"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={isLoading || success ? undefined : handleClose}
              className="absolute inset-0 bg-void/80 backdrop-blur-lg"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-md max-h-[90svh] overflow-y-auto overscroll-contain border border-border-subtle bg-surface/90 p-8 shadow-2xl sm:p-10"
            >
              {/* Close Button */}
              {!isLoading && !success && (
                <button
                  onClick={handleClose}
                  className="absolute top-6 right-6 text-muted hover:text-foreground transition-colors"
                >
                  <X className="size-6 stroke-[1.5]" />
                </button>
              )}

              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="mb-6 flex size-16 items-center justify-center rounded-full border border-success/30 bg-success/10">
                      <Check className="size-8 stroke-[1.5] text-success" />
                    </div>
                    <h3 className="font-display text-2xl font-normal text-foreground">Hoş Geldiniz</h3>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex items-center gap-6 mb-10 border-b border-border-subtle pb-4">
                      <button 
                        onClick={() => setActiveTab('login')}
                        className={`text-sm tracking-wider uppercase transition-colors ${activeTab === 'login' ? 'text-foreground' : 'text-muted hover:text-foreground'}`}
                      >
                        Giriş Yap
                      </button>
                      <button 
                        onClick={() => setActiveTab('register')}
                        className={`text-sm tracking-wider uppercase transition-colors ${activeTab === 'register' ? 'text-foreground' : 'text-muted hover:text-foreground'}`}
                      >
                        Kayıt Ol
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8 flex flex-col">
                      <div className="relative group">
                        <input 
                          type="email" 
                          id="auth-email" 
                          required 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="peer w-full bg-transparent border-b border-border-subtle focus:border-foreground py-2 text-foreground font-sans outline-none transition-colors" 
                          placeholder=" " 
                        />
                        <label 
                          htmlFor="auth-email" 
                          className="absolute left-0 -top-4 text-2xs uppercase tracking-eyebrow text-foreground transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-muted peer-focus:-top-4 peer-focus:text-2xs peer-focus:uppercase peer-focus:tracking-eyebrow peer-focus:text-foreground cursor-text"
                        >
                          E-posta Adresi
                        </label>
                      </div>

                      <div className="relative group">
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          id="auth-password" 
                          required 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="peer w-full bg-transparent border-b border-border-subtle focus:border-foreground py-2 pr-10 text-foreground font-sans outline-none transition-colors" 
                          placeholder=" " 
                        />
                        <label 
                          htmlFor="auth-password" 
                          className="absolute left-0 -top-4 text-2xs uppercase tracking-eyebrow text-foreground transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-muted peer-focus:-top-4 peer-focus:text-2xs peer-focus:uppercase peer-focus:tracking-eyebrow peer-focus:text-foreground cursor-text"
                        >
                          Şifre
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-0 top-2 text-muted hover:text-foreground transition-colors focus:outline-none"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="size-5 stroke-[1.5]" />
                          ) : (
                            <Eye className="size-5 stroke-[1.5]" />
                          )}
                        </button>
                      </div>

                      <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 mt-4 bg-foreground text-void font-sans text-sm font-medium uppercase tracking-widest hover:bg-foreground/90 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'İşleniyor...' : (activeTab === 'login' ? 'Giriş Yap' : 'Kayıt Ol')}
                      </button>

                      {error && (
                        <p className="text-center text-sm text-danger" role="alert">
                          {error}
                        </p>
                      )}
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Auth Warning Toast
          Konumlandırma dış kapta yapılır: framer-motion'ın inline transform'u Tailwind'in
          -translate-x-1/2 değerini ezip toast'u ortadan kaydırıyordu. */}
      <div className="pointer-events-none fixed inset-x-4 bottom-above-bar z-toast flex justify-center md:bottom-8">
        <AnimatePresence>
          {authToastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="pointer-events-auto max-w-md border border-border-subtle bg-void/90 px-8 py-4 text-center shadow-2xl backdrop-blur-md"
              role="status"
            >
              <span className="text-foreground font-sans text-sm tracking-wide">{authToastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>,
    document.body,
  );
}
