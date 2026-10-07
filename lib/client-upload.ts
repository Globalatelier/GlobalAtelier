import type { ProductImage } from "@/types";

const MAX_BYTES = 10 * 1024 * 1024;

type NamedFile = {
  key: string;
  file: File;
};

export async function uploadNamedImages(
  files: NamedFile[],
  onProgress?: (done: number, total: number) => void,
) {
  const uploaded = new Map<string, ProductImage>();
  const failed: string[] = [];
  let done = 0;

  for (let index = 0; index < files.length; index += 40) {
    const signature = await uploadSignature();
    const chunk = files.slice(index, index + 40);
    let cursor = 0;

    async function worker() {
      while (cursor < chunk.length) {
        const current = chunk[cursor];
        cursor += 1;

        if (!current.file.type.startsWith("image/") || current.file.size > MAX_BYTES) {
          failed.push(current.file.name);
        } else {
          const image = await uploadOne(signature, current.file);

          if (image) uploaded.set(current.key, image);
          else failed.push(current.file.name);
        }

        done += 1;
        onProgress?.(done, files.length);
      }
    }

    await Promise.all(Array.from({ length: Math.min(4, chunk.length) }, () => worker()));
  }

  return { uploaded, failed };
}

async function uploadSignature() {
  const response = await fetch("/api/upload", { method: "POST" });
  const signature = (await response.json()) as {
    error?: string;
    timestamp?: number;
    signature?: string;
    folder?: string;
    apiKey?: string;
    cloudName?: string;
  };

  if (!response.ok || !signature.cloudName || !signature.apiKey || !signature.signature) {
    throw new Error(signature.error || "Upload ist gerade nicht möglich.");
  }

  return signature;
}

async function uploadOne(
  signature: {
    timestamp?: number;
    signature: string;
    folder?: string;
    apiKey: string;
    cloudName: string;
  },
  file: File,
) {
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", signature.apiKey);
  body.append("timestamp", String(signature.timestamp));
  body.append("signature", signature.signature);
  body.append("folder", signature.folder ?? "global-atelier");

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
      { method: "POST", body },
    );
    const payload = (await response.json().catch(() => null)) as {
      public_id?: string;
      secure_url?: string;
    } | null;

    if (!response.ok || !payload?.public_id || !payload.secure_url) return null;

    return { publicId: payload.public_id, url: payload.secure_url };
  } catch {
    return null;
  }
}
