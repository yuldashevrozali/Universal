import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import BookNote from "@/models/BookNote";
import { getUserId } from "@/lib/auth";

// Iqtibos / postlar ro'yxati (type bo'yicha filtr)
export async function GET(req) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const filter = { user: userId };
  if (type === "quote" || type === "post") filter.type = type;

  await dbConnect();
  const notes = await BookNote.find(filter).sort({ createdAt: -1 }).select("type text book createdAt");
  return NextResponse.json({
    notes: notes.map((n) => ({ id: n._id, type: n.type, text: n.text, book: n.book, at: n.createdAt })),
  });
}

// Yangi iqtibos yoki post — qaysi kitobdan ekani majburiy
export async function POST(req) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const { type, text, book } = await req.json();
  if (type !== "quote" && type !== "post") {
    return NextResponse.json({ error: "Tur noto'g'ri" }, { status: 400 });
  }
  if (!text?.trim()) return NextResponse.json({ error: "Matn bo'sh" }, { status: 400 });
  if (!book?.trim()) return NextResponse.json({ error: "Qaysi kitobdan ekanini yozing" }, { status: 400 });

  await dbConnect();
  const note = await BookNote.create({ user: userId, type, text: text.trim(), book: book.trim() });
  return NextResponse.json({
    note: { id: note._id, type: note.type, text: note.text, book: note.book, at: note.createdAt },
  });
}

// O'chirish
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
