import type { CartItem } from "@/types";

export function whatsappDigits(value: string) {
  return value.replace(/\D/g, "").replace(/^00/, "");
}

export function buildWhatsappUrl(
  number: string,
  shopName: string,
  items: CartItem[],
  origin: string,
) {
  const digits = whatsappDigits(number);
  const site = origin.replace(/\/$/, "");

  if (digits.length < 8 || items.length === 0 || !site) return null;

  const lines = [
    `Hallo ${shopName}`,
    "ich würde gerne folgende Produkte anfragen",
    "",
  ];

  items.forEach((item) => {
    lines.push(
      `${item.name} / ${site}/product/${item.slug} / ${item.size ?? "—"} / ${item.quantity}`,
    );
  });

  return `https://wa.me/${digits}?text=${encodeURIComponent(lines.join("\n"))}`;
}
