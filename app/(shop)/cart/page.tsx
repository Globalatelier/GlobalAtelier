import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Warenkorb",
};

export default async function CartPage() {
  const settings = await getSettings();

  return <CartView settings={settings} />;
}
