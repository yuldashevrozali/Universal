import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { getUserId } from "@/lib/auth";

// Foydalanuvchilarni qidirish (ism / username / nomer bo'yicha)
export async function GET(req) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  await dbConnect();

  const filter = { _id: { $ne: userId } };
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { username: rx }, { phone: rx }];
  }

  const users = await User.find(filter).select("name username phone").limit(30).sort({ name: 1 });
  return NextResponse.json({
    users: users.map((u) => ({ id: u._id, name: u.name, username: u.username, phone: u.phone })),
  });
}
