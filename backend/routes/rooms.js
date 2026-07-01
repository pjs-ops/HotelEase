const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

// @route   GET /api/rooms
// @desc    Get all rooms with optional filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { type, status, minPrice, maxPrice } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (minPrice) filter.basePrice = { $gte: parseInt(minPrice) };
    if (maxPrice) {
      filter.basePrice = filter.basePrice || {};
      filter.basePrice.$lte = parseInt(maxPrice);
    }

    const rooms = await Room.find(filter).sort({ roomNumber: 1 });
    res.json(rooms);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/rooms/:id
// @desc    Get room by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }
    
    res.json(room);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Room not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/rooms
// @desc    Create a new room
// @access  Private (admin only)
router.post('/', async (req, res) => {
  try {
    const { roomNumber, type, basePrice, weekendPrice, holidayPrice, amenities, capacity } = req.body;
    
    // Check if room with this number already exists
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({ msg: 'Room with this number already exists' });
    }
    
    // Create new room
    const newRoom = new Room({
      roomNumber,
      type,
      basePrice,
      weekendPrice,
      holidayPrice,
      amenities,
      capacity
    });
    
    const room = await newRoom.save();
    res.json(room);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/rooms/:id
// @desc    Update room
// @access  Private (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { roomNumber, type, basePrice, weekendPrice, holidayPrice, status, amenities, capacity } = req.body;
    
    // Build room object
    const roomFields = {};
    if (roomNumber) roomFields.roomNumber = roomNumber;
    if (type) roomFields.type = type;
    if (basePrice) roomFields.basePrice = basePrice;
    if (weekendPrice) roomFields.weekendPrice = weekendPrice;
    if (holidayPrice) roomFields.holidayPrice = holidayPrice;
    if (status) roomFields.status = status;
    if (amenities) roomFields.amenities = amenities;
    if (capacity) roomFields.capacity = capacity;
    
    let room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }
    
    // Update room
    room = await Room.findByIdAndUpdate(
      req.params.id,
      { $set: roomFields },
      { new: true }
    );
    
    res.json(room);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Room not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/rooms/:id
// @desc    Delete room
// @access  Private (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }
    
    await Room.findByIdAndRemove(req.params.id);
    
    res.json({ msg: 'Room removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Room not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router; 