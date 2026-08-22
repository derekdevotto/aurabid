"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/categorias", label: "Categorías" },
  { href: "/como-funciona", label: "Cómo funciona" },
];

export default function PublicSiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="public-header">
      <Link className="brand-lockup" href="/" aria-label="AuraBid inicio">
        <span className="brand-icon"><Image src="/aura-mark-navbar.png" alt="" width={30} height={30} priority /></span>
        <span className="brand-name">aurabid<span>.lol</span></span>
      </Link>
      <nav className="public-nav" aria-label="Navegación pública">
        {links.map((link) => <Link className={pathname === link.href ? "active" : ""} href={link.href} key={link.href}>{link.label}</Link>)}
      </nav>
      <div className="public-header-actions">
        <Link className="public-cta" href="/#leaderboard">Reclamá tu aura</Link>
        <button className="public-mobile-toggle" type="button" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
          <span /><span /><span />
        </button>
      </div>
      {menuOpen ? <nav className="public-mobile-nav" aria-label="Menú móvil">
        {links.map((link) => <Link className={pathname === link.href ? "active" : ""} href={link.href} key={link.href} onClick={closeMenu}>{link.label}<span>→</span></Link>)}
        <Link href="/#leaderboard" onClick={closeMenu}>Reclamá tu aura<span>↗</span></Link>
      </nav> : null}
    </header>
  );
}
