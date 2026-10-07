import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/auth";
import { createUploadSignature } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST() {
  const admin = await getAdminClient();

  if (!admin) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const signature = createUploadSignature();

  if (!signature) {
    return NextResponse.json(
      { error: "Cloudinary ist nicht konfiguriert." },
      { status: 500 },
    );
  }

  return NextResponse.json(signature, {
    headers: { "Cache-Control": "no-store" },
  });
}
