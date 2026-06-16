import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req) {
  try {
    const { name, phone, username, password } = await req.json();

    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: "Ism, nomer va parol majburiy" },
        { status: 400 }
      );
    }

    await dbConnect();

    const exists = await User.findOne({ phone: phone.trim() });
    if (exists) {
      return NextResponse.json(
        { error: "Bu nomer allaqachon ro'yxatdan o'tgan" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      phone: phone.trim(),
      username: (username || "").trim(),
      passwordHash,
    });

    const token = signToken({ id: user._id.toString() });
    setAuthCookie(token);

    return NextResponse.json({
      user: { id: user._id, name: user.name, phone: user.phone, username: user.username },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Xatolik" }, { status: 500 });
  }
}
