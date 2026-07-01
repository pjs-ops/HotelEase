# Project  - Hotel Management System Backend

This is the backend API for the Project Hotel Management System. It provides RESTful endpoints for managing hotel operations including room management, bookings, user authentication, and more.

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory with the following content:
   ```
   PORT=5001
   MONGO_URI=mongodb://localhost:27017/project-bolt
   JWT_SECRET=your_jwt_secret_key_here
   ```

3. Make sure MongoDB is running on your system

4. Start the server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/user` - Get current user data

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create a new user (admin only)
- `PUT /api/users/:id` - Update user details
- `PUT /api/users/password/:id` - Update user password
- `DELETE /api/users/:id` - Delete a user (admin only)

### Rooms
- `GET /api/rooms` - Get all rooms with optional filters
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms` - Create a new room (admin only)
- `PUT /api/rooms/:id` - Update room details (admin only)
- `DELETE /api/rooms/:id` - Delete a room (admin only)

### Bookings
- `GET /api/bookings` - Get all bookings with optional filters
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create a new booking
- `PUT /api/bookings/:id` - Update booking status/details
- `DELETE /api/bookings/:id` - Delete a booking (admin only)

### Services
- `GET /api/services` - Get all service requests with optional filters
- `GET /api/services/:id` - Get service request by ID
- `POST /api/services` - Create a new service request
- `PUT /api/services/:id` - Update service request status/details
- `DELETE /api/services/:id` - Delete a service request

### Analytics (Admin only)
- `GET /api/analytics/overview` - Get hotel overview analytics
- `GET /api/analytics/revenue` - Get revenue analytics
- `GET /api/analytics/bookings` - Get booking analytics

## Models

The system uses the following data models:

1. **User**: Staff and guest accounts with role-based permissions
2. **Room**: Hotel room information with types, pricing, and status
3. **Booking**: Reservation details linking guests to rooms
4. **Service**: Room service and maintenance requests

## Authentication

This API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header for protected routes:

```
Authorization: Bearer <your-token-here>
``` 