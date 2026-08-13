"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function submit(e) {
        e.preventDefault();
        setError("");
        if (!password || password.length < 6) return setError("Parol kamida 6 ta belgidan bo'lishi kerak");
        if (password !== confirm) return setError("Parollar mos emas");
        setLoading(true);
        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword: password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Xatolik');
            router.replace('/dashboard');
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
                    <p className="muted" style={{ margin: "6px 0 0" }}>Birinchi kirishda parolni yangilang</p>
                </div>
                {error && <div className="error">{error}</div>}
                <form onSubmit={submit}>
                    <div className="field">
                        <label>Yangi parol</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Yangi parol" />
                    </div>
                    <div className="field">
                        <label>Parolni takrorlash</label>
                        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Takrorlash" />
                    </div>
                    <button className="btn" disabled={loading}>{loading ? 'Yozilmoqda...' : 'Yangilash'}</button>
                </form>
            </div>
        </div>
    );
}
