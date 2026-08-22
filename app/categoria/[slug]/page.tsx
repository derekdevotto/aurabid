import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicSiteHeader from "@/components/public-site-header";
import ShareActions from "@/components/share-actions";
import SiteFavicon from "@/components/site-favicon";
import { getCategoryBySlug, getPublicEntries, publicCategories } from "@/lib/aura-data";

type Props = { params: Promise<{ slug: string }> };
const siteUrl = "https://www.aurabid.lol";
export const revalidate = 60;

export function generateStaticParams() {
  return publicCategories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: "Categoría no encontrada | AuraBid" };
  return {
    title: `Aura ${category.name.toLowerCase()}`,
    description: `${category.description} Mirá quién lidera esta categoría en AuraBid.`,
    alternates: { canonical: `/categoria/${category.slug}` },
    openGraph: {
      title: `${category.name} | AuraBid`,
      description: category.description,
      url: `${siteUrl}/categoria/${category.slug}`,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();
  const entries = (await getPublicEntries()).filter((entry) => entry.category === category.name);

  return (
    <main className="public-page">
      <PublicSiteHeader />
      <section className="public-hero public-hero-compact">
        <p className="public-kicker">AURABID / CATEGORÍA</p>
        <h1>Aura {category.name.toLowerCase()}.</h1>
        <p>{category.description} Acá la oferta define quién manda.</p>
        <div className="public-hero-actions"><Link className="public-primary" href="/#leaderboard">Sumar mi aura</Link><ShareActions url={`${siteUrl}/categoria/${category.slug}`} title={`Ranking de ${category.name} en AuraBid`} /></div>
      </section>
      <section className="public-section" aria-labelledby="category-ranking-title">
        <div className="public-section-heading"><div><p className="public-kicker">RANKING / HOY</p><h2 id="category-ranking-title">Los que tienen aura</h2></div><span>{entries.length} perfiles</span></div>
        <div className="public-ranking-list">
          {entries.length ? entries.map((entry, index) => (
            <article className="public-ranking-card" key={entry.handle}>
              <strong className={`public-rank public-rank-${Math.min(index + 1, 5)}`}>#{String(index + 1).padStart(2, "0")}</strong>
              <SiteFavicon className="public-avatar" tone={entry.tone} url={entry.url} initials={entry.initials} />
              <div className="public-ranking-copy"><Link href={`/aura/${encodeURIComponent(entry.handle)}`}><h3>@{entry.handle}</h3></Link><p>{entry.title}</p><small>{entry.clicks.toLocaleString("en-US")} visitas al perfil</small></div>
              <strong className="public-bid">+{entry.bid.toLocaleString("en-US")} <small>aura</small></strong>
              <Link className="public-view-link" href={`/aura/${encodeURIComponent(entry.handle)}`}>Ver aura</Link>
            </article>
          )) : <div className="public-empty">Todavía no hay ofertas en esta categoría. Podés ser el primero.</div>}
        </div>
      </section>
      <footer className="public-footer"><Link href="/categorias">Todas las categorías</Link><Link href="/leaderboard">Leaderboard general</Link><Link href="/">Volver al tablero</Link></footer>
    </main>
  );
}
