import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VehicleCard } from '../components/home/VehicleCard';
import { useVehicleStore } from '../store/useVehicleStore';

export function FavoritesPage() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const favorites = useVehicleStore((s) => s.favorites);
  const favoriteVehicles = vehicles.filter((v) => favorites.includes(v.id));

  return (
    <div className="safe-top px-4 pt-6 pb-8 md:px-8 lg:px-12 py-16">
      <h1 className="font-display text-3xl font-light tracking-wide text-foreground">Favoriler</h1>
      <p className="mt-2 text-sm text-muted">
        {favoriteVehicles.length} kayıtlı araç
      </p>

      {favoriteVehicles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border-subtle mt-8 flex flex-col items-center rounded-none px-6 py-12 text-center bg-transparent"
        >
          <Heart className="size-12 text-muted/50" />
          <p className="mt-4 text-sm text-muted">
            Henüz favori eklemediniz. Bir araç detayında kalp ikonuna dokunun.
          </p>
          <Link
            to="/"
            className="mt-8 border border-foreground/30 text-foreground hover:bg-foreground hover:text-void px-6 py-3 text-sm tracking-mb-wide uppercase transition-all duration-300 rounded-none inline-flex items-center justify-center font-medium"
          >
            Kataloğa Dön
          </Link>
        </motion.div>
      ) : (
        <ul className="mt-12 flex flex-col gap-12 md:grid md:grid-cols-2 md:gap-16 lg:grid-cols-2 xl:grid-cols-3">
          {favoriteVehicles.map((vehicle, index) => (
            <li key={vehicle.id} className="w-full">
              <VehicleCard vehicle={vehicle} index={index} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
