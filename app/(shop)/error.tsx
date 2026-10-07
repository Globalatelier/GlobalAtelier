"use client";

export default function ShopError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="px-4 py-24 text-center">
      <p className="font-serif text-4xl">Etwas ist schiefgelaufen.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 text-[11px] uppercase tracking-[0.18em] underline underline-offset-4"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
