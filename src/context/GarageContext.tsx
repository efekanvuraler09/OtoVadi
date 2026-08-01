import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

interface GarageContextType {
  garagedSlugs: string[];
  loadingSlug: string | null;
  addVehicle: (slug: string, name: string) => Promise<void>;
  removeVehicle: (slug: string, name: string) => Promise<void>;
}

const GarageContext = createContext<GarageContextType | undefined>(undefined);

export function GarageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [garagedSlugs, setGaragedSlugs] = useState<string[]>([]);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync with Firestore when user changes
  useEffect(() => {
    let isMounted = true;
    
    const fetchGarage = async () => {
      if (!user) {
        if (isMounted) setGaragedSlugs([]);
        return;
      }
      
      try {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (isMounted) setGaragedSlugs(data.savedVehicles || []);
        } else {
          // Initialize empty garage for new user
          await setDoc(userRef, { 
            savedVehicles: [],
            displayName: user.displayName || user.email?.split('@')[0] || 'Bilinmeyen Kullanıcı',
            email: user.email || '',
            updatedAt: serverTimestamp()
          }, { merge: true });
          if (isMounted) setGaragedSlugs([]);
        }
      } catch (error) {
        console.error("Error fetching garage:", error);
      }
    };
    
    fetchGarage();
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  const addVehicle = async (slug: string, name: string) => {
    if (!user) return;
    setLoadingSlug(slug);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        savedVehicles: arrayUnion(slug),
        displayName: user.displayName || user.email?.split('@')[0] || 'Bilinmeyen Kullanıcı',
        email: user.email || '',
        updatedAt: serverTimestamp()
      }, { merge: true });
      setGaragedSlugs((prev) => [...prev, slug]);
      showToast(`${name} kalıcı olarak garajınıza eklendi.`);
    } catch (error) {
      console.error("Error adding vehicle:", error);
    } finally {
      setLoadingSlug(null);
    }
  };

  const removeVehicle = async (slug: string, name: string) => {
    if (!user) return;
    setLoadingSlug(slug);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        savedVehicles: arrayRemove(slug),
        displayName: user.displayName || user.email?.split('@')[0] || 'Bilinmeyen Kullanıcı',
        email: user.email || '',
        updatedAt: serverTimestamp()
      }, { merge: true });
      setGaragedSlugs((prev) => prev.filter((s) => s !== slug));
      showToast(`${name} garajınızdan çıkarıldı.`);
    } catch (error) {
      console.error("Error removing vehicle:", error);
    } finally {
      setLoadingSlug(null);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  return (
    <GarageContext.Provider value={{ garagedSlugs, loadingSlug, addVehicle, removeVehicle }}>
      {children}
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 z-[120] bg-foreground text-void px-6 py-4 border border-border-subtle shadow-2xl flex items-center gap-3"
          >
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-sans text-sm tracking-wide">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </GarageContext.Provider>
  );
}

export function useGarage() {
  const context = useContext(GarageContext);
  if (context === undefined) {
    throw new Error('useGarage must be used within a GarageProvider');
  }
  return context;
}
