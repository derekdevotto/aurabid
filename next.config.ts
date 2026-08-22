import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  agentRules: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "www.google.com", pathname: "/s2/favicons/**" }],
  },
};

export default nextConfig;
