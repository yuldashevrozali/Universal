import Link from "next/link";

const ITEMS = [
  {
    href: "/dashboard/lessons/flashcards",
    icon: "🗂️", title: "So'z yodlash",
    sub: "Flashcards — to'plam yarating, so'zlarni yodlang",
    color: "108,140,255",
  },
  {
    href: "/dashboard/lessons/quiz",
    icon: "🎯", title: "Multiple choice",
    sub: "To'g'ri tarjimani toping — tezkor test",
    color: "155,108,255",
  },
  {
    href: "/dashboard/lessons/chess",
    icon: "♟️", title: "Shaxmat",
    sub: "Bot yoki sherik bilan — har yurishda so'z chiqadi",
    color: "6,182,212",
  },
];

export default function LessonsPage() {
  return (
    <div>
      <h1 className="page-title">Dars qilish</h1>
      <p className="page-sub">So'z yodlash va bilim o'yinlari.</p>

      <div className="grid grid-3">
        {ITEMS.map((it, i) => (
          <Link
            key={it.href}
            href={it.href}
            className="card lesson-tile"
            style={{
              animationDelay: `${i * 80}ms`,
              borderTop: `2px solid rgba(${it.color},.5)`,
              paddingTop: 24,
            }}
          >
            <div className="lesson-ic">{it.icon}</div>
            <h3 style={{ margin: "0 0 6px", background: `linear-gradient(135deg,rgb(${it.color}),#fff)`, WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent" }}>
              {it.title}
            </h3>
            <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{it.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
