"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Bosh sahifa", icon: "🏠" },
  { href: "/dashboard/grind", label: "Grind", icon: "⏱️" },
  { href: "/dashboard/goals", label: "Maqsadlar", icon: "🎯" },
  { href: "/dashboard/chat", label: "Chat", icon: "💬" },
  { href: "/dashboard/ai-chat", label: "AI Chat", icon: "🤖" },
  { href: "/dashboard/books", label: "Kitoblar", icon: "📚" },
  { href: "/dashboard/expenses", label: "Xarajat", icon: "💰" },
  { href: "/dashboard/lessons", label: "Dars qilish", icon: "🎓" },
  { href: "/dashboard/settings", label: "Sozlamalar", icon: "⚙️" },
];

export default function Sidebar({ name, username }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const activeLink = links.find((l) =>
    l.href === "/dashboard" ? pathname === l.href : pathname.startsWith(l.href)
  );

  return (
    <>
      {/* Mobil yuqori panel */}
      <header className="mobile-topbar">
        <button className="hamburger" onClick={() => setOpen(true)} aria-label="Menu">☰</button>
        <span className="brand" style={{ fontSize: 20 }}>{activeLink?.label || "Universal"}</span>
      </header>

      {open && <div className="backdrop" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <button className="drawer-close" onClick={() => setOpen(false)} aria-label="Yopish">✕</button>
        <div className="brand" style={{ padding: "6px 12px 22px" }}>U<span className="nav-text">niversal</span></div>
        <nav>
          {links.map((l) => {
            const active = l.href === "/dashboard" ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link ${active ? "active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <span className="nav-ic">{l.icon}</span>
                <span className="nav-text">{l.label}</span>
              </Link>
            );
          })}
        </nav>
        <div style={{ position: "absolute", bottom: 16, left: 14, right: 14 }}>
          <div className="nav-text" style={{ fontSize: 13, color: "var(--muted)", padding: "0 8px 10px" }}>
            {name}{username ? ` · @${username}` : ""}
          </div>
          <button className="btn ghost" onClick={logout}>
            <span className="nav-ic">↩</span><span className="nav-text">Chiqish</span>
          </button>
        </div>
      </aside>
    </>
  );
}
