const express = require("express");
const router = express.Router();
const Partnership = require("../models/Partnership");
const Business = require("../models/Business");
const User = require("../models/User");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

// 📌 Buy a partnership
router.post("/buy/:businessId", authenticateToken, authorizeRoles("partner"), async (req, res) => {
  try {
    const { businessId } = req.params;
    const userId = req.user.id;

    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: "Business not found" });

    const io = req.app.get("io");

// Example when a new partner is added
const newPartner = await Partner.create({ name, email, business: businessId });
io.emit("newPartner", newPartner);


    // check available slots
    const count = await Partnership.countDocuments({ business: businessId });
    if (count >= business.maxPartners) {
      return res.status(400).json({ message: "All partnership slots are filled" });
    }

    // fetch user from DB to check wallet balance
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.walletBalance < business.cost) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    // deduct cost
    user.walletBalance -= business.cost;
    await user.save();

    // create partnership
    const partnership = new Partnership({
      user: userId,
      business: businessId,
      amountPaid: business.cost
    });
    await partnership.save();

    res.json({ message: "Partnership purchased successfully", partnership });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 📌 View all my partnerships
router.get("/my-partnerships", authenticateToken, authorizeRoles("partner"), async (req, res) => {
  try {
    const partnerships = await Partnership.find({ user: req.user.id })
      .populate("business");
    res.json(partnerships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 📌 Admin: view all partnerships of a business
router.get("/business/:businessId", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { businessId } = req.params;
    const partnerships = await Partnership.find({ business: businessId })
      .populate("user", "username email");
    res.json(partnerships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
