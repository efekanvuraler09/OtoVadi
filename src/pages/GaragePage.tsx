import { motion } from 'framer-motion';
import { ArrowRight, BookmarkMinus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGarage } from '../context/GarageContext';
import { useAuth } from '../context/AuthContext';
import { useVehicleStore } from '../store/useVehicleStore';

export function GaragePage() {
  const { user, openAuthModal } = useAuth();
  const { garagedSlugs, removeVehicle } = useGarage();
  const vehicles = useVehicleStore((s) => s.vehicles);
  
  if (!user) {
    // If somehow landed here without auth, show empty and prompt
    return (
      <main className="w-full min-h-screen bg-void pt-24 pb-32 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-3xl font-light text-muted mb-6">Garaja Erişim Yok</h2>
          <p className="text-muted/70 mb-12 max-w-sm mx-auto">Kişisel koleksiyonunuzu görüntülemek için giriş yapmanız gerekmektedir.</p>
          <button 
            onClick={() => openAuthModal()}
            className="inline-flex items-center gap-3 border border-foreground/30 px-8 py-4 font-sans text-sm font-medium uppercase tracking-[0.15em] text-foreground transition-all duration-300 hover:bg-foreground hover:text-void"
          >
            Giriş Yap
          </button>
        </div>
      </main>
    );
  }

  const garagedVehicles = vehicles.filter(v => garagedSlugs.includes(v.slug));

  return (
    <main className="w-full min-h-screen bg-void pt-24 pb-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 flex flex-col">
        
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-16 tracking-wide">
          Garajım
        </h1>

        {garagedVehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h2 className="font-display text-3xl font-light text-muted mb-6">Garajınız şu an boş.</h2>
            <p className="text-muted/70 mb-12">Hayalinizdeki aracı keşfetmek için koleksiyonumuzu inceleyin.</p>
            <Link 
              to="/modeller"
              className="inline-flex items-center gap-3 border border-foreground/30 px-8 py-4 font-sans text-sm font-medium uppercase tracking-[0.15em] text-foreground transition-all duration-300 hover:bg-foreground hover:text-void"
            >
              Koleksiyonu Keşfet
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {garagedVehicles.map((vehicle) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="group relative flex flex-col border border-border-subtle bg-surface/30 backdrop-blur-md p-8 overflow-hidden h-[400px]"
              >
                {/* Remove Button */}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    removeVehicle(vehicle.slug, `${vehicle.brand} ${vehicle.model}`);
                  }}
                  className="absolute top-6 right-6 z-20 text-muted hover:text-foreground transition-colors"
                  aria-label="Garajdan Çıkar"
                >
                  <BookmarkMinus className="size-6 stroke-[1.5]" />
                </button>

                {/* Brand & Model */}
                <div className="z-10 mb-4 cursor-pointer" onClick={() => window.location.href = `/arac/${vehicle.slug}`}>
                  <h2 className="font-display text-2xl font-semibold tracking-wide text-foreground group-hover:text-foreground/80 transition-colors">
                    {vehicle.brand} {vehicle.model}
                  </h2>
                  <p className="font-sans text-xs uppercase tracking-widest text-muted mt-1">
                    {vehicle.pricing.trim}
                  </p>
                </div>

                {/* Studio Image */}
                <div className="relative flex-1 flex items-center justify-center my-6 z-10 pointer-events-none">
                  <img
                    src={vehicle.interactiveGallery?.studioImage || vehicle.media.heroImage}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
