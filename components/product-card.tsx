import Link from "next/link";
import { CardPurchase } from "@/components/card-purchase";
import { PriceDisplay } from "@/components/price-display";
import { ProductImageView } from "@/components/product-image";
import { productTitle } from "@/lib/format";
import { safeExternalUrl } from "@/lib/site";
import type { Product } from "@/types";

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const title = productTitle(product.name);
  const image = product.images[0]?.url ?? null;
  const manufacturerUrl = product.manufacturerUrl
    ? safeExternalUrl(product.manufacturerUrl)
    : null;

  return (
    <article>
      <Link href={`/product/${product.slug}`} className="group block">
        <div className="relative aspect-[3/4] overflow-hidden bg-[#f3f3f1]">
          {image ? (
            <ProductImageView
              url={image}
              alt={title}
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
              priority={priority}
              className="image-zoom object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-end p-3">
              <span className="font-serif text-2xl uppercase tracking-[0.08em] text-neutral-400">
                {title}
              </span>
            </div>
          )}
        </div>
        <div className="pt-3">
          <h2 className="text-[13px] leading-snug tracking-[0.04em]">{title}</h2>
          <p className="mt-1 text-[11px] tracking-[0.14em] text-neutral-500">{product.sku}</p>
          <PriceDisplay
            price={product.price}
            originalPrice={product.originalPrice}
            className="mt-1 text-[13px]"
          />
          {product.brand ? (
            <p className="mt-1 text-[11px] tracking-[0.08em] text-neutral-500">{product.brand}</p>
          ) : null}
          {!product.available ? (
            <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              Ausverkauft
            </p>
          ) : null}
        </div>
      </Link>
      <CardPurchase product={product} />
      {manufacturerUrl ? (
        <a
          href={manufacturerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-[11px] uppercase tracking-[0.14em] text-neutral-500 underline underline-offset-4"
        >
          Hersteller
        </a>
      ) : null}
    </article>
  );
}
