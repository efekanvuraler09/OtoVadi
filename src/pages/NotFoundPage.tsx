import { Link } from 'react-router-dom';
import { StatusScreen } from '../components/ui/DataState';
import { primaryButtonClass, secondaryButtonClass } from '../components/ui/buttonStyles';

interface NotFoundPageProps {
  title?: string;
  description?: string;
  /** Birincil butonun hedefi (varsayılan: ana sayfa) */
  backTo?: string;
  backLabel?: string;
}

export function NotFoundPage({
  title = 'Aradığınız sayfa bulunamadı',
  description = 'Bağlantı değişmiş ya da sayfa kaldırılmış olabilir. Vitrine dönerek keşfe devam edebilirsiniz.',
  backTo = '/',
  backLabel = 'Ana Sayfa',
}: NotFoundPageProps) {
  return (
    <StatusScreen
      eyebrow="404"
      title={title}
      description={description}
      actions={
        <>
          <Link to={backTo} className={primaryButtonClass}>
            {backLabel}
          </Link>
          <Link to="/modeller" className={secondaryButtonClass}>
            Modelleri Keşfet
          </Link>
        </>
      }
    />
  );
}
