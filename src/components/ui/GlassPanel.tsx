import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GlassPanel({ children, className = '', onClick }: GlassPanelProps) {
  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={`glass-panel rounded-2xl ${className}`}
    >
      {children}
    </Component>
  );
}
