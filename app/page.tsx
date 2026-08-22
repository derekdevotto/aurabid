"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PayPalCheckout from "@/components/paypal-checkout";
import { supabase, supabaseConfigured } from "@/lib/supabase";

type IconName = "menu" | "moon" | "globe" | "chevron" | "grid" | "search" | "spark" | "arrow" | "external" | "clock" | "x" | "wallet" | "plus" | "chart" | "check" | "refresh";

type Entry = {
  id?: string;
  seasonId?: string;
  handle: string;
  url?: string;
  title: string;
  category: string;
  bid: number;
  initials: string;
  tone: string;
  clicks: number;
  age: string;
};

type Activity = {
  id?: string;
  seasonId?: string;
  handle: string;
  text: string;
  bid?: number;
  age: string;
};

type SavedState = {
  entries: Entry[];
  activities: Activity[];
  wallet: number;
  darkMode: boolean;
  locale: Locale;
};

type Locale = "es" | "en";

type Target = {
  handle: string;
  url: string;
  kind: "x" | "url";
};

const messages = {
  es: {
    leaderboard: "Leaderboard", categories: "Categorías", about: "About", rules: "Reglas", balance: "Saldo", online: "online", visitors: "visitantes desde el lanzamiento", stats: "ver estadísticas", claim: "Reclamá el #1 por", heroLead: "+100 aura por oferta.", heroBody: "Tus puntos deciden tu puesto; la oferta más alta se queda con el #1.", urlPlaceholder: "Tu URL de producto o @handle", existing: "¿Ya estás en la lista? Ingresá el mismo @handle y pagá solo la diferencia.", available: "Disponible", spent: "cada punto gastado queda registrado en la temporada", season: "TEMPORADA 01 / HOY", board: "El tablero de aura", resets: "se reinicia en", now: "#1 AHORA", active: "egos activos", verified: "aura en ofertas verificadas", noAlgorithm: "sin algoritmo · sin favoritos · solo ofertas", ruleKicker: "LA ÚNICA REGLA", manifesto: "Más arriba no significa mejor.", manifestoEm: "Solo significa que pagaste más.", manifestoBody: "Un leaderboard público para sitios, perfiles y proyectos con demasiado ego. El puesto #1 siempre está a una oferta de distancia.", activity: "ÚLTIMOS MOVIMIENTOS", live: "EN VIVO", rulesKicker: "REGLAS DEL TRONO", rulesTitle: "Así funciona el aura.", rule1: "Cargás puntos en tu saldo demo.", rule2: "Tu oferta total define tu lugar en el tablero.", rule3: "Para ser #1 tenés que superar la oferta actual por +100.", rule4: "Si repetís tu @handle, solo pagás la diferencia.", rule5: "La temporada se reinicia; el historial queda.", ruleNote: "El saldo y las ofertas se guardan en este navegador. No se procesa dinero real.", vaultKicker: "TU BÓVEDA", walletTitle: "Comprá aura.", availableBalance: "saldo disponible", add: "sumar", auraPoints: "aura points", addDemo: "Agregar en demo", resetDemo: "Reiniciar demo", simulatePay: "Simular pago", processing: "Procesando...", paymentSimulation: "SIMULACIÓN", paypalMode: "PAYPAL SANDBOX", paypalLive: "PAYPAL LIVE · PAGOS REALES", sandbox: "Sandbox de PayPal activo. Los puntos se acreditan después de la captura.", demo: "Simulación local activa: no se cobra dinero real.", statsKicker: "DATOS DE TEMPORADA", statsTitle: "El caos, medido.", activeEgos: "egos activos", auraGame: "aura en juego", visits: "visitas registradas", remaining: "restantes", statsNote: "Las estadísticas del MVP viven en tu navegador y se reinician si borrás la demo.", xDetected: "Perfil de X detectado", urlDetected: "Enlace detectado", invalidTarget: "Pegá @usuario, un perfil de X o una URL válida.", openLink: "Abrir enlace", outbid: "Outbid", seoKicker: "EXPLORÁ AURABID", seoTitle: "El ranking público de aura.", seoBody: "Descubrí perfiles, proyectos y egos que compiten por el puesto #1. Cada aura tiene una página pública para compartir.", seoLeaderboard: "Ver leaderboard completo", seoCategories: "Explorar categorías"
  },
  en: {
    leaderboard: "Leaderboard", categories: "Categories", about: "About", rules: "Rules", balance: "Balance", online: "online", visitors: "visitors since launch", stats: "see stats", claim: "Claim #1 for", heroLead: "+100 aura per offer.", heroBody: "Your points decide your place; the highest offer keeps the #1 spot.", urlPlaceholder: "Your product URL or @handle", existing: "Already listed? Enter the same @handle and pay only the difference.", available: "Available", spent: "every point spent is recorded for the season", season: "SEASON 01 / TODAY", board: "The aura board", resets: "resets in", now: "#1 NOW", active: "active egos", verified: "aura in verified offers", noAlgorithm: "no algorithm · no favorites · offers only", ruleKicker: "THE ONLY RULE", manifesto: "Higher does not mean better.", manifestoEm: "It only means you paid more.", manifestoBody: "A public leaderboard for sites, profiles and projects with too much ego. The #1 spot is always one offer away.", activity: "LATEST MOVES", live: "LIVE", rulesKicker: "THRONE RULES", rulesTitle: "How aura works.", rule1: "Load points into your demo balance.", rule2: "Your total offer decides your place on the board.", rule3: "To take #1, beat the current offer by +100.", rule4: "If you reuse your @handle, you only pay the difference.", rule5: "The season resets; the history stays.", ruleNote: "Balance and offers are stored in this browser. No real money is processed.", vaultKicker: "YOUR VAULT", walletTitle: "Buy aura.", availableBalance: "available balance", add: "add", auraPoints: "aura points", addDemo: "Add in demo", simulatePay: "Simulate payment", processing: "Processing...", paymentSimulation: "SIMULATION", paypalMode: "PAYPAL SANDBOX", paypalLive: "PAYPAL LIVE · REAL PAYMENTS", resetDemo: "Reset demo", sandbox: "PayPal sandbox is active. Points are credited after capture.", demo: "Local simulation active: no real money is charged.", statsKicker: "SEASON DATA", statsTitle: "Chaos, measured.", activeEgos: "active egos", auraGame: "aura in play", visits: "recorded visits", remaining: "remaining", statsNote: "MVP stats live in your browser and reset when you clear the demo.", xDetected: "X profile detected", urlDetected: "Link detected", invalidTarget: "Enter @username, an X profile, or a valid URL.", openLink: "Open link", outbid: "Outbid", seoKicker: "EXPLORE AURABID", seoTitle: "The public aura ranking.", seoBody: "Discover profiles, projects and egos competing for the #1 spot. Every aura gets a public page to share.", seoLeaderboard: "View full leaderboard", seoCategories: "Explore categories"
  }
} as const;

const categoryLabels: Record<Locale, Record<string, string>> = {
  es: { "Todo": "Todo", "Aura pura": "Aura pura", "Vibe": "Vibe", "Estilo": "Estilo", "Caos": "Caos" },
  en: { "Todo": "All", "Aura pura": "Pure aura", "Vibe": "Vibe", "Estilo": "Style", "Caos": "Chaos" },
};

const STORAGE_KEY = "aurabid:mvp:v4";
const CLOUD_SEASON_SLUG = "season-01";
const SEASON_DURATION = 15 * 60 * 60 + 34 * 60 + 22;
const categories = ["Todo", "Aura pura", "Vibe", "Estilo", "Caos"];
const auraPacks = [100, 500, 1000];

const initialEntries: Entry[] = [
  { handle: "lomitozen", url: "https://x.com/lomitozen", title: "Aura de boss final", category: "Aura pura", bid: 400, initials: "LZ", tone: "coral", clicks: 9744, age: "17 h" },
  { handle: "sofi.exe", url: "https://x.com/sofi.exe", title: "No dijo nada y ganó", category: "Vibe", bid: 300, initials: "SE", tone: "violet", clicks: 6401, age: "12 h" },
  { handle: "mateconhielo", url: "https://x.com/mateconhielo", title: "Energía de protagonista", category: "Estilo", bid: 200, initials: "MH", tone: "yellow", clicks: 3288, age: "9 h" },
  { handle: "el_bicho", url: "https://x.com/el_bicho", title: "Aura inexplicable", category: "Caos", bid: 100, initials: "EB", tone: "blue", clicks: 1802, age: "5 h" },
  { handle: "pancho2004", url: "https://x.com/pancho2004", title: "Tiene lore", category: "Aura pura", bid: 50, initials: "P2", tone: "mint", clicks: 744, age: "2 h" },
];

const initialActivity: Activity[] = [
  { handle: "sofi.exe", text: "superó a mateconhielo", bid: 300, age: "hace 11 seg" },
  { handle: "lomitozen", text: "defendió el puesto #1", bid: 400, age: "hace 42 seg" },
  { handle: "nacho.zip", text: "entró a la categoría Caos", bid: 100, age: "hace 1 min" },
];

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "menu") return <svg {...common}><path d="M4 7h16M4 12h11M4 17h7" /></svg>;
  if (name === "moon") return <svg {...common}><path d="M20.3 15.1A8.2 8.2 0 0 1 8.9 3.7 8.2 8.2 0 1 0 20.3 15.1Z" /></svg>;
  if (name === "globe") return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M3.7 12h16.6M12 3.5c2.2 2.3 3.2 5.1 3.2 8.5s-1 6.2-3.2 8.5c-2.2-2.3-3.2-5.1-3.2-8.5s1-6.2 3.2-8.5Z" /></svg>;
  if (name === "chevron") return <svg {...common}><path d="m7 9 5 5 5-5" /></svg>;
  if (name === "grid") return <svg {...common}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>;
  if (name === "search") return <svg {...common}><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.2 4.2" /></svg>;
  if (name === "spark") return <svg {...common}><path d="m12 3 1.5 6.5L20 11l-6.5 1.5L12 19l-1.5-6.5L4 11l6.5-1.5L12 3Z" /></svg>;
  if (name === "external") return <svg {...common}><path d="M14 5h5v5M19 5l-8 8" /><path d="M18 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" /></svg>;
  if (name === "clock") return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.2 2" /></svg>;
  if (name === "wallet") return <svg {...common}><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 16.5v-9Z" /><path d="M4 8h14.5a1.5 1.5 0 0 1 0 3H17" /><circle cx="17" cy="9.5" r=".7" fill="currentColor" stroke="none" /></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  if (name === "chart") return <svg {...common}><path d="M5 19V9M12 19V5M19 19v-7" /></svg>;
  if (name === "check") return <svg {...common}><path d="m5 12 4.5 4.5L19 7" /></svg>;
  if (name === "refresh") return <svg {...common}><path d="M20 11a8 8 0 0 0-14.7-3L4 10M4 5v5h5M4 13a8 8 0 0 0 14.7 3L20 14m0 5v-5h-5" /></svg>;
  if (name === "x") return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
  return <svg {...common}><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
}

function formatPoints(value: number) {
  return value.toLocaleString("en-US");
}

function formatTime(value: number) {
  const hours = Math.floor(value / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((value % 3600) / 60).toString().padStart(2, "0");
  const seconds = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function normalizeTarget(rawValue: string): Target | null {
  const value = rawValue.trim();
  if (!value) return null;

  const urlValue = /^https?:\/\//i.test(value)
    ? value
    : /^(www\.)?(x|twitter)\.com\//i.test(value)
      ? `https://${value}`
      : null;

  if (urlValue) {
    try {
      const parsed = new URL(urlValue);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
      const isX = host === "x.com" || host === "twitter.com" || host === "mobile.twitter.com";
      const firstSegment = parsed.pathname.split("/").filter(Boolean)[0]?.replace(/^@+/, "");
      if (isX) {
        if (!firstSegment || !/^[a-zA-Z0-9_]{1,15}$/.test(firstSegment)) return null;
        return { handle: firstSegment, url: parsed.toString(), kind: "x" };
      }
      const label = firstSegment || host.replace(/\./g, "-");
      return { handle: label.slice(0, 32), url: parsed.toString(), kind: "url" };
    } catch {
      return null;
    }
  }

  const cleanHandle = value
    .replace(/^@+/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_.-]/g, "")
    .replace(/^-+|-+$/g, "");
  if (!cleanHandle || cleanHandle.length > 32) return null;
  return { handle: cleanHandle, url: `https://x.com/${cleanHandle}`, kind: "x" };
}

function getTargetHost(url?: string) {
  try {
    return new URL(url || "https://x.com").hostname.replace(/^www\./, "");
  } catch {
    return "x.com";
  }
}

function mapCloudEntry(row: {
  id: string;
  season_id: string;
  handle: string;
  target_url: string;
  title: string;
  category: string;
  bid_points: number;
  clicks: number;
  initials: string;
  tone: string;
  age_label: string;
}): Entry {
  return {
    id: row.id,
    seasonId: row.season_id,
    handle: row.handle,
    url: row.target_url,
    title: row.title,
    category: row.category,
    bid: row.bid_points,
    initials: row.initials,
    tone: row.tone,
    clicks: row.clicks,
    age: row.age_label,
  };
}

function mapCloudActivity(row: {
  id: string;
  season_id: string;
  handle: string;
  activity_text: string;
  bid_points: number | null;
  age_label: string;
}): Activity {
  return {
    id: row.id,
    seasonId: row.season_id,
    handle: row.handle,
    text: row.activity_text,
    bid: row.bid_points ?? undefined,
    age: row.age_label,
  };
}

function Avatar({ entry }: { entry: Entry }) {
  const [iconFailed, setIconFailed] = useState(false);
  const host = getTargetHost(entry.url);
  const iconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;

  return <span className={`avatar avatar-site avatar-${entry.tone}`}>{iconFailed ? entry.initials : <Image src={iconUrl} alt="" width={30} height={30} unoptimized onError={() => setIconFailed(true)} />}</span>;
}

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [activities, setActivities] = useState<Activity[]>(initialActivity);
  const [selectedCategory, setSelectedCategory] = useState("Todo");
  const [bid, setBid] = useState(500);
  const [handle, setHandle] = useState("");
  const [category, setCategory] = useState("Aura pura");
  const [wallet, setWallet] = useState(1000);
  const [liveOnline, setLiveOnline] = useState(24);
  const [liveVisitors, setLiveVisitors] = useState(186);
  const [secondsLeft, setSecondsLeft] = useState(SEASON_DURATION);
  const [notice, setNotice] = useState("");
  const [showRules, setShowRules] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [simulatingPack, setSimulatingPack] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [locale, setLocale] = useState<Locale>("es");
  const [isReady, setIsReady] = useState(false);
  const [cloudSeasonId, setCloudSeasonId] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<"local" | "loading" | "connected">(supabaseConfigured ? "loading" : "local");

  const leader = entries[0];
  const copy = messages[locale];
  const visitorLabel = locale === "es" ? "visitantes únicos desde el lanzamiento" : "unique visitors since launch";
  const entryClickLabel = locale === "es" ? "clics" : "clicks";
  const statsNote = cloudStatus === "connected"
    ? (locale === "es" ? "Visitantes únicos de AuraBid, registrados por sesión en Supabase. Los clics de cada oferta son una métrica separada; Vercel Analytics usa su propio contador." : "AuraBid unique visitors, registered per session in Supabase. Clicks on each offer are a separate metric; Vercel Analytics uses its own counter.")
    : copy.statsNote;
  const categoryLabel = (category: string) => categoryLabels[locale][category] || category;
  const targetPreview = useMemo(() => normalizeTarget(handle), [handle]);
  const prospectiveRank = useMemo(() => entries.filter((entry) => entry.bid > bid).length + 1, [bid, entries]);
  const visibleEntries = useMemo(() => selectedCategory === "Todo" ? entries : entries.filter((entry) => entry.category === selectedCategory), [entries, selectedCategory]);
  const totalAura = entries.reduce((sum, entry) => sum + entry.bid, 0);
  const paypalConfigured = Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && !process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID.startsWith("your_"));
  const paypalProduction = process.env.NEXT_PUBLIC_PAYPAL_ENV === "production" || process.env.NEXT_PUBLIC_PAYPAL_ENV === "live";

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<SavedState>;
          if (!supabaseConfigured && Array.isArray(parsed.entries) && parsed.entries.length > 0) setEntries(parsed.entries.map((entry) => ({ ...entry, url: entry.url || `https://x.com/${entry.handle.replace(/^@+/, "")}` })));
          if (!supabaseConfigured && Array.isArray(parsed.activities)) setActivities(parsed.activities);
          if (typeof parsed.wallet === "number") setWallet(parsed.wallet);
          if (typeof parsed.darkMode === "boolean") setDarkMode(parsed.darkMode);
          if (parsed.locale === "es" || parsed.locale === "en") setLocale(parsed.locale);
        }
      } catch {
        setNotice("No se pudo restaurar la sesión demo; arrancamos una nueva.");
      } finally {
        setIsReady(true);
      }
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    const cloudClient = supabase;
    if (!cloudClient) return;
    let cancelled = false;

    async function loadCloudBoard() {
      if (!cloudClient) return;
      setCloudStatus("loading");
      const { data: season, error: seasonError } = await cloudClient
        .from("seasons")
        .select("id, ends_at")
        .eq("slug", CLOUD_SEASON_SLUG)
        .single();

      if (seasonError || !season) {
        if (!cancelled) {
          setCloudStatus("local");
          setNotice("Supabase no respondió; seguimos en modo local.");
        }
        return;
      }

      const [{ data: cloudEntries, error: entriesError }, { data: cloudActivities, error: activitiesError }] = await Promise.all([
        cloudClient.from("aura_entries").select("*").eq("season_id", season.id).order("bid_points", { ascending: false }).order("created_at", { ascending: true }).limit(50),
        cloudClient.from("aura_activities").select("*").eq("season_id", season.id).order("created_at", { ascending: false }).limit(5),
      ]);

      if (entriesError || activitiesError) {
        if (!cancelled) {
          setCloudStatus("local");
          setNotice("No se pudieron cargar los datos compartidos; seguimos en modo local.");
        }
        return;
      }

      if (cancelled) return;
      setCloudSeasonId(season.id);
      setEntries((cloudEntries || []).map(mapCloudEntry));
      setActivities((cloudActivities || []).map(mapCloudActivity));
      setSecondsLeft(Math.max(1, Math.floor((new Date(season.ends_at).getTime() - Date.now()) / 1000)));
      setCloudStatus("connected");

      const presenceKey = "aurabid:presence:session";
      const visitKey = `aurabid:visit:${CLOUD_SEASON_SLUG}`;
      const presenceSessionId = window.localStorage.getItem(presenceKey) || crypto.randomUUID();
      window.localStorage.setItem(presenceKey, presenceSessionId);
      const isNewVisit = !window.localStorage.getItem(visitKey);
      window.localStorage.setItem(visitKey, "1");

      const updatePresence = async (newVisit: boolean) => {
        const { data: presenceData } = await cloudClient.rpc("register_aura_presence", {
          p_season_id: season.id,
          p_session_id: presenceSessionId,
          p_new_visit: newVisit,
        });
        const presence = Array.isArray(presenceData) ? presenceData[0] : presenceData;
        if (presence) {
          setLiveOnline(Number(presence.online_count) || 0);
          setLiveVisitors(Number(presence.visitor_count) || 0);
        }
      };
      void updatePresence(isNewVisit);
      const presenceTimer = window.setInterval(() => void updatePresence(false), 15000);

      const refreshBoard = async () => {
        const [{ data: refreshedEntries }, { data: refreshedActivities }] = await Promise.all([
          cloudClient.from("aura_entries").select("*").eq("season_id", season.id).order("bid_points", { ascending: false }).order("created_at", { ascending: true }).limit(50),
          cloudClient.from("aura_activities").select("*").eq("season_id", season.id).order("created_at", { ascending: false }).limit(5),
        ]);
        if (refreshedEntries) setEntries(refreshedEntries.map(mapCloudEntry));
        if (refreshedActivities) setActivities(refreshedActivities.map(mapCloudActivity));
      };

      const channel = cloudClient
        .channel(`aurabid-season-${season.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "aura_entries", filter: `season_id=eq.${season.id}` }, refreshBoard)
        .on("postgres_changes", { event: "*", schema: "public", table: "aura_activities", filter: `season_id=eq.${season.id}` }, refreshBoard)
        .subscribe();

      return () => {
        cancelled = true;
        window.clearInterval(presenceTimer);
        void cloudClient.removeChannel(channel);
      };
    }

    let cleanup: (() => void) | undefined;
    void loadCloudBoard().then((result) => { cleanup = result; });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    document.documentElement.lang = locale;
  }, [darkMode, locale]);

  useEffect(() => {
    if (!isReady || (supabaseConfigured && cloudStatus !== "connected")) return;
    const snapshot: SavedState = { entries, activities, wallet, darkMode, locale };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [activities, cloudStatus, darkMode, entries, isReady, locale, wallet]);

  useEffect(() => {
    const timer = window.setInterval(() => setSecondsLeft((value) => value <= 1 ? SEASON_DURATION : value - 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (supabaseConfigured && cloudStatus === "connected") return;
    const timer = window.setInterval(() => {
      setLiveOnline((value) => Math.min(40, Math.max(10, value + (Math.random() > 0.48 ? 1 : -1))));
      setLiveVisitors((value) => value + Math.ceil(Math.random() * 3));
    }, 5000);
    return () => window.clearInterval(timer);
  }, [cloudStatus]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function changeBid(delta: number) {
    setBid((value) => Math.max(0, value + delta));
  }

  async function submitBid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = normalizeTarget(handle);
    if (!target) {
      setNotice(copy.invalidTarget);
      return;
    }
    const cleanHandle = target.handle;
    const existing = entries.find((entry) => entry.handle.toLowerCase() === cleanHandle.toLowerCase());
    if (bid <= 0) {
      setNotice("Tu oferta debe ser mayor a +0 aura.");
      return;
    }
    if (existing && bid <= existing.bid) {
      setBid(existing.bid + 50);
      setNotice(`@${cleanHandle} ya tiene +${formatPoints(existing.bid)} aura; superá ese valor para actualizarlo.`);
      return;
    }
    const cost = existing ? Math.max(0, bid - existing.bid) : bid;
    if (wallet < cost) {
      setShowWallet(true);
      setNotice(`Necesitás +${formatPoints(cost)} aura de saldo; tenés +${formatPoints(wallet)}.`);
      return;
    }
    const newEntry: Entry = {
      handle: cleanHandle,
      url: target.url,
      title: existing?.title || "Aura recién desbloqueada",
      category: existing?.category || category,
      bid,
      initials: cleanHandle.slice(0, 2).toUpperCase(),
      tone: existing?.tone || ["coral", "violet", "yellow", "blue", "mint"][entries.length % 5],
      clicks: existing?.clicks || 0,
      age: "ahora",
    };
    const oldLeader = leader;
    if (cloudSeasonId) {
      const response = await fetch("/api/aura/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seasonId: cloudSeasonId,
          handle: cleanHandle,
          targetUrl: target.url,
          title: newEntry.title,
          category: newEntry.category,
          bid,
          initials: newEntry.initials,
          tone: newEntry.tone,
          clicks: newEntry.clicks,
        }),
      });
      const result = await response.json() as { error?: string; entry?: Parameters<typeof mapCloudEntry>[0]; activity?: Parameters<typeof mapCloudActivity>[0] | null };
      if (!response.ok || !result.entry) {
        setNotice(result.error || "No se pudo guardar la oferta en Supabase. Intentá de nuevo.");
        return;
      }
      const savedEntry = mapCloudEntry(result.entry);
      setEntries((current) => [savedEntry, ...current.filter((entry) => entry.handle.toLowerCase() !== cleanHandle.toLowerCase())].sort((a, b) => b.bid - a.bid).slice(0, 8));
      const savedActivity = result.activity ? mapCloudActivity(result.activity) : { handle: cleanHandle, text: `compró +${formatPoints(bid)} aura y desafió a ${oldLeader.handle}`, bid, age: "ahora" };
      setActivities((current) => [savedActivity, ...current].slice(0, 5));
    } else {
      setEntries((current) => [newEntry, ...current.filter((entry) => entry.handle.toLowerCase() !== cleanHandle.toLowerCase())].sort((a, b) => b.bid - a.bid).slice(0, 8));
      setActivities((current) => [{ handle: cleanHandle, text: `compró +${formatPoints(bid)} aura y desafió a ${oldLeader.handle}`, bid, age: "ahora" }, ...current].slice(0, 5));
    }
    setWallet((value) => value - cost);
    setBid(bid + 100);
    setHandle("");
    setNotice(`@${cleanHandle} ahora tiene +${formatPoints(bid)} aura.`);
  }

  function purchasePoints(points: number, serverBalance?: number) {
    setWallet((value) => serverBalance ?? value + points);
    setActivities((current) => [{ handle: "sistema", text: `sumó +${formatPoints(points)} aura a tu saldo demo`, bid: points, age: "ahora" }, ...current].slice(0, 5));
    setShowWallet(false);
    setNotice(`Saldo actualizado: +${formatPoints(points)} aura disponibles.`);
  }

  function simulatePurchase(points: number) {
    if (simulatingPack) return;
    setSimulatingPack(points);
    window.setTimeout(() => {
      purchasePoints(points);
      setSimulatingPack(null);
    }, 850);
  }

  function handlePayPalError(message: string) {
    setNotice(message);
  }

  function resetDemo() {
    if (supabaseConfigured) {
      setWallet(1000);
      setShowWallet(false);
      setNotice("El tablero conectado se administra desde Supabase; solo reinicié tu saldo local.");
      return;
    }
    setEntries(initialEntries);
    setActivities(initialActivity);
    setWallet(1000);
    setBid(500);
    setSelectedCategory("Todo");
    window.localStorage.removeItem(STORAGE_KEY);
    setShowWallet(false);
    setNotice("La demo volvió a su estado inicial.");
  }

  return (
    <main className="site-shell">
      <header className="site-header">
        <div className="brand-lockup"><span className="brand-icon"><Image src="/aura-mark-navbar.png" alt="" width={30} height={30} priority /></span><span className="brand-name">aurabid<span>.lol</span></span></div>
        <nav className="main-nav" aria-label="Navegación principal"><a href="#leaderboard">{copy.leaderboard}</a><a href="#categories">{copy.categories}</a><a href="#about">{copy.about}</a><button onClick={() => setShowRules(true)}>{copy.rules}</button></nav>
        <button className="main-mobile-toggle" type="button" aria-label={showMobileNav ? "Cerrar menú" : "Abrir menú"} aria-expanded={showMobileNav} onClick={() => setShowMobileNav((value) => !value)}><Icon name="menu" size={19} /></button>
        <div className="header-tools"><button className="wallet-button" onClick={() => setShowWallet(true)}><Icon name="wallet" size={15} /><span>{copy.balance}</span><strong>+{formatPoints(wallet)}</strong></button><button className="locale-button" aria-label="Cambiar idioma" onClick={() => setLocale((value) => value === "es" ? "en" : "es")}>{locale.toUpperCase()}</button><button className="theme-button" aria-label="Cambiar tema" onClick={() => setDarkMode((value) => !value)}><Icon name="moon" size={16} /></button></div>
        {showMobileNav ? <nav className="main-mobile-nav" aria-label="Menú móvil"><a href="#leaderboard" onClick={() => setShowMobileNav(false)}>{copy.leaderboard}<span>→</span></a><a href="#categories" onClick={() => setShowMobileNav(false)}>{copy.categories}<span>→</span></a><a href="#about" onClick={() => setShowMobileNav(false)}>{copy.about}<span>→</span></a><button onClick={() => { setShowRules(true); setShowMobileNav(false); }}>{copy.rules}<span>→</span></button></nav> : null}
      </header>

      <section className="hero-block">
        <div className="online-pill"><span className="online-dot" /> <strong>{formatPoints(liveOnline)} {copy.online}</strong><span>· {formatPoints(liveVisitors)} {visitorLabel} ·</span><button onClick={() => setShowStats(true)}>{copy.stats} <Icon name="arrow" size={13} /></button></div>
        <h1><span className="claim-copy">{locale === "es" ? "Reclamá" : "Claim"} <b>#{prospectiveRank}</b> {locale === "es" ? "por" : "for"}</span> <span className="price-control"><button aria-label="-50 aura" onClick={() => changeBid(-50)}>−</button><label className="price-edit"><span>+</span><input aria-label="Cantidad de aura" type="number" min="0" step="50" inputMode="numeric" value={bid} onChange={(event) => setBid(Math.max(0, Number(event.target.value) || 0))} /></label><small>aura</small><button aria-label="+50 aura" onClick={() => changeBid(50)}>+</button></span></h1>
        <p className="hero-subtitle"><span>{copy.heroLead}</span> {copy.heroBody}</p>
        <form className="claim-form" onSubmit={submitBid}>
          <label className="field url-field"><Icon name="globe" size={17} /><input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder={copy.urlPlaceholder} aria-label={copy.urlPlaceholder} /><span className="field-shortcut">⌘ K</span></label>
          <label className="field select-field"><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Elegí una categoría"><option>Aura pura</option><option>Vibe</option><option>Estilo</option><option>Caos</option></select><Icon name="chevron" size={16} /></label>
          <button className="outbid-button" type="submit">{copy.outbid}</button>
        </form>
        {handle.trim() ? <p className={`target-status ${targetPreview ? "is-valid" : "is-invalid"}`}><Icon name={targetPreview?.kind === "x" ? "check" : "globe"} size={13} /> {targetPreview ? `${targetPreview.kind === "x" ? copy.xDetected : copy.urlDetected} · ${targetPreview.url}` : copy.invalidTarget}</p> : null}
        <p className="claim-hint">{locale === "es" ? `Con +${formatPoints(bid)} entrarías al puesto #${prospectiveRank}.` : `With +${formatPoints(bid)} you would enter at position #${prospectiveRank}.`}</p>
        <p className="existing-copy">{copy.existing}</p>
        <p className="form-help"><span>{copy.available}: +{formatPoints(wallet)} aura</span> · {copy.spent}</p>
      </section>

      <section className="category-tabs" id="categories" aria-label="Categorías">
        {categories.map((item, index) => <button key={item} className={selectedCategory === item ? "active" : ""} onClick={() => setSelectedCategory(item)}>{index === 0 ? <Icon name="grid" size={14} /> : index === 1 ? <Icon name="spark" size={14} /> : index === 2 ? <Icon name="search" size={14} /> : <Icon name="arrow" size={14} />}{categoryLabel(item)}</button>)}
      </section>

      <section className="board-section" id="leaderboard">
        <div className="board-heading"><div><p className="eyebrow">{copy.season}</p><h2>{copy.board}</h2></div><p className="reset-info"><Icon name="clock" size={14} /> {copy.resets} <strong>{formatTime(secondsLeft)}</strong></p></div>
        <div className="board-list">
          {visibleEntries.map((entry, index) => (
            <article className={`entry-card aura-rank-${Math.min(index + 1, 5)} ${index === 0 && selectedCategory === "Todo" ? "entry-leader" : ""}`} key={entry.handle}>
              <div className="entry-rank">#{String(index + 1).padStart(2, "0")}</div>
              <Avatar entry={entry} />
              <div className="entry-main">
                <div className="entry-title-row">
                  <Link className="entry-target" href={`/aura/${encodeURIComponent(entry.handle)}`} title={`Ver aura de @${entry.handle}`}><h3>{entry.handle}</h3><Icon name="arrow" size={12} /></Link>
                  {index === 0 && selectedCategory === "Todo" ? <span className="live-tag">{copy.now}</span> : null}
                </div>
                <p>{entry.title}</p>
                <small>{entry.age} · {categoryLabel(entry.category)} · <span className="click-dot" /> {entry.clicks.toLocaleString("en-US")} {entryClickLabel}</small>
              </div>
              <div className="entry-bid"><span>+</span>{formatPoints(entry.bid)}<small>aura</small></div>
              <a className="entry-arrow" href={entry.url || `https://x.com/${entry.handle}`} target="_blank" rel="noreferrer" aria-label={`${copy.openLink}: @${entry.handle}`}><Icon name="external" size={17} /></a>
            </article>
          ))}
          {visibleEntries.length === 0 ? <div className="empty-state">Todavía no hay aura en esta categoría.</div> : null}
        </div>
        <div className="board-footer"><span><strong>{entries.length}</strong> {copy.active}</span><span><strong>+{formatPoints(totalAura)} aura</strong> {copy.verified}</span><span>{copy.noAlgorithm}</span><span className="cloud-status">{cloudStatus === "connected" ? "Supabase en vivo" : "Modo local"}</span></div>
      </section>

      <section className="lower-grid" id="about">
        <div className="manifesto"><p className="eyebrow">{copy.ruleKicker}</p><h2>{copy.manifesto}<br /><em>{copy.manifestoEm}</em></h2><p>{copy.manifestoBody}</p></div>
        <aside className="activity-card"><div className="activity-head"><span>{copy.activity}</span><span className="activity-live"><i /> {copy.live}</span></div>{activities.map((item, index) => <div className="activity-row" key={`${item.handle}-${index}`}><span className="activity-avatar">{item.handle.slice(0, 2).toUpperCase()}</span><p><strong>@{item.handle}</strong> {item.text}<small>{item.age}{item.bid ? ` · +${formatPoints(item.bid)} aura` : ""}</small></p></div>)}</aside>
      </section>

      <section className="home-seo-section" aria-labelledby="home-seo-title">
        <div><p className="eyebrow">{copy.seoKicker}</p><h2 id="home-seo-title">{copy.seoTitle}</h2><p>{copy.seoBody}</p></div>
        <div className="home-seo-links"><Link href="/leaderboard">{copy.seoLeaderboard} <span>→</span></Link><Link href="/categorias">{copy.seoCategories} <span>→</span></Link><Link href="/como-funciona">Cómo funciona <span>→</span></Link></div>
      </section>

      <footer className="site-footer"><span>© 2026 aurabid.lol</span><span>hecho para gente con demasiado ego</span><button onClick={() => setShowRules(true)}>{copy.rules}</button></footer>

      {notice ? <div className="toast" role="status">{notice}<button aria-label="Cerrar aviso" onClick={() => setNotice("")}><Icon name="x" size={14} /></button></div> : null}

      {showRules ? <div className="modal-backdrop" onClick={() => setShowRules(false)}><div className="rules-modal" role="dialog" aria-modal="true" aria-labelledby="rules-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Cerrar reglas" onClick={() => setShowRules(false)}><Icon name="x" size={18} /></button><p className="eyebrow">{copy.rulesKicker}</p><h2 id="rules-title">{copy.rulesTitle}</h2><ol><li>{copy.rule1}</li><li>{copy.rule2}</li><li>{copy.rule3}</li><li>{copy.rule4}</li><li>{copy.rule5}</li></ol><p className="rules-note">{copy.ruleNote}</p></div></div> : null}

      {showWallet ? <div className="modal-backdrop" onClick={() => setShowWallet(false)}><div className="wallet-modal" role="dialog" aria-modal="true" aria-labelledby="wallet-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Cerrar saldo" onClick={() => setShowWallet(false)}><Icon name="x" size={18} /></button><p className="eyebrow">{copy.vaultKicker}</p><h2 id="wallet-title">{copy.walletTitle}</h2><div className="payment-mode"><span className={paypalConfigured ? "mode-dot mode-dot-paypal" : "mode-dot"} />{paypalConfigured ? (paypalProduction ? copy.paypalLive : copy.paypalMode) : copy.paymentSimulation}</div><div className="wallet-balance"><span>{copy.availableBalance}</span><strong>+{formatPoints(wallet)} <small>aura</small></strong></div><div className="pack-grid">{auraPacks.map((points) => <div className="pack-card" key={points}><span>{copy.add}</span><strong>+{formatPoints(points)}</strong><small>{copy.auraPoints} · US${(points / 100).toFixed(2)}</small>{paypalConfigured ? <PayPalCheckout points={points} onSuccess={purchasePoints} onError={handlePayPalError} /> : <button className="demo-pack-button" disabled={simulatingPack !== null} onClick={() => simulatePurchase(points)}>{simulatingPack === points ? copy.processing : copy.simulatePay}</button>}</div>)}</div><p className="rules-note">{paypalConfigured ? (paypalProduction ? "PayPal Live activo. Los pagos son reales." : copy.sandbox) : copy.demo}</p><button className="reset-button" onClick={resetDemo}><Icon name="refresh" size={14} /> {copy.resetDemo}</button></div></div> : null}

      {showStats ? <div className="modal-backdrop" onClick={() => setShowStats(false)}><div className="stats-modal" role="dialog" aria-modal="true" aria-labelledby="stats-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Cerrar estadísticas" onClick={() => setShowStats(false)}><Icon name="x" size={18} /></button><p className="eyebrow">{copy.statsKicker}</p><h2 id="stats-title">{copy.statsTitle}</h2><div className="stats-grid"><div><Icon name="chart" size={18} /><strong>{entries.length}</strong><span>{copy.activeEgos}</span></div><div><Icon name="spark" size={18} /><strong>+{formatPoints(totalAura)}</strong><span>{copy.auraGame}</span></div><div><Icon name="search" size={18} /><strong>{formatPoints(liveVisitors)}</strong><span>{visitorLabel}</span></div><div><Icon name="clock" size={18} /><strong>{formatTime(secondsLeft)}</strong><span>{copy.remaining}</span></div></div><p className="rules-note">{statsNote}</p></div></div> : null}
    </main>
  );
}
