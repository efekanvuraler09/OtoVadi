/**
 * 1.2 / 2.3 — Tarayıcının yazdır / "PDF olarak kaydet" penceresini açar. PDF dosya adı çoğu tarayıcıda belge
 * başlığından gelir; yazdırma süresince anlamlı bir başlık verilir, ardından eski başlık geri yüklenir.
 * Basılacak içerik components/print/PrintSheet ile body'ye portal edilen belgedir (index.css → @media print).
 *
 * Hotlink görseller yavaş gelebildiği için baskı belgesindeki görseller en fazla IMAGE_WAIT_MS beklenir;
 * yüklenemeyen görselin yerine SmartImage'ın tipografik zemini basılır (baskı hiçbir zaman kilitlenmez).
 */
const IMAGE_WAIT_MS = 3000;

function waitForSheetImages(): Promise<void> {
  const images = [...document.querySelectorAll<HTMLImageElement>('.print-sheet img')];
  const pending = images
    .filter((img) => !img.complete)
    .map(
      (img) =>
        new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        }),
    );
  if (pending.length === 0) return Promise.resolve();
  return Promise.race([
    // Yüklenen görsel SmartImage'da bir sonraki render'da görünür olur: kısa bir kare payı
    Promise.all(pending).then(() => new Promise<void>((resolve) => setTimeout(resolve, 120))),
    new Promise<void>((resolve) => setTimeout(resolve, IMAGE_WAIT_MS)),
  ]);
}

let printing = false;

export async function printDocument(title: string): Promise<void> {
  if (typeof window === 'undefined' || typeof window.print !== 'function' || printing) return;
  printing = true;
  try {
    await waitForSheetImages();
    const previous = document.title;
    document.title = title;
    window.addEventListener(
      'afterprint',
      () => {
        document.title = previous;
      },
      { once: true },
    );
    window.print();
  } finally {
    printing = false;
  }
}
