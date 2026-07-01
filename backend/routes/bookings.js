const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const mongoose = require('mongoose');
const User = require('../models/User');

// @route   GET /api/bookings
// @desc    Get all bookings with optional filters
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { status, guestId, roomId, fromDate, toDate, populate } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (guestId) filter.guestId = guestId;
    if (roomId) filter.roomId = roomId;
    
    // Date range filtering
    if (fromDate || toDate) {
      filter.$or = [];
      
      // Find bookings where check-in or check-out falls within the date range
      if (fromDate && toDate) {
        filter.$or.push(
          { checkIn: { $gte: new Date(fromDate), $lte: new Date(toDate) } },
          { checkOut: { $gte: new Date(fromDate), $lte: new Date(toDate) } },
          {
            $and: [
              { checkIn: { $lte: new Date(fromDate) } },
              { checkOut: { $gte: new Date(toDate) } }
            ]
          }
        );
      } else if (fromDate) {
        filter.$or.push(
          { checkIn: { $gte: new Date(fromDate) } },
          { checkOut: { $gte: new Date(fromDate) } }
        );
      } else if (toDate) {
        filter.$or.push(
          { checkIn: { $lte: new Date(toDate) } },
          { checkOut: { $lte: new Date(toDate) } }
        );
      }
    }

    // Create booking query with proper population
    let bookingQuery = Booking.find(filter);
    
    // Always populate room and guest data with essential fields
    bookingQuery = bookingQuery
      .populate({
        path: 'roomId',
        select: 'roomNumber type basePrice status'
      })
      .populate({
        path: 'guestId',
        select: 'username fullName email phone'
      })
      .sort({ checkIn: -1 });
    
    const bookings = await bookingQuery;
    
    // Add convenience properties to match frontend model
    const enhancedBookings = bookings.map(booking => {
      const bookingObject = booking.toObject();
      
      // Ensure ID properties exist in the format the frontend expects
      bookingObject.id = bookingObject._id.toString();
      
      // Add convenience room and guest properties
      if (bookingObject.roomId) {
        bookingObject.room = bookingObject.roomId;
        // Also keep the original roomId
      }
      
      if (bookingObject.guestId) {
        bookingObject.guest = bookingObject.guestId;
        bookingObject.guestName = bookingObject.guestId.fullName || bookingObject.guestId.username;
        bookingObject.phone = bookingObject.guestId.phone;
      }
      
      return bookingObject;
    });
      
    res.json(enhancedBookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('roomId', 'roomNumber type basePrice amenities')
      .populate('guestId', 'username fullName email phone');
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    
    // Convert to enhanced response with convenience properties
    const bookingObject = booking.toObject();
    
    // Ensure ID properties exist in the format the frontend expects
    bookingObject.id = bookingObject._id.toString();
    
    // Add convenience room and guest properties
    if (bookingObject.roomId) {
      bookingObject.room = bookingObject.roomId;
      // Also keep the original roomId
    }
    
    if (bookingObject.guestId) {
      bookingObject.guest = bookingObject.guestId;
      bookingObject.guestName = bookingObject.guestId.fullName || bookingObject.guestId.username;
      bookingObject.phone = bookingObject.guestId.phone;
    }
    
    res.json(bookingObject);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', async (req, res) => {
  try {
    const {
      roomId,
      guestId,
      checkIn,
      checkOut,
      numberOfGuests,
      totalPrice,
      specialRequests,
      bookingSource
    } = req.body;
    
    // Process roomId with extra validation - it might be the display text
    let processedRoomId = roomId;
    
    // Check if it's a valid ObjectId
    if (roomId && !mongoose.Types.ObjectId.isValid(roomId)) {
      console.warn(`Invalid ObjectId format received for roomId: ${roomId}. Attempting to recover.`);
      
      // It might be in format "101 - Standard (₹1500/night)" - try to extract room number
      const roomNumberMatch = roomId.match(/^(\d+)/);
      
      if (roomNumberMatch && roomNumberMatch[1]) {
        const roomNumber = roomNumberMatch[1];
        console.log(`Extracted room number from display text: ${roomNumber}`);
        
        // Try to find room by room number
        const room = await Room.findOne({ roomNumber });
        
        if (room) {
          console.log(`Found room by room number: ${roomNumber}, using ID: ${room._id}`);
          processedRoomId = room._id;
        } else {
          return res.status(400).json({ msg: `Room not found with number: ${roomNumber}` });
        }
      } else {
        return res.status(400).json({ msg: `Invalid room ID format: ${roomId}` });
      }
    }
    
    // Check if room exists and is available
    let room;
    try {
      room = await Room.findById(processedRoomId);
      if (!room) {
        return res.status(404).json({ msg: 'Room not found' });
      }
    } catch (err) {
      console.error('Error finding room:', err.message);
      return res.status(400).json({ msg: `Invalid room ID format: ${processedRoomId}` });
    }
    
    if (room.status !== 'Available') {
      return res.status(400).json({ msg: 'Room is not available for booking' });
    }
    
    // Check for date conflicts with existing bookings
    const conflictingBookings = await Booking.find({
      roomId,
      $or: [
        { checkIn: { $lte: new Date(checkOut), $gte: new Date(checkIn) } },
        { checkOut: { $gte: new Date(checkIn), $lte: new Date(checkOut) } },
        {
          $and: [
            { checkIn: { $lte: new Date(checkIn) } },
            { checkOut: { $gte: new Date(checkOut) } }
          ]
        }
      ],
      status: { $nin: ['cancelled', 'checked-out'] }
    });
    
    if (conflictingBookings.length > 0) {
      return res.status(400).json({ msg: 'Room is already booked for the selected dates' });
    }
    
    // Create new booking with proper ObjectId validation
    const newBooking = new Booking({
      roomId: processedRoomId,
      guestId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      numberOfGuests,
      totalPrice,
      specialRequests,
      bookingSource: bookingSource || 'Direct Website'
    });
    
    const booking = await newBooking.save();
    
    // Update room status to Occupied if immediate check-in
    const currentDate = new Date();
    const checkInDate = new Date(checkIn);
    
    if (checkInDate.setHours(0, 0, 0, 0) <= currentDate.setHours(0, 0, 0, 0)) {
      await Room.findByIdAndUpdate(processedRoomId, { status: 'Occupied' });
    }
    
    // Convert to plain object for response
    const bookingResponse = booking.toObject();
    
    // Ensure both _id and id fields are present for compatibility
    bookingResponse.id = bookingResponse._id.toString();
    
    // Also fetch the complete room and guest data for the response
    try {
      const room = await Room.findById(processedRoomId);
      const guest = await User.findById(guestId);
      
      if (room) {
        bookingResponse.room = room.toObject();
        bookingResponse.room.id = bookingResponse.room._id.toString();
      }
      
      if (guest) {
        bookingResponse.guest = guest.toObject();
        delete bookingResponse.guest.password; // Remove sensitive data
        bookingResponse.guest.id = bookingResponse.guest._id.toString();
        bookingResponse.guestName = guest.fullName || guest.username;
        bookingResponse.phone = guest.phone;
      }
    } catch (fetchError) {
      console.error('Error fetching additional booking data:', fetchError);
      // Continue with the response even if we couldn't fetch additional data
    }
    
    console.log(`Booking created successfully with ID: ${bookingResponse.id}`);
    
    res.json(bookingResponse);
  } catch (err) {
    console.error('Booking creation error:', err.message);
    
    // Handle ObjectId validation errors with clearer messages
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        msg: `Invalid ${err.path} format: ${err.value}` 
      });
    }
    
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/bookings/:id
// @desc    Update booking
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const {
      checkIn,
      checkOut,
      numberOfGuests,
      status,
      totalPrice,
      paymentStatus,
      specialRequests
    } = req.body;
    
    // Build booking object
    const bookingFields = {};
    if (checkIn) bookingFields.checkIn = new Date(checkIn);
    if (checkOut) bookingFields.checkOut = new Date(checkOut);
    if (numberOfGuests) bookingFields.numberOfGuests = numberOfGuests;
    if (status) bookingFields.status = status;
    if (totalPrice) bookingFields.totalPrice = totalPrice;
    if (paymentStatus) bookingFields.paymentStatus = paymentStatus;
    if (specialRequests) bookingFields.specialRequests = specialRequests;
    
    let booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    
    // Update room status based on booking status
    if (status && status !== booking.status) {
      const room = await Room.findById(booking.roomId);
      
      if (status === 'checked-in') {
        await Room.findByIdAndUpdate(booking.roomId, { status: 'Occupied' });
      } else if (status === 'checked-out') {
        await Room.findByIdAndUpdate(booking.roomId, { status: 'Cleaning' });
      } else if (status === 'cancelled' && room.status === 'Occupied') {
        await Room.findByIdAndUpdate(booking.roomId, { status: 'Available' });
      }
    }
    
    // Update booking
    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: bookingFields },
      { new: true }
    ).populate('roomId', 'roomNumber type');
    
    res.json(booking);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Delete booking
// @access  Private (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    
    await Booking.findByIdAndRemove(req.params.id);
    
    res.json({ msg: 'Booking removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router; 