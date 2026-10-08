"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { importProducts } from "@/app/admin/actions";
import { parseProductImport, type ImportDraft, type ImportIssue } from "@/lib/import";

type ImportResult = {
  created: { row: number; name: string; sku: string }[];
  failed: { row: number; name: string; message: string }[];
  warnings: { row: number; name: string; message: string }[];
};

const BATCH = 40;

export function ProductImport() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportDraft[]>([]);
  const [issues, setIssues] = useState<ImportIssue[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadLabel, setUploadLabel] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const withImages = rows.filter((row) => row.imageUrls.length > 0).length;

  async function onFile(file: File | null) {
    setRows([]);
    setIssues([]);
    setFileError(null);
    setError(null);
    setResult(null);
    setFileName(file?.name ?? null);
    if (fileRef.current) fileRef.current.value = "";

    if (!file) return;

    const parsed = parseProductImport(await file.text());

    setRows(parsed.rows);
    setIssues(parsed.warnings);
    setFileError(parsed.error);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (rows.length === 0) return;

    setPending(true);
    setError(null);
    setUploadLabel(null);

    const created: ImportResult["created"] = [];
    const failed: ImportResult["failed"] = [];
    const warnings: ImportResult["warnings"] = [];

    for (let index = 0; index < rows.length; index += BATCH) {
      const slice = rows.slice(index, index + BATCH);
      setUploadLabel(`Artikel ${Math.min(index + BATCH, rows.length)} von ${rows.length}`);
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

    setResult({ created, failed, warnings });
    setUploadLabel(null);
    setPending(false);

    if (created.length > 0) {
      setRows([]);
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl">
      <p className="max-w-xl text-sm leading-relaxed text-neutral-600">
        Eine CSV-Datei. Jedes Feld kann leer bleiben. Bildlinks stehen in der Spalte Bilder,
        mehrere Links mit Komma oder Senkrechtstrich trennen. Bis zu 600 Artikel, acht Bilder
        pro Artikel. Der erste Link wird das Hauptbild.
      </p>
      <p className="mt-4 text-[11px] uppercase leading-relaxed tracking-[0.14em] text-neutral-500">
        Name, Originalpreis, Unser Preis, Herstellerlink, Marke, Kategorie, Größen, Bilder, Verfügbar
      </p>
      <a
        href="/produkte-vorlage.csv"
        download
        className="mt-6 inline-flex h-11 items-center border border-black px-4 text-[11px] uppercase tracking-[0.16em]"
      >
        Vorlage herunterladen
      </a>

      <label className="mt-10 block">
        <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">CSV-Datei</span>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => void onFile(event.target.files?.[0] ?? null)}
          className="mt-3 block w-full text-sm"
        />
      </label>

      {fileName ? <p className="mt-4 text-sm text-neutral-500">{fileName}</p> : null}
      {fileError ? <p className="mt-4 text-sm">{fileError}</p> : null}

      {rows.length > 0 ? (
        <div className="mt-8">
          <p className="text-sm">
            {rows.length} Artikel bereit, {withImages} mit Bildlinks
            {issues.length > 0 ? `, ${issues.length} Hinweise` : ""}.
          </p>
          <ul className="mt-4 border-t border-neutral-200">
            {rows.slice(0, 8).map((row) => (
              <li key={row.row} className="flex items-baseline justify-between gap-4 border-b border-neutral-200 py-3 text-sm">
                <span className="truncate">{row.name || "Ohne Namen"}</span>
                <span className="shrink-0 text-neutral-500">
                  {row.imageUrls.length} {row.imageUrls.length === 1 ? "Bild" : "Bilder"}
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
