import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import PayPalContext from "@/components/paypal-provider";
import "./globals.css";

const siteUrl = "https://www.aurabid.lol";
const siteTitle = "AuraBid — leaderboard de aura en vivo";
const siteDescription = "Reclamá tu lugar en el leaderboard de aura. Hacé una oferta, superá a la competencia y convertite en el #1.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | AuraBid",
  },
  description: siteDescription,
  applicationName: "AuraBid",
  keywords: ["AuraBid", "leaderboard de aura", "ranking de aura", "reclamá el número uno", "ofertas de aura"],
  authors: [{ name: "AuraBid" }],
  creator: "AuraBid",
  publisher: "AuraBid",
  category: "entertainment",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_UY",
    url: siteUrl,
    siteName: "AuraBid",
    title: siteTitle,
    description: siteDescription,
    images: [{
      url: "/opengraph-image",
      width: 1200,
      height: 630,
      alt: "AuraBid, el leaderboard de aura en vivo",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: "g7PcAwQpbryTd-Fx2CaLYBbjAbTqtKz0QoPRRLFQs4Y",
  },
  icons: {
    icon: [{ url: "/icon.ico", type: "image/x-icon" }],
    shortcut: ["/icon.ico"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f0efff",
  colorScheme: "light dark",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "AuraBid",
      description: siteDescription,
      inLanguage: ["es", "en"],
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#application`,
      url: siteUrl,
      name: "AuraBid",
      description: siteDescription,
      applicationCategory: "EntertainmentApplication",
      operatingSystem: "Web",
      browserRequirements: "Requires JavaScript",
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <PayPalContext>{children}</PayPalContext>
        <Analytics />
      </body>
    </html>
  );
}
