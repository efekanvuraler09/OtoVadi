interface UnverifiedNoteProps {
  className?: string;
}

/** "—" işaretli değerlerin açıklaması (Cila 1). Sakin, satır içi; uyarı rengi kullanılmaz. */
export function UnverifiedNote({ className = '' }: UnverifiedNoteProps) {
  return (
    <p className={`flex items-start gap-2 text-2xs leading-relaxed text-muted ${className}`}>
      <span className="font-medium text-secondary" aria-hidden>
        —
      </span>
      <span>
        Bu değer kayıtlarımızda henüz doğrulanmadı. Gerçek olmayan bir rakam göstermek yerine boş bırakıyor; kıyas, düello
        ve maliyet hesaplarına katmıyoruz.
      </span>
    </p>
  );
}
