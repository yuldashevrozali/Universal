"use client";

import { useState, useEffect, lazy, Suspense } from "react";

const HandScanner = lazy(() => import("@/components/HandScanner"));

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setName(d.user.name || "");
          setUsername(d.user.username || "");
        }
      });
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username }),
    });
    const d = await res.json();
    setSaving(false);
    if (res.ok) {
      setUser((u) => ({ ...u, name: d.user.name, username: d.user.username }));
      setMsg("Saqlandi!");
      setTimeout(() => setMsg(""), 2500);
    } else {
      setMsg(d.error || "Xatolik");
    }
  }

  async function toggleHandScan() {
    if (!user) return;
    if (!user.handScanEnabled) {
      setShowScanner(true);
    } else {
      setScanLoading(true);
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handScanEnabled: false }),
      });
      if (res.ok) setUser((u) => ({ ...u, handScanEnabled: false }));
      setScanLoading(false);
    }
  }

  async function onScan(landmarks) {
    setShowScanner(false);
    setScanLoading(true);
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handScanEnabled: true, handLandmarks: landmarks }),
    });
    if (res.ok) {
      setUser((u) => ({ ...u, handScanEnabled: true }));
      setMsg("Qo'l skaneri yoqildi!");
      setTimeout(() => setMsg(""), 3000);
    }
    setScanLoading(false);
  }

  if (!user) {
    return (
      <div>
        <h1 className="page-title">Sozlamalar</h1>
        <p className="muted">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 className="page-title">Sozlamalar</h1>
      <p className="page-sub">Profil va xavfsizlik sozlamalari</p>

      {msg && (
        <div
          style={{
            background: msg.includes("Xato") ? "#2a1620" : "#0d2a1e",
            border: `1px solid ${msg.includes("Xato") ? "#5b2230" : "#1a5c3a"}`,
            color: msg.includes("Xato") ? "#ffb4c0" : "var(--green)",
            padding: "10px 14px",
            borderRadius: 10,
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {msg}
        </div>
      )}

      {/* Profil tahrirlash */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 17 }}>Profil</h2>
        <form onSubmit={saveProfile}>
          <div className="field">
            <label>Ism</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ismingiz" />
          </div>
          <div className="field">
            <label>Username</label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--muted)",
                }}
              >
                @
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                placeholder="username"
                style={{ paddingLeft: 26 }}
              />
            </div>
          </div>
          <div className="field">
            <label>Telefon</label>
            <input value={user.phone} disabled style={{ opacity: 0.5 }} />
          </div>
          <button className="btn" disabled={saving}>
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </form>
      </div>

      {/* Xavfsizlik */}
      <div className="card">
        <h2 style={{ margin: "0 0 16px", fontSize: 17 }}>Xavfsizlik</h2>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Login skaneri</div>
            <div style={{ fontSize: 13, color: "var(--muted)", maxWidth: 300 }}>
              Boshqa qurilmadan kirganingizda kamera orqali qo'lingiz skanerlanadi. 5 barmoqni
              ochiq ko'rsatish kerak bo'ladi.
            </div>
            {user.handScanEnabled && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "var(--green)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>●</span> Faol — qo'l naqshi saqlangan
              </div>
            )}
          </div>

          <button
            onClick={toggleHandScan}
            disabled={scanLoading}
            style={{
              flexShrink: 0,
              width: 52,
              height: 28,
              borderRadius: 14,
              border: "none",
              background: user.handScanEnabled
                ? "linear-gradient(135deg, var(--accent), var(--accent2))"
                : "var(--card2)",
              position: "relative",
              cursor: scanLoading ? "wait" : "pointer",
              transition: "background 0.2s",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: user.handScanEnabled ? 27 : 3,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,.3)",
              }}
            />
          </button>
        </div>

        {user.handScanEnabled && (
          <button
            onClick={() => setShowScanner(true)}
            className="btn secondary"
            style={{ marginTop: 16, width: "auto", fontSize: 13 }}
          >
            ✋ Qo'l naqshini qayta o'rnatish
          </button>
        )}
      </div>

      {showScanner && (
        <Suspense fallback={null}>
          <HandScanner
            title="Qo'l naqshini skaner qiling"
            onScan={onScan}
            onCancel={() => setShowScanner(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
