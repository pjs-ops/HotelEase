const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');
const Service = require('../models/Service');

// @route   GET /api/analytics/overview
// @desc    Get overall analytics
// @access  Private (admin only)
router.get('/overview', async (req, res) => {
  try {
    // Get total rooms
    const totalRooms = await Room.countDocuments();
    
    // Get occupied rooms
    const occupiedRooms = await Room.countDocuments({ status: 'Occupied' });
    
    // Get available rooms
    const availableRooms = await Room.countDocuments({ status: 'Available' });
    
    // Get rooms under maintenance
    const maintenanceRooms = await Room.countDocuments({ status: 'Maintenance' });
    
    // Get rooms being cleaned
    const cleaningRooms = await Room.countDocuments({ status: 'Cleaning' });
    
    // Get total users by role
    const totalGuests = await User.countDocuments({ role: 'guest' });
    const totalStaff = await User.countDocuments({ role: { $ne: 'guest' } });
    
    // Get active bookings
    const activeBookings = await Booking.countDocuments({ 
      status: { $in: ['confirmed', 'checked-in'] } 
    });
    
    // Get pending service requests
    const pendingServices = await Service.countDocuments({ 
      status: { $in: ['pending', 'processing'] } 
    });
    
    // Calculate occupancy rate
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    
    res.json({
      totalRooms,
      occupiedRooms,
      availableRooms,
      maintenanceRooms,
      cleaningRooms,
      totalGuests,
      totalStaff,
      activeBookings,
      pendingServices,
      occupancyRate: occupancyRate.toFixed(2)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/analytics/revenue
// @desc    Get revenue analytics
// @access  Private (admin only)
router.get('/revenue', async (req, res) => {
  try {
    const { period } = req.query;
    
    // Define date ranges based on period
    let startDate = new Date();
    let endDate = new Date();
    let groupBy = '$month';
    
    if (period === 'yearly') {
      startDate.setFullYear(startDate.getFullYear() - 1);
      groupBy = '$month';
    } else if (period === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
      groupBy = '$day';
    } else if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
      groupBy = '$day';
    } else {
      // Default: last 3 months
      startDate.setMonth(startDate.getMonth() - 3);
      groupBy = '$month';
    }
    
    // Aggregate bookings data for revenue analysis
    const revenueData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $nin: ['cancelled'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalRevenue: { $sum: '$totalPrice' },
          bookingCount: { $sum: 1 },
          avgStayLength: {
            $avg: {
              $divide: [
                { $subtract: ['$checkOut', '$checkIn'] },
                1000 * 60 * 60 * 24 // Convert ms to days
              ]
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);
    
    // Format the response
    const formattedData = revenueData.map(item => {
      const date = new Date(item._id.year, item._id.month - 1, item._id.day);
      
      return {
        date: date.toISOString().split('T')[0],
        month: date.toLocaleString('default', { month: 'long' }),
        day: item._id.day,
        year: item._id.year,
        revenue: item.totalRevenue,
        bookings: item.bookingCount,
        avgStayLength: parseFloat(item.avgStayLength.toFixed(1))
      };
    });
    
    res.json(formattedData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/analytics/bookings
// @desc    Get booking analytics
// @access  Private (admin only)
router.get('/bookings', async (req, res) => {
  try {
    // Get booking sources distribution
    const bookingSources = await Booking.aggregate([
      {
        $group: {
          _id: '$bookingSource',
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Get room type distribution
    const roomTypeBookings = await Booking.aggregate([
      {
        $lookup: {
          from: 'rooms',
          localField: 'roomId',
          foreignField: '_id',
          as: 'room'
        }
      },
      {
        $unwind: '$room'
      },
      {
        $group: {
          _id: '$room.type',
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    res.json({
      bookingSources: bookingSources.map(source => ({
        channel: source._id,
        bookings: source.count,
        revenue: source.revenue
      })),
      roomTypeDistribution: roomTypeBookings.map(type => ({
        type: type._id,
        bookings: type.count,
        revenue: type.revenue
      }))
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 