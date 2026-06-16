"use client";

import { useCallback, useEffect, useState } from "react";

function tashkentDate() {
  return new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("uz", { year: "numeric", month: "short", day: "numeric" });
}

const TABS = [
  { key: "books", label: "Kitoblar" },
  { key: "quote", label: "Iqtiboslar" },
  { key: "post", label: "Postlar" },
];

export default function BooksPage() {
  const [tab, setTab] = useState("books");

  const [books, setBooks] = useState([]);
  const [notes, setNotes] = useState({ quote: [], post: [] });
  const [err, setErr] = useState("");

  // Kitob formasi
  const [bForm, setBForm] = useState({ title: "", category: "", startedAt: tashkentDate() });
  // Iqtibos/post formasi
  const [nText, setNText] = useState("");
  const [nBook, setNBook] = useState("");

  const loadBooks = useCallback(async () => {
    const res = await fetch("/api/books");
    if (res.ok) setBooks((await res.json()).books);
  }, []);

  const loadNotes = useCallback(async (type) => {
    const res = await fetch(`/api/book-notes?type=${type}`);
    if (!res.ok) return;
    const { notes } = await res.json();
    setNotes((prev) => ({ ...prev, [type]: notes }));
  }, []);

  useEffect(() => { loadBooks(); }, [loadBooks]);
  useEffect(() => {
    if (tab === "quote" || tab === "post") loadNotes(tab);
  }, [tab, loadNotes]);

  async function addBook(e) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bForm),
    });
    const d = await res.json();
    if (!res.ok) { setErr(d.error || "Xatolik"); return; }
    setBooks((b) => [d.book, ...b]);
    setBForm({ title: "", category: "", startedAt: tashkentDate() });
  }

  async function deleteBook(id) {
    await fetch(`/api/books?id=${id}`, { method: "DELETE" });
    setBooks((b) => b.filter((x) => x.id !== id));
  }

  async function addNote(e) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/book-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: tab, text: nText, book: nBook }),
    });
    const d = await res.json();
    if (!res.ok) { setErr(d.error || "Xatolik"); return; }
    setNotes((prev) => ({ ...prev, [tab]: [d.note, ...prev[tab]] }));
    setNText("");
    setNBook("");
  }

  async function deleteNote(id) {
    await fetch(`/api/book-notes?id=${id}`, { method: "DELETE" });
    setNotes((prev) => ({ ...prev, [tab]: prev[tab].filter((x) => x.id !== id) }));
  }

  const list = tab === "books" ? books : notes[tab];

  return (
    <div>
      <h1 className="page-title">Kitoblar</h1>
      <p className="page-sub">O'qigan kitoblaringiz, iqtiboslar va postlar.</p>

      <div className="row" style={{ marginBottom: 18 }}>
        {TABS.map((t) => (
          <button key={t.key} className={`pill ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {err && <div className="error">{err}</div>}

      {/* ---- Kitob qo'shish ---- */}
      {tab === "books" && (
        <>
          <div className="card" style={{ marginBottom: 18 }}>
            <h3 style={{ marginTop: 0 }}>Yangi kitobni tugatish</h3>
            <form onSubmit={addBook}>
              <div className="grid-form2" style={{ marginBottom: 12 }}>
                <div>
                  <label>Kitob nomi</label>
                  <input value={bForm.title} onChange={(e) => setBForm({ ...bForm, title: e.target.value })} placeholder="Masalan: Atomic Habits" />
                </div>
                <div>
                  <label>Kategoriya</label>
                  <input list="cats" value={bForm.category} onChange={(e) => setBForm({ ...bForm, category: e.target.value })} placeholder="Self-help" />
                  <datalist id="cats">
                    <option value="Self-help" /><option value="Biznes" /><option value="Roman" />
                    <option value="Tarix" /><option value="Psixologiya" /><option value="Fan" /><option value="Diniy" />
                  </datalist>
                </div>
              </div>
              <div className="row" style={{ alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label>Boshlangan sana</label>
                  <input type="date" max={tashkentDate()} value={bForm.startedAt} onChange={(e) => setBForm({ ...bForm, startedAt: e.target.value })} />
                </div>
                <button className="btn auto">✓ Tugatdim</button>
              </div>
              <p className="muted" style={{ fontSize: 13, margin: "10px 0 0" }}>
                Tugatgan sana avtomatik hozirgi vaqt bilan qo'shiladi.
              </p>
            </form>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>O'qigan kitoblarim <span className="badge">{books.length}</span></h3>
            {books.length === 0 && <p className="muted">Hali kitob qo'shilmagan.</p>}
            {books.map((b) => (
              <div key={b.id} className="todo" style={{ alignItems: "flex-start" }}>
                <span style={{ fontSize: 20 }}>📖</span>
                <div className="todo-text">
                  <div style={{ fontWeight: 600 }}>{b.title}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    <span className="badge" style={{ marginRight: 8 }}>{b.category}</span>
                    {fmtDate(b.startedAt)} → {fmtDate(b.finishedAt)}
                  </div>
                </div>
                <button className="icon-btn" onClick={() => deleteBook(b.id)}>✕</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ---- Iqtibos / Post ---- */}
      {(tab === "quote" || tab === "post") && (
        <>
          <div className="card" style={{ marginBottom: 18 }}>
            <h3 style={{ marginTop: 0 }}>{tab === "quote" ? "Yangi iqtibos" : "Yangi post"}</h3>
            <form onSubmit={addNote}>
              <div className="field">
                <label>Qaysi kitobdan</label>
                <input list="bookTitles" value={nBook} onChange={(e) => setNBook(e.target.value)} placeholder="Kitob nomi" />
                <datalist id="bookTitles">
                  {books.map((b) => <option key={b.id} value={b.title} />)}
                </datalist>
              </div>
              <div className="field">
                <label>{tab === "quote" ? "Iqtibos matni" : "Post matni"}</label>
                <textarea rows={tab === "quote" ? 3 : 5} value={nText} onChange={(e) => setNText(e.target.value)}
                  placeholder={tab === "quote" ? "Esda qolgan jumla…" : "Fikrlaringiz…"} />
              </div>
              <button className="btn">{tab === "quote" ? "Iqtibos qo'shish" : "Post qo'shish"}</button>
            </form>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>
              {tab === "quote" ? "Iqtiboslar" : "Postlar"} <span className="badge">{list.length}</span>
            </h3>
            {list.length === 0 && <p className="muted">Hali {tab === "quote" ? "iqtibos" : "post"} yo'q.</p>}
            {list.map((n) => (
              <div key={n.id} className="card" style={{ background: "var(--bg2)", marginBottom: 10, position: "relative" }}>
                <button className="icon-btn" style={{ position: "absolute", top: 10, right: 10 }} onClick={() => deleteNote(n.id)}>✕</button>
                <div style={{ whiteSpace: "pre-wrap", paddingRight: 24 }}>
                  {tab === "quote" ? <em>“{n.text}”</em> : n.text}
                </div>
                <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                  📖 {n.book} · {fmtDate(n.at)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
