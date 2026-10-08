import "server-only";

import { createHash } from "node:crypto";
import { largerImageCandidates } from "@/lib/images";

export const CLOUDINARY_FOLDER = "global-atelier";

const PUBLIC_ID = /^[A-Za-z0-9_/-]+$/;

function cloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) return null;

  return { cloudName, apiKey, apiSecret };
}

function sign(params: Record<string, string | number>, apiSecret: string) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1")
    .update(payload + apiSecret)
    .digest("hex");
}

export function isSafePublicId(value: string) {
  return (
    value.length > 0 &&
    value.length < 200 &&
    PUBLIC_ID.test(value) &&
    !value.includes("..")
  );
}

export function createUploadSignature() {
  const config = cloudinaryConfig();

  if (!config) return null;

  const timestamp = Math.round(Date.now() / 1000);
  const signature = sign(
    { folder: CLOUDINARY_FOLDER, timestamp },
    config.apiSecret,
  );

  return {
    timestamp,
    signature,
    folder: CLOUDINARY_FOLDER,
    apiKey: config.apiKey,
    cloudName: config.cloudName,
  };
}

type RemoteUpload =
  | { image: { publicId: string; url: string }; width: number }
  | { error: string };

async function imageByteLength(url: string) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return 0;

    const type = response.headers.get("content-type") ?? "";
    if (
      type &&
      !type.startsWith("image/") &&
      !type.startsWith("application/octet-stream")
    ) {
      return 0;
    }

    const length = Number(response.headers.get("content-length") || 0);
    return Number.isFinite(length) && length > 0 ? length : 1;
  } catch {
    return 0;
  }
}

async function postRemoteImage(
  fileUrl: string,
  hostname: string,
): Promise<RemoteUpload> {
  const config = cloudinaryConfig();

  if (!config) {
    return { error: "Cloudinary ist nicht konfiguriert. Das Produkt wird ohne dieses Bild angelegt." };
  }

  const timestamp = Math.round(Date.now() / 1000);
  const signature = sign(
    { folder: CLOUDINARY_FOLDER, timestamp },
    config.apiSecret,
  );
  const body = new FormData();

  body.append("file", fileUrl);
  body.append("folder", CLOUDINARY_FOLDER);
  body.append("timestamp", String(timestamp));
  body.append("api_key", config.apiKey);
  body.append("signature", signature);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
      { method: "POST", body, signal: AbortSignal.timeout(20000) },
    );
    const payload = (await response.json().catch(() => null)) as {
      public_id?: string;
      secure_url?: string;
      width?: number;
      error?: { message?: string };
    } | null;

    if (
      !response.ok ||
      !payload?.public_id ||
      !payload.secure_url ||
      !isSafePublicId(payload.public_id)
    ) {
      return { error: `Bild von ${hostname} konnte nicht übernommen werden.` };
    }

    return {
      image: {
        publicId: payload.public_id,
        url: payload.secure_url,
      },
      width: payload.width ?? 0,
    };
  } catch {
    return { error: `Bild von ${hostname} konnte nicht übernommen werden.` };
  }
}

export async function uploadRemoteImage(
  sourceUrl: string,
): Promise<RemoteUpload> {
  let parsed: URL;

  try {
    parsed = new URL(sourceUrl.trim());
  } catch {
    return { error: "Ein Bildlink ist ungültig." };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { error: "Ein Bildlink ist ungültig." };
  }

  const candidates = largerImageCandidates(parsed.toString()).filter((url) => {
    try {
      const candidate = new URL(url);
      return candidate.protocol === "https:" || candidate.protocol === "http:";
    } catch {
      return false;
    }
  });
  const lengths = await Promise.all(candidates.map((url) => imageByteLength(url)));
  const ranked = candidates
    .map((url, index) => ({ url, length: lengths[index] ?? 0 }))
    .sort((left, right) => right.length - left.length);
  const original = candidates[candidates.length - 1] ?? parsed.toString();
  const preferred = ranked.find((item) => item.length > 0)?.url ?? candidates[0] ?? original;
  const uploaded = await postRemoteImage(preferred, parsed.hostname);

  if ("error" in uploaded) {
    if (preferred === original) return uploaded;
    return postRemoteImage(original, parsed.hostname);
  }

  if (uploaded.width >= 800 || preferred === original) return uploaded;

  await destroyCloudinaryImage(uploaded.image.publicId);
  return postRemoteImage(original, parsed.hostname);
}

export async function destroyCloudinaryImage(publicId: string) {
  if (!isSafePublicId(publicId)) return false;

  const config = cloudinaryConfig();

  if (!config) return false;

  const timestamp = Math.round(Date.now() / 1000);
  const signature = sign({ public_id: publicId, timestamp }, config.apiSecret);
  const body = new URLSearchParams({
    public_id: publicId,
    api_key: config.apiKey,
    timestamp: String(timestamp),
    signature,
  });

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`,
    { method: "POST", body },
  );

  return response.ok;
}
