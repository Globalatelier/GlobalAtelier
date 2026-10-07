"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { deleteProduct } from "@/app/admin/actions";
import { PriceDisplay } from "@/components/price-display";
import { productImage } from "@/lib/images";
import type { Product } from "@/types";

export function ProductTable({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p className="mt-16 text-sm text-neutral-500">Noch keine Produkte.</p>;
  }

  return (
    <div className="mt-8 border-t border-neutral-200">
      <div className="hidden grid-cols-[72px_1.4fr_0.7fr_0.7fr_0.8fr_0.7fr_auto] gap-4 py-3 text-[10px] uppercase tracking-[0.16em] text-neutral-400 md:grid">
        <span>Bild</span>
        <span>Name</span>
        <span>Artikelnummer</span>
        <span>Preis</span>
        <span>Kategorie</span>
        <span>Status</span>
        <span />
      </div>
      <ul>
        {products.map((product) => (
          <li
            key={product.id}
            className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 border-t border-neutral-200 py-4 md:grid-cols-[72px_1.4fr_0.7fr_0.7fr_0.8fr_0.7fr_auto] md:items-center md:gap-4"
          >
            <div className="relative h-20 w-[72px] bg-[#f3f3f1]">
              {product.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={productImage(product.images[0].url, 200)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 md:contents">
              <div className="min-w-0">
                <p className="truncate text-sm">{product.name}</p>
                <p className="mt-1 text-[11px] tracking-[0.12em] text-neutral-500 md:hidden">
                  {product.sku}
                </p>
              </div>
              <p className="hidden text-sm tracking-[0.08em] md:block">{product.sku}</p>
              <PriceDisplay
                price={product.price}
                originalPrice={product.originalPrice}
                className="mt-2 text-sm md:mt-0"
              />
              <p className="mt-1 text-sm text-neutral-600 md:mt-0">{product.category ?? "—"}</p>
              <p className="mt-1 text-sm md:mt-0">{product.available ? "Verfügbar" : "Ausverkauft"}</p>
              <div className="mt-3 flex items-center gap-4 md:mt-0 md:justify-end">
                <Link href={`/admin/products/${product.id}`} className="text-[11px] uppercase tracking-[0.14em]">
                  Bearbeiten
                </Link>
                <DeleteProductButton id={product.id} name={product.name} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    const result = await deleteProduct(id);

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    dialogRef.current?.close();
    setPending(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="text-[11px] uppercase tracking-[0.14em] text-neutral-500"
      >
        Löschen
      </button>
      <dialog ref={dialogRef} className="w-[min(92vw,24rem)] p-6">
        <p className="font-serif text-3xl">Produkt löschen</p>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          „{name}“ wird unwiderruflich entfernt.
        </p>
        {error ? <p className="mt-3 text-sm">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="h-10 px-4 text-[11px] uppercase tracking-[0.14em]"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={pending}
            className="h-10 bg-black px-4 text-[11px] uppercase tracking-[0.14em] text-white disabled:bg-neutral-300"
          >
            {pending ? "Löscht…" : "Löschen"}
          </button>
        </div>
      </dialog>
    </>
  );
}
