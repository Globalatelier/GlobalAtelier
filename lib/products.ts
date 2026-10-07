import "server-only";

import { cache } from "react";
import { safeExternalUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Product, ProductImage, ProductInput } from "@/types";

const PRODUCT_COLUMNS =
  "id, name, slug, sku, price, original_price, manufacturer_url, brand, category, sizes, images, available, created_at, updated_at";

export const getProducts = cache(async () => {
  if (!isSupabaseConfigured()) {
    return { products: [] as Product[], error: null as string | null };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .order("created_at", { ascending: false });

    if (error) {
      const missingTable =
        error.code === "PGRST205" || error.message.toLowerCase().includes("schema cache");

      const missingColumn =
        error.code === "PGRST204" ||
        error.message.toLowerCase().includes("original_price") ||
        error.message.toLowerCase().includes("manufacturer_url");

      return {
        products: [] as Product[],
        error: missingTable
          ? "Die Datenbank ist noch nicht eingerichtet. Führe supabase/schema.sql im Supabase SQL Editor aus."
          : missingColumn
            ? "Die Datenbank braucht ein Update. Führe supabase/schema.sql im Supabase SQL Editor erneut aus."
            : "Produkte konnten nicht geladen werden.",
      };
    }

    return {
      products: ((data ?? []) as unknown[]).map((row) =>
        mapProduct(row as Record<string, unknown>),
      ),
      error: null,
    };
  } catch {
    return {
      products: [] as Product[],
      error: "Produkte konnten nicht geladen werden.",
    };
  }
});

export const getProductBySlug = cache(async (slug: string) => {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;

    return mapProduct(data as Record<string, unknown>);
  } catch {
    return null;
  }
});

export async function getFacets() {
  const { products } = await getProducts();

  return {
    categories: uniqueValues(products.map((product) => product.category)),
    brands: uniqueValues(products.map((product) => product.brand)),
  };
}

export function sanitizeProductInput(
  input: ProductInput,
): { data: ProductInput } | { error: string } {
  const name = input.name.trim();

  if (name.length > 160) return { error: "Der Produktname ist zu lang." };

  let price: number | null = null;

  if (input.price != null) {
    if (!Number.isFinite(input.price) || input.price < 0 || input.price > 1_000_000) {
      return { error: "Bitte einen gültigen Preis angeben." };
    }

    price = Math.round(input.price * 100) / 100;
  }

  let originalPrice: number | null = null;

  if (input.originalPrice != null) {
    if (
      !Number.isFinite(input.originalPrice) ||
      input.originalPrice < 0 ||
      input.originalPrice > 1_000_000
    ) {
      return { error: "Bitte einen gültigen Originalpreis angeben." };
    }

    originalPrice = Math.round(input.originalPrice * 100) / 100;
  }

  const manufacturerUrl = cleanUrl(input.manufacturerUrl);

  if (manufacturerUrl === "invalid") {
    return { error: "Der Herstellerlink muss mit http:// oder https:// beginnen." };
  }

  const brand = cleanMeta(input.brand);
  const category = cleanMeta(input.category);

  if (brand === "invalid" || category === "invalid") {
    return { error: "Marke oder Kategorie ist zu lang." };
  }

  const sizes: string[] = [];

  for (const size of input.sizes) {
    const value = size.trim();

    if (!value || value.length > 16) continue;
    if (sizes.some((existing) => existing.toLowerCase() === value.toLowerCase())) {
      continue;
    }

    sizes.push(value);

    if (sizes.length > 40) {
      return { error: "Es sind zu viele Größen angegeben." };
    }
  }

  if (input.images.length > 12) {
    return { error: "Maximal 12 Bilder pro Produkt." };
  }

  const images: ProductImage[] = [];

  for (const image of input.images) {
    if (!isCloudinaryUrl(image.url) || !isSafeImageId(image.publicId)) {
      return { error: "Ein Bild ist ungültig. Bitte erneut hochladen." };
    }

    images.push({ publicId: image.publicId, url: image.url });
  }

  return {
    data: {
      name,
      price,
      originalPrice,
      manufacturerUrl,
      brand,
      category,
      sizes,
      images,
      available: input.available,
    },
  };
}

export function toDatabaseProduct(input: ProductInput) {
  return {
    name: input.name,
    price: input.price,
    original_price: input.originalPrice,
    manufacturer_url: input.manufacturerUrl,
    brand: input.brand,
    category: input.category,
    sizes: input.sizes,
    images: input.images.map((image) => ({
      public_id: image.publicId,
      url: image.url,
    })),
    available: input.available,
  };
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    sku: String(row.sku ?? ""),
    price: toPrice(row.price),
    originalPrice: toPrice(row.original_price),
    manufacturerUrl: toOptionalText(row.manufacturer_url),
    brand: toOptionalText(row.brand),
    category: toOptionalText(row.category),
    sizes: toSizes(row.sizes),
    images: toImages(row.images),
    available: Boolean(row.available),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

function toPrice(value: unknown) {
  if (value == null || value === "") return null;

  const number = typeof value === "number" ? value : Number(value);

  return Number.isFinite(number) ? number : null;
}

function toOptionalText(value: unknown) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  return trimmed || null;
}

function toSizes(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is string => typeof item === "string" && item.trim() !== "",
  );
}

function toImages(value: unknown): ProductImage[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const record = item as Record<string, unknown>;

    if (typeof record.public_id !== "string" || typeof record.url !== "string") {
      return [];
    }

    return [{ publicId: record.public_id, url: record.url }];
  });
}

function cleanUrl(value: string | null) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) return null;
  if (trimmed.length > 500) return "invalid" as const;

  return safeExternalUrl(trimmed) ?? ("invalid" as const);
}

function cleanMeta(value: string | null) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) return null;
  if (trimmed.length > 80) return "invalid" as const;

  return trimmed;
}

function isCloudinaryUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

function isSafeImageId(value: string) {
  return /^[A-Za-z0-9_/-]+$/.test(value) && !value.includes("..") && value.length < 200;
}

function uniqueValues(values: Array<string | null>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value))),
  ).sort((a, b) => a.localeCompare(b, "de"));
}
