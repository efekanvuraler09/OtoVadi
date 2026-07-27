import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVehicleStore } from '../store/useVehicleStore';
import { useGarage } from '../context/GarageContext';
import { useAuth } from '../context/AuthContext';
import { Bookmark } from 'lucide-react';


export function ModelsPage() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const { garagedSlugs, addVehicle, removeVehicle, loadingSlug } = useGarage();
  const { user, openAuthModal } = useAuth();
  const [filter, setFilter] = useState<'all' | 'suv' | 'sedan' | 'eco'>('all');

  const filteredVehicles = vehicles.filter((v) => {
    if (filter === 'all') return true;
    if (filter === 'suv') return v.bodyType === 'suv';
    if (filter === 'sedan') return v.bodyType === 'sedan';
    if (filter === 'eco') return v.engine.fuelType === 'hybrid' || v.engine.fuelType === 'electric' || v.engine.fuelType === 'plug-in-hybrid';
    return true;
  });

  const filterOptions = [
    { id: 'all', label: 'Tümü' },
    { id: 'suv', label: 'SUV' },
    { id: 'sedan', label: 'Sedan' },
    { id: 'eco', label: 'Elektrikli / Hibrit' },
  ];

  return (
    <main className="w-full min-h-screen bg-void pt-24 pb-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 flex flex-col items-center">
        
        {/* Header */}
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-foreground text-center mb-12 tracking-wide">
          Koleksiyonu Keşfedin
        </h1>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-8 mb-20">
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id as any)}
              className={`font-sans text-xs uppercase tracking-widest transition-colors duration-300 pb-2 border-b ${
                filter === opt.id 
                  ? 'text-foreground border-foreground' 
                  : 'text-muted border-transparent hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <motion.div 
          layout
          className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
        >
          <AnimatePresence>
            {filteredVehicles.map((vehicle) => (
              <motion.div
                key={vehicle.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="group relative flex flex-col border border-border-subtle bg-surface/30 backdrop-blur-md p-8 overflow-hidden cursor-pointer h-[500px]"
                onClick={() => window.location.href = `/arac/${vehicle.slug}`}
              >
                {/* Garage Button */}
                <button
                  disabled={loadingSlug === vehicle.slug}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!user) {
                      openAuthModal('Bu ayrıcalığı yaşamak için lütfen giriş yapın.');
                      return;
                    }
                    const isGaraged = garagedSlugs.includes(vehicle.slug);
                    if (isGaraged) {
                      removeVehicle(vehicle.slug, `${vehicle.brand} ${vehicle.model}`);
                    } else {
                      addVehicle(vehicle.slug, `${vehicle.brand} ${vehicle.model}`);
                    }
                  }}
                  className={`absolute top-6 right-6 z-30 transition-all duration-300 ${loadingSlug === vehicle.slug ? 'opacity-50 cursor-not-allowed' : 'text-muted hover:text-foreground'}`}
                  aria-label="Garaja Ekle/Çıkar"
                >
                  {loadingSlug === vehicle.slug ? (
                    <div className="size-5 rounded-full border-[1.5px] border-muted border-t-foreground animate-spin" />
                  ) : (
                    <Bookmark 
                      className={`size-5 ${
                        garagedSlugs.includes(vehicle.slug) 
                          ? 'fill-foreground text-foreground stroke-foreground' 
                          : 'stroke-[1.5]'
                      }`} 
                    />
                  )}
                </button>

                {/* Brand & Model */}
                <div className="z-10 text-center mb-4">
                  <h2 className="font-display text-2xl font-semibold tracking-wide text-foreground">
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

                {/* Hover Specs (Slide Up) */}
                <div className="absolute inset-x-0 bottom-0 bg-void/90 backdrop-blur-md p-6 border-t border-border-subtle translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.22,1,0.36,1] z-20 flex justify-between">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-muted">Motor</span>
                    <span className="font-display text-lg text-foreground">{vehicle.engine.displacementCc} cc</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 border-l border-border-subtle pl-4">
                    <span className="text-[10px] uppercase tracking-widest text-muted">Güç</span>
                    <span className="font-display text-lg text-foreground">{vehicle.engine.powerHp} HP</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 border-l border-border-subtle pl-4">
                    <span className="text-[10px] uppercase tracking-widest text-muted">0-100</span>
                    <span className="font-display text-lg text-foreground">{vehicle.performance.zeroTo100Kmh} s</span>
                  </div>
                </div>

                {/* Static Bottom CTA */}
                <div className="z-10 flex justify-center mt-auto opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                  <span className="text-xs uppercase tracking-widest text-muted underline underline-offset-4 decoration-border-subtle hover:text-foreground hover:decoration-foreground transition-colors">
                    Detayları İncele
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredVehicles.length === 0 && (
          <div className="w-full text-center py-20">
            <p className="font-display text-2xl font-light text-muted">Bu kategoriye ait araç bulunamadı.</p>
          </div>
        )}

      </div>
    </main>
  );
}
