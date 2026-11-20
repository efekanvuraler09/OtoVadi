import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  /** Başlığın sağında (masaüstü) / altında (mobil) gösterilecek aksiyonlar */
  actions?: ReactNode;
  align?: 'left' | 'center';
  /** Sayfanın ana başlığı değilse 'h2' */
  as?: 'h1' | 'h2';
  className?: string;
}

/** Sayfa başlığı: eyebrow → display başlık → açıklama. Tüm sayfalarda aynı tip ölçeği ve alt boşluk. */
export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  align = 'left',
  as: Heading = 'h1',
  className = '',
}: PageHeaderProps) {
  const centered = align === 'center';
  return (
    <header
      className={`mb-10 flex flex-col gap-6 md:mb-14 ${
        centered ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between'
      } ${className}`}
    >
      <div className={centered ? 'flex flex-col items-center' : 'min-w-0'}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <Heading className="text-display-lg font-light text-foreground">{title}</Heading>
        {description && (
          <p className={`mt-4 max-w-2xl text-base leading-relaxed text-secondary md:text-lg ${centered ? 'mx-auto' : ''}`}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

interface SectionHeaderProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  id?: string;
  className?: string;
}

/** Sayfa içi bölüm başlığı (h2): ana sayfa vitrini, gövde tipleri vb. */
export function SectionHeader({ title, eyebrow, description, actions, id, className = '' }: SectionHeaderProps) {
  return (
    <div className={`mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between ${className}`}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 id={id} className="text-display-md font-light text-foreground">
          {title}
        </h2>
        {description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-secondary md:text-base">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}
