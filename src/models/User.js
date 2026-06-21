import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    username: { type: String, default: "", trim: true },
    passwordHash: { type: String, required: true },
    handScanEnabled: { type: Boolean, default: false },
    handLandmarks: { type: [Number], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
