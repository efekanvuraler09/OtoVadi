import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Vehicle } from '../../types/vehicle';
import { useVehicleTransitionLink } from '../../hooks/useVehicleTransitionLink';

interface VehicleLinkProps {
  vehicle: Vehicle;
  className?: string;
  children: ReactNode;
}

/**
 * Detay sayfasına View Transition ile giden link (1.1). Kaynak görsel/başlık, linkin en yakın [data-vt-root]
 * atasındaki [data-vt="media"] / [data-vt="title"] öğeleridir; bulunamazsa yalnızca sayfa çapraz geçişi olur.
 */
export function VehicleLink({ vehicle, className, children }: VehicleLinkProps) {
  const link = useVehicleTransitionLink(vehicle);
  return (
    <Link
      to={link.to}
      onPointerEnter={link.prefetch}
      onFocus={link.prefetch}
      onTouchStart={link.prefetch}
      onClick={(event) => link.onClick(event, event.currentTarget.closest<HTMLElement>('[data-vt-root]'))}
      className={className}
    >
      {children}
    </Link>
  );
}
