"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/types";

export function Catalog({
  products,
  error,
  initialQuery,
  initialCategory,
}: {
  products: Product[];
  error: string | null;
  initialQuery: string;
  initialCategory: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [focused, setFocused] = useState(false);
  const timer = useRef<number | null>(null);
  const paramKey = `${initialQuery}\n${initialCategory}`;
  const [seenKey, setSeenKey] = useState(paramKey);

  if (seenKey !== paramKey) {
    setSeenKey(paramKey);
    setCategory(initialCategory);

    if (!focused) setQuery(initialQuery);
  }

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => product.category)
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((a, b) => a.localeCompare(b, "de"));
  }, [products]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return products.filter((product) => {
      if (category && product.category !== category) return false;
      if (!needle) return true;

      return [product.name, product.sku, product.brand ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [products, query, category]);

  function syncUrl(nextQuery: string, nextCategory: string) {
    if (timer.current) window.clearTimeout(timer.current);

    timer.current = window.setTimeout(() => {
      const params = new URLSearchParams();
      const trimmed = nextQuery.trim();

      if (trimmed) params.set("q", trimmed);
      if (nextCategory) params.set("category", nextCategory);

      router.replace(params.size ? `/?${params.toString()}` : "/", { scroll: false });
    }, 250);
  }

  function onQueryChange(value: string) {
    setQuery(value);
    syncUrl(value, category);
  }

  function onCategoryChange(value: string) {
    setCategory(value);
    syncUrl(query, value);
  }

  return (
    <section className="px-4 pb-16 sm:px-6 lg:px-10">
      <div id="suche">
        <label className="block border-b border-black">
          <span className="sr-only">Suche</span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Name, Artikelnummer oder Marke"
            className="w-full bg-transparent py-3 text-base outline-none placeholder:text-neutral-400 md:text-sm"
          />
        </label>
      </div>

      <div className="mt-5 flex items-end justify-between gap-6">
        <div className="flex gap-5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryButton active={!category} onClick={() => onCategoryChange("")}>
            Alle
          </CategoryButton>
          {categories.map((item) => (
            <CategoryButton
              key={item}
              active={category === item}
              onClick={() => onCategoryChange(item)}
            >
              {item}
            </CategoryButton>
          ))}
        </div>
        <p className="hidden shrink-0 text-[11px] uppercase tracking-[0.16em] text-neutral-500 sm:block">
          {filtered.length} {filtered.length === 1 ? "Produkt" : "Produkte"}
        </p>
      </div>

      {error ? (
        <p className="py-24 text-center font-serif text-4xl">Gerade nicht erreichbar</p>
      ) : filtered.length === 0 ? (
        <EmptyState query={query.trim()} hasProducts={products.length > 0} />
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4">
          {filtered.map((product, index) => (
            <li key={product.id}>
              <ProductCard product={product} priority={index < 2} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CategoryButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 border-b pb-1 text-[11px] uppercase tracking-[0.18em] ${
        active ? "border-black text-black" : "border-transparent text-neutral-400"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ query, hasProducts }: { query: string; hasProducts: boolean }) {
  if (!hasProducts) {
    return (
      <div className="py-24 text-center">
        <p className="font-serif text-4xl">Noch keine Stücke</p>
      </div>
    );
  }

  return (
    <div className="py-24 text-center">
      <p className="font-serif text-4xl">Keine Treffer</p>
      <p className="mx-auto mt-3 max-w-sm text-sm text-neutral-500">
        Für „{query || "diese Auswahl"}“ gibt es gerade nichts.
      </p>
    </div>
  );
}
