import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <main className="w-full min-h-screen bg-void flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md border border-border-subtle bg-surface/30 backdrop-blur-md p-10 md:p-12"
      >
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-light text-foreground tracking-wide mb-2">OtoVadi</h1>
          <p className="font-sans text-xs uppercase tracking-widest text-muted">Yönetim Paneli</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8 flex flex-col">
          {/* Floating Label Email */}
          <div className="relative group">
            <input 
              type="email" 
              id="admin-user" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="peer w-full bg-transparent border-b border-border-subtle focus:border-foreground py-2 text-foreground font-sans outline-none transition-colors" 
              placeholder=" " 
            />
            <label 
              htmlFor="admin-user" 
              className="absolute left-0 -top-4 text-[10px] uppercase tracking-widest text-foreground transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-muted peer-focus:-top-4 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-foreground cursor-text"
            >
              E-posta Adresi
            </label>
          </div>

          {/* Floating Label Password */}
          <div className="relative group">
            <input 
              type={showPassword ? 'text' : 'password'}
              id="admin-pass" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="peer w-full bg-transparent border-b border-border-subtle focus:border-foreground py-2 pr-10 text-foreground font-sans outline-none transition-colors" 
              placeholder=" " 
            />
            <label 
              htmlFor="admin-pass" 
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
            className="w-full py-4 mt-6 bg-foreground text-void font-sans text-sm font-medium uppercase tracking-widest hover:bg-foreground/90 transition-colors"
          >
            Giriş Yap
          </button>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-xs text-red-500 uppercase tracking-widest mt-4"
            >
              Hatalı bilgi girişi!
            </motion.p>
          )}
        </form>
      </motion.div>
    </main>
  );
}
