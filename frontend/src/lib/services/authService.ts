import api from '../api';
import { UserRole } from '../../App';

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
  fullName?: string;
  phone?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  fullName?: string;
  [key: string]: any;
}

interface AuthResponse {
  token: string;
  user: User;
}

// Authentication service
const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Register new user
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Get current user data
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === "undefined") {
      return null;
    }
    return JSON.parse(userStr);
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<User> => {
    const response = await api.get(`/auth/user?userId=${userId}`);
    return response.data;
  },

  // Logout user
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return localStorage.getItem('token') !== null;
  }
};

export default authService; 