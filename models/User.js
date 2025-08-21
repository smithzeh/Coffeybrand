const mongoose = require("mongoose");

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "partner"], default: "partner" },
  walletBalance: { type: Number, default: 0 },

  name: { type: String },
  email: { type: String, unique: true },

  joinedBusinesses: [
    {
      businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business" },
      slots: { type: Number, default: 0 },
      joinedAt: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

// Business Schema
const businessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  slotsAvailable: { type: Number, default: 0 },
}, { timestamps: true });

// ✅ Prevent OverwriteModelError
const User = mongoose.models.User || mongoose.model("User", userSchema);
const Business = mongoose.models.Business || mongoose.model("Business", businessSchema);

module.exports = { User, Business };
