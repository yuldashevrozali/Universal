import mongoose from "mongoose";

// Grind (pomodoro) sessiyalari
const SessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    minutes: { type: Number, required: true }, // haqiqiy o'tirilgan daqiqalar
    targetMinutes: { type: Number, required: true }, // 25 yoki 50
    completed: { type: Boolean, default: false }, // to'liq tugadimi yoki to'xtatildimi
    dateKey: { type: String, required: true }, // Toshkent "YYYY-MM-DD"
  },
  { timestamps: true }
);

SessionSchema.index({ user: 1, dateKey: 1 });

export default mongoose.models.Session || mongoose.model("Session", SessionSchema);
