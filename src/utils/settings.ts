// Manages user profile and interface preferences across the app.

import { storage } from "@/utils/storageUtils";
import { supabase } from "@/integrations/supabase/client";

export type UserSettings = {
  theme: "light" | "dark" | "system";
  notifications: boolean;
  language: "en" | "ar" | "fr";
  savedDorms: string[];
  aiMemory: boolean;
};

const DEFAULT_SETTINGS: UserSettings = {
  theme: "system",
  notifications: true,
  language: "en",
  savedDorms: [],
  aiMemory: true,
};

const STORAGE_KEY = "roomy_user_settings";

export const settingsManager = {
  load(): UserSettings {
    return storage.get<UserSettings>(STORAGE_KEY, DEFAULT_SETTINGS);
  },

  save(newSettings: Partial<UserSettings>) {
    const current = storage.get<UserSettings>(STORAGE_KEY, DEFAULT_SETTINGS);
    const merged = { ...current, ...newSettings };
    storage.set(STORAGE_KEY, merged);
    return merged;
  },

  toggleTheme(): "light" | "dark" {
    const current = storage.get<UserSettings>(STORAGE_KEY, DEFAULT_SETTINGS);
    const newTheme = current.theme === "light" ? "dark" : "light";
    storage.set(STORAGE_KEY, { ...current, theme: newTheme });
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    return newTheme;
  },

  async syncWithSupabase(userId?: string) {
    if (!userId) return;
    const local = storage.get<UserSettings>(STORAGE_KEY, DEFAULT_SETTINGS);

    const { data: existing } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existing) {
      await supabase.from("user_settings").insert({
        user_id: userId,
        preferences: local,
      });
    } else {
      await supabase
        .from("user_settings")
        .update({ preferences: local })
        .eq("user_id", userId);
    }
  },

  async loadFromSupabase(userId?: string): Promise<UserSettings> {
    if (!userId) return DEFAULT_SETTINGS;
    const { data } = await supabase
      .from("user_settings")
      .select("preferences")
      .eq("user_id", userId)
      .maybeSingle();

    if (data?.preferences) {
      const settings = data.preferences as UserSettings;
      storage.set(STORAGE_KEY, settings);
      return settings;
    }

    return DEFAULT_SETTINGS;
  },
};
