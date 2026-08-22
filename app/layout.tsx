import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import PayPalContext from "@/components/paypal-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AuraBid — reclamá el #1",
  description: "Un leaderboard en vivo donde tu oferta decide tu nivel de aura.",
  verification: {
    google: "g7PcAwQpbryTd-Fx2CaLYBbjAbTqtKz0QoPRRLFQs4Y",
  },
  icons: {
    icon: [{ url: "/icon.ico", type: "image/x-icon" }],
    shortcut: ["/icon.ico"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <PayPalContext>{children}</PayPalContext>
        <Analytics />
      </body>
    </html>
  );
}
