const express = require("express");
const Advert = require("../models/Advert");
const upload = require("../middleware/upload");

const router = express.Router();

// Create Advert (with image upload)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const newAd = new Advert({
      title: req.body.title,
      description: req.body.description,
      imageUrl: `/uploads/${req.file.filename}`, // store path
    });
    await newAd.save();
    res.json(newAd);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all adverts
router.get("/", async (req, res) => {
  const ads = await Advert.find();
  res.json(ads);
});

// Delete advert
router.delete("/:id", async (req, res) => {
  try {
    await Advert.findByIdAndDelete(req.params.id);
    res.json({ message: "Advert deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
