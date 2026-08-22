import type { Metadata } from "next";
import Link from "next/link";
import PublicSiteHeader from "@/components/public-site-header";
import { publicCategories } from "@/lib/aura-data";

export const metadata: Metadata = {
  title: "Categorías de aura",
  description: "Explorá los rankings de aura pura, vibe, estilo y caos en AuraBid.",
  alternates: { canonical: "/categorias" },
};

export default function CategoriesPage() {
  return (
    <main className="public-page">
      <PublicSiteHeader />
      <section className="public-hero public-hero-compact">
        <p className="public-kicker">AURABID / CATEGORÍAS</p>
        <h1>Elegí tu tipo de aura.</h1>
        <p>Cada categoría tiene un tablero propio para que tu energía compita donde corresponde.</p>
      </section>
      <section className="category-directory" aria-label="Categorías de aura">
        {publicCategories.map((category, index) => (
          <Link className={`category-directory-card category-directory-${index + 1}`} href={`/categoria/${category.slug}`} key={category.slug}>
            <span className="public-kicker">0{index + 1}</span>
            <h2>{category.name}</h2>
            <p>{category.description}</p>
            <strong>Ver ranking <span>→</span></strong>
          </Link>
        ))}
      </section>
      <footer className="public-footer"><span>© 2026 AuraBid</span><Link href="/leaderboard">Leaderboard</Link><Link href="/">Reclamá tu aura</Link></footer>
    </main>
  );
}
