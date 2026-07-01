const express = require('express');
const router = express.Router();
const Service = require('../models/Service');

// @route   GET /api/services
// @desc    Get all services with optional filters
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { type, status, guestId, roomId, bookingId } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (guestId) filter.guestId = guestId;
    if (roomId) filter.roomId = roomId;
    if (bookingId) filter.bookingId = bookingId;

    const services = await Service.find(filter)
      .populate('guestId', 'username fullName')
      .populate('roomId', 'roomNumber')
      .populate('assignedTo', 'username fullName')
      .sort({ createdAt: -1 });
      
    res.json(services);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/services/:id
// @desc    Get service by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('guestId', 'username fullName email')
      .populate('roomId', 'roomNumber type')
      .populate('assignedTo', 'username fullName');
    
    if (!service) {
      return res.status(404).json({ msg: 'Service request not found' });
    }
    
    res.json(service);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Service request not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/services
// @desc    Create a new service request
// @access  Private
router.post('/', async (req, res) => {
  try {
    const {
      type,
      guestId,
      roomId,
      bookingId,
      item,
      quantity,
      price,
      notes
    } = req.body;
    
    // Create new service request
    const newService = new Service({
      type,
      guestId,
      roomId,
      bookingId,
      item,
      quantity: quantity || 1,
      price: price || 0,
      notes
    });
    
    const service = await newService.save();
    
    res.json(service);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/services/:id
// @desc    Update service request
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const {
      status,
      assignedTo,
      notes,
      price
    } = req.body;
    
    // Build service object
    const serviceFields = {};
    if (status) serviceFields.status = status;
    if (assignedTo) serviceFields.assignedTo = assignedTo;
    if (notes) serviceFields.notes = notes;
    if (price !== undefined) serviceFields.price = price;
    
    let service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ msg: 'Service request not found' });
    }
    
    // Update service
    service = await Service.findByIdAndUpdate(
      req.params.id,
      { $set: serviceFields },
      { new: true }
    ).populate('assignedTo', 'username fullName');
    
    res.json(service);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Service request not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/services/:id
// @desc    Delete service request
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ msg: 'Service request not found' });
    }
    
    await Service.findByIdAndRemove(req.params.id);
    
    res.json({ msg: 'Service request removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Service request not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router; 