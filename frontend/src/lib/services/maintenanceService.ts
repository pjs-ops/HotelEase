import api from '../api';
import { User } from '../../App';

export interface MaintenanceTask {
  id: string;
  _id?: string; // MongoDB ID property
  roomId: string;
  room?: {
    id?: string;
    _id?: string;
    roomNumber: string;
    type: string;
  };
  issue: string;
  status?: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  reportedBy: string;
  reportedByUser?: User;
  assignedTo?: string;
  assignedToUser?: User;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateMaintenanceTaskData {
  roomId: string;
  issue: string;
  priority: string;
  reportedBy: string;
  assignedTo?: string;
}

interface UpdateMaintenanceTaskData {
  status?: string;
  priority?: string;
  assignedTo?: string;
  notes?: string;
}

// Helper to normalize MongoDB response data (handle _id vs id issue)
const normalizeTask = (task: any): MaintenanceTask => {
  // If it's an array of tasks, map each one
  if (Array.isArray(task)) {
    return task.map(normalizeTask) as any;
  }

  if (!task) return task;

  const result = { ...task };
  
  // Make sure id property is available even if only _id is in the response
  if (task._id && !task.id) {
    result.id = task._id.toString();
  }
  
  // Ensure roomId is a string, not an object
  if (typeof task.roomId === 'object' && task.roomId !== null) {
    if (task.roomId._id) {
      result.roomId = task.roomId._id.toString();
    } else if (task.roomId.id) {
      result.roomId = task.roomId.id.toString();
    }
  }
  
  // Also normalize nested room object if it exists
  if (task.room) {
    result.room = { ...task.room };
    if (task.room._id && !task.room.id) {
      result.room.id = task.room._id.toString();
    }
  }
  
  // Normalize user references
  if (task.reportedByUser) {
    result.reportedByUser = { ...task.reportedByUser };
    if (task.reportedByUser._id && !task.reportedByUser.id) {
      result.reportedByUser.id = task.reportedByUser._id.toString();
    }
  }
  
  if (task.assignedToUser) {
    result.assignedToUser = { ...task.assignedToUser };
    if (task.assignedToUser._id && !task.assignedToUser.id) {
      result.assignedToUser.id = task.assignedToUser._id.toString();
    }
  }
  
  return result;
};

// Maintenance service
const maintenanceService = {
  // Get all maintenance tasks
  getAllTasks: async (): Promise<MaintenanceTask[]> => {
    try {
      console.log('Fetching all maintenance tasks');
      const response = await api.get('/maintenance');
      const normalizedTasks = normalizeTask(response.data);
      console.log(`Fetched ${normalizedTasks.length} maintenance tasks`);
      return normalizedTasks;
    } catch (error) {
      console.error('Error fetching maintenance tasks:', error);
      throw error;
    }
  },

  // Get maintenance tasks by room
  getTasksByRoom: async (roomId: string): Promise<MaintenanceTask[]> => {
    try {
      console.log(`Fetching maintenance tasks for room ID: ${roomId}`);
      const response = await api.get(`/maintenance/room/${roomId}`);
      const normalizedTasks = normalizeTask(response.data);
      return normalizedTasks;
    } catch (error) {
      console.error(`Error fetching maintenance tasks for room ${roomId}:`, error);
      throw error;
    }
  },

  // Get maintenance tasks for a guest
  getTasksForGuest: async (guestId: string): Promise<MaintenanceTask[]> => {
    try {
      console.log(`Fetching maintenance tasks for guest ID: ${guestId}`);
      // We'll query by reportedBy field which should contain the guest's ID
      const response = await api.get(`/maintenance/guest/${guestId}`);
      const normalizedTasks = normalizeTask(response.data);
      console.log(`Fetched ${normalizedTasks.length} maintenance tasks for guest`);
      return normalizedTasks;
    } catch (error) {
      console.error(`Error fetching maintenance tasks for guest ${guestId}:`, error);
      // If the specific endpoint isn't available, we'll fall back to filtering all tasks
      try {
        const response = await api.get('/maintenance');
        const tasks = normalizeTask(response.data);
        const guestTasks = tasks.filter(task => task.reportedBy === guestId);
        console.log(`Filtered ${guestTasks.length} maintenance tasks for guest`);
        return guestTasks;
      } catch (fallbackError) {
        console.error('Error in fallback guest task fetch:', fallbackError);
        throw fallbackError;
      }
    }
  },

  // Get maintenance task by ID
  getTaskById: async (taskId: string): Promise<MaintenanceTask> => {
    try {
      console.log(`Fetching maintenance task with ID: ${taskId}`);
      const response = await api.get(`/maintenance/${taskId}`);
      const normalizedTask = normalizeTask(response.data);
      return normalizedTask;
    } catch (error) {
      console.error(`Error fetching maintenance task ${taskId}:`, error);
      throw error;
    }
  },

  // Create a new maintenance task
  createTask: async (taskData: CreateMaintenanceTaskData): Promise<MaintenanceTask> => {
    try {
      console.log('Creating maintenance task with data:', {
        ...taskData,
        roomId: taskData.roomId ? taskData.roomId : 'MISSING_ROOM_ID',
      });
      
      if (!taskData.roomId) {
        throw new Error('Missing required field: roomId');
      }
      
      const response = await api.post('/maintenance', taskData);
      console.log('Maintenance task created successfully:', response.data);
      return normalizeTask(response.data);
    } catch (error: any) {
      console.error('Error creating maintenance task:', error);
      
      if (error.response && error.response.data && error.response.data.msg) {
        throw new Error(error.response.data.msg);
      } else if (error.message && error.message.includes('ObjectId')) {
        throw new Error(`Invalid room ID format. Please select a valid room from the dropdown.`);
      }
      
      throw error;
    }
  },

  // Update a maintenance task
  updateTask: async (taskId: string, taskData: UpdateMaintenanceTaskData): Promise<MaintenanceTask> => {
    try {
      console.log(`Updating maintenance task ${taskId} with data:`, taskData);
      const response = await api.put(`/maintenance/${taskId}`, taskData);
      return normalizeTask(response.data);
    } catch (error) {
      console.error(`Error updating maintenance task ${taskId}:`, error);
      throw error;
    }
  },

  // Delete a maintenance task
  deleteTask: async (taskId: string): Promise<{ msg: string }> => {
    try {
      console.log(`Deleting maintenance task ${taskId}`);
      const response = await api.delete(`/maintenance/${taskId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting maintenance task ${taskId}:`, error);
      throw error;
    }
  }
};

export default maintenanceService; 