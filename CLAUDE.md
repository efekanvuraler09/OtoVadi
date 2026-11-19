# OtoVadi — Çalışma Notları

Premium dijital otomotiv showroom'u: araç kataloğu, karşılaştırma, AI "Akıllı Keşif" (Gemini), "Ruh İkizi" eşleştirme,
editoryal içerik (Günün Aracı, Koleksiyonlar) ve Firestore tabanlı admin CMS. Canlı: otovadi.vercel.app (Vercel, SPA rewrite).

## Yığın
React 19 · TypeScript ~6 · Vite 8 · Tailwind 3.4 (`darkMode: 'class'`) · framer-motion 12 · Zustand 5 ·
React Router 7 (`BrowserRouter`, deklaratif rotalar) · Firebase 12 (Auth + Firestore) · `@google/generative-ai` (istemcide, bkz. Hassas noktalar).

## Doğrulama (her değişiklikten sonra)
```bash
npx tsc -p tsconfig.app.json --noEmit    # src'yi gerçekten tarar
npx tsc -p tsconfig.node.json --noEmit   # vite.config.ts
npm run build                            # tsc -b && vite build (500 kB chunk uyarısı bilinen durum)
npx eslint .                             # 62 hata önceden var (çoğu AdminDashboard `any`); sayı ARTMAMALI
```
Kökte düz `npx tsc --noEmit` hiçbir dosyayı taramaz (`tsconfig.json` → `files: []`), güvence vermez.
Geliştirme: `npm run dev` (5173). Build önizleme: `npx vite preview`.

## Veri akışı
- `App.tsx` → `FirestoreSync`, `vehicles` koleksiyonuna abone olur → `useVehicleStore` (`vehicles`, `isLoading`, `loadError`, `retryLoad`).
- Store `vehicles: []` ile başlar. Araç kullanan her sayfa sırasıyla `isLoading` → `loadError` + boş liste → boş liste durumlarını ele alır;
  `vehicles[0]`'a korumasız erişme. Hazır bileşenler `components/ui/DataState.tsx` içinde: `LoadingState`, `VehicleLoadError`, `LoadErrorState`, `StatusScreen`, `CrashScreen`.
- Yeni `onSnapshot` aboneliklerine mutlaka hata callback'i ver (servislerdeki `onError` parametresi deseni).
- Tek doğru kaynak Firestore'dur. `src/data/*.json` hiçbir yerde import edilmez (eski seed verisi).

## Mimari kurallar (Faz 1)
1. **Renk tokenları:** `index.css`'te "R G B" kanalları (`--color-foreground: 0 0 0`), Tailwind'de `rgb(var(--x) / <alpha-value>)`.
   `bg-void/80` gibi opaklık sınıfları buna bağlıdır. Ham CSS/inline stilde `rgb(var(--color-foreground))` yaz; çıplak
   `var(--color-...)` artık geçerli bir renk DEĞİLDİR. Temaya bağlı renklerde yeni hex kullanma.
2. **z-index:** Yalnızca isimli skala: `z-header` / `z-bottombar` 40, `z-drawer-backdrop` 60, `z-drawer` 70, `z-modal` 80,
   `z-toast` 90, `z-stage` 100. Sayfa içi yerel değerler 0–30. `main`'e z-index verme (stacking context tuzağı); `z-[9999]` gibi keyfi değer ekleme.
3. **Overlay/modal:** `createPortal(..., document.body)` ile render et. `AnimatePresence` `isOpen` koşulunun dışında olmalı
   (`if (!isOpen) return null` yazma, yoksa kapanış animasyonu oynamaz). Mobilde `max-h-[90svh] overflow-y-auto`; bottom-sheet örneği `TestDriveModal`.
4. **Scroll kilidi:** Her overlay `useBodyScrollLock(isOpen)` kullanır (sayaçlıdır, iç içe katmanları destekler). `document.body.style.overflow`'a doğrudan dokunma.
5. **Navigasyon:** Uygulama içi geçiş yalnızca `<Link>` / `useNavigate`; `window.location.href` yok. Kaydırmayı `ScrollManager` yönetir
   (PUSH → en üst, POP → konumu geri yükler). Sayfa içi kaydırma için `href="#id"` kullanma, `scrollIntoView` yapan buton kullan.
   Geri butonları `useBackNavigation(fallback)`. `RouteBoundary` sayfayı pathname ile key'ler ve ErrorBoundary ile sarar;
   `Outlet` etrafına `AnimatePresence` geri ekleme (sayfaları iki kez mount eder).
6. **Mobil / safe-area:** `pt-safe`, `pb-safe`, `pb-bottom-bar`, `bottom-above-bar`, `pb-sheet` yardımcıları; `--bottom-bar-height: 5rem`.
   `BottomNav` ve `MobileActionBar` `h-20`; `main` → `pb-bottom-bar md:pb-8`. `/arac/*`'ta BottomNav gizlidir, yerini `MobileActionBar` alır.
   Yeni kodda `100vh` yerine `svh`/`dvh`. Sticky header 4rem; çapa hedeflerinde `scroll-mt-20`.
7. **Fiyat:** Daima `formatVehiclePrice(pricing)` veya `formatPrice(tutar, resolveCurrency(pricing))` (`utils/formatPrice.ts`).
   Para birimini tutardan tahmin etme, para birimi kodunu metne elle ekleme.
8. **Diğer:** Garaj işlemleri `useGarageToggle(vehicle)`; giriş gerektiren aksiyonlar `openAuthModal(mesaj)`;
   bulunamayan kayıtta sessiz `Navigate to="/"` yerine `NotFoundPage`.

## Bilinen veri istisnaları (canlı Firestore `otovadi-99993`, 2026-11-19 itibarıyla)
- `vehicles`: 33 doküman, hepsi `pricing.currency: "TRY"`; ancak 28'inin `msrp` değeri < 1.000.000 ve gerçekte EUR.
  Sebep: admin formu eskiden para birimini zorla TRY yazıyordu (düzeltildi, artık formda seçim var).
  `resolveCurrency` içindeki GEÇİCİ kural: `TRY` ve < 1M → EUR. Araçlar admin'den doğru para birimiyle yeniden kaydedilince bu kural kaldırılmalı.
- Doküman id = `vehicle.id`; `slug` farklı olabilir. Garaj (`users/{uid}.savedVehicles`) slug saklar; id ve slug'ı birlikte kontrol et.
- Admin'den eklenen araçlarda boyutlar sahte varsayılandır (4500 mm, 500 L, 1500 kg), ses `src: ''`, multimedya/iç mekan boştur; güvenilir sayma.
- Muscle car kayıtlarında `segment: "muscle-car"` olabilir (tip `'-'` bekler).
- `public/audio/` ve `public/images/vehicles/` boştur; görseller dış hotlink'tir (Wikimedia/Unsplash) ve kırılabilir.
- Canlı veritabanına script ile yazma veya migration çalıştırma yalnızca kullanıcının açık onayıyla yapılır.

## Dokunma / hassas noktalar
- `public/models/tucson.glb` (25 MB, kullanılmıyor) ve `public/hero-challenger.mp4` (28,5 MB): onaysız silme veya değiştirme.
- `.env` (`VITE_GEMINI_API_KEY`): commit etme, değerini asla yazdırma. Anahtar bundle'a gömülüyor; serverless'a taşıma planlı (K1/K2).
- `src/components/curator/AutoCurator.tsx` içindeki Gemini çağrı yapısı: K1/K2 fazına kadar dokunma.
- Firestore kuralları ve `src/config/firebase.ts`: K3/K4 fazında ele alınacak. Kurallar repoda yok; `isAdmin` istemci tarafı e-posta kontrolüdür, güvenlik sınırı değildir.
- `scripts/recover2.js`: kimlik doğrulamasız prod'a yazar, çalıştırma.
- `src/pages/admin/AdminDashboard.tsx`: büyük ve `any` yoğun; yalnızca hedefli, küçük değişiklik.
- Commit/push yapma; kullanıcı her fazdan sonra kendisi test edip commit alır.

## Kod standartları
- TS: `verbatimModuleSyntax` (tipler `import type`), `erasableSyntaxOnly` (enum / parameter property yok), `noUnused*`. Yeni `any` ekleme.
- `react-refresh` kuralı: `.tsx` dosyaları yalnızca bileşen export eder; sabitler `.ts` dosyasına (ör. `components/ui/buttonStyles.ts`).
- Yorumlar ve arayüz metinleri Türkçe. i18n (`useI18n`, tr/en/de) kısmidir: zaten çevrilmiş alanlarda (nav, hero, catalog…) yeni metni locale dosyalarına ekle.
- Stil: Tailwind tokenları (`void`, `surface`, `foreground`, `muted`, `border-subtle`) ve mevcut buton dili (`primaryButtonClass`, `secondaryButtonClass`).
  İstenmeyen tasarım/tipografi değişikliği yapma.
- Kapsam dışı bir sorun görürsen sessizce düzeltme; raporla.

## Yol haritası
Analiz maddeleri: K1–K14 (hata/güvenlik), U1–U13 (UI/UX), P1–P8 (performans/SEO), Y1–Y7 (yeni özellik).
Faz 1 tamamlandı: K5–K10. Sonraki fazlar kullanıcı onayıyla, madde numarasıyla seçilir.
