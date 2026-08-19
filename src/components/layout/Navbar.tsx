import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Bookmark, User, Menu, X } from 'lucide-react';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import { useVehicleStore } from '../../store/useVehicleStore';
import { useI18n } from '../../i18n/useI18n';
import { motion, AnimatePresence } from 'framer-motion';

// Minimalist custom SVG for OtoVadi - representing an O (circle) and a V (road/needle)
const BrandIcon = () => (
  <svg 
    className="size-9 text-foreground"
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.25" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
  >
    {/* The "O" - Steering wheel / Outer ring */}
    <circle cx="12" cy="12" r="10" />
    {/* The "V" - Touching the circle perfectly at 45 degrees and bottom center */}
    <path d="M4.93 4.93 L 12 22 L 19.07 4.93" />
  </svg>
);

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { garagedSlugs } = useGarage();
  const { user, isAdmin, openAuthModal, logout } = useAuth();
  const setSelectedCategory = useVehicleStore((s) => s.setSelectedCategory);
  const { t } = useI18n();
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: t.nav.models, href: '/modeller' },
    { label: t.nav.discover, href: '/kesif' },
    { label: t.nav.compare, href: '/karsilastir' },
    { label: t.nav.dailyCar, href: '/gunun-araci' },
    { label: t.nav.collections, href: '/koleksiyonlar' },
    { label: t.nav.soulmate, href: '/ruh-ikizi' },
    { label: t.nav.about, href: '/hakkimizda' },
  ];

  return (
    <>
      <header className="sticky top-0 z-[100] w-full border-b border-border-subtle bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-sm shadow-none transition-colors duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8 lg:px-12">
          
          {/* Left: Brand Icon & Name */}
          <div className="flex shrink-0 items-center">
            <Link 
              to="/" 
              aria-label="Ana Sayfa"
              onClick={() => {
                setSelectedCategory(null, null);
                setIsMenuOpen(false);
              }}
              className="group flex items-center gap-3 transition-opacity duration-300 hover:opacity-80 select-none outline-none focus:outline-none"
            >
              <BrandIcon />
              <span className="font-display text-xl font-bold uppercase tracking-wide text-foreground">
                OtoVadi
              </span>
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex shrink-0 items-center gap-2 md:gap-4 lg:gap-6 scale-90 sm:scale-100 origin-right">
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="text-sm font-semibold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors hidden lg:block whitespace-nowrap select-none outline-none focus:outline-none"
              >
                {t.nav.adminPanel}
              </Link>
            )}

            <Link 
              to="/garajim"
              className="relative text-black dark:text-white hover:opacity-70 transition-opacity select-none outline-none focus:outline-none mr-2 md:mr-0"
              aria-label={t.nav.myGarage}
            >
              <Bookmark className="size-5 stroke-[1.5]" />
              {garagedSlugs.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[9px] font-bold text-void">
                  {garagedSlugs.length}
                </span>
              )}
            </Link>

            {user ? (
              <div className="group relative">
                <div className="w-7 h-7 rounded-full border border-neutral-900 dark:border-neutral-100 flex items-center justify-center cursor-pointer text-black dark:text-white text-xs uppercase font-medium select-none outline-none focus:outline-none transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  {user.email?.[0] || 'U'}
                </div>
                <div className="absolute top-full right-0 mt-2 w-52 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md shadow-2xl border border-neutral-200 dark:border-neutral-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link 
                    to="/profil"
                    className="block w-full text-left px-4 py-3 font-sans text-sm font-medium tracking-wider uppercase text-neutral-900 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border-b border-neutral-200 dark:border-neutral-800 select-none outline-none focus:outline-none"
                  >
                    {t.nav.profile}
                  </Link>
                  <Link 
                    to="/randevularim"
                    className="block w-full text-left px-4 py-3 font-sans text-sm font-medium tracking-wider uppercase text-neutral-900 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border-b border-neutral-200 dark:border-neutral-800 select-none outline-none focus:outline-none"
                  >
                    {t.nav.testDrives}
                  </Link>
                  <button 
                    onClick={logout}
                    className="block w-full text-left px-4 py-3 font-sans text-sm font-medium tracking-wider uppercase text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors select-none outline-none focus:outline-none"
                  >
                    {t.nav.logout}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal()}
                className="text-black dark:text-white hover:opacity-70 transition-opacity select-none outline-none focus:outline-none"
                aria-label={t.nav.login}
              >
                <User className="size-5 stroke-[1.5]" />
              </button>
            )}

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            
            {/* Hamburger Menu Toggle — visible on ALL screen sizes */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-black dark:text-white hover:opacity-70 transition-opacity ml-1 select-none outline-none focus:outline-none"
              aria-label={t.nav.menu}
            >
              {isMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
          
        </div>
      </header>

      {/* ── Fullscreen Drawer Menu ── */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Drawer Panel — slides in from right */}
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 z-[100] h-dvh w-full max-w-md bg-void border-l border-border-subtle shadow-2xl flex flex-col select-none"
            >
              {/* Drawer Header */}
              <div className="flex h-16 items-center justify-between border-b border-border-subtle px-6">
                <span className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
                  {t.nav.menu}
                </span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-black dark:text-white hover:opacity-70 transition-opacity outline-none focus:outline-none"
                  aria-label="Kapat"
                >
                  <X className="size-6" />
                </button>
              </div>

              {/* Drawer Links */}
              <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-1">
                {navLinks.map((link, i) => {
                  const isDuplicatedInBottomNav = link.href === '/kesif' || link.href === '/karsilastir';
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i, duration: 0.3 }}
                      className={isDuplicatedInBottomNav ? 'hidden md:block' : ''}
                    >
                      <Link
                        to={link.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="block py-4 font-sans text-[15px] font-medium uppercase tracking-widest text-black dark:text-neutral-200 hover:text-foreground border-b border-border-subtle/50 transition-colors duration-200 outline-none focus:outline-none"
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}

                {isAdmin && (
                  <motion.div
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * navLinks.length, duration: 0.3 }}
                    className="block lg:hidden"
                  >
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-4 font-sans text-[15px] font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 border-b border-border-subtle/50 transition-colors duration-200 outline-none focus:outline-none"
                    >
                      {t.nav.adminPanel}
                    </Link>
                  </motion.div>
                )}


              </div>

              {/* Drawer Footer */}
              <div className="border-t border-border-subtle px-6 py-5">
                <p className="text-[10px] uppercase tracking-widest text-muted">
                  © {new Date().getFullYear()} OtoVadi
                </p>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
