import React, { useState, useEffect } from 'react';
import { Users, Settings, BarChart as BarChartIcon, CreditCard, UserPlus, Trash2, Edit, TrendingUp, Users as UsersIcon, Calendar, DollarSign, Loader2, Plus } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import Header from '../components/Header';
import NavigationBar from '../components/NavigationBar';
import { User, UserRole } from '../App';
import { userService, roomService, analyticsService } from '../lib/services';
import { Room } from '../lib/services/roomService';
import { RevenueData as AnalyticsRevenueData, BookingSourceData, RoomTypeDistributionData } from '../lib/services/analyticsService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AdminPanelProps {
  user: User | null;
  onLogout: () => void;
}

interface RevenueData {
  month: string;
  bookings: number;
  occupancy: number;
  revenue: number;
  avgStayLength: number;
  avgSpending: number;
}

interface CustomerDemographic {
  ageGroup: string;
  percentage: number;
  bookings: number;
  revenue: number;
}

interface StaffMember {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  fullName?: string;
  phone?: string;
  isActive?: boolean;
}

interface RoomType {
  id: string;
  type: string;
  basePrice: number;
  weekend: number;
  holiday: number;
  roomNumber?: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('staff');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Staff state
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState<boolean>(false);

  // Room pricing state
  const [roomPricing, setRoomPricing] = useState<RoomType[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(false);

  // Analytics state
  const [overview, setOverview] = useState<{
    totalRooms: number;
    occupiedRooms: number;
    occupancyRate: number;
  }>({
    totalRooms: 0,
    occupiedRooms: 0,
    occupancyRate: 0
  });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [customerDemographics, setCustomerDemographics] = useState<CustomerDemographic[]>([]);
  const [popularRoomTypes, setPopularRoomTypes] = useState<RoomTypeDistributionData[]>([]);
  const [bookingTrends, setBookingTrends] = useState<BookingSourceData[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);

  // Edit staff state
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Add state for room management
  const [newRoom, setNewRoom] = useState<{
    roomNumber: string;
    type: 'Standard' | 'Deluxe' | 'Suite' | 'Presidential';
    basePrice: number;
    weekendPrice: number;
    holidayPrice: number;
    capacity: number;
    amenities: string;
  }>({
    roomNumber: '',
    type: 'Standard',
    basePrice: 2000,
    weekendPrice: 2500,
    holidayPrice: 3000,
    capacity: 2,
    amenities: ''
  });

  // Load staff data from API
  useEffect(() => {
    const fetchStaff = async () => {
      if (activeTab === 'staff') {
        setLoadingStaff(true);
        setError(null);
        try {
          // Load staff members (excluding guests)
          const staff = await userService.getAllUsers();
          // Filter out any users with role 'guest'
          const staffOnly = staff.filter(member => member.role !== 'guest') as StaffMember[];
          setStaffMembers(staffOnly);
        } catch (err) {
          console.error('Error fetching staff:', err);
          setError('Failed to load staff data. Please try again.');
        } finally {
          setLoadingStaff(false);
        }
      }
    };

    fetchStaff();
  }, [activeTab]);

  // Load room pricing data from API
  useEffect(() => {
    const fetchRoomPricing = async () => {
      if (activeTab === 'pricing' || activeTab === 'rooms') {
        setLoadingRooms(true);
        setError(null);
        try {
          const rooms = await roomService.getAllRooms();
          // Transform room data to pricing format
          const pricing = rooms.map(room => ({
            id: room.id,
            type: room.type,
            basePrice: room.basePrice,
            weekend: room.weekendPrice,
            holiday: room.holidayPrice,
            roomNumber: room.roomNumber
          }));
          setRoomPricing(pricing);
        } catch (err) {
          console.error('Error fetching room pricing:', err);
          setError('Failed to load room pricing data. Please try again.');
        } finally {
          setLoadingRooms(false);
        }
      }
    };

    fetchRoomPricing();
  }, [activeTab]);

  // Load analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (activeTab === 'reports') {
        setLoadingAnalytics(true);
        setError(null);
        try {
          // Fetch overview data
          const overviewData = await analyticsService.getOverviewData();
          setOverview({
            totalRooms: overviewData.totalRooms,
            occupiedRooms: overviewData.occupiedRooms,
            occupancyRate: parseFloat(overviewData.occupancyRate)
          });

          // Fetch revenue data
          const revenueResponse = await analyticsService.getRevenueData('monthly');
          // Transform to expected format
          const transformedRevenue = revenueResponse.map(item => ({
            month: item.month,
            bookings: item.bookings,
            revenue: item.revenue,
            occupancy: 0, // Not provided by API, would need calculation
            avgStayLength: item.avgStayLength,
            avgSpending: Math.round(item.revenue / item.bookings) // Calculate average spending
          }));
          setRevenueData(transformedRevenue);

          // Fetch booking analytics
          const bookingAnalytics = await analyticsService.getBookingAnalytics();
          
          // Add percentage values if they don't exist
          const roomTypeDistribution = bookingAnalytics.roomTypeDistribution.map(room => {
            // Calculate percentage if not provided by API
            if (!('percentage' in room)) {
              const totalBookings = bookingAnalytics.roomTypeDistribution.reduce(
                (sum, item) => sum + item.bookings, 0
              );
              return {
                ...room,
                percentage: totalBookings > 0 ? Math.round((room.bookings / totalBookings) * 100) : 0
              };
            }
            return room;
          });
          
          const bookingSources = bookingAnalytics.bookingSources.map(source => {
            // Calculate percentage if not provided by API
            if (!('percentage' in source)) {
              const totalBookings = bookingAnalytics.bookingSources.reduce(
                (sum, item) => sum + item.bookings, 0
              );
              return {
                ...source,
                percentage: totalBookings > 0 ? Math.round((source.bookings / totalBookings) * 100) : 0
              };
            }
            return source;
          });
          
          setBookingTrends(bookingSources);
          setPopularRoomTypes(roomTypeDistribution);

          // Customer demographics would need to be fetched from a separate endpoint
          // For now we'll use placeholder data until the API is available
          setCustomerDemographics([
            { ageGroup: '18-25', percentage: 15, bookings: 42, revenue: 252000 },
            { ageGroup: '26-35', percentage: 35, bookings: 98, revenue: 686000 },
            { ageGroup: '36-45', percentage: 25, bookings: 70, revenue: 490000 },
            { ageGroup: '46-55', percentage: 15, bookings: 42, revenue: 294000 },
            { ageGroup: '56+', percentage: 10, bookings: 28, revenue: 196000 }
          ]);
        } catch (err) {
          console.error('Error fetching analytics:', err);
          setError('Failed to load analytics data. Please try again.');
        } finally {
          setLoadingAnalytics(false);
        }
      }
    };

    fetchAnalytics();
  }, [activeTab]);

  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [tempPricing, setTempPricing] = useState({
    basePrice: 0,
    weekend: 0,
    holiday: 0
  });

  // General utility functions
  const calculateOccupancyRate = () => {
    return overview.occupancyRate;
  };

  const calculateRevenueGrowth = () => {
    if (revenueData.length < 2) return '0.0';
    const currentMonth = revenueData[revenueData.length - 1];
    const previousMonth = revenueData[revenueData.length - 2];
    const growth = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100;
    return growth.toFixed(1);
  };

  const calculateAverageStayLength = () => {
    if (revenueData.length === 0) return '0.0';
    return (revenueData.reduce((acc, curr) => acc + curr.avgStayLength, 0) / revenueData.length).toFixed(1);
  };

  const calculateTotalRevenue = () => {
    return revenueData.reduce((acc, curr) => acc + curr.revenue, 0);
  };

  const formatIndianCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Room pricing handlers
  const handleEditPrice = (room: RoomType) => {
    setEditingPrice(room.id);
    setTempPricing({
      basePrice: room.basePrice,
      weekend: room.weekend,
      holiday: room.holiday
    });
  };

  const handleSavePrice = async (id: string) => {
    setLoading(true);
    try {
      // Find the room to update
      const roomToUpdate = roomPricing.find(room => room.id === id);
      if (roomToUpdate) {
        // Update the room in the database
        await roomService.updateRoom(id, {
          basePrice: tempPricing.basePrice,
          weekendPrice: tempPricing.weekend,
          holidayPrice: tempPricing.holiday
        });
        
        // Update local state
        setRoomPricing(roomPricing.map(room => 
          room.id === id ? { ...room, ...tempPricing } : room
        ));
      }
    } catch (err) {
      console.error('Error updating room pricing:', err);
      setError('Failed to update room pricing. Please try again.');
    } finally {
      setLoading(false);
      setEditingPrice(null);
    }
  };

  // Staff management handlers
  const [newStaff, setNewStaff] = useState({
    username: '',
    password: '',
    email: '',
    role: 'receptionist' as 'admin' | 'receptionist' | 'housekeeping' | 'guest',
    fullName: '',
    phone: ''
  });

  const handleAddStaff = async () => {
    if (newStaff.username && newStaff.password && newStaff.email && newStaff.role) {
      setLoading(true);
      setError(null);
      try {
        // Create new staff user via API
        const createdUser = await userService.createUser(newStaff);
        // Cast the created user to StaffMember to ensure type safety
        setStaffMembers([...staffMembers, createdUser as StaffMember]);
        setNewStaff({
          username: '',
          password: '',
          email: '',
          role: 'receptionist',
          fullName: '',
          phone: ''
        });
        
        // Show success message
        alert('Staff member added successfully!');
      } catch (err) {
        console.error('Error adding staff:', err);
        setError('Failed to add staff member. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      setError('Please fill all required fields.');
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      setLoading(true);
      setError(null);
      try {
        // Delete staff via API
        await userService.deleteUser(id);
        setStaffMembers(staffMembers.filter(staff => staff.id !== id));
      } catch (err) {
        console.error('Error deleting staff:', err);
        setError('Failed to delete staff member. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const [settings, setSettings] = useState({
    hotelName: 'HotelEase',
    email: 'info@hotelease.com',
    phone: '011-4567-8900',
    checkIn: '14:00',
    checkOut: '11:00'
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Settings saved successfully!');
  };

  // Staff edit dialog handler
  const handleEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    const modalForm = document.getElementById('editStaffModal');
    if (modalForm) {
      (modalForm as HTMLDialogElement).showModal();
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    
    setLoading(true);
    try {
      // Update the staff member via API
      const updatedUser = await userService.updateUser(editingStaff.id, {
        fullName: editingStaff.fullName,
        email: editingStaff.email,
        phone: editingStaff.phone,
        role: editingStaff.role,
        isActive: editingStaff.isActive
      });
      
      // Update the staff list
      setStaffMembers(staffMembers.map(staff => 
        staff.id === editingStaff.id ? { ...staff, ...updatedUser } as StaffMember : staff
      ));
      
      // Close the modal
      const modalForm = document.getElementById('editStaffModal');
      if (modalForm) {
        (modalForm as HTMLDialogElement).close();
      }
      
      setEditingStaff(null);
    } catch (err) {
      console.error('Error updating staff:', err);
      setError('Failed to update staff member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add function to handle adding a new room
  const handleAddRoom = async () => {
    if (!newRoom.roomNumber || !newRoom.type) {
      setError('Please fill all required fields.');
      return;
    }

    setLoading(true);
    try {
      // Create new room via API
      const amenitiesArray = newRoom.amenities.split(',').map(item => item.trim()).filter(item => item !== '');
      
      const createdRoom = await roomService.createRoom({
        roomNumber: newRoom.roomNumber,
        type: newRoom.type,
        basePrice: newRoom.basePrice,
        weekendPrice: newRoom.weekendPrice,
        holidayPrice: newRoom.holidayPrice,
        capacity: newRoom.capacity,
        amenities: amenitiesArray
      });
      
      // Update the rooms list
      setRoomPricing([...roomPricing, {
        id: createdRoom.id,
        type: createdRoom.type,
        basePrice: createdRoom.basePrice,
        weekend: createdRoom.weekendPrice,
        holiday: createdRoom.holidayPrice,
        roomNumber: createdRoom.roomNumber
      }]);
      
      // Reset form and close modal
      setNewRoom({
        roomNumber: '',
        type: 'Standard',
        basePrice: 2000,
        weekendPrice: 2500,
        holidayPrice: 3000,
        capacity: 2,
        amenities: ''
      });
      
      const modalForm = document.getElementById('roomModal');
      if (modalForm) {
        (modalForm as HTMLDialogElement).close();
      }
      
      // Show success message
      alert('Room added successfully!');
    } catch (err) {
      console.error('Error adding room:', err);
      setError('Failed to add room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render staff management tab content
  const renderStaffTab = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-primary">Staff Management</h2>
          <button 
            className="btn-primary flex items-center gap-1"
            onClick={() => {
              const modalForm = document.getElementById('staffModal');
              if (modalForm) {
                (modalForm as HTMLDialogElement).showModal();
              }
            }}
            disabled={loading}
          >
            <UserPlus size={18} />
            <span>Add Staff</span>
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loadingStaff ? (
          <div className="text-center py-8">
            <Loader2 size={36} className="animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">Loading staff data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Name</th>
                  <th className="py-3 px-4 text-left">Role</th>
                  <th className="py-3 px-4 text-left">Email</th>
                  <th className="py-3 px-4 text-left">Phone</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.length > 0 ? (
                  staffMembers.map((staff) => (
                    <tr key={staff.id} className="border-t">
                      <td className="py-3 px-4">{staff.fullName || staff.username}</td>
                      <td className="py-3 px-4 capitalize">{staff.role}</td>
                      <td className="py-3 px-4">{staff.email}</td>
                      <td className="py-3 px-4">{staff.phone || 'N/A'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          staff.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {staff.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleEditStaff(staff)}
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDeleteStaff(staff.id)}
                            disabled={loading}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No staff members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Staff Modal Form - Hidden by default */}
        <dialog id="staffModal" className="modal bg-white rounded-lg p-6 shadow-xl max-w-md">
          <div className="modal-content">
            <h3 className="text-lg font-bold mb-4">Add New Staff Member</h3>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); handleAddStaff(); }}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={newStaff.fullName}
                  onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Username</label>
                <input
                  type="text"
                  className="input-field"
                  value={newStaff.username}
                  onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Email</label>
                <input
                  type="email"
                  className="input-field"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Password</label>
                <input
                  type="password"
                  className="input-field"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  className="input-field"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Role</label>
                <select
                  className="input-field"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as 'admin' | 'receptionist' | 'housekeeping' | 'guest' })}
                  required
                >
                  <option value="receptionist">Receptionist</option>
                  <option value="housekeeping">Housekeeping</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    const modalForm = document.getElementById('staffModal');
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
                  {loading ? 'Adding...' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </dialog>

        {/* Edit Staff Modal Form - Hidden by default */}
        <dialog id="editStaffModal" className="modal bg-white rounded-lg p-6 shadow-xl max-w-md">
          <div className="modal-content">
            <h3 className="text-lg font-bold mb-4">Edit Staff Member</h3>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            {editingStaff && (
              <form onSubmit={handleUpdateStaff}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingStaff.fullName || ''}
                    onChange={(e) => setEditingStaff({ 
                      ...editingStaff, 
                      fullName: e.target.value 
                    })}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    value={editingStaff.email}
                    onChange={(e) => setEditingStaff({ 
                      ...editingStaff, 
                      email: e.target.value 
                    })}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    className="input-field"
                    value={editingStaff.phone || ''}
                    onChange={(e) => setEditingStaff({ 
                      ...editingStaff, 
                      phone: e.target.value 
                    })}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Role</label>
                  <select
                    className="input-field"
                    value={editingStaff.role || 'receptionist'}
                    onChange={(e) => setEditingStaff({ 
                      ...editingStaff, 
                      role: e.target.value as 'admin' | 'receptionist' | 'housekeeping' | 'guest'
                    })}
                    required
                  >
                    <option value="receptionist">Receptionist</option>
                    <option value="housekeeping">Housekeeping</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Status</label>
                  <select
                    className="input-field"
                    value={editingStaff.isActive === false ? 'inactive' : 'active'}
                    onChange={(e) => setEditingStaff({ 
                      ...editingStaff, 
                      isActive: e.target.value === 'active' 
                    })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      const modalForm = document.getElementById('editStaffModal');
                      if (modalForm) {
                        (modalForm as HTMLDialogElement).close();
                      }
                      setEditingStaff(null);
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
                    {loading ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </dialog>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'staff':
        return renderStaffTab();
      case 'pricing':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">Room Pricing</h2>
              <button className="btn-primary flex items-center gap-1">
                <CreditCard size={18} />
                <span>Update Pricing</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left">Room Type</th>
                    <th className="py-3 px-4 text-right">Base Price</th>
                    <th className="py-3 px-4 text-right">Weekend Price</th>
                    <th className="py-3 px-4 text-right">Holiday Price</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roomPricing.map((room) => (
                    <tr key={room.id} className="border-t">
                      <td className="py-3 px-4">{room.type}</td>
                      <td className="py-3 px-4 text-right">
                        {editingPrice === room.id ? (
                          <input
                            type="number"
                            className="w-24 px-2 py-1 border rounded"
                            value={tempPricing.basePrice}
                            onChange={(e) => setTempPricing({
                              ...tempPricing,
                              basePrice: parseInt(e.target.value)
                            })}
                          />
                        ) : (
                          formatIndianCurrency(room.basePrice)
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {editingPrice === room.id ? (
                          <input
                            type="number"
                            className="w-24 px-2 py-1 border rounded"
                            value={tempPricing.weekend}
                            onChange={(e) => setTempPricing({
                              ...tempPricing,
                              weekend: parseInt(e.target.value)
                            })}
                          />
                        ) : (
                          formatIndianCurrency(room.weekend)
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {editingPrice === room.id ? (
                          <input
                            type="number"
                            className="w-24 px-2 py-1 border rounded"
                            value={tempPricing.holiday}
                            onChange={(e) => setTempPricing({
                              ...tempPricing,
                              holiday: parseInt(e.target.value)
                            })}
                          />
                        ) : (
                          formatIndianCurrency(room.holiday)
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {editingPrice === room.id ? (
                          <button
                            className="p-1 text-green-600 hover:text-green-800"
                            onClick={() => handleSavePrice(room.id)}
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            className="p-1 text-blue-600 hover:text-blue-800"
                            onClick={() => handleEditPrice(room)}
                          >
                            <Edit size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'reports':
        // Hardcoded hotel room analytics data
        const roomAnalyticsData = [
          { type: 'Standard', occupancy: 80, revenue: 120000 },
          { type: 'Deluxe', occupancy: 65, revenue: 95000 },
          { type: 'Suite', occupancy: 50, revenue: 70000 },
          { type: 'Presidential', occupancy: 30, revenue: 40000 },
        ];
        const COLORS = ['#2563eb', '#22c55e', '#a21caf', '#f59e42'];
        return (
          <div>
            <h2 className="text-xl font-bold text-primary mb-6">Reports & Analytics</h2>

            {/* Room Analytics Bar Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h3 className="font-bold text-lg mb-4">Room Type Analytics</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={roomAnalyticsData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" tick={{ fontWeight: 'bold', fontSize: 14 }} />
                  <YAxis yAxisId="left" orientation="left" tick={{ fontWeight: 'bold' }} label={{ value: 'Occupancy (%)', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={formatIndianCurrency} label={{ value: 'Revenue (₹)', angle: 90, position: 'insideRight', fontSize: 12 }} />
                  <Tooltip formatter={(value: any, name: string) => name === 'revenue' ? formatIndianCurrency(value as number) : value} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="occupancy" name="Occupancy (%)" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={32} />
                  <Bar yAxisId="right" dataKey="revenue" name="Revenue (₹)" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-gray-500 text-sm mt-4">This chart shows the occupancy rate and revenue for each room type in the hotel. Use this data to identify which room types are most popular and profitable.</p>
            </div>
            
            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <UsersIcon size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Occupancy</p>
                    <p className="text-2xl font-bold text-blue-600">{calculateOccupancyRate()}%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSign size={24} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {revenueData.length > 0 ? formatIndianCurrency(revenueData[revenueData.length - 1].revenue) : '₹0'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Calendar size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg. Stay Length</p>
                    <p className="text-2xl font-bold text-purple-600">{calculateAverageStayLength()} days</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <TrendingUp size={24} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Revenue Growth</p>
                    <p className="text-2xl font-bold text-orange-600">{calculateRevenueGrowth()}%</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Monthly Performance */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h3 className="font-bold text-lg mb-4">Monthly Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left">Month</th>
                      <th className="py-3 px-4 text-right">Bookings</th>
                      <th className="py-3 px-4 text-right">Occupancy</th>
                      <th className="py-3 px-4 text-right">Avg. Stay</th>
                      <th className="py-3 px-4 text-right">Avg. Spending</th>
                      <th className="py-3 px-4 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueData.map((data, index) => (
                      <tr key={index} className="border-t">
                        <td className="py-3 px-4">{data.month}</td>
                        <td className="py-3 px-4 text-right">{data.bookings}</td>
                        <td className="py-3 px-4 text-right">{data.occupancy}%</td>
                        <td className="py-3 px-4 text-right">{data.avgStayLength} days</td>
                        <td className="py-3 px-4 text-right">{formatIndianCurrency(data.avgSpending)}</td>
                        <td className="py-3 px-4 text-right">{formatIndianCurrency(data.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Customer Demographics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-bold text-lg mb-4">Customer Demographics</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-3 px-4 text-left">Age Group</th>
                        <th className="py-3 px-4 text-right">Percentage</th>
                        <th className="py-3 px-4 text-right">Bookings</th>
                        <th className="py-3 px-4 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerDemographics.map((demo, index) => (
                        <tr key={index} className="border-t">
                          <td className="py-3 px-4">{demo.ageGroup}</td>
                          <td className="py-3 px-4 text-right">{demo.percentage}%</td>
                          <td className="py-3 px-4 text-right">{demo.bookings}</td>
                          <td className="py-3 px-4 text-right">{formatIndianCurrency(demo.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-bold text-lg mb-4">Room Type Performance</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-3 px-4 text-left">Room Type</th>
                        <th className="py-3 px-4 text-right">Bookings</th>
                        <th className="py-3 px-4 text-right">Revenue</th>
                        <th className="py-3 px-4 text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {popularRoomTypes.map((room, index) => (
                        <tr key={index} className="border-t">
                          <td className="py-3 px-4">{room.type}</td>
                          <td className="py-3 px-4 text-right">{room.bookings}</td>
                          <td className="py-3 px-4 text-right">{formatIndianCurrency(room.revenue)}</td>
                          <td className="py-3 px-4 text-right">{room.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Booking Channels */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-lg mb-4">Booking Channels</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left">Channel</th>
                      <th className="py-3 px-4 text-right">Bookings</th>
                      <th className="py-3 px-4 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingTrends.map((trend, index) => (
                      <tr key={index} className="border-t">
                        <td className="py-3 px-4">{trend.channel}</td>
                        <td className="py-3 px-4 text-right">{trend.bookings}</td>
                        <td className="py-3 px-4 text-right">{trend.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div>
            <h2 className="text-xl font-bold text-primary mb-4">System Settings</h2>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="font-bold text-lg mb-4">General Settings</h3>
              
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Hotel Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.hotelName}
                    onChange={(e) => setSettings({ ...settings, hotelName: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Check-in Time
                  </label>
                  <input
                    type="time"
                    className="input-field"
                    value={settings.checkIn}
                    onChange={(e) => setSettings({ ...settings, checkIn: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Check-out Time
                  </label>
                  <input
                    type="time"
                    className="input-field"
                    value={settings.checkOut}
                    onChange={(e) => setSettings({ ...settings, checkOut: e.target.value })}
                  />
                </div>
                
                <div className="mt-6">
                  <button type="submit" className="btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      case 'rooms':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">Room Management</h2>
              <button 
                className="btn-primary flex items-center gap-1"
                onClick={() => {
                  const modalForm = document.getElementById('roomModal');
                  if (modalForm) {
                    (modalForm as HTMLDialogElement).showModal();
                  }
                }}
                disabled={loading}
              >
                <Plus size={18} />
                <span>Add Room</span>
              </button>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {loadingRooms ? (
              <div className="text-center py-8">
                <Loader2 size={36} className="animate-spin mx-auto mb-4 text-primary" />
                <p className="text-gray-600">Loading rooms...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left">Room Number</th>
                      <th className="py-3 px-4 text-left">Type</th>
                      <th className="py-3 px-4 text-right">Base Price</th>
                      <th className="py-3 px-4 text-right">Weekend Price</th>
                      <th className="py-3 px-4 text-right">Holiday Price</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomPricing.length > 0 ? (
                      roomPricing.map((room) => (
                        <tr key={room.id} className="border-t">
                          <td className="py-3 px-4">{room.roomNumber || 'Room ' + room.id.substring(0, 4)}</td>
                          <td className="py-3 px-4">{room.type}</td>
                          <td className="py-3 px-4 text-right">
                            {editingPrice === room.id ? (
                              <input
                                type="number"
                                className="w-24 px-2 py-1 border rounded"
                                value={tempPricing.basePrice}
                                onChange={(e) => setTempPricing({
                                  ...tempPricing,
                                  basePrice: parseInt(e.target.value)
                                })}
                              />
                            ) : (
                              formatIndianCurrency(room.basePrice)
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {editingPrice === room.id ? (
                              <input
                                type="number"
                                className="w-24 px-2 py-1 border rounded"
                                value={tempPricing.weekend}
                                onChange={(e) => setTempPricing({
                                  ...tempPricing,
                                  weekend: parseInt(e.target.value)
                                })}
                              />
                            ) : (
                              formatIndianCurrency(room.weekend)
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {editingPrice === room.id ? (
                              <input
                                type="number"
                                className="w-24 px-2 py-1 border rounded"
                                value={tempPricing.holiday}
                                onChange={(e) => setTempPricing({
                                  ...tempPricing,
                                  holiday: parseInt(e.target.value)
                                })}
                              />
                            ) : (
                              formatIndianCurrency(room.holiday)
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              Available
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {editingPrice === room.id ? (
                              <button
                                className="p-1 text-green-600 hover:text-green-800"
                                onClick={() => handleSavePrice(room.id)}
                              >
                                Save
                              </button>
                            ) : (
                              <button
                                className="p-1 text-blue-600 hover:text-blue-800"
                                onClick={() => handleEditPrice(room)}
                              >
                                <Edit size={18} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500">
                          No rooms found. Add your first room using the button above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Add Room Modal */}
            <dialog id="roomModal" className="modal bg-white rounded-lg p-6 shadow-xl max-w-md">
              <div className="modal-content">
                <h3 className="text-lg font-bold mb-4">Add New Room</h3>
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}
                <form onSubmit={(e) => { e.preventDefault(); handleAddRoom(); }}>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Room Number</label>
                    <input
                      type="text"
                      className="input-field"
                      value={newRoom.roomNumber}
                      onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Room Type</label>
                    <select
                      className="input-field"
                      value={newRoom.type}
                      onChange={(e) => setNewRoom({ 
                        ...newRoom, 
                        type: e.target.value as 'Standard' | 'Deluxe' | 'Suite' | 'Presidential'
                      })}
                      required
                    >
                      <option value="Standard">Standard</option>
                      <option value="Deluxe">Deluxe</option>
                      <option value="Suite">Suite</option>
                      <option value="Presidential">Presidential</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Base Price (₹)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={newRoom.basePrice}
                      onChange={(e) => setNewRoom({ ...newRoom, basePrice: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Weekend Price (₹)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={newRoom.weekendPrice}
                      onChange={(e) => setNewRoom({ ...newRoom, weekendPrice: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Holiday Price (₹)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={newRoom.holidayPrice}
                      onChange={(e) => setNewRoom({ ...newRoom, holidayPrice: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Capacity</label>
                    <input
                      type="number"
                      className="input-field"
                      value={newRoom.capacity}
                      onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Amenities (comma separated)</label>
                    <input
                      type="text"
                      className="input-field"
                      value={newRoom.amenities}
                      onChange={(e) => setNewRoom({ ...newRoom, amenities: e.target.value })}
                      placeholder="WiFi, AC, TV, Minibar"
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        const modalForm = document.getElementById('roomModal');
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
                      {loading ? 'Adding...' : 'Add Room'}
                    </button>
                  </div>
                </form>
              </div>
            </dialog>
          </div>
        );
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />
      <NavigationBar title="Administrator Panel" />
      
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-primary">Administrator Panel</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-bold text-primary mb-4">Management</h2>
            <nav>
              <ul className="space-y-1">
                <li>
                  <button 
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                      activeTab === 'staff' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveTab('staff')}
                  >
                    <Users size={18} />
                    <span>Staff Management</span>
                  </button>
                </li>
                <li>
                  <button 
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                      activeTab === 'pricing' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveTab('pricing')}
                  >
                    <CreditCard size={18} />
                    <span>Room Pricing</span>
                  </button>
                </li>
                <li>
                  <button 
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                      activeTab === 'reports' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveTab('reports')}
                  >
                    <BarChartIcon size={18} />
                    <span>Analytics</span>
                  </button>
                </li>
                <li>
                  <button 
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                      activeTab === 'settings' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveTab('settings')}
                  >
                    <Settings size={18} />
                    <span>Settings</span>
                  </button>
                </li>
                <li>
                  <button 
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                      activeTab === 'rooms' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveTab('rooms')}
                  >
                    <Users size={18} />
                    <span>Rooms</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
          
          <div className="lg:col-span-4 bg-white rounded-lg shadow-md p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;