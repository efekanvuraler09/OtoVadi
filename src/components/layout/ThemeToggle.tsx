import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="glass-panel flex h-10 w-[72px] items-center justify-between rounded-full p-1 relative"
      aria-label="Temayı değiştir"
    >
      <motion.div
        className="absolute h-8 w-8 rounded-full bg-surface-elevated shadow-sm"
        animate={{
          x: theme === 'dark' ? 32 : 0,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
      <div className="z-10 flex w-full justify-between px-1.5">
        <Sun
          className={`h-4 w-4 ${
            theme === 'light' ? 'text-accent' : 'text-muted'
          }`}
        />
        <Moon
          className={`h-4 w-4 ${
            theme === 'dark' ? 'text-accent' : 'text-muted'
          }`}
        />
      </div>
    </motion.button>
  );
}
