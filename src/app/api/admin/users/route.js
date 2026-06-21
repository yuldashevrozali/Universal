import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { getUserId } from "@/lib/auth";

const ADMIN_PHONE = "+998912038995";

async function checkAdmin() {
  const id = getUserId();
  if (!id) return null;
  await dbConnect();
  const me = await User.findById(id).select("phone");
  if (!me || me.phone !== ADMIN_PHONE) return null;
  return id;
}

// GET — barcha foydalanuvchilar ro'yxati
export async function GET(req) {
  const adminId = await checkAdmin();
  if (!adminId) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  const filter = { _id: { $ne: adminId } };
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { username: rx }, { phone: rx }];
  }

  const users = await User.find(filter)
    .select("name username phone blocked lastSeen createdAt handScanEnabled")
    .sort({ createdAt: -1 });

  return NextResponse.json({ users });
}

// PATCH — bloklash / blokdan chiqarish
export async function PATCH(req) {
  const adminId = await checkAdmin();
  if (!adminId) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const { userId, blocked } = await req.json();
  if (!userId || typeof blocked !== "boolean") {
    return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { blocked } },
    { new: true }
  ).select("name username phone blocked lastSeen");

  if (!user) return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
  return NextResponse.json({ user });
}

// DELETE — o'chirish
export async function DELETE(req) {
  const adminId = await checkAdmin();
  if (!adminId) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("id");
  if (!userId) return NextResponse.json({ error: "ID kerak" }, { status: 400 });

  await User.findByIdAndDelete(userId);
  return NextResponse.json({ ok: true });
}
