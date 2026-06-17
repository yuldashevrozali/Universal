import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Expense from "@/models/Expense";
import { getUserId } from "@/lib/auth";
import { tashkentDateStr, tashkentMonthStr, tashkentWeekStartStr } from "@/lib/tashkent";

// Yangi pul harakati qo'shish (kirim/chiqim)
export async function POST(req) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const body = await req.json();
  const type = body.type;
  const amount = Number(body.amount);

  if (type !== "income" && type !== "expense") {
    return NextResponse.json({ error: "Tur noto'g'ri" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Summa noto'g'ri" }, { status: 400 });
  }

  await dbConnect();
  await Expense.create({
    user: userId,
    type,
    amount: Math.round(amount),
    category: (body.category || "").toString().slice(0, 40).trim(),
    note: (body.note || "").toString().slice(0, 200).trim(),
    dateKey: tashkentDateStr(),
  });

  return NextResponse.json({ ok: true });
}

// Pul harakatini o'chirish
export async function DELETE(req) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID yo'q" }, { status: 400 });

  await dbConnect();
  await Expense.deleteOne({ _id: id, user: userId });

  return NextResponse.json({ ok: true });
}

// Balans + bugun/hafta/oy statistikasi + so'nggi harakatlar
export async function GET() {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  await dbConnect();

  const today = tashkentDateStr();
  const month = tashkentMonthStr();
  const weekStart = tashkentWeekStartStr();

  const txns = await Expense.find({ user: userId }).select("type amount category note dateKey createdAt");

  let balance = 0;
  let dayIn = 0, dayOut = 0;
  let weekIn = 0, weekOut = 0;
  let monthIn = 0, monthOut = 0;
  const categories = {}; // shu oy chiqimlari kategoriya bo'yicha

  for (const t of txns) {
    const sign = t.type === "income" ? 1 : -1;
    balance += sign * t.amount;

    const inMonth = t.dateKey.startsWith(month);
    const isToday = t.dateKey === today;
    const inWeek = t.dateKey >= weekStart && t.dateKey <= today;

    if (t.type === "income") {
      if (isToday) dayIn += t.amount;
      if (inWeek) weekIn += t.amount;
      if (inMonth) monthIn += t.amount;
    } else {
      if (isToday) dayOut += t.amount;
      if (inWeek) weekOut += t.amount;
      if (inMonth) {
        monthOut += t.amount;
        const key = t.category || "Boshqa";
        categories[key] = (categories[key] || 0) + t.amount;
      }
    }
  }

  const recent = txns
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 20)
    .map((t) => ({
      id: t._id,
      type: t.type,
      amount: t.amount,
      category: t.category,
      note: t.note,
      dateKey: t.dateKey,
      at: t.createdAt,
    }));

  const catList = Object.entries(categories)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  return NextResponse.json({
    balance,
    day: { in: dayIn, out: dayOut },
    week: { in: weekIn, out: weekOut },
    month: { in: monthIn, out: monthOut },
    categories: catList,
    count: txns.length,
    recent,
  });
}
