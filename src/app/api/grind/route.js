import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Session from "@/models/Session";
import { getUserId } from "@/lib/auth";
import { tashkentDateStr, tashkentMonthStr, tashkentWeekStartStr } from "@/lib/tashkent";

// Sessiyani saqlash
export async function POST(req) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const { minutes, targetMinutes, completed } = await req.json();
  if (!minutes || minutes <= 0) {
    return NextResponse.json({ error: "Daqiqa noto'g'ri" }, { status: 400 });
  }

  await dbConnect();
  await Session.create({
    user: userId,
    minutes: Math.round(minutes),
    targetMinutes: targetMinutes || minutes,
    completed: !!completed,
    dateKey: tashkentDateStr(),
  });

  return NextResponse.json({ ok: true });
}

// Statistika: bugun / hafta / oy + so'nggi sessiyalar
export async function GET() {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  await dbConnect();

  const today = tashkentDateStr();
  const month = tashkentMonthStr();
  const weekStart = tashkentWeekStartStr();

  const sessions = await Session.find({ user: userId }).select("minutes dateKey completed targetMinutes createdAt");

  let dayTotal = 0, weekTotal = 0, monthTotal = 0, allTotal = 0;
  for (const s of sessions) {
    allTotal += s.minutes;
    if (s.dateKey === today) dayTotal += s.minutes;
    if (s.dateKey >= weekStart && s.dateKey <= today) weekTotal += s.minutes;
    if (s.dateKey.startsWith(month)) monthTotal += s.minutes;
  }

  const recent = sessions
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 10)
    .map((s) => ({
      minutes: s.minutes,
      target: s.targetMinutes,
      completed: s.completed,
      dateKey: s.dateKey,
      at: s.createdAt,
    }));

  return NextResponse.json({
    day: dayTotal,
    week: weekTotal,
    month: monthTotal,
    all: allTotal,
    count: sessions.length,
    recent,
  });
}
