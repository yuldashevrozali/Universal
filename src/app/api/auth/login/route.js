import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken, setAuthCookie, signPendingToken } from "@/lib/auth";

export async function POST(req) {
  try {
    const { phone, password } = await req.json();
    if (!phone || !password) {
      return NextResponse.json({ error: "Nomer va parol kiriting" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      return NextResponse.json({ error: "Nomer yoki parol noto'g'ri" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Nomer yoki parol noto'g'ri" }, { status: 401 });
    }

    if (user.blocked) {
      return NextResponse.json({ error: "Hisobingiz bloklangan. Admin bilan bog'laning." }, { status: 403 });
    }

    if (user.handScanEnabled && user.handLandmarks?.length > 0) {
      const pendingToken = signPendingToken({ id: user._id.toString() });
      return NextResponse.json({ requireHandScan: true, pendingToken });
    }

    const token = signToken({ id: user._id.toString() });
    setAuthCookie(token);

    return NextResponse.json({
      user: { id: user._id, name: user.name, phone: user.phone, username: user.username },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Xatolik" }, { status: 500 });
  }
}
