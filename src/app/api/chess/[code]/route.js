import { NextResponse } from "next/server";
import { Chess } from "chess.js";
import { dbConnect } from "@/lib/mongodb";
import ChessGame from "@/models/ChessGame";
import FlashcardSet from "@/models/FlashcardSet";
import User from "@/models/User";
import { getUserId } from "@/lib/auth";

const PENALTY_MS = 10 * 1000;

function myColor(game, userId) {
  if (game.hostUser?.toString() === userId) return game.hostColor;
  if (game.guestUser?.toString() === userId) return game.hostColor === "w" ? "b" : "w";
  return null;
}

// O'yinning flashcard to'plamini olib beradi (ishtirokchilar uchun, egasidan qat'i nazar)
async function gameCards(game) {
  if (!game.setId) return [];
  const set = await FlashcardSet.findById(game.setId).select("cards");
  return set ? set.cards.map((c) => ({ word: c.word, translation: c.translation })) : [];
}

function view(game, userId, cards = []) {
  return {
    code: game.code,
    fen: game.fen,
    moves: game.moves,
    status: game.status,
    result: game.result,
    host: { name: game.hostName, color: game.hostColor },
    guest: game.guestUser ? { name: game.guestName, color: game.hostColor === "w" ? "b" : "w" } : null,
    setId: game.setId,
    setName: game.setName,
    cards,
    hostTimeMs: game.hostTimeMs,
    guestTimeMs: game.guestTimeMs,
    lastMoveAt: game.lastMoveAt,
    youColor: myColor(game, userId),
    youAreHost: game.hostUser?.toString() === userId,
    turn: new Chess(game.fen).turn(),
  };
}

// O'yin holatini olish (polling)
export async function GET(req, { params }) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  await dbConnect();
  const game = await ChessGame.findOne({ code: params.code });
  if (!game) return NextResponse.json({ error: "O'yin topilmadi" }, { status: 404 });

  const cards = await gameCards(game);
  return NextResponse.json({ game: view(game, userId, cards) });
}

// action: "join" yoki "move"
export async function POST(req, { params }) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const body = await req.json();
  await dbConnect();
  const game = await ChessGame.findOne({ code: params.code });
  if (!game) return NextResponse.json({ error: "O'yin topilmadi" }, { status: 404 });

  const cards = await gameCards(game);

  // ---- Qo'shilish ----
  if (body.action === "join") {
    if (game.hostUser.toString() === userId) {
      return NextResponse.json({ game: view(game, userId, cards) }); // host o'zi
    }
    if (game.guestUser && game.guestUser.toString() !== userId) {
      return NextResponse.json({ error: "O'yin allaqachon to'lgan" }, { status: 403 });
    }
    if (!game.guestUser) {
      const me = await User.findById(userId).select("name");
      game.guestUser = userId;
      game.guestName = me?.name || "Mehmon";
      game.status = "active";
      game.lastMoveAt = new Date();
      await game.save();
    }
    return NextResponse.json({ game: view(game, userId, cards) });
  }

  // ---- Yurish ----
  if (body.action === "move") {
    const color = myColor(game, userId);
    if (!color) return NextResponse.json({ error: "Siz bu o'yin ishtirokchisi emassiz" }, { status: 403 });
    if (game.status !== "active") return NextResponse.json({ error: "O'yin faol emas" }, { status: 400 });

    const chess = new Chess(game.fen);
    if (chess.turn() !== color) {
      return NextResponse.json({ error: "Hozir sizning navbatingiz emas" }, { status: 400 });
    }

    let move;
    try {
      move = chess.move({ from: body.from, to: body.to, promotion: body.promotion || "q" });
    } catch {
      move = null;
    }
    if (!move) return NextResponse.json({ error: "Noto'g'ri yurish" }, { status: 400 });

    // Vaqtni hisoblash: o'tgan vaqt + xato javob jazosi
    const now = Date.now();
    const elapsed = now - new Date(game.lastMoveAt).getTime();
    const penalty = body.wrongAnswer ? PENALTY_MS : 0;
    const isHost = game.hostUser.toString() === userId;
    if (isHost) game.hostTimeMs = Math.max(0, game.hostTimeMs - elapsed - penalty);
    else game.guestTimeMs = Math.max(0, game.guestTimeMs - elapsed - penalty);

    game.fen = chess.fen();
    game.moves.push(move.san);
    game.lastMoveAt = new Date();

    if (chess.isCheckmate()) {
      game.status = "finished";
      game.result = isHost ? "host" : "guest";
    } else if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition()) {
      game.status = "finished";
      game.result = "draw";
    } else if ((isHost ? game.hostTimeMs : game.guestTimeMs) <= 0) {
      game.status = "finished";
      game.result = isHost ? "guest" : "host";
    }

    await game.save();
    return NextResponse.json({ game: view(game, userId, cards) });
  }

  // ---- Taslim bo'lish ----
  if (body.action === "resign") {
    const isHost = game.hostUser.toString() === userId;
    if (game.guestUser && (isHost || game.guestUser.toString() === userId)) {
      game.status = "finished";
      game.result = isHost ? "guest" : "host";
      await game.save();
    }
    return NextResponse.json({ game: view(game, userId, cards) });
  }

  return NextResponse.json({ error: "Noma'lum amal" }, { status: 400 });
}
