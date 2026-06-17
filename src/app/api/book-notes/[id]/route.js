import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import BookNote from "@/models/BookNote";
import User from "@/models/User";
import { getUserId } from "@/lib/auth";

// Bitta postning to'liq izohlari (comment'lari)
export async function GET(req, { params }) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  await dbConnect();
  const note = await BookNote.findById(params.id).populate("comments.user", "name username");
  if (!note) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  return NextResponse.json({
    comments: (note.comments || []).map((c) => ({
      id: c._id,
      text: c.text,
      at: c.createdAt,
      mine: c.user?._id?.toString() === userId,
      author: c.user ? { id: c.user._id, name: c.user.name, username: c.user.username } : null,
    })),
  });
}

// action: "like" (toggle) yoki "comment" (yangi izoh)
export async function POST(req, { params }) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const body = await req.json();
  const action = body.action;

  await dbConnect();
  const note = await BookNote.findById(params.id);
  if (!note) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  if (action === "like") {
    const idx = note.likes.findIndex((l) => l.toString() === userId);
    if (idx >= 0) note.likes.splice(idx, 1);
    else note.likes.push(userId);
    await note.save();
    return NextResponse.json({ likes: note.likes.length, liked: idx < 0 });
  }

  if (action === "comment") {
    const text = (body.text || "").trim();
    if (!text) return NextResponse.json({ error: "Izoh bo'sh" }, { status: 400 });
    note.comments.push({ user: userId, text });
    await note.save();
    const me = await User.findById(userId).select("name username");
    const c = note.comments[note.comments.length - 1];
    return NextResponse.json({
      comment: {
        id: c._id,
        text: c.text,
        at: c.createdAt,
        mine: true,
        author: { id: me._id, name: me.name, username: me.username },
      },
      count: note.comments.length,
    });
  }

  return NextResponse.json({ error: "Noma'lum amal" }, { status: 400 });
}

// Izohni o'chirish: ?commentId=...  (faqat o'zinikini)
export async function DELETE(req, { params }) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get("commentId");
  if (!commentId) return NextResponse.json({ error: "commentId yo'q" }, { status: 400 });

  await dbConnect();
  const note = await BookNote.findById(params.id);
  if (!note) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });

  const c = note.comments.id(commentId);
  if (c && c.user.toString() === userId) {
    c.deleteOne();
    await note.save();
  }
  return NextResponse.json({ ok: true, count: note.comments.length });
}
