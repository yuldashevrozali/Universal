import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // ism
    phone: { type: String, required: true, unique: true, trim: true }, // nomer
    username: { type: String, default: "", trim: true }, // bo'sh bo'lishi mumkin
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
