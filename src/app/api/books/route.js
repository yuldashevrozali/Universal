import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Book from "@/models/Book";
import { getUserId } from "@/lib/auth";

// O'qilgan kitoblar ro'yxati
export async function GET() {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  await dbConnect();
  const books = await Book.find({ user: userId }).sort({ finishedAt: -1 }).select("title category startedAt finishedAt");
  return NextResponse.json({
    books: books.map((b) => ({
      id: b._id,
      title: b.title,
      category: b.category,
      startedAt: b.startedAt,
      finishedAt: b.finishedAt,
    })),
  });
}

// Yangi tugatilgan kitob qo'shish (tugagan sana = hozir, avtomatik)
export async function POST(req) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const { title, category, startedAt } = await req.json();
  if (!title?.trim() || !category?.trim() || !startedAt) {
    return NextResponse.json({ error: "Nom, kategoriya va boshlangan sana majburiy" }, { status: 400 });
  }
  const start = new Date(startedAt);
  if (isNaN(start.getTime())) {
    return NextResponse.json({ error: "Sana noto'g'ri" }, { status: 400 });
  }

  await dbConnect();
  const book = await Book.create({
    user: userId,
    title: title.trim(),
    category: category.trim(),
    startedAt: start,
    finishedAt: new Date(), // avtomatik — qo'shilgan payt
  });

  return NextResponse.json({
    book: { id: book._id, title: book.title, category: book.category, startedAt: book.startedAt, finishedAt: book.finishedAt },
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
  await Book.deleteOne({ _id: id, user: userId });
  return NextResponse.json({ ok: true });
}
