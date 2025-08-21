const mongoose = require('mongoose');

const partnershipSchema = new mongoose.Schema({
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  slotsBought: { type: Number, required: true },
  totalCost: { type: Number, required: true }
}, { timestamps: true });

// ✅ Prevent OverwriteModelError
const Partnership = mongoose.models.Partnership || mongoose.model('Partnership', partnershipSchema);

module.exports = Partnership;
