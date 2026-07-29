import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Bookmark, User, Menu, X } from 'lucide-react';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { garagedSlugs } = useGarage();
  const { user, isAdmin, openAuthModal, logout } = useAuth();
  const navLinks = [
    { label: 'Modeller', href: '/modeller' },
    { label: 'Akıllı Keşif', href: '/kesif' },
    { label: 'Karşılaştır', href: '/karsilastir' },
    { label: 'Hakkımızda', href: '#' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-void/80 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 md:px-8 lg:px-12">
        
        {/* Left: Brand Icon & Name */}
        <div className="flex flex-1 items-center justify-start">
          <Link 
            to="/" 
            aria-label="Ana Sayfa"
            className="group flex items-center gap-3 transition-opacity duration-300 hover:opacity-80"
          >
            <BrandIcon />
            <span className="font-display text-xl font-bold uppercase tracking-wide text-foreground">
              OtoVadi
            </span>
          </Link>
        </div>

        {/* Right: Nav Links & Actions */}
        <div className="flex flex-1 items-center justify-end gap-4 lg:gap-6">
          <nav className="hidden xl:flex items-center gap-4 xl:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="group relative text-sm font-medium text-muted transition-colors duration-300 hover:text-foreground"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-[1px] w-0 bg-foreground transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center lg:border-l lg:border-border-subtle lg:pl-6 gap-3 lg:gap-5">
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="text-[10px] uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors hidden md:block whitespace-nowrap"
              >
                Yönetim Paneli
              </Link>
            )}

            <Link 
              to="/garajim"
              className="relative text-muted hover:text-foreground transition-colors"
              aria-label="Garajım"
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
                <div className="size-7 rounded-full bg-surface/80 border border-border-subtle flex items-center justify-center cursor-pointer text-foreground text-xs uppercase font-medium">
                  {user.email?.[0] || 'U'}
                </div>
                <div className="absolute top-full right-0 mt-2 w-32 bg-surface/90 backdrop-blur-md border border-border-subtle opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button 
                    onClick={logout}
                    className="w-full text-left px-4 py-3 text-xs uppercase tracking-widest text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                  >
                    Çıkış Yap
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal()}
                className="text-muted hover:text-foreground transition-colors"
                aria-label="Giriş Yap"
              >
                <User className="size-5 stroke-[1.5]" />
              </button>
            )}

            <ThemeToggle />
            
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden text-muted hover:text-foreground transition-colors ml-2"
              aria-label="Menü"
            >
              {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>
        
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="xl:hidden absolute top-16 left-0 right-0 bg-void/95 backdrop-blur-xl border-b border-border-subtle p-6 shadow-2xl flex flex-col gap-6 animate-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-medium tracking-wide text-muted hover:text-foreground border-b border-white/5 pb-2"
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-medium tracking-wide text-emerald-500 hover:text-emerald-400 border-b border-white/5 pb-2"
            >
              Yönetim Paneli
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
