import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PriceDisplay } from "@/components/price-display";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchase } from "@/components/product-purchase";
import { formatPriceLabel, productTitle, showsOriginalPrice } from "@/lib/format";
import { productImage } from "@/lib/images";
import { getProductBySlug } from "@/lib/products";
import { safeExternalUrl } from "@/lib/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Nicht gefunden" };

  const title = productTitle(product.name);
  const priceText = showsOriginalPrice(product.price, product.originalPrice)
    ? `${formatPriceLabel(product.price)} statt ${formatPriceLabel(product.originalPrice)}`
    : formatPriceLabel(product.price);
  const description = [product.sku, product.brand, priceText]
    .filter(Boolean)
    .join(" · ");

  return {
    title,
    description: `${title}. ${description}`,
    openGraph: {
      title,
      description: `${title}. ${description}`,
      images: product.images[0]
        ? [
            {
              url: productImage(product.images[0].url, 1200, "limit"),
              alt: title,
            },
          ]
        : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const title = productTitle(product.name);
  const manufacturerUrl = product.manufacturerUrl
    ? safeExternalUrl(product.manufacturerUrl)
    : null;

  return (
    <article className="mx-auto grid max-w-[1440px] gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:gap-16 lg:px-10 lg:py-12">
      <ProductGallery images={product.images} name={title} />
      <div className="lg:sticky lg:top-24 lg:self-start">
        <Link href="/" className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
          Katalog
        </Link>
        <h1 className="mt-5 font-serif text-[2.6rem] uppercase leading-[0.9] tracking-[0.03em] md:text-6xl">
          {title}
        </h1>
        <p className="mt-4 text-[11px] tracking-[0.16em] text-neutral-500">{product.sku}</p>
        <PriceDisplay
          price={product.price}
          originalPrice={product.originalPrice}
          className="mt-4 text-sm"
        />
        {manufacturerUrl ? (
          <a
            href={manufacturerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-[11px] uppercase tracking-[0.16em] underline underline-offset-4"
          >
            Beim Hersteller ansehen
          </a>
        ) : null}
        <dl className="mt-8 space-y-3 text-sm">
          {product.brand ? <Meta label="Marke" value={product.brand} /> : null}
          {product.category ? (
            <div className="flex gap-4">
              <dt className="w-24 shrink-0 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                Kategorie
              </dt>
              <dd>
                <Link
                  href={`/?category=${encodeURIComponent(product.category)}`}
                  className="underline underline-offset-4"
                >
                  {product.category}
                </Link>
              </dd>
            </div>
          ) : null}
          <Meta label="Status" value={product.available ? "Verfügbar" : "Ausverkauft"} />
        </dl>
        <ProductPurchase product={product} />
      </div>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-24 shrink-0 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}
