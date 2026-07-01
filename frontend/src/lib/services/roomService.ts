import api from '../api';

export type RoomType = 'Standard' | 'Deluxe' | 'Suite' | 'Presidential';
export type RoomStatus = 'Available' | 'Occupied' | 'Maintenance' | 'Cleaning';
export type CleaningStatus = 'clean' | 'dirty' | 'pending';
export type Priority = 'low' | 'medium' | 'high';

export interface Room {
  id: string;
  _id?: string; // MongoDB ID property
  roomNumber: string;
  type: RoomType;
  basePrice: number;
  weekendPrice: number;
  holidayPrice: number;
  status: RoomStatus;
  cleaningStatus?: CleaningStatus;
  priority?: Priority;
  amenities?: string[];
  capacity?: number;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface RoomFilter {
  type?: RoomType;
  status?: RoomStatus;
  minPrice?: number;
  maxPrice?: number;
}

interface CreateRoomData {
  roomNumber: string;
  type: RoomType;
  basePrice: number;
  weekendPrice: number;
  holidayPrice: number;
  amenities?: string[];
  capacity?: number;
}

interface UpdateRoomData {
  roomNumber?: string;
  type?: RoomType;
  basePrice?: number;
  weekendPrice?: number;
  holidayPrice?: number;
  status?: RoomStatus;
  cleaningStatus?: CleaningStatus;
  priority?: Priority;
  amenities?: string[];
  capacity?: number;
}

// Helper to normalize MongoDB response data (handle _id vs id issue)
const normalizeRoom = (room: any): Room => {
  // If it's an array of rooms, map each one
  if (Array.isArray(room)) {
    return room.map(normalizeRoom) as any;
  }

  if (!room) return room;

  const result = { ...room };
  
  // Make sure id property is available even if only _id is in the response
  if (room._id && !room.id) {
    result.id = room._id.toString();
  }
  
  return result;
};

// Room management service
const roomService = {
  // Get all rooms with optional filters
  getAllRooms: async (filters?: RoomFilter): Promise<Room[]> => {
    try {
      console.log('Fetching rooms with filters:', filters);
      const response = await api.get('/rooms', { params: filters });
      const normalizedRooms = normalizeRoom(response.data);
      console.log(`Fetched ${normalizedRooms.length} rooms`);
      return normalizedRooms;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }
  },

  // Get rooms for a specific guest based on bookings
  getRoomsForGuest: async (guestId: string): Promise<Room[]> => {
    try {
      console.log(`Fetching rooms for guest ID: ${guestId}`);
      // This would typically query guest's active bookings to get their room
      const response = await api.get(`/rooms/guest/${guestId}`);
      const normalizedRooms = normalizeRoom(response.data);
      console.log(`Fetched ${normalizedRooms.length} rooms for guest`);
      return normalizedRooms;
    } catch (error) {
      console.error(`Error fetching rooms for guest ${guestId}:`, error);
      // Fall back to a safer method if the endpoint isn't available
      // For testing/demo purposes, return all available rooms if the endpoint isn't ready
      try {
        console.log('Falling back to default room fetch for guest');
        const response = await api.get('/rooms');
        const rooms = normalizeRoom(response.data);
        // In a real implementation, we'd filter to only show the guest's assigned room(s)
        console.log(`Fallback fetched ${rooms.length} rooms for guest`);
        return rooms;
      } catch (fallbackError) {
        console.error('Error in fallback room fetch:', fallbackError);
        throw fallbackError;
      }
    }
  },

  // Get room by ID
  getRoomById: async (roomId: string): Promise<Room> => {
    try {
      console.log(`Fetching room with ID: ${roomId}`);
      const response = await api.get(`/rooms/${roomId}`);
      const normalizedRoom = normalizeRoom(response.data);
      console.log('Fetched room:', normalizedRoom);
      return normalizedRoom;
    } catch (error) {
      console.error(`Error fetching room with ID ${roomId}:`, error);
      throw error;
    }
  },

  // Create a new room (admin only)
  createRoom: async (roomData: CreateRoomData): Promise<Room> => {
    try {
      const response = await api.post('/rooms', roomData);
      return normalizeRoom(response.data);
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  },

  // Update room (admin only)
  updateRoom: async (roomId: string, roomData: UpdateRoomData): Promise<Room> => {
    try {
      const response = await api.put(`/rooms/${roomId}`, roomData);
      return normalizeRoom(response.data);
    } catch (error) {
      console.error(`Error updating room with ID ${roomId}:`, error);
      throw error;
    }
  },

  // Delete room (admin only)
  deleteRoom: async (roomId: string): Promise<{ msg: string }> => {
    try {
      const response = await api.delete(`/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting room with ID ${roomId}:`, error);
      throw error;
    }
  }
};

export default roomService; 