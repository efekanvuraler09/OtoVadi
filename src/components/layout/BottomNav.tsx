import { Home, Sparkles, Scale, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { id: 'home', label: 'Ana Sayfa', icon: Home, to: '/' },
  { id: 'kesif', label: 'Akıllı Keşif', icon: Sparkles, to: '/kesif' },
  { id: 'karsilastir', label: 'Karşılaştır', icon: Scale, to: '/karsilastir' },
  { id: 'profile', label: 'Profil', icon: User, to: '/profil' },
] as const;

export function BottomNav() {
  const location = useLocation();

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 md:hidden safe-bottom"
      aria-label="Ana gezinme"
    >
      <div className="mx-3 mb-2 border border-border-subtle bg-void/95 backdrop-blur-sm px-2 py-2">
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
                      className="absolute inset-0 rounded-sm bg-foreground/5"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">
                    <Icon
                      className={`size-5 ${active ? 'text-foreground' : 'text-muted'}`}
                      strokeWidth={active ? 2.25 : 1.75}
                    />
                  </span>
                  <span
                    className={`relative z-10 text-[10px] font-medium ${active ? 'text-foreground' : 'text-muted'}`}
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
