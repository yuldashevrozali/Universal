import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Maqsadlar: kunlik / oylik / yillik reja (todo list)
const PlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["daily", "monthly", "yearly"], required: true },
    // periodKey: daily="YYYY-MM-DD", monthly="YYYY-MM", yearly="YYYY"
    periodKey: { type: String, required: true },
    items: { type: [ItemSchema], default: [] },
  },
  { timestamps: true }
);

PlanSchema.index({ user: 1, type: 1, periodKey: 1 }, { unique: true });

export default mongoose.models.Plan || mongoose.model("Plan", PlanSchema);
