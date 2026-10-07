import type { CartItem } from "@/types";
import { formatPrice, showsOriginalPrice } from "@/lib/format";

export function whatsappDigits(value: string) {
  return value.replace(/\D/g, "").replace(/^00/, "");
}

export function buildWhatsappUrl(
  number: string,
  shopName: string,
  items: CartItem[],
) {
  const digits = whatsappDigits(number);

  if (digits.length < 8 || items.length === 0) return null;

  const lines = [
    `Hallo ${shopName},`,
    "",
    "ich interessiere mich für folgende Artikel:",
    "",
  ];

  items.forEach((item) => {
    lines.push(`${item.quantity}x ${item.sku} – ${item.name}`);

    if (item.size) {
      lines.push(`Größe: ${item.size}`);
    }

    lines.push(
      `Preis: ${item.price == null ? "auf Anfrage" : formatPrice(item.price)}`,
    );

    if (showsOriginalPrice(item.price, item.originalPrice)) {
      lines.push(`Originalpreis: ${formatPrice(item.originalPrice)}`);
    }

    lines.push("");
  });

  lines.push("Bitte gebt mir Bescheid, ob die Artikel verfügbar sind.");
  lines.push("");
  lines.push("Danke!");

  return `https://wa.me/${digits}?text=${encodeURIComponent(lines.join("\n"))}`;
}
