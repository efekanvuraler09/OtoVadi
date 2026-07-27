import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

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

  return (
    <>
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
              className="relative w-full max-w-md bg-surface/90 border border-border-subtle p-10 shadow-2xl overflow-hidden z-10"
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
                    <div className="size-16 rounded-full border border-emerald-500/30 flex items-center justify-center mb-6 bg-emerald-500/10">
                      <Check className="size-8 text-emerald-500 stroke-[1.5]" />
                    </div>
                    <h3 className="font-display text-2xl font-light text-foreground">Hoş Geldiniz</h3>
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
                          className="absolute left-0 -top-4 text-[10px] uppercase tracking-widest text-foreground transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-muted peer-focus:-top-4 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-foreground cursor-text"
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
                          className="absolute left-0 -top-4 text-[10px] uppercase tracking-widest text-foreground transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-muted peer-focus:-top-4 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-foreground cursor-text"
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
                        <p className="text-center text-xs text-red-500 uppercase tracking-widest">
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

      {/* Global Auth Warning Toast */}
      <AnimatePresence>
        {authToastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] bg-void/90 backdrop-blur-md border border-border-subtle px-8 py-4 shadow-2xl"
          >
            <span className="text-foreground font-sans text-sm tracking-wide">{authToastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
