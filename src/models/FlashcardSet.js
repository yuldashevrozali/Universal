import mongoose from "mongoose";

const CardSchema = new mongoose.Schema(
  {
    word: { type: String, required: true, trim: true, maxlength: 200 },
    translation: { type: String, required: true, trim: true, maxlength: 200 },
  },
  { _id: false }
);

// So'z yodlash to'plami (flashcards) — nom bilan saqlanadi, kamida 10 ta so'z
const FlashcardSetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    cards: { type: [CardSchema], default: [] },
  },
  { timestamps: true }
);

FlashcardSetSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.FlashcardSet || mongoose.model("FlashcardSet", FlashcardSetSchema);
