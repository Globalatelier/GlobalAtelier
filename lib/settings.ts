import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ShopSettings } from "@/types";

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: "Global Atelier",
  whatsappNumber: "",
  instagramUrl: "",
};

export const getSettings = cache(async (): Promise<ShopSettings> => {
  if (!isSupabaseConfigured()) return DEFAULT_SETTINGS;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shop_settings")
      .select("shop_name, whatsapp_number, instagram_url")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return DEFAULT_SETTINGS;

    const row = data as {
      shop_name?: string;
      whatsapp_number?: string;
      instagram_url?: string;
    };

    return {
      shopName: row.shop_name?.trim() || DEFAULT_SETTINGS.shopName,
      whatsappNumber: row.whatsapp_number?.trim() ?? "",
      instagramUrl: row.instagram_url?.trim() ?? "",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
});
