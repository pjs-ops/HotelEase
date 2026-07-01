const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Standard', 'Deluxe', 'Suite', 'Presidential'],
    default: 'Standard'
  },
  basePrice: {
    type: Number,
    required: true
  },
  weekendPrice: {
    type: Number,
    required: true
  },
  holidayPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Maintenance', 'Cleaning'],
    default: 'Available'
  },
  amenities: [{
    type: String
  }],
  capacity: {
    type: Number,
    default: 2
  },
  images: [{
    type: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema); 