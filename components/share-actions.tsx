"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";

type Props = {
  url: string;
  title: string;
};

type ShareIconName = "share" | "copy" | "x" | "whatsapp";

function ShareIcon({ name }: { name: ShareIconName }) {
  if (name === "x") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5 19 19.5M19 4.5 5 19.5" /></svg>;
  if (name === "whatsapp") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.4 4.6A9.7 9.7 0 0 0 4.1 16.2L3 21l4.9-1.1A9.7 9.7 0 1 0 19.4 4.6Z" /><path d="M8.2 8.1c.3-.4.6-.4.9-.4h.4c.2 0 .4.1.5.4l.7 1.6c.1.2.1.4-.1.6l-.6.7c.6 1.1 1.5 2 2.7 2.5l.7-.7c.2-.2.4-.2.6-.1l1.6.7c.2.1.3.3.3.5v.4c0 .3-.1.6-.4.9-.3.3-.8.5-1.3.5-2.2-.1-5.8-3.2-6.9-5.6-.3-.8-.2-1.5.3-2Z" /></svg>;
  if (name === "copy") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 4.5c.5 2.8 2.2 4.5 5 5" /><path d="M19 9.5v1.7c0 4.2-3.4 7.6-7.6 7.6A7.6 7.6 0 0 1 4 11.2a7.6 7.6 0 0 1 7.6-7.6" /><path d="m12 3.6 2.1 2.1L12 7.8" /></svg>;
}

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
      <button className="share-button share-button-primary" type="button" onClick={() => void share()}><ShareIcon name="share" /><span>Compartir</span></button>
      <button className="share-button" type="button" onClick={() => void copyLink()}><ShareIcon name="copy" /><span>{copied ? "Copiado" : "Copiar"}</span></button>
      <a className="share-button share-button-x" href={xUrl} target="_blank" rel="noreferrer" aria-label="Publicar en X" onClick={() => track("share", { channel: "x", page: url })}><ShareIcon name="x" /><span>X</span></a>
      <a className="share-button share-button-whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Compartir por WhatsApp" onClick={() => track("share", { channel: "whatsapp", page: url })}><ShareIcon name="whatsapp" /><span>WhatsApp</span></a>
    </div>
  );
}
