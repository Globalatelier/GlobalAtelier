"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { BagIcon, InstagramIcon, SearchIcon } from "@/components/icons";

export function Header({
  shopName,
  instagramUrl,
}: {
  shopName: string;
  instagramUrl: string;
}) {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
      <div className="flex h-14 items-center gap-4 px-4 md:h-16 md:px-8 lg:px-10">
        <Link
          href="/"
          className="max-w-[42vw] truncate font-serif text-[13px] uppercase tracking-[0.2em] md:max-w-[16rem] md:text-sm md:tracking-[0.24em]"
        >
          {shopName}
        </Link>
        <div className="hidden min-w-0 flex-1 md:mx-6 md:block md:max-w-md">
          <SearchForm />
        </div>
        <div className="ml-auto flex items-center gap-4 md:gap-5">
          <button
            type="button"
            className="md:hidden"
            aria-label={open ? "Suche schließen" : "Suche öffnen"}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            <SearchIcon />
          </button>
          {instagramUrl ? (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-neutral-950"
            >
              <InstagramIcon />
            </a>
          ) : null}
          <Link href="/cart" aria-label={`Warenkorb, ${count} Artikel`} className="relative">
            <BagIcon />
            {count > 0 ? (
              <span className="absolute -right-2.5 -top-2 text-[10px] tabular-nums">
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
      {open ? (
        <div className="border-t border-neutral-200 px-4 py-3 md:hidden">
          <SearchForm />
        </div>
      ) : null}
    </header>
  );
}

function SearchForm() {
  return (
    <form action="/" method="get">
      <label className="flex items-center gap-2 border-b border-neutral-300 focus-within:border-black">
        <SearchIcon className="h-4 w-4 shrink-0 text-neutral-500" />
        <span className="sr-only">Suche</span>
        <input
          name="q"
          placeholder="Suche"
          className="w-full bg-transparent py-2 text-base outline-none placeholder:text-neutral-400 md:text-sm"
        />
      </label>
    </form>
  );
}
