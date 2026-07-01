const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  stock: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['Sufficient', 'Low', 'Critical'], default: 'Sufficient' },
  lowThreshold: { type: Number, default: 50 },
  criticalThreshold: { type: Number, default: 10 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Inventory', inventorySchema); 