import Link from "next/link";

const cards = [
  { href: "/dashboard/grind", icon: "⏱️", title: "Grind", desc: "25/50 daqiqalik diqqat sessiyalari va vaqt statistikasi." },
  { href: "/dashboard/goals", icon: "🎯", title: "Maqsadlar", desc: "Kunlik, oylik va yillik rejalar — todo ko'rinishida." },
  { href: "/dashboard/chat", icon: "💬", title: "Chat", desc: "Boshqa foydalanuvchilar bilan matnli yozishuv." },
  { href: "/dashboard/ai-chat", icon: "🤖", title: "AI Chat", desc: "Tez orada qo'shiladi." },
  { href: "/dashboard/books", icon: "📚", title: "Kitoblar", desc: "O'qigan kitoblar, iqtiboslar va postlar." },
  { href: "/dashboard/expenses", icon: "💰", title: "Xarajat", desc: "Tez orada qo'shiladi." },
];

export default function DashboardHome() {
  return (
    <div>
      <h1 className="page-title">Bosh sahifa</h1>
      <p className="page-sub">Universal — diqqat, rejalar va muloqot bir joyda.</p>
      <div className="grid grid-2">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="card" style={{ display: "block" }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>{c.icon}</div>
            <h3 style={{ margin: "0 0 6px" }}>{c.title}</h3>
            <p className="muted" style={{ margin: 0 }}>{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
