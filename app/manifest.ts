import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AuraBid — leaderboard de aura en vivo",
    short_name: "AuraBid",
    description: "Reclamá tu lugar en el leaderboard de aura.",
    start_url: "/",
    display: "standalone",
    background_color: "#f0efff",
    theme_color: "#f0efff",
    lang: "es",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
