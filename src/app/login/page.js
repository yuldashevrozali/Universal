"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      router.replace("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
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
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
          </div>
          <div className="field">
            <label>Parol</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button className="btn" disabled={loading}>{loading ? "Kirilmoqda..." : "Kirish"}</button>
        </form>
        <p className="center muted mt">
          Hisobingiz yo'qmi? <Link href="/register" style={{ color: "var(--accent)" }}>Ro'yxatdan o'tish</Link>
        </p>
      </div>
    </div>
  );
}
