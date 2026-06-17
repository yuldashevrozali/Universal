import mongoose from "mongoose";

// Sherik bilan o'ynaladigan shaxmat o'yini (link orqali qo'shiladi)
const ChessGameSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true }, // link uchun qisqa kod

    hostUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hostName: { type: String, default: "" },
    guestUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guestName: { type: String, default: "" },

    hostColor: { type: String, enum: ["w", "b"], default: "w" }, // host oq bilan boshlaydi

    // Flashcard to'plami (har yurishdan oldin so'z chiqadi)
    setId: { type: mongoose.Schema.Types.ObjectId, ref: "FlashcardSet", default: null },
    setName: { type: String, default: "" },

    fen: { type: String, default: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" },
    moves: { type: [String], default: [] }, // SAN ro'yxati

    hostTimeMs: { type: Number, default: 5 * 60 * 1000 },
    guestTimeMs: { type: Number, default: 5 * 60 * 1000 },
    lastMoveAt: { type: Date, default: Date.now },

    status: { type: String, enum: ["waiting", "active", "finished"], default: "waiting" },
    result: { type: String, default: "" }, // masalan: "host", "guest", "draw"
  },
  { timestamps: true }
);

export default mongoose.models.ChessGame || mongoose.model("ChessGame", ChessGameSchema);
