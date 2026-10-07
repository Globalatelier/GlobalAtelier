"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { importProducts } from "@/app/admin/actions";
import { uploadNamedImages } from "@/lib/client-upload";
import {
  parseProductImport,
  planLocalImages,
  type ImportDraft,
  type ImportIssue,
  type LocalImageFile,
} from "@/lib/import";

type PickedImage = LocalImageFile & { file: File };

type ImportResult = {
  created: { row: number; name: string; sku: string }[];
  failed: { row: number; name: string; message: string }[];
  warnings: { row: number; name: string; message: string }[];
};

const BATCH = 40;

export function ProductImport() {
  const router = useRouter();
  const folderRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportDraft[]>([]);
  const [issues, setIssues] = useState<ImportIssue[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<PickedImage[]>([]);
  const [uploadLabel, setUploadLabel] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const plan = useMemo(
    () => planLocalImages(rows, imageFiles),
    [rows, imageFiles],
  );
  const withImages = plan.plans.filter((item) => item.files.length > 0 || item.urls.length > 0).length;

  async function readSheet(file: File) {
    setRows([]);
    setIssues([]);
    setFileError(null);
    setError(null);
    setResult(null);
    setFileName(file.name);

    const parsed = parseProductImport(await file.text());

    setRows(parsed.rows);
    setIssues(parsed.errors);
    setFileError(parsed.error);
  }

  async function onFolder(list: FileList | null) {
    const all = Array.from(list ?? []);
    const sheets = all
      .filter((file) => /\.csv$/i.test(file.name) && !file.name.startsWith("."))
      .sort((a, b) => scoreSheet(b.name) - scoreSheet(a.name));
    const images = all.filter(isImageFile).map((file) => ({
      key: file.webkitRelativePath || file.name,
      name: file.name,
      directory: parentDirectory(file.webkitRelativePath || file.name),
      file,
    }));

    setImageFiles(images);
    if (folderRef.current) folderRef.current.value = "";

    if (!sheets[0]) {
      setRows([]);
      setIssues([]);
      setFileName(null);
      setFileError("Im Ordner liegt keine CSV-Datei.");
      return;
    }

    await readSheet(sheets[0]);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (rows.length === 0) return;

    setPending(true);
    setError(null);
    setUploadLabel(null);

    const needed = new Set(plan.plans.flatMap((item) => item.files));
    let uploaded = new Map<string, { publicId: string; url: string }>();
    let failedUploads: string[] = [];

    try {
      const upload = await uploadNamedImages(
        imageFiles.filter((file) => needed.has(file.key)).map((file) => ({ key: file.key, file: file.file })),
        (done, total) => setUploadLabel(`Bilder ${done} von ${total}`),
      );
      uploaded = upload.uploaded;
      failedUploads = upload.failed;
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload fehlgeschlagen.");
      setPending(false);
      setUploadLabel(null);
      return;
    }

    const prepared = rows.map((row, index) => {
      const item = plan.plans[index];

      return {
        ...row,
        imageUrls: item?.urls ?? [],
        images: (item?.files ?? []).flatMap((key) => {
          const image = uploaded.get(key);
          return image ? [image] : [];
        }),
      };
    });

    const created: ImportResult["created"] = [];
    const failed: ImportResult["failed"] = [];
    const warnings: ImportResult["warnings"] = [];

    for (let index = 0; index < prepared.length; index += BATCH) {
      const slice = prepared.slice(index, index + BATCH);
      setUploadLabel(`Artikel ${Math.min(index + BATCH, prepared.length)} von ${prepared.length}`);
      const response = await importProducts(slice);

      if ("error" in response && response.error && !("created" in response)) {
        setError(response.error);
        break;
      }

      if ("created" in response && Array.isArray(response.created)) {
        created.push(...response.created);
        failed.push(...(response.failed ?? []));
        warnings.push(...(response.warnings ?? []));
      }
    }

    plan.plans.forEach((item, index) => {
      item.missing.forEach((name) => {
        warnings.push({
          row: rows[index]?.row ?? index + 2,
          name: rows[index]?.name ?? "Produkt",
          message: `Datei „${name}“ fehlt im Ordner.`,
        });
      });
    });
    failedUploads.forEach((name) => {
      warnings.push({ row: 0, name, message: "Das Bild konnte nicht hochgeladen werden." });
    });

    setResult({ created, failed, warnings });
    setUploadLabel(null);
    setPending(false);

    if (created.length > 0) {
      setRows([]);
      setImageFiles([]);
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl">
      <p className="max-w-xl text-sm leading-relaxed text-neutral-600">
        Ein Ordner für alles. Darin die CSV und pro Artikel ein Unterordner mit dem Produktnamen.
        In den Unterordner kommen die eigenen Fotos, der Dateiname ist egal. Bis zu 600 Artikel,
        acht Fotos pro Artikel. Das erste Foto nach Dateiname ist das Hauptbild.
      </p>
      <p className="mt-4 text-[11px] uppercase leading-relaxed tracking-[0.14em] text-neutral-500">
        Name, Originalpreis, Unser Preis, Herstellerlink, Marke, Kategorie, Größen, Verfügbar
      </p>
      <a
        href="/produkte-vorlage.csv"
        download
        className="mt-6 inline-flex h-11 items-center border border-black px-4 text-[11px] uppercase tracking-[0.16em]"
      >
        Vorlage herunterladen
      </a>

      <div className="mt-10">
        <button
          type="button"
          onClick={() => folderRef.current?.click()}
          className="inline-flex h-11 items-center bg-black px-4 text-[11px] uppercase tracking-[0.16em] text-white"
        >
          Ordner auswählen
        </button>
        <input
          ref={folderRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(event) => void onFolder(event.target.files)}
          {...{ webkitdirectory: "", directory: "" }}
        />
      </div>

      {fileName ? <p className="mt-4 text-sm text-neutral-500">{fileName}</p> : null}
      {imageFiles.length > 0 ? (
        <p className="mt-2 text-sm text-neutral-500">
          {imageFiles.length} {imageFiles.length === 1 ? "Bild" : "Bilder"} im Ordner
        </p>
      ) : null}
      {fileError ? <p className="mt-4 text-sm">{fileError}</p> : null}

      {rows.length > 0 ? (
        <div className="mt-8">
          <p className="text-sm">
            {rows.length} Artikel bereit, {withImages} mit Bildern
            {issues.length > 0 ? `, ${issues.length} Zeilen werden übersprungen` : ""}.
          </p>
          <ul className="mt-4 border-t border-neutral-200">
            {rows.slice(0, 8).map((row, index) => (
              <li key={row.row} className="flex items-baseline justify-between gap-4 border-b border-neutral-200 py-3 text-sm">
                <span className="truncate">{row.name}</span>
                <span className="shrink-0 text-neutral-500">
                  {plan.plans[index]?.files.length ?? 0} Bilder
                </span>
              </li>
            ))}
          </ul>
          {rows.length > 8 ? (
            <p className="mt-3 text-sm text-neutral-500">und {rows.length - 8} weitere</p>
          ) : null}
        </div>
      ) : null}

      {issues.length > 0 ? (
        <ul className="mt-6 space-y-2 text-sm text-neutral-700">
          {issues.slice(0, 12).map((issue) => (
            <li key={`${issue.row}-${issue.message}`}>Zeile {issue.row}: {issue.message}</li>
          ))}
        </ul>
      ) : null}

      {error ? <p className="mt-6 text-sm">{error}</p> : null}

      {result ? (
        <div className="mt-8 text-sm">
          <p>
            {result.created.length}{" "}
            {result.created.length === 1 ? "Produkt angelegt" : "Produkte angelegt"}.
          </p>
          {result.failed.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {result.failed.slice(0, 12).map((item) => (
                <li key={`${item.row}-${item.name}`}>
                  Zeile {item.row}, {item.name}: {item.message}
                </li>
              ))}
            </ul>
          ) : null}
          {result.warnings.length > 0 ? (
            <ul className="mt-4 space-y-2 text-neutral-600">
              {result.warnings.slice(0, 12).map((item) => (
                <li key={`${item.row}-${item.name}-${item.message}`}>
                  {item.row > 0 ? `Zeile ${item.row}, ` : ""}
                  {item.name}: {item.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending || rows.length === 0}
        className="mt-8 inline-flex h-12 items-center justify-center bg-black px-6 text-[11px] font-medium uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
      >
        {uploadLabel ? uploadLabel : pending ? "Importiert…" : "Importieren"}
      </button>
    </form>
  );
}

function scoreSheet(name: string) {
  if (/produkt|vorlage/i.test(name)) return 2;
  if (/^import/i.test(name)) return 1;
  return 0;
}

function isImageFile(file: File) {
  return file.type.startsWith("image/") || /\.(jpe?g|png|webp|avif)$/i.test(file.name);
}

function parentDirectory(path: string) {
  const parts = path.split("/").filter(Boolean);

  return parts.length > 1 ? parts[parts.length - 2] : "";
}
