import api from '../api';

export type BookingStatus = 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'completed';
export type BookingSource = 'Direct Website' | 'Online Travel Agencies' | 'Corporate Bookings' | 'Walk-in';

export interface Booking {
  id: string;
  _id?: string; // MongoDB ID property
  roomId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  status: BookingStatus;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  specialRequests?: string;
  bookingSource: BookingSource;
  createdAt?: string;
  updatedAt?: string;
  // Populated fields
  room?: {
    roomNumber: string;
    type: string;
    [key: string]: any;
  };
  guest?: {
    username: string;
    fullName?: string;
    email?: string;
    phone?: string;
    [key: string]: any;
  };
  // Frontend helper properties (derived from guest)
  guestName?: string;
  phone?: string;
}

interface BookingFilter {
  status?: BookingStatus;
  guestId?: string;
  roomId?: string;
  fromDate?: string;
  toDate?: string;
}

interface CreateBookingData {
  roomId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  totalPrice: number;
  specialRequests?: string;
  bookingSource?: BookingSource;
}

interface UpdateBookingData {
  checkIn?: string;
  checkOut?: string;
  numberOfGuests?: number;
  status?: BookingStatus;
  totalPrice?: number;
  paymentStatus?: PaymentStatus;
  specialRequests?: string;
}

// Helper to normalize MongoDB response data (handle _id vs id issue)
const normalizeBooking = (booking: any): Booking => {
  // If it's an array of bookings, map each one
  if (Array.isArray(booking)) {
    return booking.map(normalizeBooking) as any;
  }

  if (!booking) return booking;

  const result = { ...booking };
  
  // Make sure id property is available even if only _id is in the response
  if (booking._id && !booking.id) {
    result.id = booking._id.toString();
  }
  
  // Ensure roomId is a string, not an object
  if (typeof booking.roomId === 'object' && booking.roomId !== null) {
    if (booking.roomId._id) {
      result.roomId = booking.roomId._id.toString();
    } else if (booking.roomId.id) {
      result.roomId = booking.roomId.id.toString();
    } else {
      // If we can't get a proper ID, use a meaningful string representation
      result.roomId = `Room-${booking.roomId.roomNumber || 'unknown'}`;
    }
  }
  
  // Also normalize nested objects
  if (booking.room) {
    result.room = { ...booking.room };
    if (booking.room._id && !booking.room.id) {
      result.room.id = booking.room._id.toString();
    }
  }
  
  if (booking.guest) {
    result.guest = { ...booking.guest };
    if (booking.guest._id && !booking.guest.id) {
      result.guest.id = booking.guest._id.toString();
    }
  }
  
  return result;
};

// Booking management service
const bookingService = {
  // Get all bookings with optional filters
  getAllBookings: async (filters?: BookingFilter): Promise<Booking[]> => {
    try {
      console.log('Fetching bookings with filters:', filters);
      
      // Include a flag to indicate we want fully populated booking data
      const params = { 
        ...filters,
        populate: 'true' // Request populated data for room and guest
      };
      
      const response = await api.get('/bookings', { params });
      return normalizeBooking(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },

  // Get booking by ID
  getBookingById: async (bookingId: string): Promise<Booking> => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      return normalizeBooking(response.data);
    } catch (error) {
      console.error(`Error fetching booking with ID ${bookingId}:`, error);
      throw error;
    }
  },

  // Create a new booking
  createBooking: async (bookingData: CreateBookingData): Promise<Booking> => {
    try {
      console.log('Creating booking with data:', {
        ...bookingData,
        roomId: bookingData.roomId ? bookingData.roomId : 'MISSING_ROOM_ID',
        guestId: bookingData.guestId ? bookingData.guestId : 'MISSING_GUEST_ID',
      });
      
      // Validate required fields before sending to API
      if (!bookingData.roomId) {
        throw new Error('Missing required field: roomId');
      }
      
      if (!bookingData.guestId) {
        throw new Error('Missing required field: guestId');
      }
      
      const response = await api.post('/bookings', bookingData);
      console.log('Booking created successfully, response:', response.data);
      
      return normalizeBooking(response.data);
    } catch (error: any) {
      console.error('Error in createBooking:', error);
      
      // Check for specific error conditions
      if (error.response && error.response.data && error.response.data.msg) {
        throw new Error(error.response.data.msg);
      } else if (error.message && error.message.includes('ObjectId')) {
        throw new Error(`Invalid room ID format. Please select a valid room from the dropdown.`);
      } else if (error.message && error.message.includes('guestId')) {
        throw new Error(`Guest ID issue: ${error.message}. Please try again.`);
      }
      
      throw error;
    }
  },

  // Update booking
  updateBooking: async (bookingId: string, bookingData: UpdateBookingData): Promise<Booking> => {
    try {
      const response = await api.put(`/bookings/${bookingId}`, bookingData);
      return normalizeBooking(response.data);
    } catch (error) {
      console.error(`Error updating booking with ID ${bookingId}:`, error);
      throw error;
    }
  },

  // Delete booking (admin only)
  deleteBooking: async (bookingId: string): Promise<{ msg: string }> => {
    const response = await api.delete(`/bookings/${bookingId}`);
    return response.data;
  },

  // Get user's bookings
  getUserBookings: async (userId: string): Promise<Booking[]> => {
    return bookingService.getAllBookings({ guestId: userId });
  },

  // Get room bookings
  getRoomBookings: async (roomId: string): Promise<Booking[]> => {
    return bookingService.getAllBookings({ roomId });
  }
};

export default bookingService; 