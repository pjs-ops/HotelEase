import api from '../api';
import { UserRole } from '../../App';

interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  fullName?: string;
  phone?: string;
  employeeId?: string;
  joiningDate?: string;
  isActive?: boolean;
  [key: string]: any;
}

interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  fullName?: string;
  phone?: string;
  employeeId?: string;
  joiningDate?: string;
}

interface UpdateUserData {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  role?: UserRole;
  isActive?: boolean;
  idProofType?: string;
  idProofNumber?: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

// Helper to normalize MongoDB response data (handle _id vs id issue)
const normalizeUser = (user: any): User => {
  // If it's an array of users, map each one
  if (Array.isArray(user)) {
    return user.map(normalizeUser) as any;
  }

  if (!user) return user;

  const result = { ...user };
  
  // Make sure id property is available even if only _id is in the response
  if (user._id && !user.id) {
    result.id = user._id.toString();
  }
  
  return result;
};

// User management service
const userService = {
  // Get all users with optional role filter
  getAllUsers: async (role?: UserRole): Promise<User[]> => {
    const params = role ? { role } : {};
    const response = await api.get('/users', { params });
    return normalizeUser(response.data);
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<User> => {
    const response = await api.get(`/users/${userId}`);
    return normalizeUser(response.data);
  },

  // Create a new user (admin only)
  createUser: async (userData: CreateUserData): Promise<User> => {
    try {
      console.log('Creating user with data:', {
        ...userData,
        password: userData.password ? '******' : undefined
      });
      
      const response = await api.post('/users', userData);
      console.log('User creation response:', response.data);
      
      // Normalize the user data to ensure id is present
      const normalizedUser = normalizeUser(response.data);
      
      // Validate the required id
      if (!normalizedUser.id) {
        console.error('User created but no ID was returned:', normalizedUser);
        throw new Error('User created but no ID was returned');
      }
      
      return normalizedUser;
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Provide more helpful error messages
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        const errorMessage = errorData.msg || 'User creation failed';
        const errorDetails = errorData.details 
          ? JSON.stringify(errorData.details) 
          : '';
        
        throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
      }
      
      throw error;
    }
  },

  // Update user details
  updateUser: async (userId: string, userData: UpdateUserData): Promise<User> => {
    const response = await api.put(`/users/${userId}`, userData);
    return normalizeUser(response.data);
  },

  // Change user password
  changePassword: async (userId: string, passwordData: PasswordChangeData): Promise<{ msg: string }> => {
    const response = await api.put(`/users/password/${userId}`, passwordData);
    return response.data;
  },

  // Delete user (admin only)
  deleteUser: async (userId: string): Promise<{ msg: string }> => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  }
};

export default userService; 