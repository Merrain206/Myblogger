import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #334155 70%, #1e293b 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #06b6d4, #8b5cf6, #f59e0b)",
          }}
        />
        {/* Background geometric accents */}
        <div
          style={{
            position: "absolute",
            top: 80,
            right: 80,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(6, 182, 212, 0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 100,
            left: 100,
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(139, 92, 246, 0.1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 200,
            right: 280,
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(245, 158, 11, 0.1)",
          }}
        />
        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 800,
            color: "#f1f5f9",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          Merrain&apos;s Blog
        </div>
        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#94a3b8",
            letterSpacing: "-0.01em",
          }}
        >
          Tech &amp; Life
        </div>
        {/* Footer */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 56,
            fontSize: 18,
            color: "#64748b",
            letterSpacing: "0.05em",
          }}
        >
          merrain.cn
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
