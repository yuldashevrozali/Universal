"use client";

import { useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const HandScanner = lazy(() => import("@/components/HandScanner"));
const HackerIntro = lazy(() => import("@/components/HackerIntro"));

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("credentials"); // credentials | hand-scan | hand-retry | hacker
  const [pendingToken, setPendingToken] = useState("");

  function goToDashboard() {
    router.replace("/dashboard");
    router.refresh();
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xatolik");

      if (data.requireHandScan) {
        setPendingToken(data.pendingToken);
        setStep("hand-scan");
        setLoading(false);
        return;
      }

      setStep("hacker");
      setLoading(false);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  async function onHandScan(landmarks) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/hand-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, landmarks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xatolik");
      setStep("hacker");
      setLoading(false);
    } catch (e) {
      setError(e.message);
      setStep("hand-retry");
      setLoading(false);
    }
  }

  // ── Hacker animation screen ──
  if (step === "hacker") {
    return (
      <Suspense fallback={null}>
        <HackerIntro onDone={goToDashboard} />
      </Suspense>
    );
  }

  // ── Hand scan screen ──
  if (step === "hand-scan" || step === "hand-retry") {
    return (
      <div className="auth-wrap">
        <div className="card auth-card" style={{ maxWidth: 480 }}>
          <div className="center" style={{ marginBottom: 18 }}>
            <div className="brand">Universal</div>
            <p className="muted" style={{ margin: "6px 0 0" }}>2-bosqich: Qo'l skaneri</p>
          </div>

          <div
            style={{
              background: "var(--bg2)", border: "1px solid var(--line)",
              borderRadius: 12, padding: "12px 16px", fontSize: 14,
              marginBottom: 16, color: "var(--muted)",
              display: "flex", gap: 10, alignItems: "flex-start",
            }}
          >
            <span style={{ fontSize: 20 }}>✋</span>
            <span>
              Kameraga qo'lingizni to'liq oching — 5 barmoqni ham ko'rsating va{" "}
              <b style={{ color: "var(--text)" }}>10 soniya ushlang</b>.
              Skaner avtomatik tanib oladi.
            </span>
          </div>

          {error && <div className="error">{error}</div>}

          {step === "hand-retry" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button className="btn" onClick={() => { setError(""); setStep("hand-scan"); }}>
                ✋ Qaytadan urinish
              </button>
              <button
                className="btn ghost"
                onClick={() => { setStep("credentials"); setError(""); }}
              >
                Parol bilan qaytish
              </button>
            </div>
          ) : (
            <Suspense fallback={<p className="center muted">Yuklanmoqda...</p>}>
              <HandScanner
                title="Qo'lingizni ko'rsating"
                onScan={onHandScan}
                onCancel={() => { setStep("credentials"); setError(""); }}
              />
            </Suspense>
          )}
        </div>
      </div>
    );
  }

  // ── Credentials screen ──
  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div className="center" style={{ marginBottom: 22 }}>
          <div className="brand">Universal</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>Hisobingizga kiring</p>
        </div>
        {error && <div className="error">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Nomer</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
            />
          </div>
          <div className="field">
            <label>Parol</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button className="btn" disabled={loading}>
            {loading ? "Kirilmoqda..." : "Kirish"}
          </button>
        </form>
        <p className="center muted mt">
          Hisobingiz yo'qmi?{" "}
          <Link href="/register" style={{ color: "var(--accent)" }}>
            Ro'yxatdan o'tish
          </Link>
        </p>
      </div>
    </div>
  );
}
