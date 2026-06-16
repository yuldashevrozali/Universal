import mongoose from "mongoose";

// Iqtibos (quote) yoki post — har biri qaysi kitobdan ekani bilan
const BookNoteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["quote", "post"], required: true },
    text: { type: String, required: true, trim: true, maxlength: 8000 },
    book: { type: String, required: true, trim: true }, // qaysi kitobdan
  },
  { timestamps: true }
);

BookNoteSchema.index({ user: 1, type: 1, createdAt: -1 });

export default mongoose.models.BookNote || mongoose.model("BookNote", BookNoteSchema);
