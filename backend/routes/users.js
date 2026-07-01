const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// @route   GET /api/users
// @desc    Get all users with optional role filter
// @access  Private (admin only)
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    
    // Build filter object
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/users
// @desc    Create a new user (for staff members)
// @access  Private (admin only)
router.post('/', async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      role,
      fullName,
      phone,
      employeeId,
      joiningDate
    } = req.body;
    
    console.log('Creating new user with data:', {
      username, email, role, fullName, phone,
      employeeId, joiningDate,
      password: password ? '******' : undefined
    });
    
    // Validate required fields
    if (!username || !email || !password || !role) {
      console.error('Missing required fields for user creation');
      return res.status(400).json({ 
        msg: 'Missing required fields', 
        details: {
          username: username ? 'provided' : 'missing',
          email: email ? 'provided' : 'missing',
          password: password ? 'provided' : 'missing',
          role: role ? 'provided' : 'missing'
        }
      });
    }
    
    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      console.log(`User already exists with email ${email} or username ${username}`);
      return res.status(400).json({ msg: 'User already exists' });
    }
    
    // Create new user
    user = new User({
      username,
      email,
      password,
      role,
      fullName,
      phone,
      employeeId,
      joiningDate: joiningDate ? new Date(joiningDate) : Date.now()
    });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    const savedUser = await user.save();
    console.log(`User created successfully with ID: ${savedUser._id}`);
    
    // Return user without password
    const userResponse = savedUser.toObject();
    delete userResponse.password;
    
    // Ensure both _id and id fields are present for compatibility
    userResponse.id = userResponse._id.toString();
    
    res.json(userResponse);
  } catch (err) {
    console.error('Error creating user:', err);
    if (err.name === 'ValidationError') {
      // Mongoose validation error
      const validationErrors = {};
      for (let field in err.errors) {
        validationErrors[field] = err.errors[field].message;
      }
      return res.status(400).json({ 
        msg: 'Validation error', 
        details: validationErrors 
      });
    }
    if (err.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ 
        msg: 'Duplicate key error', 
        details: err.keyValue 
      });
    }
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      address,
      role,
      isActive,
      idProofType,
      idProofNumber
    } = req.body;
    
    // Build user object
    const userFields = {};
    if (fullName) userFields.fullName = fullName;
    if (email) userFields.email = email;
    if (phone) userFields.phone = phone;
    if (address !== undefined) userFields.address = address;
    if (role) userFields.role = role;
    if (isActive !== undefined) userFields.isActive = isActive;
    if (idProofType) userFields.idProofType = idProofType;
    if (idProofNumber) userFields.idProofNumber = idProofNumber;
    
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/users/password/:id
// @desc    Update user password
// @access  Private
router.put('/password/:id', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { password: hashedPassword } },
      { new: true }
    ).select('-password');
    
    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    await User.findByIdAndRemove(req.params.id);
    
    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router; 