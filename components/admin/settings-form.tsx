"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/app/admin/actions";
import { useToast } from "@/components/toast";
import type { ShopSettings } from "@/types";

export function SettingsForm({ settings }: { settings: ShopSettings }) {
  const router = useRouter();
  const toast = useToast();
  const [shopName, setShopName] = useState(settings.shopName);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [instagramUrl, setInstagramUrl] = useState(settings.instagramUrl);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await saveSettings({ shopName, whatsappNumber, instagramUrl });

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    toast("Gespeichert");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-8">
      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Shopname</span>
        <input
          required
          value={shopName}
          onChange={(event) => setShopName(event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
          WhatsApp-Nummer
        </span>
        <input
          value={whatsappNumber}
          onChange={(event) => setWhatsappNumber(event.target.value)}
          placeholder="491701234567"
          className={inputClass}
        />
        <span className="mt-2 block text-xs leading-relaxed text-neutral-500">
          Internationale Nummer ohne Plus, zum Beispiel 491701234567. Ohne Nummer bleibt der
          Bestellbutton deaktiviert.
        </span>
      </label>
      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Instagram</span>
        <input
          value={instagramUrl}
          onChange={(event) => setInstagramUrl(event.target.value)}
          placeholder="https://instagram.com/globalatelier"
          className={inputClass}
        />
      </label>
      {error ? <p className="text-sm text-neutral-700">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center bg-black text-[11px] font-medium uppercase tracking-[0.2em] text-white disabled:bg-neutral-200 disabled:text-neutral-500"
      >
        {pending ? "Speichert…" : "Speichern"}
      </button>
    </form>
  );
}

const inputClass =
  "mt-2 w-full border-b border-neutral-300 bg-transparent py-3 text-base outline-none focus:border-black md:text-sm";
