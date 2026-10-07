"use client";

import { useRef, useState } from "react";
import { productImage } from "@/lib/images";
import type { ProductImage } from "@/types";

export type EditableImage = ProductImage & {
  persisted: boolean;
};

type PendingUpload = {
  id: string;
  name: string;
  progress: number;
};

const MAX_IMAGES = 12;
const MAX_BYTES = 10 * 1024 * 1024;

export function ImageUploader({
  images,
  onChange,
  onBusyChange,
}: {
  images: EditableImage[];
  onChange: (images: EditableImage[]) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (files.length === 0) return;

    if (images.length + files.length > MAX_IMAGES) {
      setError("Maximal 12 Bilder pro Produkt.");
      return;
    }

    const invalid = files.find(
      (file) => !file.type.startsWith("image/") || file.size > MAX_BYTES,
    );

    if (invalid) {
      setError("Bitte Bilder bis 10 MB verwenden.");
      return;
    }

    setError(null);
    onBusyChange(true);

    const queue = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      progress: 0,
      file,
    }));

    setPending(queue.map(({ id, name, progress }) => ({ id, name, progress })));

    try {
      const signatureResponse = await fetch("/api/upload", { method: "POST" });
      const signature = (await signatureResponse.json()) as {
        error?: string;
        timestamp?: number;
        signature?: string;
        folder?: string;
        apiKey?: string;
        cloudName?: string;
      };

      if (!signatureResponse.ok || !signature.cloudName || !signature.apiKey || !signature.signature) {
        throw new Error(signature.error || "Upload ist gerade nicht möglich.");
      }

      const collected = [...images];

      for (const item of queue) {
        const body = new FormData();
        body.append("file", item.file);
        body.append("api_key", signature.apiKey);
        body.append("timestamp", String(signature.timestamp));
        body.append("signature", signature.signature);
        body.append("folder", signature.folder ?? "global-atelier");

        const result = await uploadFile(
          `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
          body,
          (progress) => {
            setPending((current) =>
              current.map((entry) => (entry.id === item.id ? { ...entry, progress } : entry)),
            );
          },
        );

        collected.push({ publicId: result.publicId, url: result.url, persisted: false });
        onChange([...collected]);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload fehlgeschlagen.");
    } finally {
      setPending([]);
      onBusyChange(false);
    }
  }

  async function remove(image: EditableImage) {
    if (!image.persisted) {
      const response = await fetch("/api/upload/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: image.publicId }),
      });

      if (!response.ok) {
        setError("Das Bild konnte nicht gelöscht werden.");
        return;
      }
    }

    onChange(images.filter((item) => item.publicId !== image.publicId));
  }

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= images.length) return;

    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    onChange(next);
  }

  return (
    <div>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void onFiles(event.dataTransfer.files);
        }}
        className="border border-dashed border-neutral-300 px-4 py-8 text-center"
      >
        <p className="text-sm">Bilder hierher ziehen oder auswählen</p>
        <p className="mt-1 text-xs text-neutral-500">Mehrere Dateien gleichzeitig. Das erste Bild ist das Hauptbild.</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending.length > 0}
          className="mt-4 text-[11px] uppercase tracking-[0.16em] underline underline-offset-4 disabled:text-neutral-400"
        >
          Dateien wählen
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          onChange={(event) => void onFiles(event.target.files)}
        />
      </div>

      {pending.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {pending.map((item) => (
            <li key={item.id} className="text-xs text-neutral-600">
              <div className="flex justify-between gap-3">
                <span className="truncate">{item.name}</span>
                <span className="tabular-nums">{item.progress}%</span>
              </div>
              <div className="mt-1 h-px bg-neutral-200">
                <div className="h-px bg-black" style={{ width: `${item.progress}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <p className="mt-3 text-sm text-neutral-700">{error}</p> : null}

      {images.length > 0 ? (
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.publicId} className="border border-neutral-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={productImage(image.url, 400)}
                alt=""
                className="aspect-[3/4] w-full object-cover"
              />
              <div className="flex items-center justify-between px-2 py-2 text-[10px] uppercase tracking-[0.12em]">
                <span>{index === 0 ? "Hauptbild" : index + 1}</span>
                <span className="flex gap-2">
                  <button type="button" aria-label="Nach vorne" onClick={() => move(index, -1)} disabled={index === 0}>
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Nach hinten"
                    onClick={() => move(index, 1)}
                    disabled={index === images.length - 1}
                  >
                    ↓
                  </button>
                  <button type="button" aria-label="Bild entfernen" onClick={() => void remove(image)}>
                    ×
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function uploadFile(url: string, body: FormData, onProgress: (value: number) => void) {
  return new Promise<{ publicId: string; url: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onerror = () => reject(new Error("Upload fehlgeschlagen."));
    xhr.onload = () => {
      const payload = JSON.parse(xhr.responseText || "{}") as {
        public_id?: string;
        secure_url?: string;
        error?: { message?: string };
      };

      if (xhr.status >= 200 && xhr.status < 300 && payload.public_id && payload.secure_url) {
        resolve({ publicId: payload.public_id, url: payload.secure_url });
        return;
      }

      reject(new Error(payload.error?.message || "Upload fehlgeschlagen."));
    };
    xhr.send(body);
  });
}
