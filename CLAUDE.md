# OtoVadi — Çalışma Notları

Premium dijital otomotiv showroom'u: araç kataloğu, karşılaştırma, AI "Akıllı Keşif" (Gemini), "Ruh İkizi" eşleştirme,
editoryal içerik (Günün Aracı, Koleksiyonlar) ve Firestore tabanlı admin CMS. Canlı: otovadi.vercel.app (Vercel, SPA rewrite).

## Yığın
React 19 · TypeScript ~6 · Vite 8 · Tailwind 3.4 (`darkMode: 'class'`) · framer-motion 12 · Zustand 5 ·
React Router 7 (`BrowserRouter`, deklaratif rotalar) · Firebase 12 (Auth + Firestore) · `@google/genai` (YALNIZCA sunucuda: `api/discover.ts`, Vercel Function) ·
fontlar self-host `@fontsource/playfair-display` (yalnızca 400/500 import edilir) + `@fontsource-variable/inter` (main.tsx'te import; Google Fonts yok).

## Doğrulama (her değişiklikten sonra)
```bash
npx tsc -p tsconfig.app.json --noEmit    # src'yi gerçekten tarar
npx tsc -p tsconfig.node.json --noEmit   # vite.config.ts + api/
npm run build                            # tsc -b && vite build — 500 kB uyarısı ÇIKMAMALI (en büyük parça firestore ~451 kB)
npx eslint .                             # 55 hata önceden var (48'i AdminDashboard `any`); sayı ARTMAMALI
```
Kökte düz `npx tsc --noEmit` hiçbir dosyayı taramaz (`tsconfig.json` → `files: []`), güvence vermez.
Geliştirme: `npm run dev` (5173); vite.config.ts'teki ara katman `/api/*` isteklerini `api/<ad>.ts`'e yönlendirir ve
`.env`'deki `GEMINI_API_KEY` / `GEMINI_MODEL`'i yalnızca sunucu sürecine aktarır. `npx vite preview`'da `/api` yoktur (Hızlı Eşleştirme devreye girer).

## Veri akışı
- `App.tsx` → `FirestoreSync`, `vehicles` koleksiyonuna abone olur → `useVehicleStore` (`vehicles`, `isLoading`, `loadError`, `retryLoad`).
- Store `vehicles: []` ile başlar. Araç kullanan her sayfa sırasıyla `isLoading` → `loadError` + boş liste → boş liste durumlarını ele alır;
  `vehicles[0]`'a korumasız erişme. Hazır bileşenler `components/ui/DataState.tsx` içinde: `LoadingState`, `VehicleLoadError`, `LoadErrorState`, `StatusScreen`, `CrashScreen`.
- Yeni `onSnapshot` aboneliklerine mutlaka hata callback'i ver (servislerdeki `onError` parametresi deseni).
- Tek doğru kaynak Firestore'dur. Eski seed JSON'ları (`src/data/*.json`) ve `seedVehiclesToFirestore` Faz 4'te silindi; `src/data/` yalnızca `segments.ts` + `SCHEMA.md`.

## Mimari kurallar (Faz 1)
1. **Renk tokenları:** `index.css`'te "R G B" kanalları (`--color-foreground: 0 0 0`), Tailwind'de `rgb(var(--x) / <alpha-value>)`.
   `bg-void/80` gibi opaklık sınıfları buna bağlıdır. Ham CSS/inline stilde `rgb(var(--color-foreground))` yaz; çıplak
   `var(--color-...)` geçerli bir renk DEĞİLDİR. Gri hiyerarşisi: `foreground` → `secondary` (gövde metni) → `muted` (etiket);
   kenarlık `border-subtle` / `border-strong`; durum `success` / `warning` / `danger`. `gray-*`, `neutral-*`, `emerald-*`, `#0a0a0a`,
   `white/10` gibi temaya bağlı ham renk YOK (istisna: video/fotoğraf üstü metin ve her zaman koyu sahneler → `white`/`black`).
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

## Tasarım sistemi (Faz 3)
- **Tema flaşı / varsayılan:** `index.html`'deki inline script React'ten önce `dark` sınıfını ve `meta[name=theme-color]`'ı ayarlar.
  Kayıtlı `theme-storage` tercihi yoksa HER ZAMAN koyu (işletim sistemi teması bilinçli olarak dikkate alınmaz); kullanıcı seçimi persist edilir. `--color-void` değişirse script'teki hex'leri ve `useThemeStore`'u da güncelle.
- **Görsel kimlik = Mercedes-Benz resmi showroom estetiği (Serif Display + temiz Sans).** Porsche/Polestar tarzı grotesk display'e
  geri DÖNME (Inter Tight denendi ve kullanıcı tarafından reddedildi). `font-display` = Playfair Display (yalnızca 400–500 yüklü; serifte `font-semibold`/`font-bold` kullanma,
  `font-light` kullanma, Playfair'de 300 yok), `font-sans` = Inter (latin-ext: ğ ş İ ₺). Tüm serifler yalnızca `font-display` token'ından gelir;
  Georgia/sistem serifi veya `font-serif` yok. Serif: hero, sayfa/bölüm başlıkları, araç/koleksiyon adları, kategori kartları.
  Sans (Inter): arayüz, etiketler ve TÜM rakamlar (fiyat, teknik değer, istatistik → `tabular-nums`). Başlıklar `text-display-sm|md|lg|xl` (clamp).
  En küçük boyut `text-2xs` (11px); `text-[9px]/[10px]`, `tracking-[0.3–0.5em]`, `font-serif` yok. Etiketler `.eyebrow` / `.stat-label`
  (`tracking-eyebrow` 0.16em), değerler `.stat-value`; fiyat ve teknik değerlerde `tabular-nums`. Büyük harfle gösterilen
  marka/model/donanım adlarına `lang="en"` ver (Türkçe kural "AUDİ", "320İ" üretir).
- **Sayfa iskeleti:** `layout/PageContainer` (`width`: narrow|medium|default|wide, `spacing`: page|section|none; yatay boşluk
  Navbar ile aynı) + `layout/PageHeader` (`PageHeader` h1, `SectionHeader` h2). Sayfalar `<main>` açmaz (AppShell sağlar).
- **Görseller:** Her araç/editoryal görsel `ui/SmartImage` ile (`aspectRatio="16 / 10"` veya ebeveyni doldurur; `colorHex`
  → kırık/boş görselde stüdyo gradyanı + tipografik "OTOVADİ" monogramı; koyu sahnede `tone="dark"`; ilk ekranda `priority`). Çıplak `<img>` ekleme.
  Araç çizimi/siluet SVG'si kullanma (BodyTypeIcons kaldırıldı); gövde tipi kartları yalnızca tipografiktir.
- **Araç kartı:** `vehicle/VehicleCard` (`variant`: grid|featured) + `VehicleCardSkeleton`. Tek gerçek `<Link>` (başlık, `::after` ile kartı kaplar),
  garaj + karşılaştır (`/karsilastir?a=<slug>`) aksiyonları z-10. Araç metinleri `utils/vehicleText` (`vehicleName`, `cleanText`) ile trim'lenir.
- **Ses:** Detayda Ses sekmesi yalnızca `usePlayableTracks` gerçekten çalınabilir kayıt doğrularsa görünür; kullanıcıya dosya yolu gösterme.
- **Animasyon:** framer-motion `LazyMotion features={domAnimation} strict` ile sarılı (App.tsx): bileşenlerde `motion.div` DEĞİL
  `m.div` (`import { m } from 'framer-motion'`) kullan; `motion.*` strict modda çalışma zamanında hata verir. `layout`/`layoutId`/`drag`
  domAnimation'da yok (gerekirse `domMax`'a geçilmeli). `lib/motion.ts` → `DURATION` (0.2/0.35/0.55), tek eğri `EASE_OUT`, `TRANSITION`, `fadeUp`/`fade`, `staggerDelay(i)` (ilk 6 öğe).
  App `<MotionConfig reducedMotion="user">`; otomatik oynayan medya için ayrıca `useReducedMotion`. `filter: blur` geçişi ve `animate-ping` yok;
  CSS'te `transition` varsayılanı 200ms + aynı eğri, sürekli animasyonlar `motion-safe:`.
- **Header:** xl+ tüm linkler + dil/tema; lg 5 link + menü; mobil üst bar yalnızca marka/garaj/menü (dil + tema menüde, hesap BottomNav'da).
  Ana sayfada hero üzerinde şeffaf, kaydırınca dolgun; bunun için `HeroSection` header yüksekliği kadar negatif margin alır.

## Performans ve SEO (Faz 4)
- **Kod bölme:** `App.tsx` → `HomePage` ve `NotFoundPage` hariç tüm sayfalar `lazyPage(() => import(...), 'Ad')` (React.lazy, isimli export).
  Yükleme durumu `RouteBoundary` içindeki `<Suspense fallback={<PageFallback />}>` (admin rotaları için App'te ayrıca `fullScreen`).
  Yeni sayfa eklerken aynı deseni kullan. Detay + Modeller parçası boşta önceden indirilir (`PrefetchCommonRoutes`).
  `main.tsx`'teki `vite:preloadError` dinleyicisi dağıtım sonrası eski parça 404'ünde sekmeyi bir kez yeniler.
- **Vendor parçaları:** `vite.config.ts` → `build.rolldownOptions.output.codeSplitting.groups` (Vite 8/Rolldown'da `manualChunks` deprecated):
  `firestore` (+@firebase/app çekirdeği), `firebase-auth`, `motion`, `icons` (lucide), `react` (react/dom/router/zustand).
  `preloadCriticalFonts` eklentisi build'de hash'li Playfair 400 (latin + latin-ext) ve Inter latin woff2'yi `<link rel=preload>` ile ekler.
- **Hero videosu (P1):** `public/hero-challenger.mp4` = orijinalin 14,0–26,0 sn aralığı (Dodge uyarı yazısı kırpıldı), 12 sn, 1080p H.264 High,
  sessiz, 2-pass ~2,6 Mbps, `+faststart`, ~3,97 MB. Poster `public/hero-poster.webp` (ilk kare, ~75 kB) ana sayfada inline script ile preload edilir.
  `HeroSection`: `prefers-reduced-motion` veya `navigator.connection.saveData` açıksa `<video>` hiç mount edilmez (yalnızca poster);
  Oynat'a basılınca yüklenir. `IntersectionObserver` ekrandan çıkınca duraklatır. Videoyu yeniden kodlamak için ffmpeg gerekir (sistemde yok;
  `npx`/geçici klasöre `ffmpeg-static` kurularak yapıldı).
- **Sayfa meta (P7):** Her sayfa bileşeni en üstte `usePageMeta({ title, description, image, noindex })` çağırır (`hooks/usePageMeta.ts`):
  `document.title` = "<title> | OtoVadi", description, robots, canonical, og:*/twitter:*. `null` → yazmaz (kayıt bulunamayınca içteki
  `NotFoundPage` yazar; çocuk effect'i önce çalıştığı için ebeveyn ezmemeli). Kişisel/admin sayfaları `noindex: true`.
  Site sabitleri `lib/seo.ts`; aynı değerler `index.html` ve `api/og-meta.ts`'te kopya — birini değiştirirsen hepsini güncelle.
- **Sosyal önizleme (P7):** `vercel.json`'da `/arac/:id` için `has: user-agent` (WhatsApp, facebookexternalhit, Twitterbot, LinkedInBot,
  Slackbot, TelegramBot, Discordbot…) rewrite'ı → `api/og-meta.ts` (Firestore REST, anahtarsız public read, 3 sn timeout) araca özel kart döner;
  hata/bulunamadı → varsayılan kart (`/og-image.jpg`, 1200×630). Normal ziyaretçi ve Googlebot SPA'yı alır. Bu rewrite SPA kuralından ÖNCE kalmalı.
  Yanıtta meta refresh/yönlendirme veya X-Robots-Tag YOK (aynı URL'de sunulur).
- **İkonlar / PWA:** `public/favicon.svg` (çember içinde V, `prefers-color-scheme` ile siyah/beyaz), `apple-touch-icon.png` (180),
  `icon-192.png`, `icon-512.png` (any + maskable), `manifest.webmanifest`, `robots.txt`, `sitemap.xml` (yalnızca statik rotalar; araç URL'leri yok).

## Akıllı Keşif ve güvenlik (Faz 2)
- Akış: `AutoCurator` → `services/discoveryService.ts` → `POST /api/discover` → Gemini (`responseSchema`, slug enum + sunucuda
  ayrıca doğrulama, toplam 12 sn, 429/503'te tek retry, 300 karakter). Sözleşme `src/types/discovery.ts` (yalnızca tip).
- Model: varsayılan `gemini-3.5-flash-lite` (sabit sürüm); `GEMINI_MODEL` ile değişir. `-latest` takma adı kullanma. 2.5 serisi 1 Aralık 2026'da kapanıyor.
- İstemci durumları `idle | loading | success | degraded | error`. API başarısızsa `utils/localVehicleMatcher.ts` ile
  "Hızlı Eşleştirme" gösterilir; asla sessizce `vehicles[0]` veya "Mükemmel Eşleşme" etiketi gösterme.
- `api/` dosyalarında göreli çalışma zamanı import'u yok (Vercel ESM'de kırılır); yalnızca paketler ve `import type`.
- Sır gerektiren her şey `api/` altında, `process.env.X` (VITE_ öneki YOK). `VITE_` önekli değişken bundle'a girer.
- Yetki: `firestore.rules` tek doğru kaynaktır. Yönetici = Console'dan elle eklenen `admins/{uid}` dokümanı;
  `useAuth().isAdmin` yalnızca arayüz içindir. Kural değişikliği Firebase Console'da yayınlanmadıkça etkisizdir.
- Kurallar filtre değildir: kişisel veri sorguları sunucuda daraltılır (ör. `where('userId','==',uid)`), tüm koleksiyonu indirip
  istemcide süzme. Bileşik index'ler `firestore.indexes.json`'da. `testDrives.createdAt` = `serverTimestamp()` (kural `request.time` ister).

## Bilinen veri istisnaları (canlı Firestore `otovadi-99993`, 2026-11-19 itibarıyla)
- `vehicles`: 33 doküman, hepsi `pricing.currency: "TRY"`; ancak 28'inin `msrp` değeri < 1.000.000 ve gerçekte EUR.
  Sebep: admin formu eskiden para birimini zorla TRY yazıyordu (düzeltildi, artık formda seçim var).
  `resolveCurrency` içindeki GEÇİCİ kural: `TRY` ve < 1M → EUR. Araçlar admin'den doğru para birimiyle yeniden kaydedilince bu kural kaldırılmalı.
- Doküman id = `vehicle.id`; `slug` farklı olabilir. Garaj (`users/{uid}.savedVehicles`) slug saklar; id ve slug'ı birlikte kontrol et.
- Admin'den eklenen araçlarda boyutlar sahte varsayılandır (4500 mm, 500 L, 1500 kg), ses `src: ''`, multimedya/iç mekan boştur; güvenilir sayma.
- Muscle car kayıtlarında `segment: "muscle-car"` olabilir (tip `'-'` bekler).
- `public/audio/` ve `public/images/vehicles/` boştur (bu yüzden Ses sekmesi şu an hiçbir araçta görünmez); görseller dış hotlink'tir
  (Wikimedia/Unsplash/hdcarwallpapers) ve kırılabilir — SmartImage fallback'i bunu karşılar. Marka/model alanlarında baş/son boşluk var.
- Canlı veritabanına script ile yazma veya migration çalıştırma yalnızca kullanıcının açık onayıyla yapılır.

## Dokunma / hassas noktalar
- `public/hero-challenger.mp4` (Faz 4'te optimize edildi, ~3,97 MB) ve `public/hero-poster.webp`: yeniden kodlama/değiştirme kullanıcı onayıyla;
  değişirse posteri de aynı ilk kareden yeniden üret. (`public/models/tucson.glb` Faz 4'te silindi; 3D model kullanılmıyor.)
- `.env` (`GEMINI_API_KEY`): commit etme, değerini asla yazdırma. Eski `VITE_GEMINI_API_KEY` bundle'a sızmıştı; rotate edilmeli.
- `firestore.rules`: değiştirirsen Console'da yayınlanması gerektiğini kullanıcıya söyle; `admins` koleksiyonuna istemciden yazma ekleme.
- `scripts/recover2.js`: kimlik doğrulamasız prod'a yazar, çalıştırma (yeni kurallar zaten reddeder).
- `src/pages/admin/AdminDashboard.tsx`: büyük ve `any` yoğun; yalnızca hedefli, küçük değişiklik.
- Commit/push yapma; kullanıcı her fazdan sonra kendisi test edip commit alır.

## Kod standartları
- TS: `verbatimModuleSyntax` (tipler `import type`), `erasableSyntaxOnly` (enum / parameter property yok), `noUnused*`. Yeni `any` ekleme.
- `react-refresh` kuralı: `.tsx` dosyaları yalnızca bileşen export eder; sabitler `.ts` dosyasına (ör. `components/ui/buttonStyles.ts`).
- Yorumlar ve arayüz metinleri Türkçe. i18n (`useI18n`, tr/en/de) kısmidir: zaten çevrilmiş alanlarda (nav, hero, catalog…) yeni metni locale dosyalarına ekle.
- Stil: Tailwind tokenları ve Faz 3 tasarım sistemi; buton dili `primaryButtonClass`, `secondaryButtonClass`. İstenmeyen tasarım değişikliği yapma.
- Kapsam dışı bir sorun görürsen sessizce düzeltme; raporla.

## Yol haritası
Analiz maddeleri: K1–K14 (hata/güvenlik), U1–U13 (UI/UX), P1–P8 (performans/SEO), Y1–Y7 (yeni özellik).
Faz 1 tamamlandı: K5–K10. Faz 2 tamamlandı: K1–K4, P8 (CI ve Speed Insights hariç).
Faz 3 tamamlandı: K11, K13, U1, U2, U3, U6, U8, U9, U10 (görsellerin kendi depolamaya taşınması hariç).
Faz 4 tamamlandı: P1, P2, P4, P6, P7, K12 + varsayılan koyu tema, AutoCurator autoFocus ve alert() temizliği
(dinamik @vercel/og görseli, araç URL'li sitemap ve P3/P5 hariç).
Sonraki fazlar kullanıcı onayıyla, madde numarasıyla seçilir.
