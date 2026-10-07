import { parseMoney } from "@/lib/money";
import { safeExternalUrl } from "@/lib/site";
import type { ProductImage } from "@/types";

export type ImportDraft = {
  row: number;
  name: string;
  price: number | null;
  originalPrice: number | null;
  brand: string | null;
  category: string | null;
  sizes: string[];
  manufacturerUrl: string | null;
  imageUrls: string[];
  images?: ProductImage[];
  available: boolean;
};

export type ImportIssue = {
  row: number;
  message: string;
};

const HEADER_FIELDS = {
  name: "name",
  produktname: "name",
  produkt: "name",
  preis: "price",
  price: "price",
  unser_preis: "price",
  originalpreis: "originalPrice",
  original_price: "originalPrice",
  original_preis: "originalPrice",
  uvp: "originalPrice",
  marke: "brand",
  brand: "brand",
  kategorie: "category",
  category: "category",
  groessen: "sizes",
  grossen: "sizes",
  sizes: "sizes",
  hersteller_url: "manufacturerUrl",
  herstellerlink: "manufacturerUrl",
  hersteller: "manufacturerUrl",
  manufacturer_url: "manufacturerUrl",
  bild_urls: "imageUrls",
  bilder: "imageUrls",
  image_urls: "imageUrls",
  images: "imageUrls",
  verfuegbar: "available",
  verfugbar: "available",
  available: "available",
} as const;

type Field = (typeof HEADER_FIELDS)[keyof typeof HEADER_FIELDS];

export function parseProductImport(text: string): {
  rows: ImportDraft[];
  errors: ImportIssue[];
  warnings: ImportIssue[];
  error: string | null;
} {
  const table = parseCsv(text);

  if (table.length === 0) {
    return { rows: [], errors: [], warnings: [], error: "Die Datei ist leer." };
  }

  const header = table[0].map(normalizeHeader);
  const columns = new Map<Field, number>();

  header.forEach((name, index) => {
    const field = HEADER_FIELDS[name as keyof typeof HEADER_FIELDS];

    if (field && !columns.has(field)) columns.set(field, index);
  });

  if (columns.size === 0) {
    return {
      rows: [],
      errors: [],
      warnings: [],
      error: "Die erste Zeile enthält keine bekannte Spalte.",
    };
  }

  const dataRows = table.slice(1);

  if (dataRows.length > 600) {
    return {
      rows: [],
      errors: [],
      warnings: [],
      error: "Maximal 600 Produkte pro Datei.",
    };
  }

  const rows: ImportDraft[] = [];
  const errors: ImportIssue[] = [];
  const warnings: ImportIssue[] = [];

  dataRows.forEach((cells, index) => {
    const row = index + 2;
    const label = cell(cells, columns.get("name")).trim() || `Zeile ${row}`;
    let name = cell(cells, columns.get("name")).trim();

    if (name.length > 160) {
      warnings.push({ row, message: `„${label}“ hat einen zu langen Namen. Er wird gekürzt.` });
      name = name.slice(0, 160).trim();
    }

    const parsedPrice = parseMoney(cell(cells, columns.get("price")));
    const parsedOriginal = parseMoney(cell(cells, columns.get("originalPrice")));
    const price = parsedPrice === "invalid" ? null : parsedPrice;
    const originalPrice = parsedOriginal === "invalid" ? null : parsedOriginal;

    if (parsedPrice === "invalid") {
      warnings.push({ row, message: `„${label}“ hat einen unlesbaren Preis. Das Feld bleibt leer.` });
    }

    if (parsedOriginal === "invalid") {
      warnings.push({ row, message: `„${label}“ hat einen unlesbaren Originalpreis. Das Feld bleibt leer.` });
    }

    const manufacturerRaw = cell(cells, columns.get("manufacturerUrl"));
    const manufacturerUrl = manufacturerRaw ? safeExternalUrl(manufacturerRaw) : null;

    if (manufacturerRaw && !manufacturerUrl) {
      warnings.push({
        row,
        message: `„${label}“ hat einen Herstellerlink ohne http:// oder https://. Das Feld bleibt leer.`,
      });
    }

    const parsedAvailable = parseAvailable(cell(cells, columns.get("available")));
    const available = parsedAvailable === "invalid" ? true : parsedAvailable;

    if (parsedAvailable === "invalid") {
      warnings.push({ row, message: `„${label}“ hat einen unlesbaren Verfügbar-Wert. Es gilt verfügbar.` });
    }

    const rawImages = splitImages(cell(cells, columns.get("imageUrls"))).filter((value) => {
      if (!imageRefProblem(value)) return true;

      warnings.push({ row, message: `„${label}“ enthält einen ungültigen Bildeintrag. Er wird ausgelassen.` });
      return false;
    });
    const brand = optionalText(cell(cells, columns.get("brand")));
    const category = optionalText(cell(cells, columns.get("category")));
    const sizes = splitSizes(cell(cells, columns.get("sizes")));
    const hasContent = Boolean(
      name ||
        price != null ||
        originalPrice != null ||
        brand ||
        category ||
        sizes.length ||
        manufacturerUrl ||
        rawImages.length,
    );

    if (!hasContent) {
      if (cells.some((value) => value.trim())) {
        warnings.push({ row, message: "Die Zeile enthält keine verwertbaren Angaben." });
      }

      return;
    }

    rows.push({
      row,
      name,
      price,
      originalPrice,
      brand,
      category,
      sizes,
      manufacturerUrl,
      imageUrls: rawImages,
      available,
    });
  });

  if (rows.length === 0 && warnings.length === 0) {
    return { rows, errors, warnings, error: "Die Datei enthält keine Produkte." };
  }

  return { rows, errors, warnings, error: null };
}

function parseCsv(text: string) {
  const input = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  if (!input.trim()) return [];

  const delimiter = chooseDelimiter(input.split("\n")[0] ?? "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (quoted) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }

      continue;
    }

    if (char === '"') {
      quoted = true;
      continue;
    }

    if (char === delimiter) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if (char === "\n") {
      row.push(cell.trim());

      if (row.some((value) => value !== "")) rows.push(row);

      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());

  if (row.some((value) => value !== "")) rows.push(row);

  return rows;
}

function chooseDelimiter(header: string) {
  const semicolons = header.split(";").length;
  const commas = header.split(",").length;

  return semicolons > commas ? ";" : ",";
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function cell(cells: string[], index: number | undefined) {
  if (index == null) return "";

  return cells[index] ?? "";
}

function optionalText(value: string) {
  const trimmed = value.trim();

  return trimmed || null;
}

function splitSizes(value: string) {
  return value
    .split(/\s*[,|/\n]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export type LocalImageFile = {
  key: string;
  name: string;
  directory: string;
};

export function planLocalImages(rows: ImportDraft[], files: LocalImageFile[]) {
  const byName = new Map<string, LocalImageFile[]>();

  files.forEach((file) => {
    [normalizeFile(file.name), normalizeFile(stripExtension(file.name))].forEach((key) => {
      const list = byName.get(key) ?? [];
      list.push(file);
      byName.set(key, list);
    });
  });

  const byDirectory = new Map<string, LocalImageFile[]>();

  files.forEach((file) => {
    const key = normalizeFile(file.directory);

    if (!key) return;

    const list = byDirectory.get(key) ?? [];
    list.push(file);
    byDirectory.set(key, list);
  });

  const used = new Set<string>();

  const plans = rows.map((row) => {
    const urls = row.imageUrls.filter((value) => safeExternalUrl(value));
    const names = row.imageUrls.filter((value) => !safeExternalUrl(value));
    const chosen: LocalImageFile[] = [];
    const missing: string[] = [];

    const take = (file: LocalImageFile | undefined) => {
      if (!file || chosen.some((item) => item.key === file.key)) return;

      chosen.push(file);
      used.add(file.key);
    };

    if (names.length > 0) {
      names.forEach((name) => {
        const match =
          byName.get(normalizeFile(name))?.[0] ??
          byName.get(normalizeFile(stripExtension(name)))?.[0];

        if (!match) missing.push(name);
        else take(match);
      });
    } else if (urls.length === 0) {
      const folder = (byDirectory.get(normalizeFile(row.name)) ?? [])
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "de"));

      if (folder.length > 0) folder.forEach(take);
      else autoFiles(row.name, files).forEach(take);
    }

    return {
      urls,
      files: chosen.slice(0, 8).map((file) => file.key),
      missing,
    };
  });

  return {
    plans,
    unused: files.filter((file) => !used.has(file.key)).map((file) => file.name),
  };
}

function autoFiles(productName: string, files: LocalImageFile[]) {
  const key = normalizeFile(productName);

  return files
    .filter((file) => {
      const base = normalizeFile(stripExtension(file.name));

      return base === key || new RegExp(`^${escapeRegExp(key)}[-_ ]\\d+$`).test(base);
    })
    .sort((a, b) => {
      const aExact = normalizeFile(stripExtension(a.name)) === key;
      const bExact = normalizeFile(stripExtension(b.name)) === key;

      if (aExact !== bExact) return aExact ? -1 : 1;

      return a.name.localeCompare(b.name, "de");
    });
}

function imageRefProblem(value: string) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return safeExternalUrl(value) ? null : "invalid";
  if (!value || value.length > 180 || /[\\/]/.test(value)) return "invalid";

  return null;
}

function stripExtension(value: string) {
  return value.replace(/\.[a-z0-9]+$/i, "");
}

function normalizeFile(value: string) {
  return value.trim().toLowerCase().normalize("NFC");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function splitImages(value: string) {
  return value
    .split(/\s*[|\n]\s*|\s*,\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseAvailable(value: string) {
  const normalized = value.trim().toLowerCase();

  if (!normalized || ["ja", "yes", "true", "1", "verfuegbar", "verfügbar"].includes(normalized)) {
    return true;
  }

  if (["nein", "no", "false", "0", "ausverkauft"].includes(normalized)) {
    return false;
  }

  return "invalid" as const;
}
