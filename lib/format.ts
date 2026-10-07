export function productTitle(name: string) {
  const trimmed = name.trim();

  return trimmed || "Ohne Namen";
}

export function formatPrice(price: number | null | undefined) {
  if (price == null || Number.isNaN(price)) return null;

  const hasFraction = Math.round(price * 100) % 100 !== 0;

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export function formatPriceLabel(price: number | null | undefined) {
  return formatPrice(price) ?? "Preis auf Anfrage";
}

export function showsOriginalPrice(
  price: number | null | undefined,
  originalPrice: number | null | undefined,
) {
  return (
    originalPrice != null &&
    Number.isFinite(originalPrice) &&
    (price == null || originalPrice > price)
  );
}
