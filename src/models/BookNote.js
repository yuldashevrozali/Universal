import mongoose from "mongoose";

// Postdagi izoh (comment)
const CommentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

// Iqtibos (quote) yoki post — qaysi kitobdan ekani (ixtiyoriy)
const BookNoteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["quote", "post"], required: true },
    text: { type: String, required: true, trim: true, maxlength: 8000 },
    book: { type: String, trim: true, default: "" }, // qaysi kitobdan (ixtiyoriy)
    // ommaviy = hammaga ko'rinadi (lenta), shaxsiy = faqat o'ziga
    visibility: { type: String, enum: ["public", "private"], default: "private" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: { type: [CommentSchema], default: [] },
  },
  { timestamps: true }
);

BookNoteSchema.index({ user: 1, type: 1, createdAt: -1 });
BookNoteSchema.index({ visibility: 1, createdAt: -1 });

export default mongoose.models.BookNote || mongoose.model("BookNote", BookNoteSchema);
