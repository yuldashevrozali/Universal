import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import ChessGame from "@/models/ChessGame";
import FlashcardSet from "@/models/FlashcardSet";
import User from "@/models/User";
import { getUserId } from "@/lib/auth";

function genCode() {
  return Math.random().toString(36).slice(2, 8);
}

// Yangi sherikli o'yin yaratish — link uchun kod qaytaradi
export async function POST(req) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const { setId, minutes } = await req.json();

  await dbConnect();

  let setName = "";
  if (setId) {
    const set = await FlashcardSet.findOne({ _id: setId, user: userId }).select("name");
    if (set) setName = set.name;
  }

  const me = await User.findById(userId).select("name username");
  const timeMs = (Number(minutes) > 0 ? Number(minutes) : 5) * 60 * 1000;

  // noyob kod
  let code = genCode();
  for (let i = 0; i < 5; i++) {
    const exists = await ChessGame.findOne({ code }).select("_id");
    if (!exists) break;
    code = genCode();
  }

  const game = await ChessGame.create({
    code,
    hostUser: userId,
    hostName: me?.name || "Mezbon",
    hostColor: "w",
    setId: setId || null,
    setName,
    hostTimeMs: timeMs,
    guestTimeMs: timeMs,
    lastMoveAt: new Date(),
    status: "waiting",
  });

  return NextResponse.json({ code: game.code });
}
