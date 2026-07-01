const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
}));
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/project-bolt';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/services', require('./routes/services'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/inventory', require('./routes/inventory'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Project Bolt Hotel Management API' });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 