"use client";

import Link from "next/link";
import { useState } from "react";
import { PriceDisplay } from "@/components/price-display";
import { ProductImageView } from "@/components/product-image";
import { useCart } from "@/components/cart-provider";
import { formatPrice } from "@/lib/format";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import type { ShopSettings } from "@/types";

export function CartView({ settings }: { settings: ShopSettings }) {
  const { items, setQuantity, removeItem, clear } = useCart();
  const [confirmClear, setConfirmClear] = useState(false);
  const whatsappUrl = buildWhatsappUrl(settings.whatsappNumber, settings.shopName, items);
  const allPriced = items.length > 0 && items.every((item) => item.price != null);
  const total = items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-10 lg:py-16">
      <h1 className="font-serif text-5xl uppercase leading-none tracking-[0.08em] md:text-6xl">
        Warenkorb
      </h1>

      {items.length === 0 ? (
        <div className="py-24">
          <p className="font-serif text-3xl">Dein Warenkorb ist leer.</p>
          <Link
            href="/"
            className="mt-6 inline-block text-[11px] uppercase tracking-[0.18em] underline underline-offset-4"
          >
            Weiter stöbern
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
          <ul>
            {items.map((item) => (
              <li
                key={`${item.productId}-${item.size ?? ""}`}
                className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 border-t border-neutral-200 py-5"
              >
                <Link href={`/product/${item.slug}`} className="relative aspect-[3/4] bg-[#f3f3f1]">
                  <ProductImageView
                    url={item.image}
                    alt=""
                    sizes="88px"
                    width={240}
                  />
                </Link>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link href={`/product/${item.slug}`} className="text-sm tracking-[0.03em]">
                        {item.name}
                      </Link>
                      <p className="mt-1 text-[11px] tracking-[0.14em] text-neutral-500">
                        {item.sku}
                      </p>
                      {item.size ? (
                        <p className="mt-2 text-[12px] text-neutral-600">Größe {item.size}</p>
                      ) : null}
                    </div>
                    <PriceDisplay
                      price={item.price}
                      originalPrice={item.originalPrice}
                      inquiry="Auf Anfrage"
                      className="shrink-0 text-right text-sm"
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center border border-neutral-300">
                      <button
                        type="button"
                        aria-label="Menge verringern"
                        onClick={() => setQuantity(item.productId, item.size, item.quantity - 1)}
                        className="h-9 w-9"
                      >
                        –
                      </button>
                      <span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Menge erhöhen"
                        onClick={() => setQuantity(item.productId, item.size, item.quantity + 1)}
                        className="h-9 w-9"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId, item.size)}
                      className="text-[11px] uppercase tracking-[0.14em] text-neutral-500"
                    >
                      Entfernen
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit border-t border-neutral-200 pt-6 lg:sticky lg:top-24 lg:border-t-0 lg:pt-0">
            {allPriced ? (
              <div className="mb-6 flex items-baseline justify-between">
                <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                  Summe
                </span>
                <span className="text-sm">{formatPrice(total)}</span>
              </div>
            ) : null}
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 w-full items-center justify-center bg-black px-6 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-neutral-800"
              >
                Über WhatsApp bestellen
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center bg-neutral-200 px-6 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500"
              >
                Über WhatsApp bestellen
              </button>
            )}
            {whatsappUrl ? (
              <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                Es wird eine Anfrage geöffnet. Es gibt keine Online-Zahlung.
              </p>
            ) : null}
            <div className="mt-6">
              {confirmClear ? (
                <div className="flex items-center gap-4 text-[11px] uppercase tracking-[0.14em]">
                  <span>Wirklich leeren?</span>
                  <button type="button" onClick={() => clear()} className="underline">
                    Ja
                  </button>
                  <button type="button" onClick={() => setConfirmClear(false)}>
                    Nein
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="text-[11px] uppercase tracking-[0.14em] text-neutral-500"
                >
                  Warenkorb leeren
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
