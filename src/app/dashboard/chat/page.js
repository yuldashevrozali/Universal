"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

function timeStr(at) {
  const d = new Date(at);
  return d.toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatInner />
    </Suspense>
  );
}

function ChatInner() {
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const msgEnd = useRef(null);

  // Boshqa sahifadan ?user=&name=&username= bilan kelganda suhbatni ochish
  useEffect(() => {
    const uid = params.get("user");
    if (uid) {
      setActive({ id: uid, name: params.get("name") || "Foydalanuvchi", username: params.get("username") || "" });
    }
  }, [params]);

  const loadUsers = useCallback(async () => {
    const res = await fetch(`/api/users?q=${encodeURIComponent(q)}`);
    if (res.ok) setUsers((await res.json()).users);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(loadUsers, 250);
    return () => clearTimeout(t);
  }, [loadUsers]);

  const loadMessages = useCallback(async () => {
    if (!active) return;
    const res = await fetch(`/api/messages?with=${active.id}`);
    if (res.ok) setMessages((await res.json()).messages);
  }, [active]);

  // Suhbat ochilganda va har 4 soniyada yangilab turish
  useEffect(() => {
    if (!active) return;
    loadMessages();
    const iv = setInterval(loadMessages, 4000);
    return () => clearInterval(iv);
  }, [active, loadMessages]);

  useEffect(() => {
    msgEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    const clean = text.trim();
    if (!clean || !active) return;
    setText("");
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: active.id, text: clean }),
    });
    if (res.ok) {
      const { message } = await res.json();
      setMessages((m) => [...m, message]);
    }
  }

  return (
    <div>
      <h1 className="page-title">Chat</h1>
      <p className="page-sub">Boshqa foydalanuvchilarga matn xabar yuboring.</p>

      <div className={`chat-shell ${active ? "has-active" : ""}`}>
        <div className="card chat-list" style={{ padding: 12 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Qidirish…" style={{ marginBottom: 10 }} />
          {users.length === 0 && <p className="muted" style={{ padding: 8 }}>Topilmadi.</p>}
          {users.map((u) => (
            <div key={u.id} className={`chat-user ${active?.id === u.id ? "active" : ""}`} onClick={() => setActive(u)}>
              <div style={{ fontWeight: 600 }}>{u.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>{u.username ? `@${u.username}` : u.phone}</div>
            </div>
          ))}
        </div>

        <div className="card chat-main" style={{ padding: 0 }}>
          {!active ? (
            <div style={{ margin: "auto", color: "var(--muted)" }}>Suhbatni boshlash uchun foydalanuvchini tanlang</div>
          ) : (
            <>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 6 }}>
                <button className="chat-back" onClick={() => setActive(null)} aria-label="Orqaga">←</button>
                <div>
                  <div style={{ fontWeight: 700 }}>{active.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{active.username ? `@${active.username}` : active.phone}</div>
                </div>
              </div>
              <div className="chat-msgs">
                {messages.length === 0 && <div className="muted" style={{ margin: "auto" }}>Hali xabar yo'q. Birinchi bo'lib yozing!</div>}
                {messages.map((m) => (
                  <div key={m.id} className={`bubble ${m.mine ? "me" : "them"}`}>
                    {m.text}
                    <span className="time">{timeStr(m.at)}</span>
                  </div>
                ))}
                <div ref={msgEnd} />
              </div>
              <form className="chat-input" onSubmit={send}>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Xabar yozing…" style={{ flex: 1 }} />
                <button className="btn auto">Yuborish</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
