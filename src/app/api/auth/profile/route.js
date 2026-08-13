import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const id = getUserId();
  if (!id) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  await dbConnect();
  const user = await User.findById(id).select("name username phone handScanEnabled");
  if (!user) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  return NextResponse.json({
    user: {
      id: user._id,
      name: user.name,
      username: user.username,
      phone: user.phone,
      handScanEnabled: user.handScanEnabled,
    },
  });
}

export async function PATCH(req) {
  const id = getUserId();
  if (!id) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const body = await req.json();
  await dbConnect();
  const update = {};
  if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
  if (typeof body.username === "string") update.username = body.username.trim();
  if (typeof body.handScanEnabled === "boolean") update.handScanEnabled = body.handScanEnabled;
  if (Array.isArray(body.handLandmarks)) update.handLandmarks = body.handLandmarks;
  if (body.handScanEnabled === false) update.handLandmarks = [];

  // Password change: allow when user is setting a new password after admin-created OTP (mustChangePassword)
  if (typeof body.newPassword === "string" && body.newPassword.trim()) {
    const me = await User.findById(id).select("passwordHash mustChangePassword");
    if (!me) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

    // If user is not required to change password, verify currentPassword
    if (!me.mustChangePassword) {
      if (typeof body.currentPassword !== "string" || !body.currentPassword) {
        return NextResponse.json({ error: "Joriy parol kerak" }, { status: 400 });
      }
      const ok = await bcrypt.compare(body.currentPassword, me.passwordHash);
      if (!ok) return NextResponse.json({ error: "Joriy parol noto'g'ri" }, { status: 401 });
    }

    const newHash = await bcrypt.hash(body.newPassword, 10);
    update.passwordHash = newHash;
    update.mustChangePassword = false;
  }

  const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true }).select(
    "name username handScanEnabled"
  );

  return NextResponse.json({ user });
}
