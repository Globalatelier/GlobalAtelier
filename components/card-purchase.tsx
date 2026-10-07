"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast";
import type { Product } from "@/types";

export function CardPurchase({ product }: { product: Product }) {
  const { addItem } = useCart();
  const toast = useToast();
  const [size, setSize] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const hasSizes = product.sizes.length > 0;

  if (!product.available) return null;

  function addToCart() {
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
    <div className="mt-3">
      {hasSizes ? (
        <div className="flex flex-wrap gap-1">
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
                className={`min-w-8 px-2 py-1 text-[11px] uppercase tracking-[0.08em] ${
                  selected ? "bg-black text-white" : "border border-neutral-300 text-black"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      ) : null}
      <button
        type="button"
        onClick={addToCart}
        className="mt-3 text-[11px] uppercase tracking-[0.16em] underline underline-offset-4"
      >
        In den Warenkorb
      </button>
      {hint ? <p className="mt-2 text-[12px] text-neutral-600">{hint}</p> : null}
    </div>
  );
}
