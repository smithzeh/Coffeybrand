const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Business = require("../models/Business");
const Partnership = require("../models/Partnership");
const Withdrawal = require("../models/Withdrawal");
const Contribution = require("../models/Contribution");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

// 📌 Partner: Request withdrawal
router.post("/:businessId", authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.params;
    const { amount } = req.body;

    const partnership = await Partnership.findOne({ business: businessId, partner: req.user._id });
    if (!partnership) return res.status(404).json({ message: "You are not a partner in this business" });

    if (amount > partnership.profitEarned) {
      return res.status(400).json({ message: "Insufficient profit balance" });
    }

    const withdrawal = new Withdrawal({
      partner: req.user._id,
      business: businessId,
      amount,
    });

    await withdrawal.save();
    res.json({ message: "Withdrawal request submitted", withdrawal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 📌 Admin: Approve withdrawal
router.put("/:id/approve", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: "Request not found" });
    if (withdrawal.status !== "pending") return res.status(400).json({ message: "Request already processed" });

    const partnership = await Partnership.findOne({ business: withdrawal.business, partner: withdrawal.partner });
    if (!partnership) return res.status(404).json({ message: "Partnership not found" });

    partnership.profitEarned -= withdrawal.amount;
    await partnership.save();

    withdrawal.status = "approved";
    await withdrawal.save();

    res.json({ message: "Withdrawal approved", withdrawal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 📌 Admin Dashboard Overview
router.get("/dashboard", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBusinesses = await Business.countDocuments();
    const totalPartnerships = await Partnership.countDocuments();
    const totalWithdrawals = await Withdrawal.countDocuments();

    const pendingWithdrawals = await Withdrawal.countDocuments({ status: "pending" });
    const approvedWithdrawals = await Withdrawal.countDocuments({ status: "approved" });
    const rejectedWithdrawals = await Withdrawal.countDocuments({ status: "rejected" });

    const businesses = await Business.find().populate("owner", "name email");
    const partnerships = await Partnership.find().populate("partner", "name email").populate("business", "name");
    const withdrawals = await Withdrawal.find().populate("partner", "name email").populate("business", "name");

    res.json({
      stats: {
        totalUsers,
        totalBusinesses,
        totalPartnerships,
        totalWithdrawals,
        pendingWithdrawals,
        approvedWithdrawals,
        rejectedWithdrawals,
      },
      businesses,
      partnerships,
      withdrawals,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------- Admin: Get All Contributions -----------------
router.get("/contributions", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const contributions = await Contribution.find()
      .populate("businessId", "name")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(contributions);
  } catch (error) {
    console.error("Error fetching contributions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- Admin: Business Funding Progress -----------------
router.get("/businesses/progress", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const businesses = await Business.find();

    const results = await Promise.all(
      businesses.map(async (business) => {
        const contributions = await Contribution.find({ businessId: business._id });
        const totalRaised = contributions.reduce((sum, c) => sum + c.amount, 0);

        return {
          businessId: business._id,
          name: business.name,
          targetAmount: business.targetAmount || 0,
          totalRaised,
          progress: business.targetAmount
            ? ((totalRaised / business.targetAmount) * 100).toFixed(2)
            : "N/A",
        };
      })
    );

    res.json(results);
  } catch (error) {
    console.error("Error fetching business progress:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
