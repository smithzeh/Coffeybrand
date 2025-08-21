// models/Advert.js
const mongoose = require("mongoose");

const advertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String }, // description can be optional
    imageUrl: { type: String, required: true }, // uploaded image path or Cloudinary link
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // reference to admin user
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Advert", advertSchema);
