import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Save, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../services/userService';

export function ProfilePage() {
  const { user, isAdmin } = useAuth();
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      getUserProfile(user.uid).then(profile => {
        if (profile?.photoURL) {
          setPhotoURL(profile.photoURL);
        }
      });
    }
  }, [user]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    // Validate type and size (e.g. max 2MB)
    if (!file.type.startsWith('image/')) {
      alert('Lütfen geçerli bir resim dosyası seçin.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Resim boyutu en fazla 2MB olmalıdır.');
      return;
    }

    try {
      setIsUploading(true);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // Basic resize via canvas
        const img = new Image();
        img.src = base64String;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500;
          const MAX_HEIGHT = 500;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          
          await updateUserProfile(user.uid, { photoURL: resizedBase64 });
          setPhotoURL(resizedBase64);
          setIsUploading(false);
        };
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Fotoğraf yükleme hatası:', err);
      alert('Fotoğraf yüklenirken bir hata oluştu.');
      setIsUploading(false);
    }
  };

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
          <div className="relative mx-auto flex size-24 items-center justify-center rounded-full border border-border-subtle bg-surface mb-6 group cursor-pointer overflow-hidden">
            {isUploading ? (
              <Loader2 className="size-6 animate-spin text-muted" />
            ) : photoURL ? (
              <img src={photoURL} alt="Profil" className="size-full object-cover" />
            ) : (
              <User className="size-10 text-muted group-hover:text-foreground transition-colors" strokeWidth={1} />
            )}
            
            {!isUploading && (
              <div 
                className="absolute inset-0 bg-void/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="size-6 text-white" />
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
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
