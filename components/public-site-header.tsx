import Image from "next/image";
import Link from "next/link";

export default function PublicSiteHeader() {
  return (
    <header className="public-header">
      <Link className="brand-lockup" href="/" aria-label="AuraBid inicio">
        <span className="brand-icon"><Image src="/aura-mark-navbar.png" alt="" width={30} height={30} priority /></span>
        <span className="brand-name">aurabid<span>.lol</span></span>
      </Link>
      <nav className="public-nav" aria-label="Navegación pública">
        <Link href="/leaderboard">Leaderboard</Link>
        <Link href="/categorias">Categorías</Link>
        <Link href="/como-funciona">Cómo funciona</Link>
      </nav>
      <Link className="public-cta" href="/#leaderboard">Reclamá tu aura</Link>
    </header>
  );
}
