const express = require("express");
const router = express.Router();
const Statement = require("../models/Statement");
const Business = require("../models/Business");
const Partnership = require("../models/Partnership");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

// 📌 Admin: Add monthly statement
router.post("/:businessId", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { businessId } = req.params;
    const { month, details, revenue, expenses, profit } = req.body;

    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: "Business not found" });

    const statement = new Statement({
      business: businessId,
      month,
      details,
      revenue,
      expenses,
      profit
    });

    await statement.save();
    res.json({ message: "Statement added", statement });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 📌 Admin: Update total annual profit & allocate to partners
router.post("/:businessId/allocate-profit", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { businessId } = req.params;
    const { totalProfit } = req.body;

    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: "Business not found" });

    const partnerships = await Partnership.find({ business: businessId });
    if (partnerships.length === 0) {
      return res.status(400).json({ message: "No partners to allocate profit" });
    }

    const perPartnerProfit = totalProfit / partnerships.length;

    for (let p of partnerships) {
      p.profitEarned += perPartnerProfit;
      await p.save();
    }

    res.json({ message: "Profit allocated successfully", perPartnerProfit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
