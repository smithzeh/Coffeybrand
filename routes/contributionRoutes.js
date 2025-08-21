// routes/contributionRoutes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Contribution = require("../models/Contribution");
const Business = require("../models/Business");
const Notification = require("../models/Notification");
const User = require("../models/User");

const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { io, onlineUsers } = require("../server");

// ----------------- Create Contribution -----------------
router.post("/", authenticateToken, authorizeRoles("partner"), async (req, res) => {
  try {
    const { amount, businessId } = req.body;

    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: "Business not found" });

    const contribution = new Contribution({
      user: req.user.id,
      business: businessId,
      amount,
    });
    await contribution.save();

    // Notify contributor
    await Notification.create({
      user: req.user.id,
      type: "contribution",
      message: `✅ You contributed ₦${amount} to ${business.name}`,
    });

    if (onlineUsers[req.user.id]) {
      io.to(onlineUsers[req.user.id]).emit("newNotification", {
        user: req.user.id,
        message: `✅ Contribution of ₦${amount} was successful.`,
      });
    }

    // Notify admins
    const admins = await User.find({ role: "admin" });
    for (let admin of admins) {
      await Notification.create({
        user: admin._id,
        type: "system",
        message: `${req.user.username} contributed ₦${amount} to ${business.name}`,
      });

      if (onlineUsers[admin._id]) {
        io.to(onlineUsers[admin._id]).emit("newNotification", {
          user: admin._id,
          message: `${req.user.username} contributed ₦${amount} to ${business.name}`,
        });
      }
    }

    res.status(201).json({ message: "Contribution successful", contribution });
  } catch (err) {
    console.error("Contribution error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- Get contributions by business -----------------
router.get("/business/:businessId", authenticateToken, async (req, res) => {
  try {
    const contributions = await Contribution.find({ business: req.params.businessId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(contributions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch contributions" });
  }
});

// ----------------- Get funding progress -----------------
router.get("/progress/:businessId", authenticateToken, async (req, res) => {
  try {
    const totalRaised = await Contribution.aggregate([
      { $match: { business: new mongoose.Types.ObjectId(req.params.businessId) } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const business = await Business.findById(req.params.businessId).select("name targetAmount");

    res.json({
      businessName: business.name,
      target: business.targetAmount,
      raised: totalRaised[0]?.total || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching funding progress" });
  }
});

// ----------------- Get leaderboard -----------------
router.get("/leaderboard/:businessId", authenticateToken, async (req, res) => {
  try {
    const leaderboard = await Contribution.aggregate([
      { $match: { business: new mongoose.Types.ObjectId(req.params.businessId) } },
      { $group: { _id: "$user", totalContributed: { $sum: "$amount" } } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $sort: { totalContributed: -1 } },
      { $limit: 10 },
    ]);

    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
});

// ----------------- Admin: Get all contributions -----------------
router.get("/admin/all", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const contributions = await Contribution.find()
      .populate("user", "name email")
      .populate("business", "name");

    res.json(contributions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch contributions" });
  }
});

// ----------------- Get my contributions -----------------
router.get("/my-contributions", authenticateToken, async (req, res) => {
  try {
    const contributions = await Contribution.find({ user: req.user.id })
      .populate("business", "name description")
      .sort({ createdAt: -1 });

    res.json(contributions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch contributions" });
  }
});

module.exports = router;
