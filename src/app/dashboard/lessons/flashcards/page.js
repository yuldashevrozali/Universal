"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

function emptyRows(n) {
  return Array.from({ length: n }, () => ({ word: "", translation: "" }));
}

export default function FlashcardsPage() {
  const [sets, setSets] = useState([]);
  const [view, setView] = useState("list"); // list | create | study
  const [err, setErr] = useState("");

  // Yaratish
  const [name, setName] = useState("");
  const [rows, setRows] = useState(emptyRows(10));
  const [saving, setSaving] = useState(false);

  // Yodlash
  const [study, setStudy] = useState(null); // {set, idx, flipped}

  const load = useCallback(async () => {
    const res = await fetch("/api/flashcards");
    if (res.ok) setSets((await res.json()).sets);
  }, []);
  useEffect(() => { load(); }, [load]);

  function setRow(i, key, val) {
    setRows((r) => r.map((row, j) => (j === i ? { ...row, [key]: val } : row)));
  }
  function addRow() { setRows((r) => [...r, { word: "", translation: "" }]); }
  function removeRow(i) { setRows((r) => r.filter((_, j) => j !== i)); }

  async function save() {
    setErr("");
    const cards = rows.filter((r) => r.word.trim() && r.translation.trim());
    if (!name.trim()) { setErr("To'plamga nom bering"); return; }
    if (cards.length < 10) { setErr("Kamida 10 ta so'z to'ldiring (so'z + tarjima)"); return; }
    setSaving(true);
    const res = await fetch("/api/flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, cards }),
    });
    setSaving(false);
    const d = await res.json();
    if (!res.ok) { setErr(d.error || "Xatolik"); return; }
    setName(""); setRows(emptyRows(10)); setView("list"); load();
  }

  async function del(id) {
    await fetch(`/api/flashcards?id=${id}`, { method: "DELETE" });
    setSets((s) => s.filter((x) => x.id !== id));
  }

  async function openStudy(id) {
    const res = await fetch(`/api/flashcards?id=${id}`);
    if (!res.ok) return;
    const { set } = await res.json();
    setStudy({ set, idx: 0, flipped: false });
    setView("study");
  }

  const filled = rows.filter((r) => r.word.trim() && r.translation.trim()).length;

  // ----- Yodlash ekrani -----
  if (view === "study" && study) {
    const c = study.set.cards[study.idx];
    const total = study.set.cards.length;
    return (
      <div>
        <button className="btn ghost auto" onClick={() => setView("list")} style={{ marginBottom: 16 }}>← Orqaga</button>
        <h1 className="page-title">{study.set.name}</h1>
        <p className="page-sub">{study.idx + 1} / {total} — kartani bosib ag'daring</p>

        <div className="flashcard" onClick={() => setStudy((s) => ({ ...s, flipped: !s.flipped }))}>
          <div className={`flashcard-inner ${study.flipped ? "flipped" : ""}`}>
            <div className="flashcard-face front">{c.word}</div>
            <div className="flashcard-face back">{c.translation}</div>
          </div>
        </div>

        <div className="row" style={{ justifyContent: "center", marginTop: 20 }}>
          <button className="btn secondary auto" disabled={study.idx === 0}
            onClick={() => setStudy((s) => ({ ...s, idx: s.idx - 1, flipped: false }))}>← Oldingi</button>
          <button className="btn auto" disabled={study.idx === total - 1}
            onClick={() => setStudy((s) => ({ ...s, idx: s.idx + 1, flipped: false }))}>Keyingi →</button>
        </div>
      </div>
    );
  }

  // ----- Yaratish ekrani -----
  if (view === "create") {
    return (
      <div>
        <button className="btn ghost auto" onClick={() => setView("list")} style={{ marginBottom: 16 }}>← Orqaga</button>
        <h1 className="page-title">Yangi to'plam</h1>
        <p className="page-sub">Kamida 10 ta so'z — har biri tarjimasi bilan.</p>

        {err && <div className="error">{err}</div>}

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="field">
            <label>To'plam nomi</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Ingliz tili — 1-dars" />
          </div>
          <div className="muted" style={{ fontSize: 13 }}>To'ldirilgan: <b style={{ color: filled >= 10 ? "var(--green)" : "var(--yellow)" }}>{filled}</b> / kamida 10</div>
        </div>

        <div className="card">
          {rows.map((row, i) => (
            <div key={i} className="word-row">
              <span className="word-num">{i + 1}</span>
              <input placeholder="So'z" value={row.word} onChange={(e) => setRow(i, "word", e.target.value)} />
              <input placeholder="Tarjimasi" value={row.translation} onChange={(e) => setRow(i, "translation", e.target.value)} />
              <button className="icon-btn" onClick={() => removeRow(i)} aria-label="O'chirish">✕</button>
            </div>
          ))}
          <button className="btn ghost" onClick={addRow} style={{ marginTop: 10 }}>+ Yana so'z qo'shish</button>
        </div>

        <div style={{ position: "sticky", bottom: 16, marginTop: 16 }}>
          <button className="btn" onClick={save} disabled={saving}>{saving ? "Saqlanmoqda…" : "💾 To'plamni saqlash"}</button>
        </div>
      </div>
    );
  }

  // ----- Ro'yxat ekrani -----
  return (
    <div>
      <h1 className="page-title">So'z yodlash</h1>
      <p className="page-sub">Flashcard to'plamlaringiz.</p>

      <button className="btn" onClick={() => { setView("create"); setErr(""); }} style={{ marginBottom: 18 }}>+ Yangi to'plam</button>

      {sets.length === 0 && (
        <div className="card center" style={{ padding: 40 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🗂️</div>
          <p className="muted" style={{ margin: 0 }}>Hali to'plam yo'q. Yuqoridagi tugma orqali birinchi to'plamni yarating.</p>
        </div>
      )}

      <div className="grid grid-2">
        {sets.map((s) => (
          <div key={s.id} className="card set-card">
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 4px" }}>{s.name}</h3>
              <div className="muted" style={{ fontSize: 13 }}>{s.count} ta so'z</div>
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn auto" onClick={() => openStudy(s.id)}>📖 Yodlash</button>
              <button className="btn secondary auto" onClick={() => del(s.id)}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      <p className="muted" style={{ marginTop: 24 }}>
        To'plamlardan o'yinlarda foydalaning: <Link href="/dashboard/lessons/quiz" style={{ color: "var(--accent)" }}>Multiple choice</Link> ·{" "}
        <Link href="/dashboard/lessons/chess" style={{ color: "var(--accent)" }}>Shaxmat</Link>
      </p>
    </div>
  );
}
