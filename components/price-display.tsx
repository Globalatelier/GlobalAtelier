import { formatPrice, formatPriceLabel, showsOriginalPrice } from "@/lib/format";

export function PriceDisplay({
  price,
  originalPrice,
  inquiry = "Preis auf Anfrage",
  className = "",
}: {
  price: number | null;
  originalPrice: number | null;
  inquiry?: string;
  className?: string;
}) {
  const showOriginal = showsOriginalPrice(price, originalPrice);
  const ours = price == null ? inquiry : formatPriceLabel(price);
  const original = formatPrice(originalPrice);

  return (
    <p className={className}>
      {showOriginal && original ? (
        <span className="mr-2 text-neutral-400 line-through">{original}</span>
      ) : null}
      <span>{ours}</span>
    </p>
  );
}
