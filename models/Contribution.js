import mongoose from "mongoose";

const contributionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    amount: { type: Number, required: true }, // amount or slots contributed
  },
  { timestamps: true }
);

// ✅ Prevent OverwriteModelError
const Contribution = mongoose.models.Contribution || mongoose.model("Contribution", contributionSchema);

export default Contribution;
