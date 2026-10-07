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
  error: string | null;
} {
  const table = parseCsv(text);

  if (table.length === 0) {
    return { rows: [], errors: [], error: "Die Datei ist leer." };
  }

  const header = table[0].map(normalizeHeader);
  const columns = new Map<Field, number>();

  header.forEach((name, index) => {
    const field = HEADER_FIELDS[name as keyof typeof HEADER_FIELDS];

    if (field && !columns.has(field)) columns.set(field, index);
  });

  if (!columns.has("name")) {
    return {
      rows: [],
      errors: [],
      error: "Die erste Zeile braucht die Spalte Name.",
    };
  }

  const dataRows = table.slice(1);

  if (dataRows.length > 600) {
    return {
      rows: [],
      errors: [],
      error: "Maximal 600 Produkte pro Datei.",
    };
  }

  const rows: ImportDraft[] = [];
  const errors: ImportIssue[] = [];

  dataRows.forEach((cells, index) => {
    const row = index + 2;
    const name = cell(cells, columns.get("name")).trim();

    if (!name) {
      errors.push({ row, message: "Der Name fehlt." });
      return;
    }

    const price = parseMoney(cell(cells, columns.get("price")));
    const originalPrice = parseMoney(cell(cells, columns.get("originalPrice")));

    if (price === "invalid") {
      errors.push({ row, message: `„${name}“ hat einen ungültigen Preis.` });
      return;
    }

    if (originalPrice === "invalid") {
      errors.push({ row, message: `„${name}“ hat einen ungültigen Originalpreis.` });
      return;
    }

    const manufacturerRaw = cell(cells, columns.get("manufacturerUrl"));
    const manufacturerUrl = manufacturerRaw ? safeExternalUrl(manufacturerRaw) : null;

    if (manufacturerRaw && !manufacturerUrl) {
      errors.push({
        row,
        message: `„${name}“ braucht einen Herstellerlink mit http:// oder https://.`,
      });
      return;
    }

    const available = parseAvailable(cell(cells, columns.get("available")));

    if (available === "invalid") {
      errors.push({ row, message: `„${name}“ hat einen ungültigen Wert bei verfuegbar.` });
      return;
    }

    const rawImages = splitImages(cell(cells, columns.get("imageUrls")));
    const invalidImage = rawImages.find((value) => imageRefProblem(value));

    if (invalidImage) {
      errors.push({ row, message: `„${name}“ enthält einen ungültigen Bildeintrag.` });
      return;
    }

    rows.push({
      row,
      name,
      price,
      originalPrice,
      brand: optionalText(cell(cells, columns.get("brand"))),
      category: optionalText(cell(cells, columns.get("category"))),
      sizes: splitSizes(cell(cells, columns.get("sizes"))),
      manufacturerUrl,
      imageUrls: rawImages,
      available,
    });
  });

  if (rows.length === 0 && errors.length === 0) {
    return { rows, errors, error: "Die Datei enthält keine Produkte." };
  }

  return { rows, errors, error: null };
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
