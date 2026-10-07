import type { Metadata } from "next";
import Link from "next/link";
import { ProductImport } from "@/components/admin/product-import";

export const metadata: Metadata = {
  title: "Import",
};

export default function ImportPage() {
  return (
    <div>
      <Link href="/admin/products" className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
        Produkte
      </Link>
      <h1 className="mt-4 font-serif text-4xl md:text-5xl">Import</h1>
      <div className="mt-8">
        <ProductImport />
      </div>
    </div>
  );
}
