// routes/withdrawalRoutes.js
const express = require("express");
const router = express.Router();
const Withdrawal = require("../models/Withdrawal");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { io, onlineUsers } = require("../server");

// ----------------- Request Withdrawal -----------------
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { amount, businessId } = req.body;

    const withdrawal = new Withdrawal({
      user: req.user.id,
      business: businessId,
      amount,
      status: "pending",
    });
    await withdrawal.save();

    // 🔔 Notify user
    await Notification.create({
      user: req.user.id,
      type: "withdrawal",
      message: `Your withdrawal request of ₦${amount} is submitted. Awaiting approval.`,
    });

    if (onlineUsers[req.user.id]) {
      io.to(onlineUsers[req.user.id]).emit("newNotification", {
        user: req.user.id,
        message: `💰 Withdrawal request of ₦${amount} submitted successfully.`,
      });
    }

    // 🔔 Notify all admins
    const admins = await User.find({ role: "admin" });
    for (let admin of admins) {
      await Notification.create({
        user: admin._id,
        type: "system",
        message: `${req.user.name} requested a withdrawal of ₦${amount} for business ${businessId}`,
      });

      if (onlineUsers[admin._id]) {
        io.to(onlineUsers[admin._id]).emit("newNotification", {
          user: admin._id,
          message: `${req.user.name} requested a withdrawal of ₦${amount}`,
        });
      }
    }

    res.status(201).json({ message: "Withdrawal request submitted", withdrawal });
  } catch (error) {
    console.error("Withdrawal error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- Approve / Reject Withdrawal -----------------
router.put("/:id/status", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { status } = req.body; // "approved" or "rejected"
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: "Withdrawal not found" });

    withdrawal.status = status;
    await withdrawal.save();

    // Notify user
    await Notification.create({
      user: withdrawal.user,
      type: "withdrawal",
      message: `Your withdrawal of ₦${withdrawal.amount} has been ${status}.`,
    });

    if (onlineUsers[withdrawal.user]) {
      io.to(onlineUsers[withdrawal.user]).emit("newNotification", {
        user: withdrawal.user,
        message: `💰 Your withdrawal of ₦${withdrawal.amount} has been ${status}.`,
      });
    }

    res.json({ message: `Withdrawal ${status}`, withdrawal });
  } catch (error) {
    console.error("Update withdrawal error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- Partner: Get own withdrawal history -----------------
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user.id })
      .populate("business", "name description")
      .sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch withdrawal history" });
  }
});

module.exports = router;
