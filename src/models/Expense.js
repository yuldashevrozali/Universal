import mongoose from "mongoose";

// Pul harakati: kirim (income) yoki chiqim (expense)
const ExpenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, trim: true, default: "" },
    note: { type: String, trim: true, default: "" },
    // dateKey = "YYYY-MM-DD" (Toshkent vaqti bo'yicha)
    dateKey: { type: String, required: true },
  },
  { timestamps: true }
);

ExpenseSchema.index({ user: 1, dateKey: 1 });

export default mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);
