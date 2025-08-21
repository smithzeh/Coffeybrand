const mongoose = require("mongoose");

const statementSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
  month: { type: String, required: true }, // e.g. "January 2025"
  details: { type: String }, // description of performance
  revenue: { type: Number, default: 0 },
  expenses: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
}, { timestamps: true });

// ✅ Prevent OverwriteModelError
const Statement = mongoose.models.Statement || mongoose.model("Statement", statementSchema);

module.exports = Statement;
