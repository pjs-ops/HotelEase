import api from '../api';

export type ServiceType = 'Food & Beverage' | 'Housekeeping' | 'Maintenance' | 'Wake-up Call';
export type ServiceStatus = 'pending' | 'processing' | 'delivered' | 'completed' | 'cancelled';

export interface Service {
  id: string;
  type: ServiceType;
  guestId: string;
  roomId: string;
  bookingId?: string;
  item: string;
  quantity: number;
  price: number;
  status: ServiceStatus;
  notes?: string;
  assignedTo?: string;
  createdAt?: string;
  updatedAt?: string;
  // Populated fields
  guest?: {
    username: string;
    fullName?: string;
    [key: string]: any;
  };
  room?: {
    roomNumber: string;
    [key: string]: any;
  };
  staff?: {
    username: string;
    fullName?: string;
    [key: string]: any;
  };
}

interface ServiceFilter {
  type?: ServiceType;
  status?: ServiceStatus;
  guestId?: string;
  roomId?: string;
  bookingId?: string;
}

interface CreateServiceData {
  type: ServiceType;
  guestId: string;
  roomId: string;
  bookingId?: string;
  item: string;
  quantity?: number;
  price?: number;
  notes?: string;
}

interface UpdateServiceData {
  status?: ServiceStatus;
  assignedTo?: string;
  notes?: string;
  price?: number;
}

// Service management service
const serviceService = {
  // Get all services with optional filters
  getAllServices: async (filters?: ServiceFilter): Promise<Service[]> => {
    const response = await api.get('/services', { params: filters });
    return response.data;
  },

  // Get service by ID
  getServiceById: async (serviceId: string): Promise<Service> => {
    const response = await api.get(`/services/${serviceId}`);
    return response.data;
  },

  // Create a new service request
  createService: async (serviceData: CreateServiceData): Promise<Service> => {
    const response = await api.post('/services', serviceData);
    return response.data;
  },

  // Update service request
  updateService: async (serviceId: string, serviceData: UpdateServiceData): Promise<Service> => {
    const response = await api.put(`/services/${serviceId}`, serviceData);
    return response.data;
  },

  // Delete service request
  deleteService: async (serviceId: string): Promise<{ msg: string }> => {
    const response = await api.delete(`/services/${serviceId}`);
    return response.data;
  },

  // Get user's service requests
  getUserServices: async (userId: string): Promise<Service[]> => {
    return serviceService.getAllServices({ guestId: userId });
  },

  // Get room service requests
  getRoomServices: async (roomId: string): Promise<Service[]> => {
    return serviceService.getAllServices({ roomId });
  },

  // Get assigned service requests
  getAssignedServices: async (staffId: string): Promise<Service[]> => {
    const response = await api.get('/services', { params: { assignedTo: staffId } });
    return response.data;
  }
};

export default serviceService; 