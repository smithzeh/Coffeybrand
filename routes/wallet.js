// routes/wallet.js
const express = require("express");
const router = express.Router();
const Wallet = require("../models/Wallet");
const Withdrawal = require("../models/Withdrawal");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

// ✅ Get my wallet
router.get("/me", authenticateToken, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = new Wallet({ user: req.user._id, balance: 0, transactions: [] });
      await wallet.save();
    }
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Request withdrawal
router.post("/withdraw", authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct temporarily
    wallet.balance -= amount;
    wallet.transactions.push({
      type: "debit",
      amount,
      description: "Withdrawal request",
    });
    await wallet.save();

    const withdrawal = new Withdrawal({
      user: req.user._id,
      amount,
      status: "pending",
    });
    await withdrawal.save();

    res.json({ message: "Withdrawal request submitted", withdrawal });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Admin: View all withdrawal requests
router.get("/withdrawals", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find().populate("user", "name email");
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Admin: Approve or Reject withdrawal
router.post("/withdrawals/:id/action", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { action } = req.body; // "approve" or "reject"
    const withdrawal = await Withdrawal.findById(req.params.id).populate("user");
    if (!withdrawal) return res.status(404).json({ message: "Withdrawal not found" });

    if (withdrawal.status !== "pending") {
      return res.status(400).json({ message: "Already processed" });
    }

    if (action === "approve") {
      withdrawal.status = "approved";
    } else if (action === "reject") {
      withdrawal.status = "rejected";

      // Refund money to wallet
      let wallet = await Wallet.findOne({ user: withdrawal.user._id });
      if (wallet) {
        wallet.balance += withdrawal.amount;
        wallet.transactions.push({
          type: "credit",
          amount: withdrawal.amount,
          description: "Refund (withdrawal rejected)",
        });
        await wallet.save();
      }
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    await withdrawal.save();
    res.json({ message: `Withdrawal ${withdrawal.status}`, withdrawal });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
