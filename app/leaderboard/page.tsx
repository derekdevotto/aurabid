import type { Metadata } from "next";
import Link from "next/link";
import PublicSiteHeader from "@/components/public-site-header";
import ShareActions from "@/components/share-actions";
import { getPublicEntries, getCategorySlug } from "@/lib/aura-data";

const siteUrl = "https://www.aurabid.lol";
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Leaderboard de aura en vivo",
  description: "Mirá quién tiene más aura hoy y reclamá un lugar en el ranking público de AuraBid.",
  alternates: { canonical: "/leaderboard" },
  openGraph: {
    title: "Leaderboard de aura en vivo | AuraBid",
    description: "El ranking público donde tu oferta decide tu aura.",
    url: `${siteUrl}/leaderboard`,
    type: "website",
  },
};

function formatPoints(value: number) {
  return value.toLocaleString("en-US");
}

export default async function LeaderboardPage() {
  const entries = await getPublicEntries();
  const totalAura = entries.reduce((sum, entry) => sum + entry.bid, 0);

  return (
    <main className="public-page">
      <PublicSiteHeader />
      <section className="public-hero">
        <p className="public-kicker">AURABID / TEMPORADA 01</p>
        <h1>El leaderboard de aura que todos pueden ver.</h1>
        <p>Compará perfiles, proyectos y egos en tiempo real. La oferta más alta ocupa el #1.</p>
        <div className="public-hero-actions">
          <Link className="public-primary" href="/#leaderboard">Reclamá un puesto</Link>
          <ShareActions url={`${siteUrl}/leaderboard`} title="El leaderboard de aura en vivo" />
        </div>
      </section>

      <section className="public-section" aria-labelledby="ranking-title">
        <div className="public-section-heading">
          <div>
            <p className="public-kicker">HOY / EN VIVO</p>
            <h2 id="ranking-title">Ranking de aura</h2>
          </div>
          <span>{entries.length} egos · +{formatPoints(totalAura)} aura</span>
        </div>
        <div className="public-ranking-list">
          {entries.map((entry, index) => (
            <article className="public-ranking-card" key={entry.handle}>
              <strong className={`public-rank public-rank-${Math.min(index + 1, 5)}`}>#{String(index + 1).padStart(2, "0")}</strong>
              <div className={`public-avatar avatar-${entry.tone}`}>{entry.initials}</div>
              <div className="public-ranking-copy">
                <Link href={`/aura/${encodeURIComponent(entry.handle)}`}><h3>@{entry.handle}</h3></Link>
                <p>{entry.title}</p>
                <small>{entry.category} · {entry.clicks.toLocaleString("en-US")} visitas al perfil</small>
              </div>
              <strong className="public-bid">+{formatPoints(entry.bid)} <small>aura</small></strong>
              <Link className="public-view-link" href={`/aura/${encodeURIComponent(entry.handle)}`}>Ver aura</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="public-content-grid">
        <div>
          <p className="public-kicker">EXPLORÁ EL CAOS</p>
          <h2>Encontrá tu categoría.</h2>
          <p>Vibe, estilo, aura pura o caos: cada categoría tiene su propio ranking y una URL para compartir.</p>
        </div>
        <div className="public-link-grid">
          {(["Aura pura", "Vibe", "Estilo", "Caos"] as const).map((category) => (
            <Link href={`/categoria/${getCategorySlug(category)}`} key={category}>{category}<span>→</span></Link>
          ))}
        </div>
      </section>

      <footer className="public-footer"><span>© 2026 AuraBid</span><Link href="/como-funciona">Cómo funciona</Link><Link href="/">Volver al tablero</Link></footer>
    </main>
  );
}
