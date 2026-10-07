export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();

  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export function safeExternalUrl(value: string) {
  try {
    const url = new URL(value.trim());

    if (url.protocol !== "https:" && url.protocol !== "http:") return null;

    return url.toString();
  } catch {
    return null;
  }
}
