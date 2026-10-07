"use client";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-16">
      <p className="font-serif text-3xl">Die Seite konnte nicht geladen werden.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 text-[11px] uppercase tracking-[0.16em] underline underline-offset-4"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
