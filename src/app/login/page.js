"use client";

import { useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const HandScanner = lazy(() => import("@/components/HandScanner"));

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("credentials"); // "credentials" | "hand-scan"
  const [pendingToken, setPendingToken] = useState("");

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

      router.replace("/dashboard");
      router.refresh();
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
      router.replace("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e.message);
      setStep("hand-scan-retry");
      setLoading(false);
    }
  }

  if (step === "hand-scan" || step === "hand-scan-retry") {
    return (
      <div className="auth-wrap">
        <div className="card auth-card" style={{ maxWidth: 480 }}>
          <div className="center" style={{ marginBottom: 18 }}>
            <div className="brand">Universal</div>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              2-bosqich: Qo'l skaneri
            </p>
          </div>

          <div
            style={{
              background: "var(--bg2)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 14,
              marginBottom: 16,
              color: "var(--muted)",
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <span style={{ fontSize: 20 }}>✋</span>
            <span>
              Kameraga qo'lingizni to'liq oching — 5 barmoqni ham ko'rsating. Skaner avtomatik
              tanib oladi.
            </span>
          </div>

          {error && <div className="error">{error}</div>}

          {step === "hand-scan-retry" ? (
            <div style={{ textAlign: "center" }}>
              <button className="btn" onClick={() => { setError(""); setStep("hand-scan"); }}>
                Qaytadan urinish
              </button>
              <button
                className="btn ghost"
                style={{ marginTop: 10 }}
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
