import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { checkIsAdmin } from '../services/adminService';

interface AuthContextType {
  user: User | null;
  /** Yalnızca arayüz içindir; asıl yetki firestore.rules → isAdmin() (admins/{uid} kaydı) */
  isAdmin: boolean;
  /** Oturum ve yönetici kontrolü sürerken true */
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authToastMessage: string | null;
  openAuthModal: (message?: string) => void;
  closeAuthModal: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authToastMessage, setAuthToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let disposed = false;
    let checkId = 0;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const id = ++checkId;
      setUser(currentUser);
      // Önceki oturumdan kalan yetki asla taşınmaz
      setIsAdmin(false);

      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      // Yönetici yetkisi admins/{uid} kaydından okunur (firestore.rules ile aynı kaynak).
      // Kontrol bitene kadar isLoading true kalır; böylece korumalı sayfalar erken karar vermez.
      setIsLoading(true);
      void checkIsAdmin(currentUser.uid).then((admin) => {
        if (disposed || id !== checkId) return;
        setIsAdmin(admin);
        setIsLoading(false);
      });
    });

    return () => {
      disposed = true;
      unsubscribe();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const openAuthModal = useCallback((message?: string) => {
    if (message) {
      setAuthToastMessage(message);
      // Bildirim 4 sn sonra kapanır; art arda çağrıda önceki zamanlayıcı iptal edilir
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setAuthToastMessage(null), 4000);
    }
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  // Değer sabit referanslı: yalnızca ilgili durum değişince tüketiciler yeniden render olur
  const value = useMemo<AuthContextType>(
    () => ({ user, isAdmin, isLoading, isAuthModalOpen, authToastMessage, openAuthModal, closeAuthModal, logout }),
    [user, isAdmin, isLoading, isAuthModalOpen, authToastMessage, openAuthModal, closeAuthModal, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
