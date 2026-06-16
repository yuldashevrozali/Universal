import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Message from "@/models/Message";
import User from "@/models/User";
import { getUserId } from "@/lib/auth";

// Suhbatni olish
export async function GET(req) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const withId = searchParams.get("with");
  if (!withId) return NextResponse.json({ error: "Foydalanuvchi tanlanmagan" }, { status: 400 });

  await dbConnect();
  const messages = await Message.find({
    $or: [
      { from: userId, to: withId },
      { from: withId, to: userId },
    ],
  })
    .sort({ createdAt: 1 })
    .limit(500)
    .select("from to text createdAt");

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m._id,
      mine: m.from.toString() === userId,
      text: m.text,
      at: m.createdAt,
    })),
  });
}

// Xabar yuborish (faqat matn)
export async function POST(req) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const { to, text } = await req.json();
  const clean = (text || "").trim();
  if (!to || !clean) return NextResponse.json({ error: "Matn bo'sh" }, { status: 400 });
  if (clean.length > 4000) return NextResponse.json({ error: "Xabar juda uzun" }, { status: 400 });

  await dbConnect();
  const recipient = await User.findById(to).select("_id");
  if (!recipient) return NextResponse.json({ error: "Qabul qiluvchi topilmadi" }, { status: 404 });

  const msg = await Message.create({ from: userId, to, text: clean });
  return NextResponse.json({ message: { id: msg._id, mine: true, text: msg.text, at: msg.createdAt } });
}
