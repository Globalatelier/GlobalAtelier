import type { Metadata } from "next";
import Link from "next/link";
import { ProductTable } from "@/components/admin/product-table";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Produkte",
};

export default async function ProductsPage() {
  const { products, error } = await getProducts();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl">Produkte</h1>
          <p className="mt-2 text-sm text-neutral-500">{products.length} im Katalog</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/products/import"
            className="inline-flex h-11 items-center border border-black px-4 text-[11px] uppercase tracking-[0.16em]"
          >
            Importieren
          </Link>
          <Link
            href="/admin/products/new"
            className="inline-flex h-11 items-center bg-black px-4 text-[11px] uppercase tracking-[0.16em] text-white"
          >
            Produkt hinzufügen
          </Link>
        </div>
      </div>
      {error ? <p className="mt-8 text-sm text-neutral-700">{error}</p> : <ProductTable products={products} />}
    </div>
  );
}
