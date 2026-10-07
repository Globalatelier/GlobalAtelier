"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast";
import type { Product } from "@/types";

export function ProductPurchase({ product }: { product: Product }) {
  const { addItem } = useCart();
  const toast = useToast();
  const [size, setSize] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const hasSizes = product.sizes.length > 0;

  function addToCart() {
    if (!product.available) return;

    if (hasSizes && !size) {
      setHint("Bitte eine Größe wählen.");
      return;
    }

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      image: product.images[0]?.url ?? null,
      size,
      quantity: 1,
      price: product.price,
      originalPrice: product.originalPrice,
    });
    setHint(null);
    toast("In den Warenkorb gelegt");
  }

  return (
    <div className="mt-8">
      {hasSizes ? (
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Größe</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((option) => {
              const selected = size === option;

              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setSize(option);
                    setHint(null);
                  }}
                  className={`min-w-12 px-3 py-3 text-[12px] uppercase tracking-[0.12em] ${
                    selected ? "bg-black text-white" : "border border-neutral-300 text-black"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={addToCart}
        disabled={!product.available}
        className="mt-6 inline-flex h-12 w-full items-center justify-center bg-black px-6 text-[11px] font-medium uppercase tracking-[0.22em] text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
      >
        {product.available ? "In den Warenkorb" : "Ausverkauft"}
      </button>
      {hint ? <p className="mt-3 text-sm text-neutral-600">{hint}</p> : null}
    </div>
  );
}
