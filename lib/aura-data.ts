import { cache } from "react";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export type PublicAuraEntry = {
  handle: string;
  url: string;
  title: string;
  category: string;
  bid: number;
  initials: string;
  tone: string;
  clicks: number;
  age: string;
};

export const publicCategories = [
  {
    slug: "aura-pura",
    name: "Aura pura",
    description: "El ranking para quienes no necesitan explicar por qué tienen aura.",
  },
  {
    slug: "vibe",
    name: "Vibe",
    description: "Perfiles con una energía imposible de ignorar.",
  },
  {
    slug: "estilo",
    name: "Estilo",
    description: "Proyectos y personas que convierten presencia en identidad.",
  },
  {
    slug: "caos",
    name: "Caos",
    description: "La categoría para lo inexplicable, lo impredecible y lo memorable.",
  },
] as const;

export const demoEntries: PublicAuraEntry[] = [
  { handle: "lomitozen", url: "https://x.com/lomitozen", title: "Aura de boss final", category: "Aura pura", bid: 400, initials: "LZ", tone: "coral", clicks: 9744, age: "17 h" },
  { handle: "sofi.exe", url: "https://x.com/sofi.exe", title: "No dijo nada y ganó", category: "Vibe", bid: 300, initials: "SE", tone: "violet", clicks: 6401, age: "12 h" },
  { handle: "mateconhielo", url: "https://x.com/mateconhielo", title: "Energía de protagonista", category: "Estilo", bid: 200, initials: "MH", tone: "yellow", clicks: 3288, age: "9 h" },
  { handle: "el_bicho", url: "https://x.com/el_bicho", title: "Aura inexplicable", category: "Caos", bid: 100, initials: "EB", tone: "blue", clicks: 1802, age: "5 h" },
  { handle: "pancho2004", url: "https://x.com/pancho2004", title: "Tiene lore", category: "Aura pura", bid: 50, initials: "P2", tone: "mint", clicks: 744, age: "2 h" },
];

export function getCategoryBySlug(slug: string) {
  return publicCategories.find((category) => category.slug === slug);
}

export function getCategorySlug(name: string) {
  return publicCategories.find((category) => category.name === name)?.slug ?? "aura-pura";
}

export const getPublicEntries = cache(async (): Promise<PublicAuraEntry[]> => {
  const client = getSupabaseServerClient();
  if (!client) return demoEntries;

  const { data: season } = await client
    .from("seasons")
    .select("id")
    .eq("slug", "season-01")
    .maybeSingle();

  if (!season) return demoEntries;

  const { data, error } = await client
    .from("aura_entries")
    .select("handle, target_url, title, category, bid_points, initials, tone, clicks, age_label")
    .eq("season_id", season.id)
    .order("bid_points", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(50);

  if (error || !data?.length) return demoEntries;

  return data.map((row) => ({
    handle: row.handle,
    url: row.target_url,
    title: row.title,
    category: row.category,
    bid: row.bid_points,
    initials: row.initials,
    tone: row.tone,
    clicks: row.clicks,
    age: row.age_label,
  }));
});

export async function getPublicEntry(handle: string) {
  const entries = await getPublicEntries();
  const normalized = decodeURIComponent(handle).replace(/^@+/, "").toLowerCase();
  const entry = entries.find((item) => item.handle.toLowerCase() === normalized);
  if (!entry) return null;

  return {
    entry,
    rank: entries.findIndex((item) => item.handle.toLowerCase() === normalized) + 1,
    totalEntries: entries.length,
  };
}
