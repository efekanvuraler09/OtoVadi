import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Bookmark, User, Menu, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import { useVehicleStore } from '../../store/useVehicleStore';
import { useI18n } from '../../i18n/useI18n';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { TRANSITION, staggerDelay } from '../../lib/motion';

// Minimalist custom SVG for OtoVadi - representing an O (circle) and a V (road/needle)
const BrandIcon = () => (
  <svg
    className="size-8"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {/* The "O" - Steering wheel / Outer ring */}
    <circle cx="12" cy="12" r="10" />
    {/* The "V" - Touching the circle perfectly at 45 degrees and bottom center */}
    <path d="M4.93 4.93 L 12 22 L 19.07 4.93" />
  </svg>
);

/** Hero üzerinde şeffaf başlayan header bu kaydırma eşiğinden sonra dolgun zemine geçer */
const SOLID_AFTER_PX = 24;

function subscribeScroll(callback: () => void) {
  window.addEventListener('scroll', callback, { passive: true });
  return () => window.removeEventListener('scroll', callback);
}

const iconButtonClass =
  'relative flex size-10 items-center justify-center rounded-full transition-opacity hover:opacity-70';

const menuItemClass =
  'flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-secondary transition-colors hover:bg-surface hover:text-foreground';

export function Navbar() {
  const location = useLocation();
  const { garagedSlugs } = useGarage();
  const { user, isAdmin, openAuthModal, logout } = useAuth();
  const setSelectedCategory = useVehicleStore((s) => s.setSelectedCategory);
  const { t } = useI18n();

  // Menüler açıldıkları sayfaya bağlıdır: rota değişince effect gerekmeden kendiliğinden kapanırlar
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null);
  const [accountOpenPath, setAccountOpenPath] = useState<string | null>(null);
  const isMenuOpen = menuOpenPath === location.pathname;
  const isAccountOpen = accountOpenPath === location.pathname;
  const closeMenu = () => setMenuOpenPath(null);

  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > SOLID_AFTER_PX,
    () => false,
  );
  // Ana sayfada, en üstteyken header videonun üzerinde şeffaf durur (metin beyaz, temadan bağımsız)
  const overHero = location.pathname === '/' && !scrolled && !isMenuOpen;

  useBodyScrollLock(isMenuOpen);

  const accountRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  // Escape: açık menüleri kapatır. Hesap menüsü dışına tıklayınca kapanır.
  useEffect(() => {
    if (!isMenuOpen && !isAccountOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpenPath(null);
        setAccountOpenPath(null);
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (isAccountOpen && !accountRef.current?.contains(e.target as Node)) setAccountOpenPath(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [isMenuOpen, isAccountOpen]);

  // Çekmece açılınca odağı menünün kendisine taşı (klavye kullanıcıları menünün içinde başlar)
  useEffect(() => {
    if (isMenuOpen) drawerRef.current?.focus();
  }, [isMenuOpen]);

  const navLinks = [
    { label: t.nav.models, href: '/modeller' },
    { label: t.nav.discover, href: '/kesif' },
    { label: t.nav.compare, href: '/karsilastir' },
    { label: t.nav.dailyCar, href: '/gunun-araci' },
    { label: t.nav.collections, href: '/koleksiyonlar' },
    { label: t.nav.soulmate, href: '/ruh-ikizi' },
    { label: t.nav.about, href: '/hakkimizda' },
  ];
  /** lg (1024–1279 px) genişliğinde sığan birincil linkler; tamamı xl ve üstünde görünür */
  const PRIMARY_COUNT = 5;

  const accountLinks = [
    { label: t.nav.profile, href: '/profil' },
    { label: t.nav.testDrives, href: '/randevularim' },
    ...(isAdmin ? [{ label: t.nav.adminPanel, href: '/admin/dashboard' }] : []),
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-header w-full pt-safe transition-colors duration-350 ${
          overHero ? 'text-white' : 'text-foreground'
        }`}
      >
        {/* Zemin katmanları: hero üzerinde yumuşak koyu geçiş, kaydırınca cam dokulu dolgun zemin */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-transparent transition-opacity duration-350 ${
            overHero ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 border-b border-border-subtle bg-void/90 backdrop-blur-md backdrop-saturate-150 transition-opacity duration-350 ${
            overHero ? 'opacity-0' : 'opacity-100'
          }`}
        />

        <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-8 lg:gap-8 lg:px-12">
          {/* Marka */}
          <Link
            to="/"
            aria-label={t.nav.home}
            onClick={() => setSelectedCategory(null, null)}
            className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <BrandIcon />
            <span className="font-display text-lg font-medium uppercase tracking-widest">OtoVadi</span>
          </Link>

          {/* Masaüstü ana gezinme */}
          <nav aria-label={t.nav.mainNav} className="hidden min-w-0 flex-1 justify-center lg:flex">
            <ul className="flex items-center gap-1">
              {navLinks.map((link, i) => (
                <li key={link.href} className={i >= PRIMARY_COUNT ? 'hidden xl:block' : ''}>
                  <NavLink
                    to={link.href}
                    className={({ isActive }) =>
                      `relative block whitespace-nowrap px-2.5 py-2 text-sm font-medium transition-opacity after:absolute after:inset-x-2.5 after:-bottom-0.5 after:h-px after:bg-current after:transition-transform after:duration-350 ${
                        isActive ? 'opacity-100 after:scale-x-100' : 'opacity-75 after:scale-x-0 hover:opacity-100'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Aksiyonlar */}
          <div className="ml-auto flex shrink-0 items-center gap-1 lg:ml-0">
            <Link to="/garajim" className={iconButtonClass} aria-label={t.nav.myGarage} title={t.nav.myGarage}>
              <Bookmark className="size-5" strokeWidth={1.5} aria-hidden />
              {garagedSlugs.length > 0 && (
                <span
                  className={`absolute right-0.5 top-0.5 flex min-w-4 items-center justify-center rounded-full px-1 text-2xs font-semibold leading-4 tabular-nums ${
                    overHero ? 'bg-white text-black' : 'bg-foreground text-void'
                  }`}
                >
                  {garagedSlugs.length}
                </span>
              )}
            </Link>

            {/* Hesap: mobilde BottomNav'daki "Hesabım" üstlenir */}
            <div ref={accountRef} className="relative hidden md:block">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setAccountOpenPath(isAccountOpen ? null : location.pathname)}
                    aria-haspopup="menu"
                    aria-expanded={isAccountOpen}
                    aria-label={t.nav.accountMenu}
                    className={iconButtonClass}
                  >
                    <span className="flex size-7 items-center justify-center rounded-full border border-current text-xs font-medium uppercase">
                      {user.email?.[0] || 'U'}
                    </span>
                  </button>
                  <AnimatePresence>
                    {isAccountOpen && (
                      <motion.div
                        role="menu"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={TRANSITION.fast}
                        className="absolute right-0 top-full mt-2 w-56 border border-border-subtle bg-void py-1 text-foreground shadow-2xl"
                      >
                        {user.email && <p className="truncate border-b border-border-subtle px-4 py-3 text-xs text-muted">{user.email}</p>}
                        {accountLinks.map((link) => (
                          <Link
                            key={link.href}
                            to={link.href}
                            role="menuitem"
                            onClick={() => setAccountOpenPath(null)}
                            className={menuItemClass}
                          >
                            {link.label}
                          </Link>
                        ))}
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setAccountOpenPath(null);
                            void logout();
                          }}
                          className={`${menuItemClass} border-t border-border-subtle text-danger hover:text-danger`}
                        >
                          <LogOut className="size-4" strokeWidth={1.5} aria-hidden />
                          {t.nav.logout}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal()}
                  className={iconButtonClass}
                  aria-label={t.nav.login}
                  title={t.nav.login}
                >
                  <User className="size-5" strokeWidth={1.5} aria-hidden />
                </button>
              )}
            </div>

            {/* Dil ve tema: geniş ekranda header'da, daha dar ekranlarda menünün içinde */}
            <div className="hidden items-center gap-1 xl:flex">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>

            <button
              type="button"
              onClick={() => setMenuOpenPath(location.pathname)}
              className={`${iconButtonClass} xl:hidden`}
              aria-label={t.nav.menu}
              aria-expanded={isMenuOpen}
              aria-controls="site-menu"
            >
              <Menu className="size-6" strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {/* ── Çekmece menü (xl altı) ── */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={TRANSITION.base}
              className="fixed inset-0 z-drawer-backdrop bg-black/40 backdrop-blur-sm"
              onClick={closeMenu}
              aria-hidden
            />

            <motion.nav
              ref={drawerRef}
              tabIndex={-1}
              id="site-menu"
              aria-label={t.nav.menu}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={TRANSITION.base}
              className="fixed right-0 top-0 z-drawer flex h-dvh w-full max-w-sm flex-col border-l border-border-subtle bg-void pb-safe pt-safe text-foreground shadow-2xl outline-none"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-border-subtle px-6">
                <span className="eyebrow">{t.nav.menu}</span>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="-mr-2 flex size-10 items-center justify-center rounded-full transition-opacity hover:opacity-70"
                  aria-label={t.nav.closeMenu}
                >
                  <X className="size-6" strokeWidth={1.5} aria-hidden />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
                <ul className="flex flex-col">
                  {navLinks.map((link, i) => (
                    <motion.li
                      key={link.href}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...TRANSITION.base, delay: staggerDelay(i) }}
                    >
                      <NavLink
                        to={link.href}
                        onClick={closeMenu}
                        className={({ isActive }) =>
                          `flex min-h-12 items-center border-b border-border-subtle/60 font-display text-xl transition-colors ${
                            isActive ? 'text-foreground' : 'text-secondary hover:text-foreground'
                          }`
                        }
                      >
                        {link.label}
                      </NavLink>
                    </motion.li>
                  ))}
                </ul>

                <div className="mt-8">
                  <p className="eyebrow mb-3">{t.nav.account}</p>
                  {user ? (
                    <ul className="flex flex-col border-y border-border-subtle">
                      {accountLinks.map((link) => (
                        <li key={link.href}>
                          <Link
                            to={link.href}
                            onClick={closeMenu}
                            className="flex min-h-11 items-center text-sm font-medium text-secondary hover:text-foreground"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            closeMenu();
                            void logout();
                          }}
                          className="flex min-h-11 w-full items-center gap-2 text-left text-sm font-medium text-danger"
                        >
                          <LogOut className="size-4" strokeWidth={1.5} aria-hidden />
                          {t.nav.logout}
                        </button>
                      </li>
                    </ul>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        openAuthModal();
                      }}
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 border border-border-strong text-sm font-medium transition-colors hover:bg-foreground hover:text-void"
                    >
                      <User className="size-4" strokeWidth={1.5} aria-hidden />
                      {t.nav.login}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid shrink-0 gap-4 border-t border-border-subtle px-6 py-5">
                <div className="grid gap-2">
                  <p className="eyebrow">{t.nav.language}</p>
                  <LanguageSwitcher variant="segmented" />
                </div>
                <div className="grid gap-2">
                  <p className="eyebrow">{t.nav.theme}</p>
                  <ThemeToggle variant="segmented" />
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
