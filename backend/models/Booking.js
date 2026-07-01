const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  guestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  numberOfGuests: {
    type: Number,
    required: true,
    default: 1
  },
  status: {
    type: String,
    enum: ['confirmed', 'checked-in', 'checked-out', 'cancelled'],
    default: 'confirmed'
  },
  totalPrice: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed'],
    default: 'pending'
  },
  specialRequests: {
    type: String
  },
  bookingSource: {
    type: String,
    enum: ['Direct Website', 'Online Travel Agencies', 'Corporate Bookings', 'Walk-in'],
    default: 'Direct Website'
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema); 