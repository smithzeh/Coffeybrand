const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  balance: { type: Number, default: 0 },
  transactions: [
    {
      type: {
        type: String,
        enum: ["credit", "debit"],
        required: true
      },
      amount: { type: Number, required: true },
      description: { type: String },
      date: { type: Date, default: Date.now }
    }
  ]
});

// ✅ Prevent OverwriteModelError
const Wallet = mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);

module.exports = Wallet;
