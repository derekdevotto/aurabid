import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicSiteHeader from "@/components/public-site-header";
import ShareActions from "@/components/share-actions";
import { demoEntries, getCategorySlug, getPublicEntry } from "@/lib/aura-data";

type Props = { params: Promise<{ handle: string }> };
const siteUrl = "https://www.aurabid.lol";
export const revalidate = 60;

export function generateStaticParams() {
  return demoEntries.map((entry) => ({ handle: entry.handle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const result = await getPublicEntry(handle);
  if (!result) return { title: "Aura no encontrada | AuraBid" };
  const { entry, rank } = result;
  const title = `@${entry.handle}: +${entry.bid} aura · puesto #${rank}`;
  const description = `${entry.title}. Mirá el puesto de @${entry.handle} en el leaderboard público de AuraBid.`;
  return {
    title,
    description,
    alternates: { canonical: `/aura/${encodeURIComponent(entry.handle)}` },
    openGraph: { title, description, url: `${siteUrl}/aura/${encodeURIComponent(entry.handle)}`, type: "profile" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AuraProfilePage({ params }: Props) {
  const { handle } = await params;
  const result = await getPublicEntry(handle);
  if (!result) notFound();
  const { entry, rank, totalEntries } = result;
  const pageUrl = `${siteUrl}/aura/${encodeURIComponent(entry.handle)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `Aura de @${entry.handle}`,
    description: entry.title,
    url: pageUrl,
    mainEntity: { "@type": "Person", name: `@${entry.handle}`, url: entry.url },
  };

  return (
    <main className="public-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicSiteHeader />
      <article className="aura-profile-page">
        <Link className="back-link" href="/leaderboard">← Volver al leaderboard</Link>
        <div className="aura-profile-card">
          <div className={`aura-profile-avatar avatar-${entry.tone}`}>{entry.initials}</div>
          <p className="public-kicker">PUESTO #{rank} / TEMPORADA 01</p>
          <h1>@{entry.handle}</h1>
          <p className="aura-profile-title">{entry.title}</p>
          <div className="aura-profile-score"><strong>+{entry.bid.toLocaleString("en-US")}</strong><span>aura</span></div>
          <p className="aura-profile-meta">{entry.category} · {entry.clicks.toLocaleString("en-US")} visitas al perfil · {entry.age}</p>
          <div className="aura-profile-actions"><a className="public-primary" href={entry.url} target="_blank" rel="noreferrer">Abrir perfil original ↗</a><ShareActions url={pageUrl} title={`@${entry.handle} tiene +${entry.bid} aura`} /></div>
        </div>
        <section className="aura-profile-copy"><p className="public-kicker">LA REGLA ES SIMPLE</p><h2>Tu aura se puede medir.</h2><p>@{entry.handle} ocupa el puesto #{rank} de {totalEntries} en AuraBid con una oferta de +{entry.bid} aura. ¿Querés subirlo, desafiarlo o reclamar tu propio lugar?</p><Link href={`/?target=${encodeURIComponent(entry.handle)}#leaderboard`}>Hacer una oferta contra este puesto →</Link></section>
        <div className="profile-links"><Link href={`/categoria/${getCategorySlug(entry.category)}`}>Más de {entry.category}</Link><Link href="/como-funciona">Cómo funciona AuraBid</Link><Link href="/">Crear mi perfil</Link></div>
      </article>
      <footer className="public-footer"><Link href="/leaderboard">Leaderboard</Link><Link href="/categorias">Categorías</Link><Link href="/">Inicio</Link></footer>
    </main>
  );
}
