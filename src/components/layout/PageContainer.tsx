import type { ElementType, ReactNode } from 'react';

/**
 * Ortak sayfa iskeleti (U9). Yatay boşluk Navbar ile aynı hizadadır: px-4 → md:px-8 → lg:px-12.
 * Genişlikler: narrow (form/hesap), medium (editoryal), default (katalog), wide (karşılaştırma).
 * Dikey ritim: üst pt-10/md:pt-14, alt pb-16/md:pb-24 (`spacing="none"` ile kapatılabilir; ör. tam genişlik hero altı).
 * Not: AppShell zaten <main> sağlar; sayfalar <main> yerine bu kabı kullanır.
 */
const WIDTHS = {
  narrow: 'max-w-3xl',
  medium: 'max-w-5xl',
  default: 'max-w-7xl',
  wide: 'max-w-[1600px]',
} as const;

const SPACING = {
  page: 'pt-10 pb-16 md:pt-14 md:pb-24',
  section: 'py-14 md:py-20',
  none: '',
} as const;

interface PageContainerProps {
  children: ReactNode;
  width?: keyof typeof WIDTHS;
  spacing?: keyof typeof SPACING;
  as?: ElementType;
  className?: string;
  id?: string;
}

export function PageContainer({
  children,
  width = 'default',
  spacing = 'page',
  as: Component = 'div',
  className = '',
  id,
}: PageContainerProps) {
  return (
    <Component id={id} className={`mx-auto w-full px-4 md:px-8 lg:px-12 ${WIDTHS[width]} ${SPACING[spacing]} ${className}`}>
      {children}
    </Component>
  );
}
