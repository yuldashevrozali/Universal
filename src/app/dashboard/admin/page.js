"use client";

import { useCallback, useEffect, useState } from "react";

const ADMIN_PHONE = "+998912038995";

function relativeTime(date) {
  if (!date) return "Hech qachon";
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return "Hozir onlayn";
  if (min < 60) return `${min} daqiqa oldin`;
  if (hr < 24) return `${hr} soat oldin`;
  if (day === 1) return "Kecha";
  if (day < 7) return `${day} kun oldin`;
  return new Date(date).toLocaleDateString("uz", { day: "numeric", month: "short", year: "numeric" });
}

function isOnline(date) {
  if (!date) return false;
  return Date.now() - new Date(date).getTime() < 5 * 60 * 1000;
}

function initials(name) {
  return (name || "?").trim().split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function avatarColor(name) {
  const colors = ["#6c8cff", "#9b6cff", "#34d399", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];
  let hash = 0;
  for (const c of (name || "")) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null); // { type: "block"|"unblock"|"delete", user }
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async (search = q) => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(search)}`);
    if (res.status === 403) { setUsers(null); setLoading(false); return; }
    if (res.ok) setUsers((await res.json()).users);
    setLoading(false);
  }, [q]);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setTimeout(() => load(q), 280);
    return () => clearTimeout(t);
  }, [q]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }

  async function doBlock(user, blocked) {
    setActionLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id || user._id, blocked }),
    });
    setActionLoading(false);
    setConfirm(null);
    if (res.ok) {
      setUsers(u => u.map(x => (x._id === (user.id || user._id) || x.id === (user.id || user._id))
        ? { ...x, blocked } : x));
      showToast(blocked ? `${user.name} bloklandi` : `${user.name} blokdan chiqarildi`);
    }
  }

  async function doDelete(user) {
    setActionLoading(true);
    await fetch(`/api/admin/users?id=${user.id || user._id}`, { method: "DELETE" });
    setActionLoading(false);
    setConfirm(null);
    setUsers(u => u.filter(x => x._id !== (user.id || user._id) && x.id !== (user.id || user._id)));
    showToast(`${user.name} o'chirildi`);
  }

  if (users === null) {
    return (
      <div>
        <h1 className="page-title">Admin panel</h1>
        <div className="card" style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🚫</div>
          <h2 style={{ margin: "0 0 8px" }}>Ruxsat yo'q</h2>
          <p className="muted">Bu sahifa faqat administrator uchun.</p>
        </div>
      </div>
    );
  }

  const total = users.length;
  const active = users.filter(u => !u.blocked).length;
  const blocked = users.filter(u => u.blocked).length;
  const online = users.filter(u => isOnline(u.lastSeen)).length;

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 999,
          background: "var(--card2)", border: "1px solid var(--line)",
          padding: "12px 20px", borderRadius: 12, fontWeight: 600,
          animation: "float-up .3s ease both",
          boxShadow: "0 8px 24px rgba(0,0,0,.4)",
        }}>
          ✓ {toast}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Admin panel</h1>
        <span style={{
          padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
          background: "rgba(251,191,36,.15)", color: "var(--yellow)",
          border: "1px solid rgba(251,191,36,.35)", letterSpacing: 1,
        }}>👑 ADMIN</span>
      </div>
      <p className="page-sub">Foydalanuvchilar boshqaruvi</p>

      {/* Stats */}
      <div className="grid grid-2" style={{ marginBottom: 20, gridTemplateColumns: "repeat(4, 1fr)" }}>
        {[
          { label: "Jami",    val: total,   color: "var(--accent)",  icon: "👥" },
          { label: "Faol",    val: active,  color: "var(--green)",   icon: "✅" },
          { label: "Bloklangan", val: blocked, color: "var(--red)", icon: "🚫" },
          { label: "Onlayn",  val: online,  color: "#34d399",        icon: "🟢" },
        ].map((s, i) => (
          <div key={s.label} className="card" data-stagger={i + 1}
            style={{ textAlign: "center", padding: "16px 12px" }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="card" data-stagger="5">
        <div style={{ marginBottom: 16 }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="🔍  Ism, username yoki nomer bo'yicha qidirish..."
            style={{ background: "var(--bg2)" }}
          />
        </div>

        {loading && (
          <div style={{ padding: "20px 0", textAlign: "center" }}>
            <div className="admin-spinner" />
          </div>
        )}

        {!loading && users.length === 0 && (
          <p className="muted" style={{ textAlign: "center", padding: "20px 0" }}>
            Foydalanuvchi topilmadi
          </p>
        )}

        {!loading && users.map((u, i) => {
          const online = isOnline(u.lastSeen);
          const color = avatarColor(u.name);
          return (
            <div
              key={u._id || u.id}
              className="admin-user-row"
              style={{ animationDelay: `${i * 40}ms`, opacity: u.blocked ? 0.6 : 1 }}
            >
              {/* Avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                background: `linear-gradient(135deg, ${color}, ${color}99)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, color: "#fff", fontSize: 16, position: "relative",
              }}>
                {initials(u.name)}
                <span style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 12, height: 12, borderRadius: "50%", border: "2px solid var(--card)",
                  background: online ? "var(--green)" : u.blocked ? "var(--red)" : "var(--muted)",
                }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700 }}>{u.name}</span>
                  {u.username && <span className="muted" style={{ fontSize: 13 }}>@{u.username}</span>}
                  {u.blocked && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                      background: "rgba(248,113,113,.15)", color: "var(--red)",
                      border: "1px solid rgba(248,113,113,.3)",
                    }}>BLOKLANGAN</span>
                  )}
                  {u.handScanEnabled && (
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 999,
                      background: "rgba(108,140,255,.12)", color: "var(--accent)",
                      border: "1px solid rgba(108,140,255,.25)",
                    }}>✋ Skaner</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                  {u.phone}
                </div>
              </div>

              {/* Last seen */}
              <div style={{ flexShrink: 0, textAlign: "right", minWidth: 120 }}>
                <div style={{
                  fontSize: 12, fontWeight: 600,
                  color: online ? "var(--green)" : "var(--muted)",
                }}>
                  {online && <span style={{ marginRight: 4 }}>●</span>}
                  {relativeTime(u.lastSeen)}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  Ro'yxatdan:{" "}
                  {new Date(u.createdAt).toLocaleDateString("uz", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  className="btn auto"
                  style={{
                    fontSize: 12, padding: "7px 14px", width: "auto",
                    background: u.blocked
                      ? "linear-gradient(135deg,var(--green),#059669)"
                      : "linear-gradient(135deg,var(--red),#b91c1c)",
                  }}
                  onClick={() => setConfirm({ type: u.blocked ? "unblock" : "block", user: u })}
                >
                  {u.blocked ? "✓ Blokdan chiqar" : "🚫 Bloklash"}
                </button>
                <button
                  className="btn auto"
                  style={{
                    fontSize: 12, padding: "7px 12px", width: "auto",
                    background: "var(--card2)", border: "1px solid var(--line)", color: "var(--muted)",
                  }}
                  onClick={() => setConfirm({ type: "delete", user: u })}
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div className="modal-backdrop" onClick={() => !actionLoading && setConfirm(null)}>
          <div className="modal sheet-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>
                {confirm.type === "delete" ? "🗑️" : confirm.type === "block" ? "🚫" : "✅"}
              </div>
              <h3 style={{ margin: "0 0 8px" }}>
                {confirm.type === "delete"
                  ? "O'chirishni tasdiqlang"
                  : confirm.type === "block"
                  ? "Bloklashni tasdiqlang"
                  : "Blokdan chiqarishni tasdiqlang"}
              </h3>
              <p className="muted" style={{ margin: "0 0 20px" }}>
                <b style={{ color: "var(--text)" }}>{confirm.user.name}</b>{" "}
                {confirm.type === "delete"
                  ? "foydalanuvchisi butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi."
                  : confirm.type === "block"
                  ? "foydalanuvchisi bloklanadi. Login qila olmaydi."
                  : "foydalanuvchisi blokdan chiqariladi."}
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn secondary"
                  disabled={actionLoading}
                  onClick={() => setConfirm(null)}
                  style={{ flex: 1 }}
                >
                  Bekor qilish
                </button>
                <button
                  className="btn"
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    background: confirm.type === "delete" || confirm.type === "block"
                      ? "linear-gradient(135deg,var(--red),#b91c1c)"
                      : "linear-gradient(135deg,var(--green),#059669)",
                  }}
                  onClick={() => {
                    if (confirm.type === "delete") doDelete(confirm.user);
                    else doBlock(confirm.user, confirm.type === "block");
                  }}
                >
                  {actionLoading ? "⏳" : confirm.type === "delete" ? "O'chirish" : confirm.type === "block" ? "Bloklash" : "Chiqarish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
