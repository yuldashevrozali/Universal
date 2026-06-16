"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
          <p className="muted" style={{ margin: "6px 0 0" }}>Yangi hisob yarating</p>
        </div>
        {error && <div className="error">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Ism</label>
            <input value={form.name} onChange={set("name")} placeholder="Ismingiz" />
          </div>
          <div className="field">
            <label>Nomer</label>
            <input value={form.phone} onChange={set("phone")} placeholder="+998 90 123 45 67" />
          </div>
          <div className="field">
            <label>Username <span className="muted">(ixtiyoriy)</span></label>
            <input value={form.username} onChange={set("username")} placeholder="@username" />
          </div>
          <div className="field">
            <label>Parol</label>
            <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••" />
          </div>
          <button className="btn" disabled={loading}>{loading ? "Yaratilmoqda..." : "Ro'yxatdan o'tish"}</button>
        </form>
        <p className="center muted mt">
          Hisobingiz bormi? <Link href="/login" style={{ color: "var(--accent)" }}>Kirish</Link>
        </p>
      </div>
    </div>
  );
}
