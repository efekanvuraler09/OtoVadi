import { Home, Compass, Heart, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { useVehicleStore } from '../../store/useVehicleStore';

const navItems = [
  { id: 'home', label: 'Keşfet', icon: Home, to: '/' },
  { id: 'catalog', label: 'Katalog', icon: Compass, to: '/#catalog' },
  { id: 'favorites', label: 'Favoriler', icon: Heart, to: '/favoriler' },
  { id: 'profile', label: 'Profil', icon: User, to: '/' },
] as const;

export function BottomNav() {
  const location = useLocation();
  const favoritesCount = useVehicleStore((s) => s.favorites.length);

  const isActive = (to: string) => {
    if (to === '/favoriler') return location.pathname === '/favoriler';
    if (to === '/#catalog') return location.pathname === '/' && location.hash === '#catalog';
    if (to === '/') return location.pathname === '/' && location.hash !== '#catalog';
    return false;
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 md:hidden safe-bottom"
      aria-label="Ana gezinme"
    >
      <div className="mx-3 mb-2 glass-panel rounded-2xl px-2 py-2">
        <ul className="flex items-center justify-around">
          {navItems.map(({ id, label, icon: Icon, to }) => {
            const active = isActive(to);
            return (
              <li key={id}>
                <NavLink
                  to={to}
                  className="relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 px-3 py-1.5"
                  aria-current={active ? 'page' : undefined}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl bg-accent/15"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">
                    <Icon
                      className={`size-5 ${active ? 'text-accent' : 'text-muted'}`}
                      strokeWidth={active ? 2.25 : 1.75}
                    />
                    {id === 'favorites' && favoritesCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-accent-red text-[9px] font-bold text-white">
                        {favoritesCount}
                      </span>
                    )}
                  </span>
                  <span
                    className={`relative z-10 text-[10px] font-medium ${active ? 'text-accent' : 'text-muted'}`}
                  >
                    {label}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
