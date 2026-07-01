import React, { useState, useEffect } from 'react';
import { ClipboardCheck, CheckCircle, Clock, AlertTriangle, Search, Filter, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import NavigationBar from '../components/NavigationBar';
import { User, UserRole } from '../App';
import { roomService, maintenanceService } from '../lib/services';
import { Room } from '../lib/services/roomService';
import { MaintenanceTask } from '../lib/services/maintenanceService';
import inventoryService, { InventoryItem } from '../lib/services/inventoryService';

interface HousekeepingPanelProps {
  user: User | null;
  onLogout: () => void;
}

const HousekeepingPanel: React.FC<HousekeepingPanelProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('rooms');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for rooms
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(false);
  
  // State for maintenance tasks
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);
  
  // New maintenance task dialog state
  const [showReportIssueDialog, setShowReportIssueDialog] = useState(false);
  const [newIssue, setNewIssue] = useState({
    room: '',
    issue: '',
    priority: 'medium'
  });
  
  // Inventory state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  
  // Add inventory item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemStock, setNewItemStock] = useState(0);
  const [addingItem, setAddingItem] = useState(false);
  
  // Fetch inventory from backend
  useEffect(() => {
    if (activeTab === 'inventory') {
      setLoadingInventory(true);
      inventoryService.getAll()
        .then(setInventory)
        .catch(() => setError('Failed to load inventory.'))
        .finally(() => setLoadingInventory(false));
    }
  }, [activeTab]);
  
  // Inventory stock update handlers
  const incrementStock = async (index: number) => {
    const item = inventory[index];
    try {
      const updated = await inventoryService.update(item._id, { stock: item.stock + 1 });
      setInventory(inv => inv.map((it, i) => i === index ? updated : it));
    } catch {
      setError('Failed to update inventory.');
    }
  };
  const decrementStock = async (index: number) => {
    const item = inventory[index];
    if (item.stock === 0) return;
    try {
      const updated = await inventoryService.update(item._id, { stock: item.stock - 1 });
      setInventory(inv => inv.map((it, i) => i === index ? updated : it));
    } catch {
      setError('Failed to update inventory.');
    }
  };
  
  // Determine if user has staff permissions
  const isStaff = user?.role === 'admin' || user?.role === 'housekeeping' || user?.role === 'receptionist';
  // For guests, they can only see their assigned room(s)
  const isGuest = user?.role === 'guest';
  
  // Load rooms data from API
  useEffect(() => {
    const fetchRooms = async () => {
      if (activeTab === 'rooms') {
        setLoadingRooms(true);
        setError(null);
        try {
          // For guests, only fetch their assigned room(s)
          const fetchedRooms = isGuest 
            ? await roomService.getRoomsForGuest(user?.id || '')
            : await roomService.getAllRooms();
          setRooms(fetchedRooms);
        } catch (err) {
          console.error('Error fetching rooms:', err);
          setError('Failed to load rooms data. Please try again.');
        } finally {
          setLoadingRooms(false);
        }
      }
    };

    fetchRooms();
  }, [activeTab, user, isGuest]);
  
  // Load maintenance tasks from API
  useEffect(() => {
    const fetchMaintenanceTasks = async () => {
      if (activeTab === 'maintenance') {
        setLoadingTasks(true);
        setError(null);
        try {
          // For guests, only show maintenance tasks for their room(s)
          const fetchedTasks = isGuest
            ? await maintenanceService.getTasksForGuest(user?.id || '')
            : await maintenanceService.getAllTasks();
          setMaintenanceTasks(fetchedTasks);
        } catch (err) {
          console.error('Error fetching maintenance tasks:', err);
          setError('Failed to load maintenance tasks. Please try again.');
        } finally {
          setLoadingTasks(false);
        }
      }
    };

    fetchMaintenanceTasks();
  }, [activeTab, user, isGuest]);

  const filteredRooms = rooms.filter(room => {
    if (filterStatus === 'all') return true;
    return room.cleaningStatus === filterStatus;
  });

  const updateRoomStatus = async (roomId: string, newStatus: string) => {
    // Only staff can update room status
    if (!isStaff) {
      setError('You do not have permission to update room status');
      return;
    }
    
    setLoading(true);
    try {
      // Update room status in the API
      await roomService.updateRoom(roomId, { cleaningStatus: newStatus as 'clean' | 'dirty' | 'pending' });
      
      // Update local state
      setRooms(rooms.map(room => 
        room.id === roomId ? { ...room, cleaningStatus: newStatus as 'clean' | 'dirty' | 'pending' } : room
      ));
    } catch (err) {
      console.error('Error updating room status:', err);
      setError('Failed to update room status. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenReportIssueDialog = () => {
    setShowReportIssueDialog(true);
    const modalForm = document.getElementById('reportIssueModal');
    if (modalForm) {
      (modalForm as HTMLDialogElement).showModal();
    }
  };
  
  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Validate roomId before submission
      if (!newIssue.room) {
        throw new Error('Please select a room');
      }

      // For guests, verify they're reporting for their assigned room
      if (isGuest) {
        // Find if this room belongs to the guest
        const userHasAccess = rooms.some(room => room.id === newIssue.room);
        if (!userHasAccess) {
          throw new Error('You can only report issues for your assigned room');
        }
      }

      // Debug information
      console.log('Creating maintenance task with room ID:', newIssue.room);
      
      // Create new maintenance task via API
      const task = await maintenanceService.createTask({
        roomId: newIssue.room,
        issue: newIssue.issue,
        priority: newIssue.priority as 'low' | 'medium' | 'high',
        reportedBy: user?.id || ''
      });
      
      // Update local state with proper type assertion
      setMaintenanceTasks([...maintenanceTasks, task as MaintenanceTask]);
      
      // Reset form and close dialog
      setNewIssue({
        room: '',
        issue: '',
        priority: 'medium'
      });
      
      const modalForm = document.getElementById('reportIssueModal');
      if (modalForm) {
        (modalForm as HTMLDialogElement).close();
      }
    } catch (err: any) {
      console.error('Error reporting issue:', err);
      setError(err.message || 'Failed to report issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    // Only staff can update task status
    if (!isStaff) {
      setError('You do not have permission to update task status');
      return;
    }
    
    setLoading(true);
    try {
      // Update task status in the API
      await maintenanceService.updateTask(taskId, { status: newStatus });
      
      // Update local state with type assertion to handle TypeScript error
      setMaintenanceTasks(maintenanceTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus as 'pending' | 'in-progress' | 'completed' } : task
      ));
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      setError('Item name is required.');
      return;
    }
    setAddingItem(true);
    setError(null);
    try {
      const added = await inventoryService.add({ name: newItemName.trim(), stock: newItemStock });
      setInventory(inv => [...inv, added]);
      setNewItemName('');
      setNewItemStock(0);
    } catch (err: any) {
      setError(err?.response?.data?.msg || 'Failed to add item.');
    } finally {
      setAddingItem(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'rooms':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">Room Cleaning Status</h2>
              {isStaff && (
                <div className="flex items-center gap-2">
                  <Filter size={18} />
                  <select 
                    className="input-field py-1"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="clean">Clean</option>
                    <option value="dirty">Dirty</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              )}
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {isStaff && (
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by room number..."
                    className="input-field pl-10"
                  />
                </div>
              </div>
            )}
            
            {loadingRooms ? (
              <div className="text-center py-8">
                <Loader2 size={36} className="animate-spin mx-auto mb-4 text-primary" />
                <p className="text-gray-600">Loading rooms...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room) => (
                  <div 
                    key={room.id} 
                    className={`border rounded-lg p-4 ${
                      room.cleaningStatus === 'clean' ? 'border-green-300 bg-green-50' :
                      room.cleaningStatus === 'dirty' ? 'border-red-300 bg-red-50' :
                      'border-yellow-300 bg-yellow-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold">Room {room.roomNumber}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        room.status === 'Occupied' ? 'bg-blue-100 text-blue-800' :
                        room.status === 'Available' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {room.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{room.type} Room</p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm">Cleaning Status:</span>
                      <span className={`text-sm font-medium ${
                        room.cleaningStatus === 'clean' ? 'text-green-600' :
                        room.cleaningStatus === 'dirty' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {room.cleaningStatus?.charAt(0).toUpperCase() + (room.cleaningStatus?.slice(1) || '')}
                      </span>
                    </div>
                    
                    {isStaff && (
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm">Priority:</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          room.priority === 'high' ? 'bg-red-100 text-red-800' :
                          room.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {room.priority}
                        </span>
                      </div>
                    )}
                    
                    {isStaff && (
                      <div className="flex gap-2">
                        {room.cleaningStatus !== 'clean' && (
                          <button 
                            className="flex-1 py-1 px-2 bg-green-600 text-white rounded-md text-sm flex items-center justify-center gap-1 hover:bg-green-700"
                            onClick={() => updateRoomStatus(room.id, 'clean')}
                            disabled={loading}
                          >
                            <CheckCircle size={16} />
                            <span>Mark Clean</span>
                          </button>
                        )}
                        {room.cleaningStatus !== 'dirty' && (
                          <button 
                            className="flex-1 py-1 px-2 bg-red-600 text-white rounded-md text-sm flex items-center justify-center gap-1 hover:bg-red-700"
                            onClick={() => updateRoomStatus(room.id, 'dirty')}
                            disabled={loading}
                          >
                            <AlertTriangle size={16} />
                            <span>Mark Dirty</span>
                          </button>
                        )}
                        {room.cleaningStatus !== 'pending' && (
                          <button 
                            className="flex-1 py-1 px-2 bg-yellow-600 text-white rounded-md text-sm flex items-center justify-center gap-1 hover:bg-yellow-700"
                            onClick={() => updateRoomStatus(room.id, 'pending')}
                            disabled={loading}
                          >
                            <Clock size={16} />
                            <span>Pending</span>
                          </button>
                        )}
                      </div>
                    )}
                    
                    {isGuest && (
                      <div className="mt-4">
                        <button 
                          className="w-full py-2 bg-blue-600 text-white rounded-md text-sm flex items-center justify-center gap-1 hover:bg-blue-700"
                          onClick={handleOpenReportIssueDialog}
                          disabled={loading}
                        >
                          <AlertTriangle size={16} />
                          <span>Report an Issue</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {filteredRooms.length === 0 && (
                  <div className="col-span-3 text-center py-8 text-gray-500">
                    No rooms match the selected filter.
                  </div>
                )}
              </div>
            )}
          </div>
        );
        
      case 'maintenance':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">Maintenance Requests</h2>
              <button 
                className="btn-primary flex items-center gap-1"
                onClick={handleOpenReportIssueDialog}
              >
                <AlertTriangle size={18} />
                <span>Report Issue</span>
              </button>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {isStaff && (
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search maintenance requests..."
                    className="input-field pl-10"
                  />
                </div>
              </div>
            )}
            
            {loadingTasks ? (
              <div className="text-center py-8">
                <Loader2 size={36} className="animate-spin mx-auto mb-4 text-primary" />
                <p className="text-gray-600">Loading maintenance tasks...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left">Room</th>
                      <th className="py-3 px-4 text-left">Issue</th>
                      <th className="py-3 px-4 text-left">Reported By</th>
                      <th className="py-3 px-4 text-left">Reported At</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      {isStaff && <th className="py-3 px-4 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceTasks.map((task) => (
                      <tr key={task.id} className="border-t">
                        <td className="py-3 px-4">{task.room?.roomNumber || (typeof task.roomId === 'object' && task.roomId ? (task.roomId as any).roomNumber : task.roomId)}</td>
                        <td className="py-3 px-4">{task.issue}</td>
                        <td className="py-3 px-4">
                          {task.reportedByUser ? 
                            (typeof task.reportedByUser === 'object' ? task.reportedByUser.fullName || task.reportedByUser.username : task.reportedByUser) 
                            : task.reportedBy}
                        </td>
                        <td className="py-3 px-4">{task.createdAt ? new Date(task.createdAt).toLocaleString() : 'N/A'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {typeof task.status === 'string' ? task.status.replace('-', ' ') : 'pending'}
                          </span>
                        </td>
                        {isStaff && (
                          <td className="py-3 px-4 text-center">
                            {task.status !== 'completed' && (
                              <select
                                className="input-field py-1 text-xs"
                                value={task.status || 'pending'}
                                onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                disabled={loading}
                              >
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    {maintenanceTasks.length === 0 && (
                      <tr>
                        <td colSpan={isStaff ? 6 : 5} className="py-8 text-center text-gray-500">
                          No maintenance tasks found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
        
      case 'inventory':
        return isStaff ? (
          <div>
            <h2 className="text-xl font-bold text-primary mb-4">Inventory Management</h2>
            {/* Add Item Form */}
            <form onSubmit={handleAddItem} className="flex flex-wrap items-end gap-4 mb-6">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Item Name</label>
                <input type="text" className="input-field" value={newItemName} onChange={e => setNewItemName(e.target.value)} disabled={addingItem} required />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Initial Stock</label>
                <input type="number" className="input-field" value={newItemStock} min={0} onChange={e => setNewItemStock(Number(e.target.value))} disabled={addingItem} required />
              </div>
              <button type="submit" className="btn-primary px-6" disabled={addingItem}>{addingItem ? 'Adding...' : 'Add Item'}</button>
            </form>
            {loadingInventory ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin mr-2" /> Loading inventory...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg shadow-md">
                  <thead className="bg-primary text-white">
                    <tr>
                      <th className="py-3 px-4 text-left">Item</th>
                      <th className="py-3 px-4 text-right">Stock</th>
                      <th className="py-3 px-4 text-right">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item, idx) => (
                      <tr className="border-t" key={item._id}>
                        <td className="py-3 px-4">{item.name}</td>
                        <td className="py-3 px-4 text-right">{item.stock}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.status === 'Sufficient' ? 'bg-green-100 text-green-800' :
                            item.status === 'Low' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button className="px-2 py-1 bg-gray-200 rounded-l hover:bg-gray-300" onClick={() => decrementStock(idx)}>-</button>
                          <button className="px-2 py-1 bg-gray-200 rounded-r hover:bg-gray-300 ml-1" onClick={() => incrementStock(idx)}>+</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-gray-500 text-sm mt-4">Monitor inventory levels to ensure all rooms are well-stocked. Restock items marked as 'Low' or 'Critical' promptly.</p>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-primary mb-4">Inventory Management</h2>
            <p className="text-gray-600">You don't have permission to view this section.</p>
          </div>
        );
        
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header user={user} onLogout={onLogout} />
      <NavigationBar title="Housekeeping Panel" />
      
      <main className="flex-grow bg-gray-100 p-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-white rounded-lg shadow-md p-4">
              <nav>
                <ul className="space-y-1">
                  <li>
                    <button
                      className={`w-full flex items-center gap-2 p-3 rounded-md transition-colors ${
                        activeTab === 'rooms' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setActiveTab('rooms')}
                    >
                      <ClipboardCheck size={20} />
                      <span>Room Status</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`w-full flex items-center gap-2 p-3 rounded-md transition-colors ${
                        activeTab === 'maintenance' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setActiveTab('maintenance')}
                    >
                      <AlertTriangle size={20} />
                      <span>Maintenance</span>
                    </button>
                  </li>
                  {isStaff && (
                    <li>
                      <button
                        className={`w-full flex items-center gap-2 p-3 rounded-md transition-colors ${
                          activeTab === 'inventory' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => setActiveTab('inventory')}
                      >
                        <ClipboardCheck size={20} />
                        <span>Inventory</span>
                      </button>
                    </li>
                  )}
                </ul>
              </nav>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 bg-white rounded-lg shadow-md p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </main>
      
      {/* Report Issue Modal */}
      <dialog id="reportIssueModal" className="modal bg-white rounded-lg p-6 shadow-xl max-w-md">
        <div className="modal-content">
          <h3 className="text-lg font-bold mb-4">Report Maintenance Issue</h3>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleReportIssue}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Room Number</label>
              <select
                className="input-field"
                value={newIssue.room}
                onChange={(e) => setNewIssue({ ...newIssue, room: e.target.value })}
                required
              >
                <option value="">Select a room</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>
                    Room {room.roomNumber} ({room.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Issue Description</label>
              <textarea
                className="input-field min-h-[100px]"
                value={newIssue.issue}
                onChange={(e) => setNewIssue({ ...newIssue, issue: e.target.value })}
                required
              ></textarea>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Priority</label>
              <select
                className="input-field"
                value={newIssue.priority}
                onChange={(e) => setNewIssue({ ...newIssue, priority: e.target.value })}
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  const modalForm = document.getElementById('reportIssueModal');
                  if (modalForm) {
                    (modalForm as HTMLDialogElement).close();
                  }
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Report Issue'}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
};

export default HousekeepingPanel;