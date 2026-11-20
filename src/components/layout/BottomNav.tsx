import { Home, Sparkles, Scale, User, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/useI18n';
import { TRANSITION } from '../../lib/motion';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  to: string;
  /** Oturum yoksa sayfaya gitmek yerine giriş modalını açar */
  requiresAuth?: boolean;
}

export function BottomNav() {
  const location = useLocation();
  const { user, openAuthModal } = useAuth();
  const { t } = useI18n();

  const navItems: NavItem[] = [
    { id: 'home', label: t.nav.home, icon: Home, to: '/' },
    { id: 'kesif', label: t.nav.discover, icon: Sparkles, to: '/kesif' },
    { id: 'karsilastir', label: t.nav.compare, icon: Scale, to: '/karsilastir' },
    { id: 'account', label: t.nav.account, icon: User, to: '/profil', requiresAuth: true },
  ];

  const isActive = (to: string) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to));

  const itemClass =
    'relative flex min-h-14 w-full flex-col items-center justify-center gap-1 px-1 py-2';

  const renderContent = (item: NavItem, active: boolean) => {
    const Icon = item.icon;
    return (
      <>
        {active && (
          <motion.span
            layoutId="nav-pill"
            className="absolute inset-x-2 inset-y-1 rounded-sm bg-foreground/5"
            transition={TRANSITION.base}
          />
        )}
        <Icon
          className={`relative size-5 ${active ? 'text-foreground' : 'text-muted'}`}
          strokeWidth={active ? 2.25 : 1.75}
          aria-hidden
        />
        <span
          className={`relative max-w-full truncate text-2xs font-medium ${active ? 'text-foreground' : 'text-muted'}`}
        >
          {item.label}
        </span>
      </>
    );
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-bottombar border-t border-border-subtle bg-void/90 pb-safe backdrop-blur-md transition-colors duration-350 md:hidden"
      aria-label={t.nav.mainNav}
    >
      {/* Yükseklik: --bottom-bar-height (5rem) — main'deki pb-bottom-bar ile eşleşir */}
      <div className="flex h-20 items-center px-2">
        <ul className="grid w-full grid-cols-4">
          {navItems.map((item) => {
            const active = isActive(item.to);
            return (
              <li key={item.id}>
                {item.requiresAuth && !user ? (
                  // Oturum yoksa sessizce ana sayfaya yönlendirmek yerine giriş modalı açılır
                  <button type="button" onClick={() => openAuthModal()} className={itemClass}>
                    {renderContent(item, false)}
                  </button>
                ) : (
                  <NavLink to={item.to} className={itemClass} aria-current={active ? 'page' : undefined}>
                    {renderContent(item, active)}
                  </NavLink>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
