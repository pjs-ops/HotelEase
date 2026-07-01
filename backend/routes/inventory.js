const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// Helper to determine status
function getStatus(stock, low, critical) {
  if (stock <= critical) return 'Critical';
  if (stock <= low) return 'Low';
  return 'Sufficient';
}

// GET /api/inventory - list all items
router.get('/', async (req, res) => {
  try {
    const items = await Inventory.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/inventory - add new item
router.post('/', async (req, res) => {
  try {
    const { name, stock = 0, lowThreshold = 50, criticalThreshold = 10 } = req.body;
    const status = getStatus(stock, lowThreshold, criticalThreshold);
    const item = new Inventory({ name, stock, lowThreshold, criticalThreshold, status });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

// PUT /api/inventory/:id - update item
router.put('/:id', async (req, res) => {
  try {
    const { stock, name, lowThreshold, criticalThreshold } = req.body;
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Item not found' });
    if (typeof stock === 'number') item.stock = stock;
    if (name) item.name = name;
    if (typeof lowThreshold === 'number') item.lowThreshold = lowThreshold;
    if (typeof criticalThreshold === 'number') item.criticalThreshold = criticalThreshold;
    item.status = getStatus(item.stock, item.lowThreshold, item.criticalThreshold);
    item.updatedAt = new Date();
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

// DELETE /api/inventory/:id - delete item
router.delete('/:id', async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Item not found' });
    res.json({ msg: 'Item deleted' });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

module.exports = router; 