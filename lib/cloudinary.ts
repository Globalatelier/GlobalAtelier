import "server-only";

import { createHash } from "node:crypto";

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

export async function uploadRemoteImage(
  sourceUrl: string,
): Promise<{ image: { publicId: string; url: string } } | { error: string }> {
  let parsed: URL;

  try {
    parsed = new URL(sourceUrl.trim());
  } catch {
    return { error: "Ein Bildlink ist ungültig." };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { error: "Ein Bildlink ist ungültig." };
  }

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

  body.append("file", parsed.toString());
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
      error?: { message?: string };
    } | null;

    if (
      !response.ok ||
      !payload?.public_id ||
      !payload.secure_url ||
      !isSafePublicId(payload.public_id)
    ) {
      return { error: `Bild von ${parsed.hostname} konnte nicht übernommen werden.` };
    }

    return {
      image: {
        publicId: payload.public_id,
        url: payload.secure_url,
      },
    };
  } catch {
    return { error: `Bild von ${parsed.hostname} konnte nicht übernommen werden.` };
  }
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
