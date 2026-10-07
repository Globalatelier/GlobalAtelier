import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { getFacets } from "@/lib/products";

export const metadata: Metadata = {
  title: "Produkt hinzufügen",
};

export default async function NewProductPage() {
  const facets = await getFacets();

  return (
    <div>
      <Link href="/admin/products" className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
        Produkte
      </Link>
      <h1 className="mt-4 font-serif text-4xl md:text-5xl">Produkt hinzufügen</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-500">
        Die Artikelnummer wird beim Speichern automatisch erzeugt und danach nicht mehr verändert.
      </p>
      <div className="mt-10">
        <ProductForm categories={facets.categories} brands={facets.brands} />
      </div>
    </div>
  );
}
