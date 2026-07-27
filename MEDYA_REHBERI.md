# OtoVadi — Medya ve Dosya Yolu Rehberi

## Proje konumu (tam yol)

```
C:\Users\User\.cursor\projects\C-Users-User-AppData-Local-Temp-18292b58-995b-4f26-abd1-593dface36fa\interactive-vehicle-catalog
```

Kısa yol: Cursor workspace içindeki **`interactive-vehicle-catalog`** klasörü.

---

## Klasör yapısı (yüklemeniz gereken yerler)

```
interactive-vehicle-catalog/
├── public/                          ← Tarayıcıya doğrudan servis edilir
│   ├── audio/                       ← SES DOSYALARI (mp3)
│   │   ├── bmw-x3-20d-idle.mp3
│   │   ├── bmw-x3-20d-exhaust.mp3
│   │   └── ...
│   └── images/
│       └── vehicles/                ← ARAÇ GÖRSELLERİ (webp önerilir)
│           ├── bmw-x3-hero.webp
│           ├── bmw-x3-thumb.webp
│           └── ...
├── src/
│   ├── data/
│   │   ├── vehicles.json            ← Araç verisi + dosya yolları
│   │   └── segments.ts              ← Klasman listesi (B/C/D/E/F sedan & SUV)
│   └── ...
```

---

## Ses dosyaları

| Ne | Nereye |
|----|--------|
| **Klasör** | `public/audio/` |
| **Format** | `.mp3` (tercihen), `.ogg`, `.wav |
| **JSON'daki yol** | `/audio/dosya-adi.mp3` |

Örnek: JSON'da `"src": "/audio/bmw-x3-20d-idle.mp3"` → dosya:

```
interactive-vehicle-catalog\public\audio\bmw-x3-20d-idle.mp3
```

Mevcut araçlar için beklenen dosya adları (`vehicles.json` içinden):

- `bmw-x3-20d-idle.mp3`, `bmw-x3-20d-exhaust.mp3`, `bmw-x3-20d-rev.mp3`
- `mercedes-glc-300-idle.mp3`, `mercedes-glc-300-exhaust.mp3`
- `audi-q5-45-idle.mp3`, `audi-q5-45-exhaust.mp3`
- `volvo-xc60-b5-idle.mp3`, `volvo-xc60-b5-exhaust.mp3`
- `lexus-nx-350h-idle.mp3`, `lexus-nx-350h-exhaust.mp3`
- `genesis-gv70-25t-idle.mp3`, `genesis-gv70-25t-exhaust.mp3`
- `bmw-320i-idle.mp3`, `bmw-320i-exhaust.mp3`
- `audi-a6-45-idle.mp3`, `audi-a6-45-exhaust.mp3`
- `mercedes-e300-idle.mp3`, `mercedes-e300-exhaust.mp3`

---

## Araç görselleri

| Ne | Nereye |
|----|--------|
| **Klasör** | `public/images/vehicles/` |
| **Format** | `.webp` veya `.jpg` / `.png` |
| **JSON'daki yol** | `/images/vehicles/dosya-adi.webp` |

Her araç için tipik dosyalar (`media` alanı):

| Alan | Açıklama | Örnek dosya |
|------|----------|-------------|
| `heroImage` | Detay üst banner | `bmw-x3-hero.webp` |
| `thumbnail` | Kart küçük görsel | `bmw-x3-thumb.webp` |
| `gallery[]` | Ek fotoğraflar | `bmw-x3-exterior-1.webp` |

Örnek tam yol:

```
interactive-vehicle-catalog\public\images\vehicles\bmw-x3-hero.webp
```

Görsel yoksa kartlarda `colorHex` gradient gösterilir; görsel ekleyince otomatik kullanılır.

---

## Yeni araç eklerken

1. Ses ve görselleri yukarıdaki `public/` klasörlerine koyun.
2. `src/data/vehicles.json` dosyasına yeni kayıt ekleyin.
3. **`segment`** alanını doğru seçin:

| Klasman | `segment` değeri |
|---------|------------------|
| B Sedan | `b-sedan` |
| C Sedan | `c-sedan` |
| D Sedan | `d-sedan` |
| E Sedan | `e-sedan` |
| F Sedan | `f-sedan` |
| B SUV | `b-suv` |
| C SUV | `c-suv` |
| D SUV | `d-suv` |
| E SUV | `e-suv` |
| F SUV | `f-suv` |

4. **`bodyType`**: `"sedan"` veya `"suv"`

---

## Çalıştırma

```powershell
cd "C:\Users\User\.cursor\projects\C-Users-User-AppData-Local-Temp-18292b58-995b-4f26-abd1-593dface36fa\interactive-vehicle-catalog"
npm run dev
```

Tarayıcı: **http://localhost:5173/**
