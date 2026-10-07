import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/auth";
import { destroyCloudinaryImage, isSafePublicId } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await getAdminClient();

  if (!admin) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { publicId?: unknown } | null;
  const publicId = body?.publicId;

  if (typeof publicId !== "string" || !isSafePublicId(publicId)) {
    return NextResponse.json({ error: "Ungültiges Bild." }, { status: 400 });
  }

  const removed = await destroyCloudinaryImage(publicId);

  if (!removed) {
    return NextResponse.json(
      { error: "Das Bild konnte nicht gelöscht werden." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
