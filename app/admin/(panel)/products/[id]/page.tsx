import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { getFacets, getProducts } from "@/lib/products";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Produkt bearbeiten",
};

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const [{ products }, facets] = await Promise.all([getProducts(), getFacets()]);
  const product = products.find((item) => item.id === id);

  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/products" className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
        Produkte
      </Link>
      <p className="mt-6 text-[11px] uppercase tracking-[0.18em] text-neutral-500">Artikelnummer</p>
      <h1 className="mt-2 font-serif text-5xl tracking-[0.06em]">{product.sku}</h1>
      <p className="mt-3 max-w-xl text-sm text-neutral-500">
        {product.name}. Die Artikelnummer bleibt beim Bearbeiten bestehen.
      </p>
      <div className="mt-10">
        <ProductForm product={product} categories={facets.categories} brands={facets.brands} />
      </div>
    </div>
  );
}
