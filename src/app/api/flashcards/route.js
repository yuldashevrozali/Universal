import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import FlashcardSet from "@/models/FlashcardSet";
import { getUserId } from "@/lib/auth";

function cleanCards(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => ({
      word: (c.word || "").toString().trim().slice(0, 200),
      translation: (c.translation || "").toString().trim().slice(0, 200),
    }))
    .filter((c) => c.word && c.translation);
}

// GET: ?id= -> bitta to'plam; aks holda -> mening barcha to'plamlarim
export async function GET(req) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  await dbConnect();

  if (id) {
    const set = await FlashcardSet.findOne({ _id: id, user: userId });
    if (!set) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
    return NextResponse.json({
      set: { id: set._id, name: set.name, cards: set.cards },
    });
  }

  const sets = await FlashcardSet.find({ user: userId }).sort({ createdAt: -1 });
  return NextResponse.json({
    sets: sets.map((s) => ({ id: s._id, name: s.name, count: s.cards.length, at: s.createdAt })),
  });
}

// Yangi to'plam yaratish (kamida 10 ta so'z)
export async function POST(req) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const { name, cards } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nom kiriting" }, { status: 400 });

  const clean = cleanCards(cards);
  if (clean.length < 10) {
    return NextResponse.json({ error: "Kamida 10 ta so'z (tarjimasi bilan) kiriting" }, { status: 400 });
  }

  await dbConnect();
  const set = await FlashcardSet.create({ user: userId, name: name.trim(), cards: clean });
  return NextResponse.json({
    set: { id: set._id, name: set.name, count: set.cards.length, at: set.createdAt },
  });
}

// Tahrirlash (nom yoki so'zlar)
export async function PUT(req) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const { id, name, cards } = await req.json();
  if (!id) return NextResponse.json({ error: "id yo'q" }, { status: 400 });

  const clean = cleanCards(cards);
  if (clean.length < 10) {
    return NextResponse.json({ error: "Kamida 10 ta so'z kerak" }, { status: 400 });
  }

  await dbConnect();
  const set = await FlashcardSet.findOneAndUpdate(
    { _id: id, user: userId },
    { name: (name || "").trim() || "To'plam", cards: clean },
    { new: true }
  );
  if (!set) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  return NextResponse.json({ set: { id: set._id, name: set.name, count: set.cards.length, at: set.createdAt } });
}

// O'chirish
export async function DELETE(req) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id yo'q" }, { status: 400 });

  await dbConnect();
  await FlashcardSet.deleteOne({ _id: id, user: userId });
  return NextResponse.json({ ok: true });
}
