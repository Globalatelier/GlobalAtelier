"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/auth";
import { destroyCloudinaryImage, uploadRemoteImage } from "@/lib/cloudinary";
import type { ImportDraft } from "@/lib/import";
import { sanitizeProductInput, toDatabaseProduct } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import type { ProductImage, ProductInput } from "@/types";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Bitte E-Mail und Passwort eingeben." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return { error: loginMessage(error.message) };
  } catch {
    return { error: "Supabase ist nicht konfiguriert." };
  }

  redirect("/admin/products");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function createProduct(input: ProductInput) {
  const supabase = await getAdminClient();

  if (!supabase) return { error: "Nicht angemeldet." };

  const sanitized = sanitizeProductInput(input);

  if ("error" in sanitized) return sanitized;

  const { data, error } = await supabase
    .from("products")
    .insert(toDatabaseProduct(sanitized.data))
    .select("id, sku")
    .single();

  if (error || !data) {
    return { error: productWriteError(error) };
  }

  revalidatePath("/", "layout");

  const row = data as { id: string; sku: string };

  return { id: row.id, sku: row.sku };
}

export async function updateProduct(id: string, input: ProductInput) {
  const supabase = await getAdminClient();

  if (!supabase) return { error: "Nicht angemeldet." };

  const sanitized = sanitizeProductInput(input);

  if ("error" in sanitized) return sanitized;

  const { data: existing, error: existingError } = await supabase
    .from("products")
    .select("images, slug")
    .eq("id", id)
    .maybeSingle();

  if (existingError || !existing) {
    return { error: "Das Produkt wurde nicht gefunden." };
  }

  const { error } = await supabase
    .from("products")
    .update(toDatabaseProduct(sanitized.data))
    .eq("id", id);

  if (error) return { error: productWriteError(error) };

  const previous = imageIds(existing);
  const next = new Set(sanitized.data.images.map((image) => image.publicId));
  const removed = previous.filter((publicId) => !next.has(publicId));

  await removeImages(removed);
  revalidatePath("/", "layout");

  return { ok: true };
}

export async function importProducts(rows: ImportDraft[]) {
  const supabase = await getAdminClient();

  if (!supabase) return { error: "Nicht angemeldet." };

  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: "Die Datei enthält keine Produkte." };
  }

  if (rows.length > 80) {
    return { error: "Maximal 80 Produkte pro Durchgang." };
  }

  const created: { row: number; name: string; sku: string }[] = [];
  const failed: { row: number; name: string; message: string }[] = [];
  const warnings: { row: number; name: string; message: string }[] = [];

  for (const [index, row] of rows.entries()) {
    const name = typeof row?.name === "string" ? row.name : "Produkt";
    const rowNumber = typeof row?.row === "number" ? row.row : index + 2;
    const provided = Array.isArray(row.images) ? row.images.filter(isProvidedImage) : [];
    const imageUrls = Array.isArray(row.imageUrls)
      ? row.imageUrls.filter((url) => typeof url === "string" && /^https?:\/\//i.test(url))
      : [];
    const images: ProductImage[] = [...provided];
    const room = Math.max(0, 8 - images.length);

    if (provided.length + imageUrls.length > 8) {
      warnings.push({
        row: rowNumber,
        name,
        message: "Es werden nur die ersten 8 Bilder übernommen.",
      });
    }

    for (const url of imageUrls.slice(0, room)) {
      const uploaded = await uploadRemoteImage(url);

      if ("error" in uploaded) {
        warnings.push({ row: rowNumber, name, message: uploaded.error });
        continue;
      }

      images.push(uploaded.image);
    }

    const sanitized = sanitizeProductInput({
      name,
      price: row.price ?? null,
      originalPrice: row.originalPrice ?? null,
      manufacturerUrl: row.manufacturerUrl ?? null,
      brand: row.brand ?? null,
      category: row.category ?? null,
      sizes: Array.isArray(row.sizes) ? row.sizes : [],
      images,
      available: row.available !== false,
    });

    if ("error" in sanitized) {
      await removeImages(images.map((image) => image.publicId));
      failed.push({ row: rowNumber, name, message: sanitized.error });
      continue;
    }

    const { data, error } = await supabase
      .from("products")
      .insert(toDatabaseProduct(sanitized.data))
      .select("sku")
      .single();

    if (error || !data) {
      await removeImages(images.map((image) => image.publicId));
      const message = productWriteError(error);
      failed.push({ row: rowNumber, name, message });

      if (message.includes("schema.sql")) break;

      continue;
    }

    created.push({
      row: rowNumber,
      name,
      sku: (data as { sku: string }).sku,
    });
  }

  if (created.length > 0) revalidatePath("/", "layout");

  return { created, failed, warnings };
}

export async function deleteProduct(id: string) {
  const supabase = await getAdminClient();

  if (!supabase) return { error: "Nicht angemeldet." };

  const { data: existing, error: existingError } = await supabase
    .from("products")
    .select("images")
    .eq("id", id)
    .maybeSingle();

  if (existingError || !existing) {
    return { error: "Das Produkt wurde nicht gefunden." };
  }

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) return { error: "Das Produkt konnte nicht gelöscht werden." };

  await removeImages(imageIds(existing));
  revalidatePath("/", "layout");

  return { ok: true };
}

export async function saveSettings(input: {
  shopName: string;
  whatsappNumber: string;
  instagramUrl: string;
}) {
  const supabase = await getAdminClient();

  if (!supabase) return { error: "Nicht angemeldet." };

  const shopName = input.shopName.trim();
  const whatsappNumber = input.whatsappNumber.trim();
  const instagramUrl = input.instagramUrl.trim();

  if (shopName.length < 2 || shopName.length > 80) {
    return { error: "Bitte einen Shopnamen angeben." };
  }

  if (whatsappNumber.length > 32) {
    return { error: "Die WhatsApp-Nummer ist zu lang." };
  }

  if (instagramUrl.length > 200) {
    return { error: "Die Instagram-URL ist zu lang." };
  }

  if (instagramUrl && !isHttpUrl(instagramUrl)) {
    return { error: "Bitte eine gültige Instagram-URL angeben." };
  }

  const { error } = await supabase
    .from("shop_settings")
    .update({
      shop_name: shopName,
      whatsapp_number: whatsappNumber,
      instagram_url: instagramUrl,
    })
    .eq("id", 1);

  if (error) return { error: "Die Einstellungen konnten nicht gespeichert werden." };

  revalidatePath("/", "layout");

  return { ok: true };
}

function imageIds(row: unknown) {
  const images = (row as { images?: unknown }).images;

  if (!Array.isArray(images)) return [];

  return images.flatMap((image) => {
    if (!image || typeof image !== "object") return [];

    const publicId = (image as { public_id?: unknown }).public_id;

    return typeof publicId === "string" ? [publicId] : [];
  });
}

async function removeImages(publicIds: string[]) {
  await Promise.all(
    publicIds.map(async (publicId) => {
      try {
        await destroyCloudinaryImage(publicId);
      } catch {
        // The product change already succeeded. Image cleanup stays isolated.
      }
    }),
  );
}

function isProvidedImage(value: ProductImage) {
  return (
    value != null &&
    typeof value.publicId === "string" &&
    typeof value.url === "string" &&
    value.publicId.length > 0 &&
    value.url.startsWith("https://")
  );
}

function productWriteError(error: { message?: string; code?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";

  if (
    error?.code === "PGRST204" ||
    error?.code === "42703" ||
    message.includes("original_price") ||
    message.includes("manufacturer_url")
  ) {
    return "Die Datenbank braucht ein Update. Führe supabase/schema.sql im Supabase SQL Editor erneut aus.";
  }

  return "Das Produkt konnte nicht gespeichert werden.";
}

function loginMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login") || normalized.includes("invalid credentials")) {
    return "E-Mail oder Passwort ist falsch.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Dieses Konto ist noch nicht bestätigt.";
  }

  return "Anmeldung fehlgeschlagen.";
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
