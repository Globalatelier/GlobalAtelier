"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { importProducts } from "@/app/admin/actions";
import { parseProductImport, type ImportDraft, type ImportIssue } from "@/lib/import";

type ImportResult = {
  created: { row: number; name: string; sku: string }[];
  failed: { row: number; name: string; message: string }[];
  warnings: { row: number; name: string; message: string }[];
};

export function ProductImport() {
  const router = useRouter();
  const [rows, setRows] = useState<ImportDraft[]>([]);
  const [issues, setIssues] = useState<ImportIssue[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function onFile(file: File | null) {
    setRows([]);
    setIssues([]);
    setFileError(null);
    setError(null);
    setResult(null);
    setFileName(file?.name ?? null);

    if (!file) return;

    const text = await file.text();
    const parsed = parseProductImport(text);

    setRows(parsed.rows);
    setIssues(parsed.errors);
    setFileError(parsed.error);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (rows.length === 0) return;

    setPending(true);
    setError(null);

    const response = await importProducts(rows);

    if ("created" in response && Array.isArray(response.created)) {
      setResult({
        created: response.created,
        failed: response.failed ?? [],
        warnings: response.warnings ?? [],
      });
      setRows([]);
      setPending(false);
      router.refresh();
      return;
    }

    setError(
      "error" in response && typeof response.error === "string"
        ? response.error
        : "Import fehlgeschlagen.",
    );
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl">
      <p className="max-w-xl text-sm leading-relaxed text-neutral-600">
        Dieselben Felder wie beim Produkt. Eine Zeile ist ein Artikel. Größen mit Komma
        trennen, zum Beispiel S, M, L. Die Artikelnummer entsteht beim Import.
      </p>
      <p className="mt-4 text-[11px] uppercase leading-relaxed tracking-[0.14em] text-neutral-500">
        Name, Originalpreis, Unser Preis, Herstellerlink, Marke, Kategorie, Größen, Bilder,
        Verfügbar
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
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => void onFile(event.target.files?.[0] ?? null)}
          className="mt-3 block w-full text-sm"
        />
      </label>

      {fileName ? <p className="mt-3 text-sm text-neutral-500">{fileName}</p> : null}
      {fileError ? <p className="mt-4 text-sm">{fileError}</p> : null}

      {rows.length > 0 ? (
        <div className="mt-8">
          <p className="text-sm">
            {rows.length} {rows.length === 1 ? "Produkt" : "Produkte"} bereit
            {issues.length > 0 ? `, ${issues.length} Zeilen werden übersprungen` : ""}.
          </p>
          <ul className="mt-4 border-t border-neutral-200">
            {rows.slice(0, 8).map((row) => (
              <li key={row.row} className="border-b border-neutral-200 py-3 text-sm">
                <span>{row.name}</span>
                {row.originalPrice != null ? (
                  <span className="ml-3 text-neutral-400 line-through">{row.originalPrice} €</span>
                ) : null}
                <span className="ml-3">{row.price == null ? "auf Anfrage" : `${row.price} €`}</span>
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
                <li key={`${item.row}-${item.message}`}>
                  Zeile {item.row}, {item.name}: {item.message}
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
        {pending ? "Importiert…" : "Importieren"}
      </button>
    </form>
  );
}
