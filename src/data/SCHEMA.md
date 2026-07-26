# Vehicle Catalog — Veri Şeması

## Kök yapı (`VehicleCatalog`)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `meta` | `VehicleCatalogMeta` | Versiyon, locale, segment filtreleri |
| `vehicles` | `Vehicle[]` | Araç listesi |

## `Vehicle` — temel alanlar

- **Kimlik:** `id`, `slug`, `brand`, `model`, `year`, `segment`, `bodyStyle`
- **Pazarlama:** `tagline`, `shortDescription`, `highlights[]`, `featured`, `accentColor`
- **Fiyat:** `pricing { currency, msrp, trim }`
- **Medya:** `media { heroImage, thumbnail, gallery[], colorHex }`

## `audio` — işitsel deneyim

```json
"audio": {
  "idle": { "id", "label", "description", "src", "durationSeconds", "format", "recordedAt?", "microphone?" },
  "exhaust": { ... },
  "rev?": { ... }
}
```

Ses dosyaları `public/audio/` altında; JSON'da `/audio/...` yolu kullanılır.

## `engine` + `performance`

Motor kodu, hacim, güç/tork, yakıt tipi; 0–100, vites, çekiş tipi.

## `multimedia[]`

`category`: `infotainment` | `audio` | `connectivity` | `driver-assist` | `comfort`

## `interiorMaterials[]`

Bölge (`zone`), malzeme, renk, sürdürülebilirlik bayrağı.

## `technicalSections[]`

Sekme/akordiyon için gruplanmış `{ label, value }` çiftleri.

## Örnek araçlar (2023 C-SUV)

BMW X3, Mercedes GLC, Audi Q5, Volvo XC60, Lexus NX, Genesis GV70
