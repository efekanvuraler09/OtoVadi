export function formatPrice(price: number): string {
  if (price < 1000000) {
    // Assume Euro for prices under 1,000,000
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  } else {
    // Assume TRY for prices 1,000,000 and above
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }).format(price);
  }
}
