const steps = [
  "Ware auswählen",
  "Nachricht abschicken",
  "Bilder erhalten",
  "Bestellung bestätigen",
];

export function OrderHero() {
  return (
    <section className="px-4 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-12 lg:px-10 lg:pt-16">
      <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Über den Warenkorb</p>
      <h1 className="mt-4 max-w-4xl font-serif text-[2.75rem] uppercase leading-[0.9] tracking-[0.03em] sm:text-6xl lg:text-7xl">
        Bestellung per WhatsApp
      </h1>
      <ol className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-black pt-5 sm:mt-10 sm:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step}>
            <p className="text-[11px] tabular-nums tracking-[0.18em] text-neutral-400">
              {String(index + 1).padStart(2, "0")}
            </p>
            <p className="mt-2 text-sm leading-snug">{step}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
