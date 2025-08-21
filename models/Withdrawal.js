const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema({
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  partnerUsername: { type: String, required: true },
  business: { type: mongoose.Schema.Types.ObjectId, ref: "Business" }, // optional
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date }
});

// ✅ Prevent OverwriteModelError
const Withdrawal = mongoose.models.Withdrawal || mongoose.model("Withdrawal", withdrawalSchema);

module.exports = Withdrawal;
