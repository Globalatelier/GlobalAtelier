import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getAdminClient } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Anmelden — Global Atelier",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const admin = await getAdminClient();

  if (admin) redirect("/admin/products");

  return <LoginForm configured={isSupabaseConfigured()} />;
}
