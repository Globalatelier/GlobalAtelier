import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/nav";
import { getAdminClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s — Admin",
  },
  robots: { index: false, follow: false },
};

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminClient();

  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-dvh bg-white">
      <AdminNav />
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">{children}</div>
    </div>
  );
}
