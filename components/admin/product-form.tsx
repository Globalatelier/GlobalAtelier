"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/app/admin/actions";
import { ImageUploader, type EditableImage } from "@/components/admin/image-uploader";
import { useToast } from "@/components/toast";
import { parseMoney } from "@/lib/money";
import { safeExternalUrl } from "@/lib/site";
import type { Product, ProductInput } from "@/types";

const PRESETS = ["XS", "S", "M", "L", "XL", "XXL"];

export function ProductForm({
  product,
  categories,
  brands,
}: {
  product?: Product;
  categories: string[];
  brands: string[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(formatInputPrice(product?.price ?? null));
  const [originalPrice, setOriginalPrice] = useState(
    formatInputPrice(product?.originalPrice ?? null),
  );
  const [manufacturerUrl, setManufacturerUrl] = useState(product?.manufacturerUrl ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryOptions, setCategoryOptions] = useState(() =>
    uniqueOptions(categories, product?.category ?? null),
  );
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? []);
  const [sizeInput, setSizeInput] = useState("");
  const [images, setImages] = useState<EditableImage[]>(
    () => product?.images.map((image) => ({ ...image, persisted: true })) ?? [],
  );
  const [available, setAvailable] = useState(product?.available ?? true);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addSizes(raw: string) {
    const parts = raw
      .split(/[,;\n]+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) return;

    setSizes((current) => {
      const next = [...current];

      parts.forEach((part) => {
        if (part.length > 16) return;
        if (next.some((size) => size.toLowerCase() === part.toLowerCase())) return;
        next.push(part);
      });

      return next;
    });
    setSizeInput("");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedPrice = parseMoney(price);
    const parsedOriginal = parseMoney(originalPrice);
    const manufacturer = manufacturerUrl.trim();

    if (parsedPrice === "invalid") {
      setError("Bitte einen gültigen Preis angeben.");
      return;
    }

    if (parsedOriginal === "invalid") {
      setError("Bitte einen gültigen Originalpreis angeben.");
      return;
    }

    if (manufacturer && !safeExternalUrl(manufacturer)) {
      setError("Der Herstellerlink muss mit http:// oder https:// beginnen.");
      return;
    }

    const input: ProductInput = {
      name,
      price: parsedPrice,
      originalPrice: parsedOriginal,
      manufacturerUrl: manufacturer ? safeExternalUrl(manufacturer) : null,
      brand: brand.trim() || null,
      category: category.trim() || null,
      sizes,
      images: images.map(({ publicId, url }) => ({ publicId, url })),
      available,
    };

    setPending(true);
    setError(null);

    const result = product
      ? await updateProduct(product.id, input)
      : await createProduct(input);

    if ("error" in result && result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    if (!product && "id" in result && result.id) {
      router.push(`/admin/products/${result.id}`);
      router.refresh();
      return;
    }

    setPending(false);
    toast("Gespeichert");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-8">
      <Field label="Name" required>
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Originalpreis" hint="Wird durchgestrichen angezeigt, wenn er über eurem Preis liegt.">
        <input
          inputMode="decimal"
          value={originalPrice}
          onChange={(event) => setOriginalPrice(event.target.value)}
          placeholder="249 oder 249,50"
          className={inputClass}
        />
      </Field>

      <Field label="Unser Preis" hint="Leer lassen für Preis auf Anfrage.">
        <input
          inputMode="decimal"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="199 oder 199,50"
          className={inputClass}
        />
      </Field>

      <Field label="Herstellerlink" hint="Link zum Shop des Herstellers.">
        <input
          inputMode="url"
          value={manufacturerUrl}
          onChange={(event) => setManufacturerUrl(event.target.value)}
          placeholder="https://"
          className={inputClass}
        />
      </Field>

      <Field label="Marke">
        <input
          value={brand}
          onChange={(event) => setBrand(event.target.value)}
          list="brand-list"
          className={inputClass}
        />
        <datalist id="brand-list">
          {brands.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </Field>

      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Kategorie</p>
        {categoryOptions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {categoryOptions.map((item) => {
              const active = category.trim().toLowerCase() === item.toLowerCase();

              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(active ? "" : item)}
                  className={`px-3 py-2 text-[11px] uppercase tracking-[0.12em] ${
                    active ? "bg-black text-white" : "border border-neutral-300"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        ) : null}
        <div className="mt-4 flex gap-3">
          <input
            value={categoryInput}
            onChange={(event) => setCategoryInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCategory();
              }
            }}
            placeholder="Neue Kategorie"
            className={inputClass}
          />
          <button
            type="button"
            onClick={addCategory}
            className="shrink-0 text-[11px] uppercase tracking-[0.14em]"
          >
            Hinzufügen
          </button>
        </div>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Größen</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const active = sizes.some((size) => size.toLowerCase() === preset.toLowerCase());

            return (
              <button
                key={preset}
                type="button"
                onClick={() =>
                  setSizes((current) =>
                    active
                      ? current.filter((size) => size.toLowerCase() !== preset.toLowerCase())
                      : [...current, preset],
                  )
                }
                className={`min-w-12 px-3 py-2 text-[11px] uppercase tracking-[0.12em] ${
                  active ? "bg-black text-white" : "border border-neutral-300"
                }`}
              >
                {preset}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex gap-3">
          <input
            value={sizeInput}
            onChange={(event) => setSizeInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addSizes(sizeInput);
              }
            }}
            placeholder="z. B. 42 oder Einheitsgröße"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => addSizes(sizeInput)}
            className="shrink-0 text-[11px] uppercase tracking-[0.14em]"
          >
            Hinzufügen
          </button>
        </div>
        {sizes.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {sizes.map((size, index) => (
              <li key={size} className="flex items-center gap-2 border border-neutral-300 px-2 py-2 text-[12px]">
                <button type="button" aria-label={`${size} nach vorne`} onClick={() => moveSize(index, -1)} disabled={index === 0}>
                  ←
                </button>
                <span>{size}</span>
                <button
                  type="button"
                  aria-label={`${size} nach hinten`}
                  onClick={() => moveSize(index, 1)}
                  disabled={index === sizes.length - 1}
                >
                  →
                </button>
                <button type="button" aria-label={`${size} entfernen`} onClick={() => setSizes(sizes.filter((item) => item !== size))}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Bilder</p>
        <div className="mt-3">
          <ImageUploader images={images} onChange={setImages} onBusyChange={setUploading} />
        </div>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Verfügbarkeit</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setAvailable(true)}
            className={`h-11 text-[11px] uppercase tracking-[0.14em] ${
              available ? "bg-black text-white" : "border border-neutral-300"
            }`}
          >
            Verfügbar
          </button>
          <button
            type="button"
            onClick={() => setAvailable(false)}
            className={`h-11 text-[11px] uppercase tracking-[0.14em] ${
              !available ? "bg-black text-white" : "border border-neutral-300"
            }`}
          >
            Ausverkauft
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-neutral-700">{error}</p> : null}

      <button
        type="submit"
        disabled={pending || uploading}
        className="inline-flex h-12 w-full items-center justify-center bg-black px-6 text-[11px] font-medium uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
      >
        {pending ? "Speichert…" : uploading ? "Bilder werden hochgeladen…" : product ? "Speichern" : "Produkt anlegen"}
      </button>
    </form>
  );

  function addCategory() {
    const value = categoryInput.trim();

    if (!value || value.length > 80) return;

    setCategoryOptions((current) => uniqueOptions(current, value));
    setCategory(value);
    setCategoryInput("");
  }

  function moveSize(index: number, direction: -1 | 1) {
    setSizes((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
        {label}
        {required ? " *" : ""}
      </span>
      <span className="mt-2 block">{children}</span>
      {hint ? <span className="mt-2 block text-xs text-neutral-500">{hint}</span> : null}
    </label>
  );
}

const inputClass =
  "w-full border-b border-neutral-300 bg-transparent py-3 text-base outline-none focus:border-black md:text-sm";

function uniqueOptions(values: string[], extra: string | null) {
  const next = [...values];

  if (extra && !next.some((item) => item.toLowerCase() === extra.toLowerCase())) {
    next.push(extra);
  }

  return next.sort((a, b) => a.localeCompare(b, "de"));
}

function formatInputPrice(price: number | null) {
  if (price == null) return "";

  return String(price).replace(".", ",");
}
