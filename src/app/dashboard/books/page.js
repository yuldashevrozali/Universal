"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

function tashkentDate() {
  return new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("uz", { year: "numeric", month: "short", day: "numeric" });
}
function fmtWhen(d) {
  return new Date(d).toLocaleString("uz", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
function initials(name) {
  return (name || "?").trim().slice(0, 1).toUpperCase();
}

const TABS = [
  { key: "feed", label: "Lenta", icon: "🌐" },
  { key: "mine", label: "Yozuvlarim", icon: "📝" },
  { key: "books", label: "Kitoblarim", icon: "📚" },
];

export default function BooksPage() {
  const [tab, setTab] = useState("feed");
  const [feed, setFeed] = useState([]);
  const [mine, setMine] = useState([]);
  const [books, setBooks] = useState([]);
  const [err, setErr] = useState("");

  // Yaratish modali
  const [create, setCreate] = useState(null); // null | "choose" | "post" | "quote" | "book"

  const loadFeed = useCallback(async () => {
    const res = await fetch("/api/book-notes?scope=feed");
    if (res.ok) setFeed((await res.json()).notes);
  }, []);
  const loadMine = useCallback(async () => {
    const res = await fetch("/api/book-notes");
    if (res.ok) setMine((await res.json()).notes);
  }, []);
  const loadBooks = useCallback(async () => {
    const res = await fetch("/api/books");
    if (res.ok) setBooks((await res.json()).books);
  }, []);

  useEffect(() => {
    if (tab === "feed") loadFeed();
    if (tab === "mine") loadMine();
    if (tab === "books") loadBooks();
  }, [tab, loadFeed, loadMine, loadBooks]);

  async function deleteNote(id) {
    await fetch(`/api/book-notes?id=${id}`, { method: "DELETE" });
    setFeed((l) => l.filter((x) => x.id !== id));
    setMine((l) => l.filter((x) => x.id !== id));
  }
  async function deleteBook(id) {
    await fetch(`/api/books?id=${id}`, { method: "DELETE" });
    setBooks((b) => b.filter((x) => x.id !== id));
  }

  // Yangi post/iqtibos yaratilgandagi callback
  function onCreated(note) {
    setCreate(null);
    if (note.visibility === "public") {
      setFeed((l) => [note, ...l]);
      setTab("feed");
    } else {
      setMine((l) => [note, ...l]);
      setTab("mine");
    }
  }
  function onBookCreated(book) {
    setCreate(null);
    setBooks((b) => [book, ...b]);
    setTab("books");
  }

  return (
    <div>
      <h1 className="page-title">Kitoblar</h1>
      <p className="page-sub">Hamjamiyat lentasi, o'z yozuvlaringiz va o'qigan kitoblaringiz.</p>

      <div className="row" style={{ marginBottom: 18 }}>
        {TABS.map((t) => (
          <button key={t.key} className={`pill ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {err && <div className="error">{err}</div>}

      {/* ===== Lenta (hammaning ommaviy postlari) ===== */}
      {tab === "feed" && (
        <div key="feed">
          {feed.length === 0 && (
            <div className="card center" style={{ padding: 40, animation: "float-up .4s ease both" }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🌱</div>
              <p className="muted" style={{ margin: 0 }}>Hali ommaviy post yo'q. Birinchi bo'lib ulashing — pastdagi <b>+</b> tugmasi.</p>
            </div>
          )}
          {feed.map((n) => (
            <PostCard key={n.id} note={n} onDelete={deleteNote} />
          ))}
        </div>
      )}

      {/* ===== Mening yozuvlarim ===== */}
      {tab === "mine" && (
        <div key="mine">
          {mine.length === 0 && (
            <div className="card center" style={{ padding: 40, animation: "float-up .4s ease both" }}>
              <p className="muted" style={{ margin: 0 }}>Hali yozuv yo'q. <b>+</b> orqali post yoki iqtibos qo'shing.</p>
            </div>
          )}
          {mine.map((n) => (
            <PostCard key={n.id} note={n} onDelete={deleteNote} mineView />
          ))}
        </div>
      )}

      {/* ===== Kitoblarim ===== */}
      {tab === "books" && (
        <div className="card" key="books" style={{ animation: "float-up .4s ease both" }}>
          <h3 style={{ marginTop: 0 }}>
            O'qigan kitoblarim{" "}
            <span className="badge" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))", color:"#fff", border:"none" }}>
              {books.length}
            </span>
          </h3>
          {books.length === 0 && <p className="muted">Hali kitob qo'shilmagan. <b>+</b> orqali kitob tugatdim deb belgilang.</p>}
          {books.map((b, i) => (
            <div key={b.id} className="todo" style={{ alignItems: "flex-start", animationDelay: `${i * 50}ms` }}>
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
      )}

      {/* ===== Suzuvchi + tugma ===== */}
      <button className="fab" onClick={() => setCreate("choose")} aria-label="Yangi qo'shish">+</button>

      {/* ===== Yaratish modallari ===== */}
      {create === "choose" && (
        <Modal onClose={() => setCreate(null)} title="Nima qo'shamiz?">
          <div className="choose-grid">
            <button className="choose-card" onClick={() => setCreate("post")}>
              <span className="choose-ic">📣</span>
              <b>Post</b>
              <span className="muted" style={{ fontSize: 12 }}>Fikr ulashish</span>
            </button>
            <button className="choose-card" onClick={() => setCreate("quote")}>
              <span className="choose-ic">❝</span>
              <b>Iqtibos</b>
              <span className="muted" style={{ fontSize: 12 }}>Esda qolgan jumla</span>
            </button>
            <button className="choose-card" onClick={() => setCreate("book")}>
              <span className="choose-ic">📖</span>
              <b>Kitob tugatish</b>
              <span className="muted" style={{ fontSize: 12 }}>O'qib bo'ldim</span>
            </button>
          </div>
        </Modal>
      )}

      {(create === "post" || create === "quote") && (
        <NoteForm type={create} books={books} onClose={() => setCreate(null)} onCreated={onCreated} />
      )}
      {create === "book" && (
        <BookForm onClose={() => setCreate(null)} onCreated={onBookCreated} />
      )}
    </div>
  );
}

/* ---------- Modal qobig'i ---------- */
function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal sheet-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Yopish">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Post / Iqtibos formasi ---------- */
function NoteForm({ type, books, onClose, onCreated }) {
  const [text, setText] = useState("");
  const [book, setBook] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!text.trim()) { setErr("Matn bo'sh"); return; }
    setSaving(true);
    const res = await fetch("/api/book-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, text, book, visibility }),
    });
    setSaving(false);
    const d = await res.json();
    if (!res.ok) { setErr(d.error || "Xatolik"); return; }
    onCreated(d.note);
  }

  return (
    <Modal title={type === "quote" ? "❝ Yangi iqtibos" : "📣 Yangi post"} onClose={onClose}>
      <form onSubmit={submit}>
        {err && <div className="error">{err}</div>}
        <div className="field">
          <label>{type === "quote" ? "Iqtibos matni" : "Post matni"}</label>
          <textarea rows={type === "quote" ? 3 : 5} value={text} onChange={(e) => setText(e.target.value)}
            placeholder={type === "quote" ? "Esda qolgan jumla…" : "Fikrlaringiz…"} autoFocus />
        </div>
        <div className="field">
          <label>Qaysi kitobdan (ixtiyoriy)</label>
          <input list="bookTitles" value={book} onChange={(e) => setBook(e.target.value)} placeholder="Kitob nomi" />
          <datalist id="bookTitles">
            {books.map((b) => <option key={b.id} value={b.title} />)}
          </datalist>
        </div>
        <div className="field">
          <label>Ko'rinish</label>
          <div className="vis-toggle">
            <button type="button" className={`vis-opt ${visibility === "public" ? "on" : ""}`} onClick={() => setVisibility("public")}>
              🌐 Ommaviy
              <span className="muted">Hamma ko'radi</span>
            </button>
            <button type="button" className={`vis-opt ${visibility === "private" ? "on" : ""}`} onClick={() => setVisibility("private")}>
              🔒 Shaxsiy
              <span className="muted">Faqat siz</span>
            </button>
          </div>
        </div>
        <button className="btn" disabled={saving}>{saving ? "Saqlanmoqda…" : "Joylash"}</button>
      </form>
    </Modal>
  );
}

/* ---------- Kitob tugatish formasi ---------- */
function BookForm({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", category: "", startedAt: tashkentDate() });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    const d = await res.json();
    if (!res.ok) { setErr(d.error || "Xatolik"); return; }
    onCreated(d.book);
  }

  return (
    <Modal title="📖 Kitobni tugatish" onClose={onClose}>
      <form onSubmit={submit}>
        {err && <div className="error">{err}</div>}
        <div className="field">
          <label>Kitob nomi</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Masalan: Atomic Habits" autoFocus />
        </div>
        <div className="field">
          <label>Kategoriya</label>
          <input list="cats" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Self-help" />
          <datalist id="cats">
            <option value="Self-help" /><option value="Biznes" /><option value="Roman" />
            <option value="Tarix" /><option value="Psixologiya" /><option value="Fan" /><option value="Diniy" />
          </datalist>
        </div>
        <div className="field">
          <label>Boshlangan sana</label>
          <input type="date" max={tashkentDate()} value={form.startedAt} onChange={(e) => setForm({ ...form, startedAt: e.target.value })} />
        </div>
        <p className="muted" style={{ fontSize: 13, margin: "0 0 14px" }}>Tugatgan sana avtomatik hozirgi vaqt bilan qo'shiladi.</p>
        <button className="btn" disabled={saving}>{saving ? "Saqlanmoqda…" : "✓ Tugatdim"}</button>
      </form>
    </Modal>
  );
}

/* ---------- Post kartasi (like / comment / xabar) ---------- */
function PostCard({ note, onDelete, mineView }) {
  const [liked, setLiked] = useState(note.liked);
  const [likes, setLikes] = useState(note.likes);
  const [commentCount, setCommentCount] = useState(note.comments);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState(null);
  const [cText, setCText] = useState("");
  const [busy, setBusy] = useState(false);

  async function toggleLike() {
    setLiked((v) => !v);
    setLikes((n) => n + (liked ? -1 : 1));
    const res = await fetch(`/api/book-notes/${note.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like" }),
    });
    if (res.ok) {
      const d = await res.json();
      setLiked(d.liked);
      setLikes(d.likes);
    }
  }

  async function openComments() {
    const next = !open;
    setOpen(next);
    if (next && comments === null) {
      const res = await fetch(`/api/book-notes/${note.id}`);
      if (res.ok) setComments((await res.json()).comments);
    }
  }

  async function addComment(e) {
    e.preventDefault();
    if (!cText.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/book-notes/${note.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "comment", text: cText }),
    });
    setBusy(false);
    if (res.ok) {
      const d = await res.json();
      setComments((c) => [...(c || []), d.comment]);
      setCommentCount(d.count);
      setCText("");
    }
  }

  async function delComment(cid) {
    const res = await fetch(`/api/book-notes/${note.id}?commentId=${cid}`, { method: "DELETE" });
    if (res.ok) {
      const d = await res.json();
      setComments((c) => c.filter((x) => x.id !== cid));
      setCommentCount(d.count);
    }
  }

  const a = note.author;
  return (
    <div className="post-card">
      <div className="post-head">
        <div className="avatar">{initials(a.name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="post-author">
            {a.name || "Foydalanuvchi"}
            {a.username ? <span className="muted" style={{ fontWeight: 400 }}> · @{a.username}</span> : null}
          </div>
          <div className="muted" style={{ fontSize: 12 }}>
            {note.type === "quote" ? "❝ Iqtibos" : "📣 Post"}
            {note.book ? ` · 📖 ${note.book}` : ""}
            {mineView ? (note.visibility === "public" ? " · 🌐 Ommaviy" : " · 🔒 Shaxsiy") : ""}
            {" · "}{fmtWhen(note.at)}
          </div>
        </div>
        {note.mine && (
          <button className="icon-btn" onClick={() => onDelete(note.id)} aria-label="O'chirish">🗑</button>
        )}
      </div>

      <div className="post-text">
        {note.type === "quote" ? <em>“{note.text}”</em> : note.text}
      </div>

      <div className="post-actions">
        <button className={`act ${liked ? "liked" : ""}`} onClick={toggleLike}>
          <span className={liked ? "heart-pop" : ""}>{liked ? "❤️" : "🤍"}</span> {likes}
        </button>
        <button className="act" onClick={openComments}>💬 {commentCount}</button>
        {!note.mine && (
          <Link
            className="act"
            href={`/dashboard/chat?user=${a.id}&name=${encodeURIComponent(a.name || "")}&username=${encodeURIComponent(a.username || "")}`}
          >
            ✉ Xabar
          </Link>
        )}
      </div>

      {open && (
        <div className="comments">
          {comments === null && <p className="muted" style={{ fontSize: 13, margin: "6px 0" }}>Yuklanmoqda…</p>}
          {comments && comments.length === 0 && <p className="muted" style={{ fontSize: 13, margin: "6px 0" }}>Hali izoh yo'q. Birinchi bo'ling!</p>}
          {comments && comments.map((c) => (
            <div key={c.id} className="comment">
              <div className="avatar sm">{initials(c.author?.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13 }}>
                  <b>{c.author?.name || "Foydalanuvchi"}</b>{" "}
                  <span className="muted">· {fmtWhen(c.at)}</span>
                </div>
                <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{c.text}</div>
              </div>
              {c.mine && <button className="icon-btn" onClick={() => delComment(c.id)}>✕</button>}
            </div>
          ))}
          <form className="comment-input" onSubmit={addComment}>
            <input value={cText} onChange={(e) => setCText(e.target.value)} placeholder="Izoh yozing…" />
            <button className="btn auto" disabled={busy}>Yuborish</button>
          </form>
        </div>
      )}
    </div>
  );
}
