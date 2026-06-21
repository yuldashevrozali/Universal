"use client";

import { useEffect, useState, useRef } from "react";

const WIN_DATA = [
  {
    id: "bio",
    title: "BIO-SCAN ENGINE v4.2",
    lines: [
      { t: "$ bio_verify --hand --nodes=21", c: "cmd" },
      { t: "> Loading MediaPipe engine...", c: "info" },
      { t: "> Analyzing landmark vectors...", c: "info" },
      { t: "> Cosine similarity: 99.7%", c: "info" },
      { t: "> Threshold: 98.5% [PASS]", c: "ok" },
      { t: "[✓] BIOMETRIC CONFIRMED", c: "ok" },
    ],
    delay: 400,
    style: { top: "7%", left: "3%" },
  },
  {
    id: "sec",
    title: "SECURITY MATRIX",
    lines: [
      { t: "0xF4A2 0xB31C 0x9E71 0xD042", c: "hex" },
      { t: "0x2C8F 0xA173 0x6E90 0x1B44", c: "hex" },
      { t: "0xCC71 0x3F02 0x8D55 0xE917", c: "hex" },
      { t: "> Validating JWT signature...", c: "info" },
      { t: "> Encryption: AES-256-GCM", c: "info" },
      { t: "[✓] ACCESS LEVEL: FULL", c: "ok" },
    ],
    delay: 1800,
    style: { top: "5%", right: "3%" },
  },
  {
    id: "sess",
    title: "SESSION MANAGER",
    lines: [
      { t: "> Generating session token...", c: "info" },
      { t: "> Lifetime: 30 days", c: "info" },
      { t: "> Device fingerprint: OK", c: "info" },
      { t: "> 2FA hand-scan: PASSED", c: "ok" },
      { t: "> Registering active session...", c: "info" },
      { t: "[✓] SESSION INITIALIZED", c: "ok" },
    ],
    delay: 3400,
    style: { bottom: "18%", left: "3%" },
  },
  {
    id: "log",
    title: "SYSTEM AUDIT LOG",
    lines: [
      { t: "> Auth method: HAND_BIOMETRIC", c: "info" },
      { t: "> User role: AUTHORIZED", c: "info" },
      { t: "> Threat level: NONE", c: "ok" },
      { t: "> Firewall status: ACTIVE", c: "info" },
      { t: "> Intrusion detection: CLEAR", c: "ok" },
      { t: "[✓] ENTRY LOGGED SECURELY", c: "ok" },
    ],
    delay: 5200,
    style: { bottom: "14%", right: "3%" },
  },
];

function useTypewriter(lines, active) {
  const [shown, setShown] = useState([]);
  const [charIdx, setCharIdx] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (lineIdx >= lines.length) return;
    const line = lines[lineIdx].t;
    if (charIdx < line.length) {
      const t = setTimeout(() => setCharIdx((c) => c + 1), 22);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setShown((s) => [...s, lines[lineIdx]]);
        setLineIdx((l) => l + 1);
        setCharIdx(0);
      }, 120);
      return () => clearTimeout(t);
    }
  }, [active, lineIdx, charIdx, lines]);

  const typing =
    lineIdx < lines.length ? lines[lineIdx].t.slice(0, charIdx) : null;

  return { shown, typing, lineColor: lineIdx < lines.length ? lines[lineIdx].c : "info" };
}

function WinContent({ lines }) {
  const [active, setActive] = useState(false);
  useEffect(() => { const t = setTimeout(() => setActive(true), 50); return () => clearTimeout(t); }, []);
  const { shown, typing, lineColor } = useTypewriter(lines, active);

  const colorMap = { cmd: "#a5b4fc", info: "#7db8ff", ok: "#34d399", hex: "#38bdf8" };

  return (
    <div style={{ fontFamily: "'Courier New', monospace", fontSize: 11, lineHeight: 1.75 }}>
      {shown.map((l, i) => (
        <div key={i} style={{ color: colorMap[l.c] || "#7db8ff" }}>{l.t}</div>
      ))}
      {typing !== null && (
        <div style={{ color: colorMap[lineColor] || "#7db8ff" }}>
          {typing}<span className="hk-cursor">_</span>
        </div>
      )}
    </div>
  );
}

function HackerWindow({ title, lines, delay, style }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!visible) return null;
  return (
    <div className="hk-win" style={style}>
      <div className="hk-win-bar">
        <div className="hk-dots">
          <span className="hk-dot" style={{ background: "#ef4444" }} />
          <span className="hk-dot" style={{ background: "#fbbf24" }} />
          <span className="hk-dot" style={{ background: "#34d399" }} />
        </div>
        <span className="hk-win-title">{title}</span>
      </div>
      <div style={{ padding: "10px 14px 12px" }}>
        <WinContent lines={lines} />
      </div>
    </div>
  );
}

function CenterScan() {
  return (
    <div className="hk-center">
      <div className="hk-orbit">
        <div className="hk-orbit-ring hk-ring1" />
        <div className="hk-orbit-ring hk-ring2" />
        <div className="hk-orbit-ring hk-ring3" />
        <div className="hk-center-icon">✋</div>
      </div>
      <div className="hk-center-label">SCANNING</div>
    </div>
  );
}

export default function HackerIntro({ onDone }) {
  const [granted, setGranted] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [loginTime] = useState(() => new Date().toLocaleTimeString("uz-UZ"));

  const logLines = WIN_DATA[3].lines.map((l, i) =>
    i === 0 ? { ...l, t: `> Auth: ${loginTime} [HAND_BIOMETRIC]` } : l
  );
  const winDataFinal = WIN_DATA.map((w) => (w.id === "log" ? { ...w, lines: logLines } : w));

  useEffect(() => {
    const t1 = setTimeout(() => setGranted(true), 8000);
    const t2 = setTimeout(() => setFadeOut(true), 9200);
    const t3 = setTimeout(() => onDone(), 10200);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [onDone]);

  return (
    <div className={`hk-overlay ${fadeOut ? "hk-fadeout" : ""}`}>
      {/* Scanlines */}
      <div className="hk-scanlines" />
      {/* Grid */}
      <div className="hk-grid" />

      {/* Corner windows */}
      {winDataFinal.map((w) => (
        <HackerWindow key={w.id} {...w} />
      ))}

      {/* Center animation */}
      {!granted && <CenterScan />}

      {/* ACCESS GRANTED */}
      {granted && (
        <div className="hk-granted">
          <div className="hk-granted-line" />
          <div className="hk-granted-text">ACCESS GRANTED</div>
          <div className="hk-granted-sub">Universal ga xush kelibsiz</div>
          <div className="hk-granted-line" />
        </div>
      )}
    </div>
  );
}
