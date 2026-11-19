import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Uygulama içi geçmiş varsa bir önceki sayfaya döner (kaydırma konumu ScrollManager ile korunur).
 * Sayfaya doğrudan link/yenileme ile gelindiyse fallback rotasına gider.
 */
export function useBackNavigation(fallback = '/') {
  const navigate = useNavigate();

  return useCallback(() => {
    // React Router her geçmiş kaydına artan bir "idx" yazar; 0 ise uygulama içinde geri gidilecek sayfa yok.
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (historyIndex > 0) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  }, [navigate, fallback]);
}
