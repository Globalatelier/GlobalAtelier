import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Einstellungen",
};

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <h1 className="font-serif text-4xl md:text-5xl">Einstellungen</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-500">
        Diese Angaben steuern Name, Instagram-Link und die WhatsApp-Bestellung im Shop.
      </p>
      <div className="mt-10">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
