import { Catalog } from "@/components/catalog";
import { getProducts } from "@/lib/products";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const [catalog, configured] = await Promise.all([
    getProducts(),
    Promise.resolve(isSupabaseConfigured()),
  ]);

  return (
    <div className="pt-6 sm:pt-10">
      <h1 className="sr-only">Katalog</h1>
      {configured ? (
        <Catalog
          products={catalog.products}
          error={catalog.error}
          initialQuery={typeof params.q === "string" ? params.q : ""}
          initialCategory={typeof params.category === "string" ? params.category : ""}
        />
      ) : (
        <Catalog products={[]} error={null} initialQuery="" initialCategory="" />
      )}
    </div>
  );
}
