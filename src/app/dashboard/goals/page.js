"use client";

import { useCallback, useEffect, useState } from "react";

// Toshkent (UTC+5) bo'yicha joriy sana qismlari
function tashkentParts() {
  const t = new Date(Date.now() + 5 * 60 * 60 * 1000);
  const iso = t.toISOString();
  return { date: iso.slice(0, 10), month: iso.slice(0, 7), year: iso.slice(0, 4) };
}

const TABS = [
  { key: "daily", label: "Kunlik" },
  { key: "monthly", label: "Oylik" },
  { key: "yearly", label: "Yillik" },
];

export default function GoalsPage() {
  const now = tashkentParts();
  const [tab, setTab] = useState("daily");
  const [period, setPeriod] = useState({ daily: now.date, monthly: now.month, yearly: now.year });

  const [data, setData] = useState({ items: [], editable: false });
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const current = period[tab];

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    const res = await fetch(`/api/plans?type=${tab}&period=${current}`);
    const d = await res.json();
    setLoading(false);
    if (!res.ok) { setErr(d.error || "Xatolik"); setData({ items: [], editable: false }); return; }
    setData(d);
  }, [tab, current]);

  useEffect(() => { load(); }, [load]);

  async function op(payload) {
    setErr("");
    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: tab, period: current, ...payload }),
    });
    const d = await res.json();
    if (!res.ok) { setErr(d.error || "Xatolik"); return; }
    setData((prev) => ({ ...prev, items: d.items }));
  }

  async function add(e) {
    e.preventDefault();
    if (!text.trim()) return;
    await op({ op: "add", text });
    setText("");
  }

  function setPeriodValue(v) {
    setPeriod((p) => ({ ...p, [tab]: v }));
  }

  const done = data.items.filter((i) => i.done).length;

  return (
    <div>
      <h1 className="page-title">Maqsadlar</h1>
      <p className="page-sub">Kunlik, oylik va yillik rejalaringizni yozing va belgilab boring.</p>

      <div className="row" style={{ marginBottom: 18 }}>
        {TABS.map((t) => (
          <button key={t.key} className={`pill ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="row" style={{ alignItems: "center", marginBottom: 16 }}>
          {tab === "daily" && (
            <input type="date" value={period.daily} max={now.date}
              onChange={(e) => setPeriodValue(e.target.value)} style={{ width: "auto" }} />
          )}
          {tab === "monthly" && (
            <input type="month" value={period.monthly} min={now.month}
              onChange={(e) => setPeriodValue(e.target.value)} style={{ width: "auto" }} />
          )}
          {tab === "yearly" && (
            <input type="number" value={period.yearly} min={now.year} max="2100"
              onChange={(e) => setPeriodValue(e.target.value)} style={{ width: 120 }} />
          )}
          {data.items.length > 0 && (
            <span className="badge">{done}/{data.items.length} bajarildi</span>
          )}
        </div>

        {err && <div className="error">{err}</div>}

        {!data.editable && (
          <div className="locked-banner">
            🔒 Bu davr yopilgan — faqat ko'rish mumkin, o'zgartirib bo'lmaydi.
          </div>
        )}

        {loading ? (
          <p className="muted">Yuklanmoqda…</p>
        ) : (
          <>
            {data.items.length === 0 && <p className="muted">Hali reja yo'q.</p>}
            {data.items.map((it) => (
              <div key={it.id} className={`todo ${it.done ? "done" : ""}`}>
                <button
                  className={`check ${it.done ? "on" : ""}`}
                  disabled={!data.editable}
                  onClick={() => op({ op: "toggle", itemId: it.id })}
                  aria-label="toggle"
                >
                  {it.done ? "✓" : ""}
                </button>
                <span className="todo-text">{it.text}</span>
                {data.editable && (
                  <button className="icon-btn" onClick={() => op({ op: "delete", itemId: it.id })}>✕</button>
                )}
              </div>
            ))}
          </>
        )}

        {data.editable && (
          <form onSubmit={add} className="row" style={{ marginTop: 14 }}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Yangi reja qo'shish…" style={{ flex: 1 }} />
            <button className="btn auto">Qo'shish</button>
          </form>
        )}
      </div>
    </div>
  );
}
