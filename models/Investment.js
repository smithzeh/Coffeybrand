const mongoose = require("mongoose");

const investmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  business: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

// ✅ Prevent OverwriteModelError
const Investment = mongoose.models.Investment || mongoose.model("Investment", investmentSchema);

module.exports = Investment;
