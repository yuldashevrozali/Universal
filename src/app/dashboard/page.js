"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const cards = [
  { href: "/dashboard/grind",    icon: "⏱️",  title: "Grind",       desc: "25/50 daqiqalik diqqat sessiyalari va vaqt statistikasi." },
  { href: "/dashboard/goals",    icon: "🎯",  title: "Maqsadlar",   desc: "Kunlik, oylik va yillik rejalar — todo ko'rinishida." },
  { href: "/dashboard/chat",     icon: "💬",  title: "Chat",        desc: "Boshqa foydalanuvchilar bilan matnli yozishuv." },
  { href: "/dashboard/ai-chat",  icon: "🤖",  title: "AI Chat",     desc: "Sun'iy intellekt bilan suhbat — tez orada." },
  { href: "/dashboard/books",    icon: "📚",  title: "Kitoblar",    desc: "O'qigan kitoblar, iqtiboslar va postlar." },
  { href: "/dashboard/expenses", icon: "💰",  title: "Xarajat",     desc: "Pul balansi, kirim-chiqimlar va oylik tahlil." },
  { href: "/dashboard/lessons",  icon: "🎓",  title: "Dars qilish", desc: "So'z yodlash, quiz va shaxmat bilan o'rganing." },
  { href: "/dashboard/settings", icon: "⚙️",  title: "Sozlamalar",  desc: "Profil, username va xavfsizlik sozlamalari." },
];

export default function DashboardHome() {
  return (
    <div style={{ position: "relative" }}>
      {/* Floating ambient orbs */}
      <div className="ambient-bg" aria-hidden="true">
        <div className="ambient-orb orb1" />
        <div className="ambient-orb orb2" />
        <div className="ambient-orb orb3" />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <h1 className="page-title">Bosh sahifa</h1>
        <p className="page-sub">Universal — diqqat, rejalar va muloqot bir joyda.</p>

        <div className="grid grid-2">
          {cards.map((c, i) => (
            <Link
              key={c.href}
              href={c.href}
              className="card home-card"
              style={{ animationDelay: `${i * 65}ms` }}
            >
              <div className="home-ic">{c.icon}</div>
              <h3 style={{ margin: "0 0 6px" }}>{c.title}</h3>
              <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{c.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
