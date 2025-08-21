// models/Business.js
const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Funding info
    targetAmount: { type: Number, required: true },
    totalRaised: { type: Number, default: 0 },
    maxPartners: { type: Number, required: true },
    progress: { type: Number, default: 0 }, // percentage of target reached

    // Partners / members
    partners: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        slots: { type: Number, default: 1 },
      },
    ],

    // Contributions
    contributions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        amount: { type: Number, required: true },
        status: { type: String, enum: ["pending", "approved"], default: "pending" },
        date: { type: Date, default: Date.now },
      },
    ],

    // Profit tracking
    profitHistory: [
      {
        month: String, // e.g., "2025-08"
        profit: Number,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Business || mongoose.model("Business", businessSchema);
