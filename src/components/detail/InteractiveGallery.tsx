import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Vehicle, Hotspot } from '../../types/vehicle';

interface InteractiveGalleryProps {
  vehicle: Vehicle;
}

export function InteractiveGallery({ vehicle }: InteractiveGalleryProps) {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  if (!vehicle.interactiveGallery) {
    return null;
  }

  const { studioImage, hotspots } = vehicle.interactiveGallery;

  return (
    <section className="relative w-full bg-void pt-4">
      <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 mb-4">
        <h2 className="text-center text-xs md:text-sm uppercase tracking-[0.3em] text-muted/60">İnteraktif İnceleme</h2>
      </div>
      
      {/* Edge-to-edge container */}
      <div className="relative w-full aspect-video md:aspect-[21/9] overflow-hidden group">
        <img 
          src={studioImage} 
          alt={`${vehicle.brand} ${vehicle.model} Studio`} 
          className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-[1.02]"
        />

        {/* Gradient overlays for smooth cinematic fade */}
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-void via-void/40 to-transparent z-0 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-void via-void/40 to-transparent z-0 pointer-events-none" />

        {/* Hotspots */}
        {hotspots.map((spot: Hotspot) => (
          <div 
            key={spot.id}
            className="absolute z-10 cursor-pointer"
            style={{ left: `${spot.xPosition}%`, top: `${spot.yPosition}%`, transform: 'translate(-50%, -50%)' }}
            onMouseEnter={() => setActiveHotspot(spot.id)}
            onMouseLeave={() => setActiveHotspot(null)}
            onClick={() => setActiveHotspot(activeHotspot === spot.id ? null : spot.id)}
          >
            {/* Pulse ring */}
            <div className="absolute inset-0 animate-ping rounded-full bg-foreground/40" />
            {/* Core dot */}
            <button 
              className={`relative flex size-6 items-center justify-center rounded-full border border-border-subtle backdrop-blur-sm transition-colors ${
                activeHotspot === spot.id ? 'bg-foreground text-void scale-110' : 'bg-void/60 text-foreground hover:bg-foreground hover:text-void'
              }`}
              aria-label={spot.title}
            >
              <div className="size-1.5 rounded-full bg-current" />
            </button>
          </div>
        ))}

        {/* Info Card Overlay */}
        <AnimatePresence>
          {activeHotspot && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-6 left-6 right-6 md:left-auto md:right-12 md:bottom-12 md:w-80 z-20"
            >
              <div className="border border-border-subtle bg-void/80 backdrop-blur-md p-6 shadow-2xl">
                {hotspots.map((spot) => spot.id === activeHotspot && (
                  <div key={spot.id}>
                    <h3 className="font-serif text-xl font-light tracking-wide text-foreground mb-3">
                      {spot.title}
                    </h3>
                    <p className="font-sans text-sm leading-relaxed text-muted">
                      {spot.description}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
