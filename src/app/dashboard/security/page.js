"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Browser detection ────────────────────────────────────────────────────────
function detectBrowser(ua) {
  if (ua.includes("Firefox")) return "Mozilla Firefox";
  if (ua.includes("Edg/") || ua.includes("EdgA/")) return "Microsoft Edge";
  if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Chrome")) return "Google Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Noma'lum brauzer";
}
function detectOS(ua, platform) {
  if (/iPhone|iPad/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/Win/.test(platform)) return ua.includes("Windows NT 10") ? "Windows 10/11" : "Windows";
  if (/Mac/.test(platform)) return "macOS";
  if (/Linux/.test(platform)) return "Linux";
  return platform || "Noma'lum";
}

// ─── Canvas fingerprint ───────────────────────────────────────────────────────
function getCanvasHash() {
  try {
    const c = document.createElement("canvas");
    c.width = 300; c.height = 80;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#f0f0f0"; ctx.fillRect(0, 0, 300, 80);
    ctx.fillStyle = "#333"; ctx.font = "bold 16px Arial";
    ctx.fillText("Security fingerprint \u{1F510}", 4, 24);
    ctx.fillStyle = "#e74c3c"; ctx.font = "13px 'Courier New'";
    ctx.fillText("UniVeRsAl#SecuriTy-2025", 4, 52);
    ctx.strokeStyle = "rgba(108,140,255,0.5)";
    ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(260, 40, 20, 0, Math.PI * 2); ctx.stroke();
    const data = c.toDataURL();
    let h = 5381;
    for (let i = 0; i < data.length; i++) h = ((h << 5) + h) ^ data.charCodeAt(i);
    return (h >>> 0).toString(16).toUpperCase().padStart(8, "0");
  } catch { return null; }
}

// ─── WebGL info ───────────────────────────────────────────────────────────────
function getWebGL() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
    if (!gl) return null;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (ext) return {
      vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),
    };
    return { vendor: gl.getParameter(gl.VENDOR), renderer: gl.getParameter(gl.RENDERER) };
  } catch { return null; }
}

// ─── WebRTC IP leak ───────────────────────────────────────────────────────────
function detectWebRTCIPs() {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      const ips = new Set();
      pc.createDataChannel("");
      pc.onicecandidate = (e) => {
        if (!e.candidate) { pc.close(); resolve([...ips]); return; }
        const m = e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/g);
        if (m) m.forEach((ip) => !ip.startsWith("0.") && ips.add(ip));
      };
      pc.createOffer().then((o) => pc.setLocalDescription(o)).catch(() => resolve([]));
      setTimeout(() => { try { pc.close(); } catch {} resolve([...ips]); }, 4000);
    } catch { resolve([]); }
  });
}

// ─── Collect all data ─────────────────────────────────────────────────────────
async function collectAll() {
  const ua = navigator.userAgent;
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  const lsKeys = [];
  try { for (let i = 0; i < localStorage.length; i++) lsKeys.push(localStorage.key(i)); } catch {}

  const cookies = document.cookie.split(";").map((c) => c.trim()).filter(Boolean);

  const perms = {};
  try {
    for (const p of ["camera", "microphone", "notifications", "geolocation"]) {
      const r = await navigator.permissions.query({ name: p }).catch(() => null);
      if (r) perms[p] = r.state;
    }
  } catch {}

  let battery = null;
  try { battery = await navigator.getBattery(); } catch {}

  const rtcIPs = await detectWebRTCIPs();

  return {
    browser: detectBrowser(ua),
    os: detectOS(ua, navigator.platform),
    platform: navigator.platform,
    ua,
    language: navigator.language,
    languages: [...(navigator.languages || [])].join(", "),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dnt: navigator.doNotTrack,
    screen: { w: screen.width, h: screen.height, depth: screen.colorDepth, dpr: window.devicePixelRatio },
    hardware: {
      cores: navigator.hardwareConcurrency,
      memory: navigator.deviceMemory,
      touch: navigator.maxTouchPoints > 0,
      touchPoints: navigator.maxTouchPoints,
    },
    network: conn ? { type: conn.effectiveType, downlink: conn.downlink, rtt: conn.rtt } : null,
    cookies,
    storage: { lsKeys, lsCount: lsKeys.length, ssCount: sessionStorage.length },
    webgl: getWebGL(),
    canvasHash: getCanvasHash(),
    historyLength: history.length,
    referrer: document.referrer,
    plugins: [...(navigator.plugins || [])].map((p) => p.name),
    battery: battery ? { level: Math.round(battery.level * 100), charging: battery.charging } : null,
    rtcIPs,
    permissions: perms,
    online: navigator.onLine,
  };
}

// ─── Build terminal script ────────────────────────────────────────────────────
function buildScript(d) {
  const lines = [];
  let t = 0;

  function add(text, type = "info", dt = 260) {
    lines.push({ text, type, delay: t });
    t += dt;
  }
  function blank(dt = 120) { lines.push({ text: "", type: "dim", delay: t }); t += dt; }

  add("╔══════════════════════════════════════════╗", "dim", 0);
  add("║   UNIVERSAL SECURITY SCANNER  v2.5      ║", "cmd", 0);
  add("║   Barcha ma'lumotlar faqat sizga ko'rin. ║", "dim", 0);
  add("╚══════════════════════════════════════════╝", "dim", 180);
  blank();

  // Browser
  add("$ ./scan --detect-system", "cmd", 80);
  add(`  > Brauzer    : ${d.browser}`, "ok", 160);
  add(`  > OS         : ${d.os}`, "ok", 160);
  add(`  > Platform   : ${d.platform}`, "info", 160);
  add(`  > Vaqt zonasi: ${d.timezone}`, "info", 160);
  add(`  > Til        : ${d.language} | ${d.languages}`, "info", 200);
  add(`  > Ekran      : ${d.screen.w}x${d.screen.h} @ ${d.screen.dpr}x DPR`, "info", 200);
  blank();

  // Cookies
  add("$ ./scan --cookies", "cmd", 80);
  if (d.cookies.length === 0) {
    add("  > JS tomonidan o'qiladigan cookie: 0 ta", "ok", 200);
    add("  > Auth token HTTPOnly -- JS ko'ra olmaydi   [XAVFSIZ ✓]", "ok", 220);
  } else {
    add(`  > ${d.cookies.length} ta cookie JS tomonidan o'qilmoqda!  [DIQQAT ⚠]`, "warn", 200);
    d.cookies.slice(0, 5).forEach((c) => add(`    - ${c.split("=")[0]}`, "dim", 100));
    if (d.cookies.length > 5) add(`    ... va yana ${d.cookies.length - 5} ta`, "dim", 100);
  }
  blank();

  // Fingerprint
  add("$ ./scan --fingerprint", "cmd", 80);
  add(`  > CPU yadrolari : ${d.hardware.cores ?? "?"}`, "info", 180);
  add(`  > RAM xotira   : ${d.hardware.memory ? d.hardware.memory + " GB" : "aniqlanmadi"}`, "info", 180);
  if (d.webgl) {
    add(`  > GPU (sotuvchi): ${d.webgl.vendor}`, "warn", 200);
    add(`  > GPU (model)   : ${d.webgl.renderer}`, "warn", 220);
    add("    ^ Bu ma'lumot saytlar tomonidan ko'rinmoqda!", "dim", 180);
  }
  if (d.canvasHash) {
    add(`  > Canvas barmoq izi : #${d.canvasHash}`, "danger", 280);
    add("    ^ Har sayt siz uchun NOYOB id olishi mumkin!", "dim", 180);
  }
  add(`  > Sensorli ekran    : ${d.hardware.touch ? `Ha (${d.hardware.touchPoints} nuqta)` : "Yo'q"}`, "info", 200);
  blank();

  // WebRTC
  add("$ ./scan --webrtc-leak  (4 soniya)...", "cmd", 80);
  if (d.rtcIPs.length > 0) {
    add(`  > [!!!] WebRTC orqali ${d.rtcIPs.length} ta IP aniqlandi!`, "danger", 300);
    d.rtcIPs.forEach((ip) => {
      const isLocal = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(ip);
      add(`    IP: ${ip}  ${isLocal ? "(ichki tarmoq)" : "(ommaviy IP!)"}`, isLocal ? "warn" : "danger", 220);
    });
    add("    ^ VPN ishlatayotgan bo'lsangiz ham haqiqiy IP ko'rinishi mumkin!", "warn", 200);
  } else {
    add("  > WebRTC sizib chiqishi topilmadi          [XAVFSIZ ✓]", "ok", 250);
  }
  blank();

  // Network
  add("$ ./scan --network", "cmd", 80);
  add(`  > Internet holati: ${d.online ? "Online ✓" : "Offline!"}`, d.online ? "ok" : "danger", 180);
  if (d.network) {
    add(`  > Ulanish turi   : ${d.network.type}`, "info", 180);
    add(`  > Tezlik         : ${d.network.downlink ?? "?"} Mbps`, "info", 180);
    add(`  > Kechikish (RTT): ${d.network.rtt ?? "?"} ms`, "info", 200);
  } else {
    add("  > Tarmoq API qo'llab-quvvatlanmaydi", "dim", 200);
  }
  blank();

  // Storage
  add("$ ./scan --local-storage", "cmd", 80);
  add(`  > localStorage  : ${d.storage.lsCount} ta element`, d.storage.lsCount > 5 ? "warn" : "ok", 200);
  if (d.storage.lsKeys.length > 0) {
    d.storage.lsKeys.slice(0, 6).forEach((k) => add(`    - "${k}"`, "dim", 80));
    if (d.storage.lsKeys.length > 6) add(`    ... va yana ${d.storage.lsKeys.length - 6} ta`, "dim", 80);
  }
  add(`  > sessionStorage : ${d.storage.ssCount} ta element`, "info", 200);
  add(`  > Brauzer tarixi : ${d.historyLength} sahifa (URL manzillar ko'rinmaydi)`, "ok", 220);
  blank();

  // Permissions
  add("$ ./scan --permissions", "cmd", 80);
  const pLabels = { camera: "Kamera", microphone: "Mikrofon", notifications: "Bildirishnomalar", geolocation: "Joylashuv" };
  if (Object.keys(d.permissions).length === 0) {
    add("  > Ruxsatlar tekshirilmadi (brauzer bloklab turishi mumkin)", "dim", 200);
  }
  Object.entries(d.permissions).forEach(([k, v]) => {
    const label = pLabels[k] || k;
    const t2 = v === "granted" ? "warn" : v === "denied" ? "ok" : "info";
    const sym = v === "granted" ? "⚠ RUXSAT BERILGAN" : v === "denied" ? "✓ BLOKLANGAN" : "○ So'ralishi mumkin";
    add(`  > ${label.padEnd(20)}: ${sym}`, t2, 180);
  });
  add(`  > Do Not Track  : ${d.dnt === "1" ? "Yoqiq  ✓" : "O'chiq ⚠"}`, d.dnt === "1" ? "ok" : "warn", 200);
  blank();

  // Battery
  if (d.battery) {
    add("$ ./scan --battery", "cmd", 80);
    add(`  > Batareya: ${d.battery.level}% (${d.battery.charging ? "zaryadlanmoqda ⚡" : "batareyada 🔋"})`, "info", 200);
    add("    ^ Batareya darajasi foydalanuvchini kuzatish uchun ishlatilishi mumkin", "dim", 180);
    blank();
  }

  // Plugins
  if (d.plugins.length > 0) {
    add("$ ./scan --plugins", "cmd", 80);
    d.plugins.slice(0, 5).forEach((p) => add(`  > ${p}`, "dim", 80));
    blank();
  }

  // Referrer
  add("$ ./scan --referrer", "cmd", 80);
  add(`  > Kelgan sahifa: ${d.referrer || "(yo'q yoki berkitilgan)"}`, d.referrer ? "warn" : "ok", 220);
  blank();

  // Final
  add("$ ./scan --analyze --generate-report", "cmd", 100);
  add("  > Ma'lumotlar tahlil qilinmoqda.......", "info", 600);
  add("  > Xavf darajasi hisoblanmoqda.........", "info", 600);
  add("  > Tavsiyalar tayyorlanmoqda...........", "info", 700);
  blank(200);
  add("═══════════════════════════════════════════", "cmd", 0);
  add("  ✓ SKANERLASH YAKUNLANDI", "ok", 0);
  add("═══════════════════════════════════════════", "cmd", 0);

  return lines;
}

// ─── Security scoring ─────────────────────────────────────────────────────────
function calcScore(d) {
  let score = 100;
  const findings = [];

  // Auth cookie HttpOnly (our token)
  if (d.cookies.length === 0) {
    findings.push({ level: "ok", cat: "cookie", title: "Auth cookie HTTPOnly", detail: "Tizimga kirish tokeningiz JS dan ko'rinmaydi — xavfsiz.", rec: null });
  } else {
    score -= 12;
    findings.push({ level: "warn", cat: "cookie", title: `${d.cookies.length} ta cookie aniqlandi`, detail: "Bu cookielar JavaScript orqali o'qilishi mumkin. XSS hujumi bo'lsa o'g'irlanishi mumkin.", rec: "Muhim saytlarda 'HttpOnly' flagli cookielardan foydalanishni talab qiling. Brauzeringizda 3rd-party cookielarni o'chiring." });
  }

  // Canvas fingerprint
  if (d.canvasHash) {
    score -= 18;
    findings.push({ level: "danger", cat: "fingerprint", title: `Canvas barmoq izi: #${d.canvasHash}`, detail: "Har bir qurilma/brauzer uchun noyob kod. Saytlar siz kirmasdan ham sizni tanishi mumkin.", rec: "Firefox ishlatib 'privacy.resistFingerprinting = true' yoqing. Yoki Brave brauzerini sinab ko'ring. uBlock Origin extensioni o'rnating." });
  }

  // WebGL
  if (d.webgl) {
    score -= 10;
    findings.push({ level: "warn", cat: "fingerprint", title: `GPU ma'lumotlari ko'rinmoqda`, detail: `Sotuvchi: ${d.webgl.vendor}\nModel: ${d.webgl.renderer}\nBu ma'lumot qurilmangizni aniq identifikatsiya qiladi.`, rec: "Brauzer kengaytmalaridan 'WebGL Fingerprint Defender' o'rnating." });
  }

  // WebRTC
  if (d.rtcIPs.length > 0) {
    const hasPublic = d.rtcIPs.some(ip => !/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(ip));
    score -= hasPublic ? 25 : 12;
    findings.push({
      level: "danger", cat: "network",
      title: `WebRTC IP sizib chiqishi aniqlandi`,
      detail: `Aniqlangan IP manzillar: ${d.rtcIPs.join(", ")}\n${hasPublic ? "Ommaviy IP manzillar ko'rinmoqda — VPN ishlatayotgan bo'lsangiz ham xaqiqiy IP ko'rinishi mumkin!" : "Ichki tarmoq IP ko'rinmoqda."}`,
      rec: "Firefox: about:config da 'media.peerconnection.enabled = false' qiling.\nChrome: WebRTC Control extensionini o'rnating.\nYoki WebRTC ni qo'llab-quvvatlaydigan VPN ishlating.",
    });
  } else {
    findings.push({ level: "ok", cat: "network", title: "WebRTC IP sizib chiqishi yo'q", detail: "WebRTC orqali IP manzillar aniqlashga urinildi — topilmadi.", rec: null });
  }

  // DNT
  if (d.dnt !== "1") {
    score -= 6;
    findings.push({ level: "warn", cat: "privacy", title: "Do Not Track o'chiq", detail: "Saytlarga kuzatmaslik so'rovini yuborish ixtiyoriy — ko'p saytlar buni e'tiborsiz qoldiradi, lekin yoqib qo'yish yaxshi.", rec: "Brauzer Sozlamalari → Maxfiylik → 'Do Not Track' yoqing." });
  } else {
    findings.push({ level: "ok", cat: "privacy", title: "Do Not Track yoqiq", detail: "Brauzeringiz saytlarga kuzatmaslik signali yubormoqda.", rec: null });
  }

  // Permissions
  const pLabels = { camera: "Kamera", microphone: "Mikrofon", notifications: "Bildirishnomalar", geolocation: "Joylashuv" };
  Object.entries(d.permissions).forEach(([k, v]) => {
    if (v === "granted") {
      score -= 7;
      findings.push({ level: "warn", cat: "permission", title: `${pLabels[k] || k} ruxsati berilgan`, detail: "Bu sahifa qurilmangizning ushbu imkoniyatiga kirish huquqiga ega.", rec: `Kerak bo'lmasa Brauzer sozlamalarida ushbu sayt uchun ${pLabels[k] || k} ruxsatini bekor qiling.` });
    } else if (v === "denied") {
      findings.push({ level: "ok", cat: "permission", title: `${pLabels[k] || k} bloklangan`, detail: "Bu ruxsat berilmagan — xavfsiz.", rec: null });
    }
  });

  // Hardware info
  findings.push({
    level: "warn", cat: "fingerprint",
    title: `Qurilma parametrlari ko'rinmoqda`,
    detail: `CPU yadrolari: ${d.hardware.cores ?? "?"}\nRAM: ${d.hardware.memory ?? "?"} GB\nEkran: ${d.screen.w}x${d.screen.h} @ ${d.screen.dpr}x\nBu ma'lumotlar kombinatsiyasi noyob barmoq izi yaratadi.`,
    rec: "Barmoq izini to'liq to'xtatib bo'lmaydi, lekin Brave/Firefox + uBlock Origin bilan kamaytiriladi.",
  });
  score -= 8;

  // Browser history length
  findings.push({ level: "ok", cat: "storage", title: `Brauzer tarixi: ${d.historyLength} sahifa`, detail: "URL manzillar Same-Origin Policy tufayli ko'rinmaydi. Faqat soni ko'rinmoqda.", rec: null });

  // Storage
  if (d.storage.lsCount > 0) {
    findings.push({ level: "info", cat: "storage", title: `LocalStorage: ${d.storage.lsCount} ta element`, detail: `Bu saytda saqlangan kalitlar: ${d.storage.lsKeys.slice(0, 5).join(", ")}${d.storage.lsKeys.length > 5 ? "..." : ""}`, rec: null });
  } else {
    findings.push({ level: "ok", cat: "storage", title: "LocalStorage bo'sh", detail: "Bu sayt hech qanday ma'lumot mahalliy saqlamagan.", rec: null });
  }

  return { score: Math.max(0, Math.min(100, score)), findings };
}

// ─── Color helpers ────────────────────────────────────────────────────────────
const LINE_COLORS = {
  cmd: "#00e5ff", ok: "#00ff41", warn: "#fbbf24",
  danger: "#ff4444", info: "#7dff7d", dim: "#2a7a2a",
};
const LEVEL_COLORS = { ok: "#34d399", warn: "#fbbf24", danger: "#f87171", info: "#6c8cff" };
const LEVEL_BG = { ok: "rgba(52,211,153,.1)", warn: "rgba(251,191,36,.1)", danger: "rgba(248,113,113,.1)", info: "rgba(108,140,255,.1)" };
const LEVEL_BORDER = { ok: "rgba(52,211,153,.35)", warn: "rgba(251,191,36,.35)", danger: "rgba(248,113,113,.35)", info: "rgba(108,140,255,.3)" };
const LEVEL_LABEL = { ok: "XAVFSIZ", warn: "DIQQAT", danger: "XAVFLI", info: "MA'LUMOT" };
const LEVEL_ICON = { ok: "✓", warn: "⚠", danger: "⛔", info: "ℹ" };

const CAT_ICONS = {
  cookie: "🍪", fingerprint: "👤", network: "🌐",
  privacy: "🔒", permission: "📱", storage: "💾", other: "🔍",
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SecurityPage() {
  const [phase, setPhase] = useState("idle"); // idle | collecting | scanning | done
  const [lines, setLines] = useState([]);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const terminalRef = useRef(null);
  const timersRef = useRef([]);

  function clearTimers() { timersRef.current.forEach(clearTimeout); timersRef.current = []; }

  useEffect(() => () => clearTimers(), []);

  const startScan = useCallback(async () => {
    setPhase("collecting");
    setLines([]);
    setResult(null);
    setProgress(0);

    // Collect data
    const data = await collectAll();

    // Build script
    const script = buildScript(data);
    const totalDuration = script.reduce((mx, l) => Math.max(mx, l.delay), 0) + 1500;

    setPhase("scanning");

    // Play lines
    script.forEach((line) => {
      const t = setTimeout(() => {
        setLines((prev) => [...prev, line]);
        setProgress(Math.round((line.delay / totalDuration) * 90));
        terminalRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
      }, line.delay);
      timersRef.current.push(t);
    });

    // Show results after last line
    const endT = setTimeout(() => {
      setProgress(100);
      setResult(calcScore(data));
      setPhase("done");
    }, totalDuration);
    timersRef.current.push(endT);
  }, []);

  // ── IDLE ──────────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div style={{ maxWidth: 640 }}>
        <h1 className="page-title">Xavfsizlik tekshiruvi</h1>
        <p className="page-sub">Brauzeringiz orqali ko'rinadigan barcha ma'lumotlarni ko'ring.</p>

        <div className="card" data-stagger="1" style={{
          background: "linear-gradient(135deg,#0a1628,#0d1e3d)",
          border: "1px solid rgba(0,229,255,.2)",
          textAlign: "center", padding: "48px 32px",
        }}>
          <div style={{ fontSize: 72, marginBottom: 20, filter: "drop-shadow(0 0 20px rgba(0,229,255,.5))", animation: "robot-float 3s ease-in-out infinite" }}>🛡️</div>
          <h2 style={{ margin: "0 0 12px", background: "linear-gradient(135deg,#00e5ff,#00ff41)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            Xavfsizlik skaneri
          </h2>
          <p className="muted" style={{ margin: "0 0 32px", lineHeight: 1.7, maxWidth: 420, margin: "0 auto 32px" }}>
            Brauzeringiz orqali ko'rish mumkin bo'lgan ma'lumotlarni skanerlaydi:{" "}
            <b style={{ color: "var(--text)" }}>cookie, IP manzillar, barmoq izi, qurilma, ruxsatlar</b> va boshqalar.
            Hech qanday ma'lumot server ga yuborilmaydi.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 32 }}>
            {["🍪 Cookie", "👤 Barmoq izi", "🌐 IP manzil", "🖥️ Qurilma", "🔒 Ruxsatlar", "💾 Saqlash"].map((t) => (
              <span key={t} style={{ padding: "5px 12px", borderRadius: 999, border: "1px solid rgba(0,229,255,.25)", fontSize: 13, color: "#00e5ff", background: "rgba(0,229,255,.05)" }}>{t}</span>
            ))}
          </div>

          <button
            className="btn"
            style={{
              background: "linear-gradient(135deg,#00e5ff,#00ff41)",
              color: "#000", fontWeight: 800, fontSize: 16,
              padding: "14px 40px", width: "auto",
              boxShadow: "0 0 30px rgba(0,229,255,.4)",
            }}
            onClick={startScan}
          >
            ▶ Skanerlashni boshlash
          </button>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 16 }}>
            Ma'lumotlar faqat sizning brauzeringizda qayta ishlanadi. Hech qaerga saqlanmaydi.
          </p>
        </div>
      </div>
    );
  }

  // ── COLLECTING ────────────────────────────────────────────────────────────
  if (phase === "collecting") {
    return (
      <div style={{ maxWidth: 640 }}>
        <h1 className="page-title">Xavfsizlik tekshiruvi</h1>
        <div className="card" style={{ textAlign: "center", padding: 60, background: "#000" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid #00ff41", borderTopColor: "transparent", animation: "spin .7s linear infinite", margin: "0 auto 20px" }} />
          <p style={{ color: "#00ff41", fontFamily: "Courier New", margin: 0 }}>Ma'lumotlar yig'ilmoqda (WebRTC tekshirish ~4 soniya)...</p>
        </div>
      </div>
    );
  }

  // ── SCANNING ──────────────────────────────────────────────────────────────
  if (phase === "scanning" || phase === "done") {
    const score = result?.score ?? 0;
    const scoreColor = score >= 80 ? "#00ff41" : score >= 55 ? "#fbbf24" : "#ff4444";
    const scoreLabel = score >= 80 ? "YAXSHI" : score >= 55 ? "O'RTACHA" : "XAVFLI";

    return (
      <div style={{ maxWidth: 840 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <h1 className="page-title" style={{ margin: 0 }}>Xavfsizlik tekshiruvi</h1>
          {phase === "done" && (
            <button
              onClick={() => { clearTimers(); setPhase("idle"); setLines([]); setResult(null); }}
              className="btn auto"
              style={{ fontSize: 13, padding: "7px 16px", width: "auto", background: "var(--card2)", border: "1px solid var(--line)" }}
            >
              ↺ Qayta skanerlash
            </button>
          )}
        </div>
        <p className="page-sub">Brauzeringiz orqali ko'rinadigan ma'lumotlar</p>

        {/* Terminal */}
        <div style={{
          background: "#000", border: "1px solid #00ff4133",
          borderRadius: 14, marginBottom: 20, overflow: "hidden",
          boxShadow: "0 0 40px rgba(0,255,65,.08)",
        }}>
          {/* Terminal titlebar */}
          <div style={{ background: "#0a0a0a", borderBottom: "1px solid #00ff4122", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
            <span style={{ flex: 1, textAlign: "center", fontSize: 12, color: "#2a7a2a", fontFamily: "Courier New" }}>
              universal-security-scanner — bash
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, background: "#0a1a0a" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg,#00ff41,#00e5ff)", width: `${progress}%`, transition: "width .3s ease", boxShadow: "0 0 8px #00ff41" }} />
          </div>

          {/* Lines */}
          <div
            ref={terminalRef}
            style={{ padding: "16px 20px", maxHeight: 440, overflowY: "auto", fontFamily: "'Courier New',monospace", fontSize: 13, lineHeight: 1.8 }}
            className="sec-terminal"
          >
            {lines.map((l, i) => (
              <div key={i} style={{ color: LINE_COLORS[l.type] || "#00ff41", whiteSpace: "pre-wrap", animation: "sec-line-in .15s ease both" }}>
                {l.text}
              </div>
            ))}
            {phase === "scanning" && (
              <span style={{ color: "#00ff41", animation: "hk-cursor-blink .6s step-end infinite" }}>_</span>
            )}
          </div>
        </div>

        {/* Results */}
        {phase === "done" && result && (
          <div style={{ animation: "float-up .5s ease both" }}>
            {/* Score */}
            <div className="card" style={{ background: "linear-gradient(135deg,#0a1628,#0d1e3d)", border: `1px solid ${scoreColor}44`, marginBottom: 16, textAlign: "center", padding: "28px 24px" }}>
              <div style={{ fontSize: 12, color: "var(--muted)", letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>Umumiy xavfsizlik balli</div>
              <div style={{ fontSize: 64, fontWeight: 900, color: scoreColor, fontFamily: "Courier New", filter: `drop-shadow(0 0 20px ${scoreColor})`, lineHeight: 1 }}>
                {score}
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>/100</div>
              <div style={{ marginTop: 12, fontSize: 15, fontWeight: 700, color: scoreColor, letterSpacing: 2 }}>
                {scoreLabel}
              </div>
              <div style={{ marginTop: 16, height: 8, background: "rgba(255,255,255,.08)", borderRadius: 999, overflow: "hidden", maxWidth: 300, margin: "16px auto 0" }}>
                <div style={{ height: "100%", width: `${score}%`, background: `linear-gradient(90deg,${scoreColor},${scoreColor}99)`, borderRadius: 999, transition: "width 1s ease", boxShadow: `0 0 10px ${scoreColor}` }} />
              </div>
            </div>

            {/* Findings */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {result.findings.map((f, i) => (
                <div
                  key={i}
                  className="card"
                  style={{
                    border: `1px solid ${LEVEL_BORDER[f.level]}`,
                    background: LEVEL_BG[f.level],
                    animation: `float-up .4s ease both`,
                    animationDelay: `${i * 55}ms`,
                    padding: "14px 18px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: f.detail ? 8 : 0 }}>
                    <span style={{ fontSize: 18 }}>{CAT_ICONS[f.cat] || "🔍"}</span>
                    <span style={{ fontWeight: 700, flex: 1 }}>{f.title}</span>
                    <span style={{
                      padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                      background: LEVEL_BG[f.level], color: LEVEL_COLORS[f.level],
                      border: `1px solid ${LEVEL_BORDER[f.level]}`, letterSpacing: 1,
                      flexShrink: 0,
                    }}>
                      {LEVEL_ICON[f.level]} {LEVEL_LABEL[f.level]}
                    </span>
                  </div>
                  {f.detail && (
                    <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--muted)", lineHeight: 1.6, whiteSpace: "pre-line", paddingLeft: 28 }}>
                      {f.detail}
                    </p>
                  )}
                  {f.rec && (
                    <div style={{ marginLeft: 28, padding: "8px 12px", borderRadius: 8, background: "rgba(108,140,255,.08)", border: "1px solid rgba(108,140,255,.2)", fontSize: 12, color: "var(--accent)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                      💡 {f.rec}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer note */}
            <div className="card" style={{ marginTop: 16, background: "rgba(52,211,153,.05)", border: "1px solid rgba(52,211,153,.2)", fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
              ✅ Hech qanday ma'lumot serverga yuborilmadi. Barcha tahlil faqat sizning qurilmangizda amalga oshirildi.
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
