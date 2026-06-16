import mongoose from "mongoose";

// O'qib tugatilgan kitob
const BookSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true }, // kitob nomi
    category: { type: String, required: true, trim: true }, // kategoriya
    startedAt: { type: Date, required: true }, // boshlangan sana
    finishedAt: { type: Date, required: true }, // tugatgan (qo'shgan) vaqt — avtomatik
  },
  { timestamps: true }
);

BookSchema.index({ user: 1, finishedAt: -1 });

export default mongoose.models.Book || mongoose.model("Book", BookSchema);
