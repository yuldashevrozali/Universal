"use client";

import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 22;

function AiParticles() {
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    left: `${Math.random() * 90 + 5}%`,
    top: `${Math.random() * 60 + 30}%`,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 6,
    duration: Math.random() * 5 + 4,
    color: ["#6c8cff", "#9b6cff", "#06b6d4", "#34d399"][Math.floor(Math.random() * 4)],
  }));

  return (
    <div className="ai-particles">
      {particles.map((p, i) => (
        <span
          key={i}
          className="ai-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}

export default function AiChatPage() {
  return (
    <div>
      <h1 className="page-title">AI Chat</h1>
      <p className="page-sub">Sun'iy intellekt bilan suhbat.</p>

      <div className="card ai-holo" data-stagger="1">
        {/* Orbs */}
        <div className="ai-holo-orb ai-orb1" />
        <div className="ai-holo-orb ai-orb2" />
        <div className="ai-holo-orb ai-orb3" />

        {/* Floating particles */}
        <AiParticles />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <div className="ai-robot">🤖</div>

          <h2 className="ai-title">Tez orada qo'shiladi</h2>

          <p
            className="muted"
            style={{ maxWidth: 380, margin: "0 auto 24px", lineHeight: 1.6, position: "relative", zIndex: 2 }}
          >
            Bu bo'lim hozircha tayyorlanmoqda. Tez orada bu yerda{" "}
            <span style={{ color: "var(--accent)" }}>Claude AI</span> yordamchi bilan
            suhbatlashish imkoniyati paydo bo'ladi.
          </p>

          {/* Feature preview chips */}
          <div
            style={{
              display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center",
              marginBottom: 28, position: "relative", zIndex: 2,
            }}
          >
            {["💬 Savol-javob", "📝 Matn yozish", "🧠 Tahlil qilish", "🌐 Tarjima"].map((f, i) => (
              <span
                key={f}
                className="badge"
                style={{
                  fontSize: 13, padding: "6px 14px",
                  animation: `float-up .5s ease both`,
                  animationDelay: `${0.3 + i * 0.1}s`,
                }}
              >
                {f}
              </span>
            ))}
          </div>

          <span className="ai-soon-badge">COMING SOON</span>
        </div>
      </div>
    </div>
  );
}
