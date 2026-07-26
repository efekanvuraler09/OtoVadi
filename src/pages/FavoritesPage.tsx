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
    <div className="safe-top px-4 pt-6 pb-8 md:px-8 lg:px-12">
      <h1 className="text-2xl font-semibold text-foreground">Favoriler</h1>
      <p className="mt-1 text-sm text-muted">
        {favoriteVehicles.length} kayıtlı araç
      </p>

      {favoriteVehicles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel mt-8 flex flex-col items-center rounded-3xl px-6 py-12 text-center"
        >
          <Heart className="size-12 text-muted/50" />
          <p className="mt-4 text-sm text-muted">
            Henüz favori eklemediniz. Bir araç detayında kalp ikonuna dokunun.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-white"
          >
            Kataloğa Dön
          </Link>
        </motion.div>
      ) : (
        <ul className="mt-6 flex flex-col gap-5">
          {favoriteVehicles.map((vehicle, index) => (
            <li key={vehicle.id}>
              <VehicleCard vehicle={vehicle} index={index} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
