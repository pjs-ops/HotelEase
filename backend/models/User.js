const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'receptionist', 'housekeeping', 'guest'],
    required: true
  },
  fullName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  // Fields for guests
  address: {
    type: String
  },
  idProofType: {
    type: String,
    enum: ['Passport', 'Driving License', 'National ID', 'Other']
  },
  idProofNumber: {
    type: String
  },
  // Staff specific fields
  employeeId: {
    type: String
  },
  joiningDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema); 