import { ImageResponse } from "next/og";

export const alt = "AuraBid, el leaderboard de aura en vivo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          color: "#211f35",
          background: "linear-gradient(135deg, #f4f2ff 0%, #e8e5ff 58%, #f4f9de 100%)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, fontWeight: 700 }}>
          <div style={{ width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, color: "#ffffff", background: "#6557f5", fontSize: 24 }}>A</div>
          <span>aurabid.lol</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", color: "#6557f5", fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>LEADERBOARD DE AURA EN VIVO</div>
          <div style={{ display: "flex", maxWidth: 920, fontSize: 72, lineHeight: 1.02, fontWeight: 800, letterSpacing: -3 }}>Reclamá tu lugar.<br />Convertite en el #1.</div>
          <div style={{ display: "flex", fontSize: 28, color: "#625e78" }}>Hacé una oferta, superá a la competencia y medí tu aura.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderRadius: 18, color: "#ffffff", background: "#6557f5", fontSize: 24, fontWeight: 700 }}>#1 ahora</div>
          <div style={{ display: "flex", alignItems: "center", padding: "14px 20px", border: "2px solid #d6d2fb", borderRadius: 18, color: "#6557f5", background: "#ffffff", fontSize: 24, fontWeight: 700 }}>+500 aura</div>
        </div>
      </div>
    ),
    size,
  );
}
