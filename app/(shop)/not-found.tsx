import Link from "next/link";

export default function NotFound() {
  return (
    <div className="px-4 py-24 text-center">
      <p className="font-serif text-4xl">Seite nicht gefunden</p>
      <Link
        href="/"
        className="mt-6 inline-block text-[11px] uppercase tracking-[0.18em] underline underline-offset-4"
      >
        Zum Katalog
      </Link>
    </div>
  );
}
