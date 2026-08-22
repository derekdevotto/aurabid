import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ handle: string }> };

export default async function Image({ params }: Props) {
  const { handle } = await params;
  const cleanHandle = decodeURIComponent(handle).replace(/^@+/, "");
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", color: "#211f35", background: "linear-gradient(135deg, #f4f2ff 0%, #e8e5ff 58%, #f4f9de 100%)", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, fontWeight: 700 }}><div style={{ width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, color: "#fff", background: "#6557f5", fontSize: 24 }}>A</div><span>aurabid.lol</span></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}><div style={{ display: "flex", color: "#6557f5", fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>PERFIL DE AURA</div><div style={{ display: "flex", fontSize: 78, lineHeight: 1, fontWeight: 800, letterSpacing: -3 }}>@{cleanHandle}</div><div style={{ display: "flex", fontSize: 30, color: "#625e78" }}>¿Tiene lo necesario para ser #1?</div></div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}><div style={{ display: "flex", padding: "14px 20px", borderRadius: 18, color: "#fff", background: "#6557f5", fontSize: 26, fontWeight: 700 }}>Reclamar puesto</div><div style={{ display: "flex", padding: "14px 20px", border: "2px solid #d6d2fb", borderRadius: 18, color: "#6557f5", background: "#fff", fontSize: 26, fontWeight: 700 }}>AuraBid</div></div>
    </div>,
    size,
  );
}
