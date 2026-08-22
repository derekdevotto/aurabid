import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  agentRules: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.google.com", pathname: "/s2/favicons/**" },
      { protocol: "https", hostname: "icons.duckduckgo.com", pathname: "/ip3/**" },
    ],
  },
};

export default nextConfig;
