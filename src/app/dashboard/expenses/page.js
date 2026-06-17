"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Summani "1 234 567 so'm" ko'rinishida formatlash
function fmtSom(n) {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString("ru-RU").replace(/ /g, " ") + " so'm";
}
function fmtNum(n) {
  return (Math.round(Number(n) || 0)).toLocaleString("ru-RU").replace(/ /g, " ");
}
function fmtDate(d) {
  return new Date(d).toLocaleString("uz", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const CATEGORIES = [
  { key: "Oziq-ovqat", icon: "🍔" },
  { key: "Transport", icon: "🚕" },
  { key: "Kvartira", icon: "🏠" },
  { key: "Kommunal", icon: "💡" },
  { key: "Kiyim", icon: "👕" },
  { key: "Sog'liq", icon: "💊" },
  { key: "O'yin-kulgi", icon: "🎮" },
  { key: "Ta'lim", icon: "📚" },
  { key: "Boshqa", icon: "📦" },
];
const INCOME_CATS = [
  { key: "Maosh", icon: "💼" },
  { key: "Biznes", icon: "📈" },
  { key: "Sovg'a", icon: "🎁" },
  { key: "Boshqa", icon: "💰" },
];

function catIcon(name) {
  return (
    CATEGORIES.find((c) => c.key === name)?.icon ||
    INCOME_CATS.find((c) => c.key === name)?.icon ||
    "📦"
  );
}

// Raqamni silliq sanab chiqadigan hook (count-up animatsiyasi)
function useCountUp(value, ms = 600) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number(value) || 0;
    const start = performance.now();
    cancelAnimationFrame(rafRef.current);

    function tick(now) {
      const p = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const cur = from + (to - from) * eased;
      setDisplay(cur);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, ms]);

  return display;
}

export default function ExpensesPage() {
  const [stats, setStats] = useState(null);
  const [mode, setMode] = useState(null); // null | "income" | "expense"
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(null); // balans o'zgarganda chaqnash

  const animatedBalance = useCountUp(stats?.balance ?? 0);

  const load = useCallback(async () => {
    const res = await fetch("/api/expenses");
    if (res.ok) setStats(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  function openForm(m) {
    setMode(m);
    setAmount("");
    setCategory("");
    setNote("");
    setErr("");
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    const amt = Number(amount.replace(/\s/g, ""));
    if (!Number.isFinite(amt) || amt <= 0) {
      setErr("Summani to'g'ri kiriting");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: mode, amount: amt, category, note }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Xatolik");
      return;
    }
    setFlash(mode);
    setTimeout(() => setFlash(null), 900);
    setMode(null);
    load();
  }

  async function remove(id) {
    await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    load();
  }

  const cats = mode === "income" ? INCOME_CATS : CATEGORIES;
  const month = stats?.month || { in: 0, out: 0 };
  const day = stats?.day || { in: 0, out: 0 };
  const maxCat = stats?.categories?.[0]?.amount || 1;

  return (
    <div>
      <h1 className="page-title">Xarajat</h1>
      <p className="page-sub">Pul balansingiz, kirim-chiqimlar va kunlik-oylik tahlil.</p>

      {/* ===== Balans kartasi ===== */}
      <div className={`card balance-card ${flash ? `flash-${flash}` : ""}`} style={{ marginBottom: 20 }}>
        <div className="balance-glow" />
        <div className="balance-label">Asosiy balans</div>
        <div className={`balance-num ${animatedBalance < 0 ? "neg" : ""}`}>
          {fmtNum(animatedBalance)} <span className="balance-cur">so'm</span>
        </div>

        <div className="balance-mini">
          <div className="bm">
            <span className="bm-dot in" />
            <div>
              <div className="bm-val">+{fmtNum(month.in)}</div>
              <div className="bm-lbl">Shu oy kirim</div>
            </div>
          </div>
          <div className="bm">
            <span className="bm-dot out" />
            <div>
              <div className="bm-val">−{fmtNum(month.out)}</div>
              <div className="bm-lbl">Shu oy chiqim</div>
            </div>
          </div>
        </div>

        <div className="row" style={{ marginTop: 20 }}>
          <button className="btn auto income-btn" onClick={() => openForm("income")}>
            ⬇ Kirim qo'shish
          </button>
          <button className="btn auto danger" onClick={() => openForm("expense")}>
            ⬆ Chiqim qo'shish
          </button>
        </div>
      </div>

      {/* ===== Kunlik / oylik statistika ===== */}
      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="card stat-tile in-tile">
          <div className="stat-tile-head">📅 Bugun</div>
          <div className="stat-tile-row"><span className="muted">Kirim</span><b className="pos">+{fmtNum(day.in)}</b></div>
          <div className="stat-tile-row"><span className="muted">Chiqim</span><b className="neg">−{fmtNum(day.out)}</b></div>
          <div className="stat-tile-sum">Sof: <b>{fmtNum(day.in - day.out)} so'm</b></div>
        </div>
        <div className="card stat-tile out-tile">
          <div className="stat-tile-head">🗓️ Shu oy</div>
          <div className="stat-tile-row"><span className="muted">Kirim</span><b className="pos">+{fmtNum(month.in)}</b></div>
          <div className="stat-tile-row"><span className="muted">Chiqim</span><b className="neg">−{fmtNum(month.out)}</b></div>
          <div className="stat-tile-sum">Sof: <b>{fmtNum(month.in - month.out)} so'm</b></div>
        </div>
      </div>

      {/* ===== Oylik chiqim kategoriyalari ===== */}
      {stats && stats.categories.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Shu oy chiqimlari — kategoriya bo'yicha</h3>
          {stats.categories.map((c, i) => (
            <div key={c.name} className="cat-row" style={{ animationDelay: `${i * 60}ms` }}>
              <span className="cat-ic">{catIcon(c.name)}</span>
              <div className="cat-body">
                <div className="cat-top">
                  <span>{c.name}</span>
                  <b>{fmtNum(c.amount)} so'm</b>
                </div>
                <div className="cat-bar">
                  <div className="cat-bar-fill" style={{ width: `${(c.amount / maxCat) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== So'nggi harakatlar ===== */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>So'nggi harakatlar</h3>
        {!stats && <p className="muted">Yuklanmoqda…</p>}
        {stats && stats.recent.length === 0 && (
          <p className="muted">Hali harakat yo'q. Birinchi kirim yoki chiqimni qo'shing.</p>
        )}
        {stats && stats.recent.map((t) => (
          <div key={t.id} className="txn">
            <span className={`txn-ic ${t.type}`}>{catIcon(t.category)}</span>
            <div className="txn-body">
              <div className="txn-top">
                <span>{t.category || (t.type === "income" ? "Kirim" : "Chiqim")}</span>
                <b className={t.type === "income" ? "pos" : "neg"}>
                  {t.type === "income" ? "+" : "−"}{fmtNum(t.amount)}
                </b>
              </div>
              <div className="txn-sub">
                <span className="muted">{t.note || fmtDate(t.at)}</span>
                {t.note && <span className="muted"> · {fmtDate(t.at)}</span>}
              </div>
            </div>
            <button className="icon-btn" onClick={() => remove(t.id)} aria-label="O'chirish">🗑</button>
          </div>
        ))}
        {stats && stats.count > 0 && (
          <p className="muted" style={{ marginBottom: 0, marginTop: 12 }}>Jami {stats.count} ta harakat</p>
        )}
      </div>

      {/* ===== Modal: kirim/chiqim formasi ===== */}
      {mode && (
        <div className="modal-backdrop" onClick={() => setMode(null)}>
          <div className={`modal sheet-up ${mode}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 style={{ margin: 0 }}>{mode === "income" ? "⬇ Kirim qo'shish" : "⬆ Chiqim qo'shish"}</h3>
              <button className="icon-btn" onClick={() => setMode(null)} aria-label="Yopish">✕</button>
            </div>
            <form onSubmit={submit}>
              {err && <div className="error">{err}</div>}
              <div className="field">
                <label>Summa (so'm)</label>
                <input
                  inputMode="numeric"
                  autoFocus
                  placeholder="0"
                  value={amount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, "");
                    setAmount(raw ? Number(raw).toLocaleString("ru-RU").replace(/ /g, " ") : "");
                  }}
                  style={{ fontSize: 22, fontWeight: 700, textAlign: "center" }}
                />
              </div>
              <div className="field">
                <label>Kategoriya</label>
                <div className="cat-pick">
                  {cats.map((c) => (
                    <button
                      type="button"
                      key={c.key}
                      className={`cat-chip ${category === c.key ? "on" : ""}`}
                      onClick={() => setCategory(c.key)}
                    >
                      <span>{c.icon}</span> {c.key}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Izoh (ixtiyoriy)</label>
                <input
                  placeholder="Masalan: tushlik"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <button className={`btn ${mode === "income" ? "income-btn" : "danger"}`} disabled={saving}>
                {saving ? "Saqlanmoqda…" : mode === "income" ? "Kirim qo'shish" : "Chiqim qo'shish"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
