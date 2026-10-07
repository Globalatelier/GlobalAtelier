import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-sm tracking-[0.22em]">GLOBAL ATELIER</p>
      <h1 className="mt-6 font-serif text-4xl">Seite nicht gefunden</h1>
      <Link
        href="/"
        className="mt-6 text-[11px] uppercase tracking-[0.18em] underline underline-offset-4"
      >
        Zum Katalog
      </Link>
    </main>
  );
}
