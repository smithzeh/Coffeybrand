const express = require("express");
const router = express.Router();
const Business = require("../models/Business");
const Investment = require("../models/Investment");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

// 📌 Join business (buy slot)
router.post("/:id/join", authenticateToken, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id).populate("partners");
    if (!business) return res.status(404).json({ message: "Business not found" });

    // Check if slots are available
    if (business.partners.length >= business.maxPartners) {
      return res.status(400).json({ message: "No slots available" });
    }

    // Check if user already joined
    if (business.partners.some(p => p.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: "Already a partner" });
    }

    // Create investment record
    const investment = new Investment({
      user: req.user._id,
      business: business._id,
      amount: business.cost
    });
    await investment.save();

    // Add partner to business
    business.partners.push(req.user._id);
    await business.save();

    res.json({ message: "Joined successfully", investment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 📌 Get my investments
router.get("/me/investments", authenticateToken, async (req, res) => {
  try {
    const investments = await Investment.find({ user: req.user._id }).populate("business");
    res.json(investments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Get single business details
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id)
      .populate("creator", "name email")  // show creator info
      .populate("members.user", "name email"); // show member info

    if (!business) return res.status(404).json({ msg: "Business not found" });

    res.json(business);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
const io = req.app.get("io");

// Example: distributing profit
business.partners.forEach((partner) => {
  partner.balance += partnerShare; 
});

// Save business & partner updates
await business.save();

// Emit event so partners' dashboards update live
io.emit("profitUpdate", {
  businessId: business._id,
  partners: business.partners,
});
// Get businesses created by logged-in user (Admin Dashboard)
router.get("/admin/mine", authMiddleware, async (req, res) => {
  try {
    const businesses = await Business.find({ creator: req.user.id })
      .populate("members.user", "name email");
    res.json(businesses);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});
// Add contribution
router.post("/:id/contribute", authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ msg: "Business not found" });

    business.contributions.push({
      user: req.user.id,
      amount,
      status: "pending",
    });

    await business.save();
    res.json({ msg: "Contribution submitted, waiting for approval" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Approve contribution (Admin only)
router.put("/:id/contribution/:contributionId/approve", authMiddleware, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ msg: "Business not found" });

    // Check if current user is admin
    if (business.creator.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    const contribution = business.contributions.id(req.params.contributionId);
    if (!contribution) return res.status(404).json({ msg: "Contribution not found" });

    contribution.status = "approved";
    await business.save();

    res.json({ msg: "Contribution approved" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Get businesses owned by logged-in user + total contributions
router.get("/my-businesses", protect, async (req, res) => {
  try {
    const businesses = await Business.find({ owner: req.user._id })
      .populate("owner", "name email");

    // fetch contributions count + sum
    const withContributions = await Promise.all(
      businesses.map(async (b) => {
        const contributions = await Contribution.find({ business: b._id });
        const totalAmount = contributions.reduce((sum, c) => sum + c.amount, 0);
        return {
          ...b._doc,
          totalContributions: totalAmount,
          contributionsCount: contributions.length,
        };
      })
    );

    res.json(withContributions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
