import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="py-16">
      <p className="font-serif text-3xl">Nicht gefunden</p>
      <Link href="/admin/products" className="mt-6 inline-block text-[11px] uppercase tracking-[0.16em] underline">
        Zurück zu den Produkten
      </Link>
    </div>
  );
}
