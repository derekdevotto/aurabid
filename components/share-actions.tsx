"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";

type Props = {
  url: string;
  title: string;
};

export default function ShareActions({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      track("share", { channel: "copy", page: url });
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copiá este enlace", url);
    }
  }

  async function share() {
    if (navigator.share) {
      track("share", { channel: "native", page: url });
      await navigator.share({ title, text: `${title} en AuraBid`, url });
      return;
    }
    await copyLink();
  }

  const xUrl = `https://x.com/intent/post?text=${encodeURIComponent(`${title} en AuraBid`)}&url=${encodeURIComponent(url)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} en AuraBid: ${url}`)}`;

  return (
    <div className="share-actions" aria-label="Compartir esta página">
      <button type="button" onClick={() => void share()}>Compartir</button>
      <button type="button" onClick={() => void copyLink()}>{copied ? "Copiado" : "Copiar"}</button>
      <a href={xUrl} target="_blank" rel="noreferrer" onClick={() => track("share", { channel: "x", page: url })}>Publicar en X</a>
      <a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => track("share", { channel: "whatsapp", page: url })}>WhatsApp</a>
    </div>
  );
}
