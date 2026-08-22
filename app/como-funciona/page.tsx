import type { Metadata } from "next";
import Link from "next/link";
import PublicSiteHeader from "@/components/public-site-header";

export const metadata: Metadata = {
  title: "Cómo funciona AuraBid",
  description: "Aprendé cómo comprar aura, hacer una oferta y subir en el leaderboard público de AuraBid.",
  alternates: { canonical: "/como-funciona" },
};

const steps = [
  ["01", "Elegí tu identidad", "Pegá un @handle de X o la URL de tu proyecto. AuraBid crea una página pública para que puedas compartirla."],
  ["02", "Comprá puntos de aura", "Cargá saldo y elegí cuánto querés ofrecer. En el MVP podés probarlo en modo demo."],
  ["03", "Superá el ranking", "La oferta más alta queda arriba. Si ya estás en el tablero, pagás solamente la diferencia."],
  ["04", "Compartí tu puesto", "Tu perfil tiene una URL propia y una tarjeta social lista para publicar en X, WhatsApp o cualquier chat."],
];

export default function HowItWorksPage() {
  return (
    <main className="public-page">
      <PublicSiteHeader />
      <article className="guide-article">
        <p className="public-kicker">AURABID / GUÍA RÁPIDA</p>
        <h1>Cómo funciona el aura.</h1>
        <p className="guide-intro">AuraBid es un leaderboard público donde la gente compite por visibilidad, presencia y una cantidad innecesaria de ego.</p>
        <div className="guide-steps">
          {steps.map(([number, title, body]) => <section key={number}><span>{number}</span><div><h2>{title}</h2><p>{body}</p></div></section>)}
        </div>
        <section className="guide-faq">
          <h2>Preguntas frecuentes</h2>
          <h3>¿El puesto se decide por likes?</h3><p>No. El puesto se ordena por la oferta de aura registrada en la temporada.</p>
          <h3>¿Puedo usar una URL en vez de X?</h3><p>Sí. Podés registrar una web, un producto, un portfolio o un perfil.</p>
          <h3>¿La temporada dura para siempre?</h3><p>No. El tablero se reinicia por temporada y conserva la historia para que el caos tenga contexto.</p>
        </section>
        <Link className="public-primary" href="/#leaderboard">Reclamá tu lugar</Link>
      </article>
      <footer className="public-footer"><Link href="/leaderboard">Leaderboard</Link><Link href="/categorias">Categorías</Link><Link href="/">Inicio</Link></footer>
    </main>
  );
}
