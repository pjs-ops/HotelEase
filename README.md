# Hotel Management System

This is a full-stack hotel management system with a React frontend and MongoDB backend.

## Features

- Complete user authentication with signup and login
- Role-based access control (Admin, Receptionist, Housekeeping, Guest)
- Dashboard for different user roles
- Room management
- Booking management
- Service requests
- Analytics and reporting

## Project Structure

- `/backend` - MongoDB and Express API
- `/frontend` - React frontend with TypeScript and Tailwind CSS

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas connection)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following content:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5001
   ```

4. Start the backend server:
   ```
   npm start
   ```

The backend server will run on http://localhost:5001

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

The frontend will be accessible at http://localhost:5173

## API Routes

- **Auth**: `/api/auth` - User authentication (login, register)
- **Users**: `/api/users` - User management
- **Rooms**: `/api/rooms` - Room management
- **Bookings**: `/api/bookings` - Booking management
- **Services**: `/api/services` - Service requests
- **Analytics**: `/api/analytics` - Reports and analytics

## User Roles

- **Admin**: Full system access, can manage staff, pricing, and view analytics
- **Receptionist**: Manages bookings, check-ins/outs, and guest services
- **Housekeeping**: Manages room cleaning and maintenance tasks
- **Guest**: Can make bookings, request services, and view own bookings

## Testing the Application

You can register as a guest user using the signup form, or log in with the following test accounts:

- **Admin**: username: `admin`, password: `admin123`
- **Receptionist**: username: `reception`, password: `reception123`
- **Housekeeping**: username: `housekeeping`, password: `housekeeping123`
- **Guest**: username: `guest`, password: `guest123`

