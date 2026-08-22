"use client";

import Image from "next/image";
import { useState } from "react";

type SiteFaviconProps = {
  url?: string;
  initials: string;
  tone: string;
  className: string;
};

function getHost(url?: string) {
  try {
    return new URL(url || "https://x.com").hostname.replace(/^www\./, "");
  } catch {
    return "x.com";
  }
}

export default function SiteFavicon({ url, initials, tone, className }: SiteFaviconProps) {
  const host = getHost(url);
  const [sourceIndex, setSourceIndex] = useState(0);
  const sources = [
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`,
  ];

  return (
    <div className={`${className} avatar-${tone}`} data-favicon-host={host}>
      {sourceIndex < sources.length ? (
        <Image
          src={sources[sourceIndex]}
          alt=""
          width={64}
          height={64}
          unoptimized
          onError={() => setSourceIndex((current) => current + 1)}
        />
      ) : initials}
    </div>
  );
}
