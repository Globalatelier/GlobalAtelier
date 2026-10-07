import type { Metadata } from "next";
import { CartProvider } from "@/components/cart-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getSettings } from "@/lib/settings";
import { safeExternalUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  return {
    title: {
      default: settings.shopName,
      template: `%s — ${settings.shopName}`,
    },
    description: `${settings.shopName}. Streetwear und Luxury.`,
    openGraph: {
      type: "website",
      locale: "de_DE",
      siteName: settings.shopName,
      title: settings.shopName,
      description: `${settings.shopName}. Streetwear und Luxury.`,
    },
  };
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const instagram = safeExternalUrl(settings.instagramUrl) ?? "";

  return (
    <CartProvider>
      <div className="flex min-h-dvh flex-col">
        <Header shopName={settings.shopName} instagramUrl={instagram} />
        <main className="flex-1">{children}</main>
        <Footer shopName={settings.shopName} instagramUrl={instagram} />
      </div>
    </CartProvider>
  );
}
