import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import BookNote from "@/models/BookNote";
import User from "@/models/User";
import { getUserId } from "@/lib/auth";

function shape(n, userId) {
  const author = n.user && typeof n.user === "object" ? n.user : null;
  const likes = n.likes || [];
  return {
    id: n._id,
    type: n.type,
    text: n.text,
    book: n.book,
    visibility: n.visibility || "private",
    at: n.createdAt,
    author: author
      ? { id: author._id, name: author.name, username: author.username }
      : { id: n.user, name: "", username: "" },
    mine: (author ? author._id : n.user).toString() === userId,
    likes: likes.length,
    liked: likes.some((l) => l.toString() === userId),
    comments: n.comments ? n.comments.length : 0,
  };
}

// GET: scope=feed → hammaning ommaviy postlari; aks holda → o'z yozuvlari
export async function GET(req) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");
  const type = searchParams.get("type");

  await dbConnect();

  if (scope === "feed") {
    const filter = { visibility: "public" };
    if (type === "quote" || type === "post") filter.type = type;
    const notes = await BookNote.find(filter)
      .sort({ createdAt: -1 })
      .limit(60)
      .populate("user", "name username");
    return NextResponse.json({ notes: notes.map((n) => shape(n, userId)) });
  }

  // O'z yozuvlari
  const filter = { user: userId };
  if (type === "quote" || type === "post") filter.type = type;
  const notes = await BookNote.find(filter).sort({ createdAt: -1 });
  return NextResponse.json({ notes: notes.map((n) => shape(n, userId)) });
}

// Yangi iqtibos yoki post
export async function POST(req) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const { type, text, book, visibility } = await req.json();
  if (type !== "quote" && type !== "post") {
    return NextResponse.json({ error: "Tur noto'g'ri" }, { status: 400 });
  }
  if (!text?.trim()) return NextResponse.json({ error: "Matn bo'sh" }, { status: 400 });

  await dbConnect();
  const note = await BookNote.create({
    user: userId,
    type,
    text: text.trim(),
    book: (book || "").trim(),
    visibility: visibility === "public" ? "public" : "private",
  });

  // Mualliflik ma'lumotini qaytarish uchun
  const me = await User.findById(userId).select("name username");
  return NextResponse.json({
    note: shape({ ...note.toObject(), user: me }, userId),
  });
}

// O'chirish (faqat o'zinikini)
export async function DELETE(req) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id yo'q" }, { status: 400 });

  await dbConnect();
  await BookNote.deleteOne({ _id: id, user: userId });
  return NextResponse.json({ ok: true });
}
