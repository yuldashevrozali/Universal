import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const id = getUserId();
  if (!id) return NextResponse.json({ user: null });

  await dbConnect();
  const user = await User.findById(id).select("name phone username");
  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({
    user: { id: user._id, name: user.name, phone: user.phone, username: user.username },
  });
}
