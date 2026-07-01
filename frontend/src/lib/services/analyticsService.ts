import api from '../api';

export interface OverviewData {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  maintenanceRooms: number;
  cleaningRooms: number;
  totalGuests: number;
  totalStaff: number;
  activeBookings: number;
  pendingServices: number;
  occupancyRate: string;
}

export interface RevenueData {
  date: string;
  month: string;
  day: number;
  year: number;
  revenue: number;
  bookings: number;
  avgStayLength: number;
}

export interface BookingSourceData {
  channel: string;
  bookings: number;
  revenue: number;
  percentage?: number;
}

export interface RoomTypeDistributionData {
  type: string;
  bookings: number;
  revenue: number;
  percentage?: number;
}

export interface BookingAnalyticsData {
  bookingSources: BookingSourceData[];
  roomTypeDistribution: RoomTypeDistributionData[];
}

// Analytics service
const analyticsService = {
  // Get hotel overview analytics
  getOverviewData: async (): Promise<OverviewData> => {
    const response = await api.get('/analytics/overview');
    return response.data;
  },

  // Get revenue analytics with optional period filter
  getRevenueData: async (period?: 'yearly' | 'monthly' | 'weekly'): Promise<RevenueData[]> => {
    const params = period ? { period } : {};
    const response = await api.get('/analytics/revenue', { params });
    return response.data;
  },

  // Get booking analytics
  getBookingAnalytics: async (): Promise<BookingAnalyticsData> => {
    const response = await api.get('/analytics/bookings');
    return response.data;
  }
};

export default analyticsService; 