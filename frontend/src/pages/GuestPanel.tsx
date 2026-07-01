import React, { useState, useEffect } from 'react';
import { Calendar, BellRing, CreditCard, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import NavigationBar from '../components/NavigationBar';
import { User } from '../App';
import { bookingService, serviceService } from '../lib/services';
import { Booking } from '../lib/services/bookingService';
import { Service } from '../lib/services/serviceService';

interface GuestPanelProps {
  user: User | null;
  onLogout: () => void;
}

const GuestPanel: React.FC<GuestPanelProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(false);
  
  // Room services state
  const [roomServices, setRoomServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState<boolean>(false);

  // Fetch user bookings from API
  useEffect(() => {
    const fetchBookings = async () => {
      if (user && activeTab === 'bookings') {
        setLoadingBookings(true);
        setError(null);
        try {
          const userBookings = await bookingService.getUserBookings(user.id);
          setBookings(userBookings);
        } catch (err) {
          console.error('Error fetching bookings:', err);
          setError('Failed to load booking data. Please try again.');
        } finally {
          setLoadingBookings(false);
        }
      }
    };

    fetchBookings();
  }, [user, activeTab]);

  // Fetch user service requests from API
  useEffect(() => {
    const fetchServices = async () => {
      if (user && activeTab === 'services') {
        setLoadingServices(true);
        setError(null);
        try {
          const userServices = await serviceService.getUserServices(user.id);
          setRoomServices(userServices);
        } catch (err) {
          console.error('Error fetching services:', err);
          setError('Failed to load service data. Please try again.');
        } finally {
          setLoadingServices(false);
        }
      }
    };

    fetchServices();
  }, [user, activeTab]);

  // Function to format currency in Indian format
  const formatIndianCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date string to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format datetime string to readable format
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderBookingsTab = () => {
    return (
      <div>
        <h2 className="text-xl font-bold text-primary mb-6">Your Bookings</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loadingBookings ? (
          <div className="text-center py-8">
            <Loader2 size={36} className="animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">Loading your bookings...</p>
          </div>
        ) : (
          <>
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <div key={booking.id} className="bg-white p-6 rounded-lg shadow-md mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">Room {booking.room?.roomNumber || booking.roomId}</h3>
                      <p className="text-gray-600">{booking.room?.type || 'Standard Room'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      booking.status === 'checked-in' ? 'bg-green-100 text-green-800' :
                      booking.status === 'checked-out' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Check-in</p>
                      <p className="font-medium">{formatDate(booking.checkIn)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Check-out</p>
                      <p className="font-medium">{formatDate(booking.checkOut)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Rate per night</p>
                      <p className="font-medium">{formatIndianCurrency(booking.totalPrice)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment status</p>
                      <p className={`font-medium ${
                        booking.paymentStatus === 'completed' ? 'text-green-600' :
                        booking.paymentStatus === 'partial' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="btn-primary flex-1">View Details</button>
                    {booking.status === 'confirmed' && (
                      <button className="btn-secondary flex-1">Modify Booking</button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-center py-6">
                  <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Bookings Found</h3>
                  <p className="text-gray-600">You don't have any active bookings.</p>
                </div>
              </div>
            )}
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-lg mb-4">Previous Stays</h3>
              <div className="text-center py-6">
                <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No Previous Stays</h3>
                <p className="text-gray-600">You haven't stayed with us before.</p>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderServicesTab = () => {
    return (
      <div>
        <h2 className="text-xl font-bold text-primary mb-6">Room Services</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="font-bold text-lg mb-4">Available Services</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 hover:border-primary hover:shadow-md transition-all">
              <h4 className="font-bold mb-2">Room Service</h4>
              <p className="text-gray-600 text-sm mb-4">Order food and beverages</p>
              <button className="w-full bg-white border border-primary text-primary hover:bg-primary/5 transition-colors rounded-md py-1">
                Order
              </button>
            </div>
            
            <div className="border rounded-lg p-4 hover:border-primary hover:shadow-md transition-all">
              <h4 className="font-bold mb-2">Housekeeping</h4>
              <p className="text-gray-600 text-sm mb-4">Request room cleaning</p>
              <button className="w-full bg-white border border-primary text-primary hover:bg-primary/5 transition-colors rounded-md py-1">
                Request
              </button>
            </div>
            
            <div className="border rounded-lg p-4 hover:border-primary hover:shadow-md transition-all">
              <h4 className="font-bold mb-2">Maintenance</h4>
              <p className="text-gray-600 text-sm mb-4">Report issues with room facilities</p>
              <button className="w-full bg-white border border-primary text-primary hover:bg-primary/5 transition-colors rounded-md py-1">
                Report
              </button>
            </div>
            
            <div className="border rounded-lg p-4 hover:border-primary hover:shadow-md transition-all">
              <h4 className="font-bold mb-2">Wake-up Call</h4>
              <p className="text-gray-600 text-sm mb-4">Schedule a wake-up call</p>
              <button className="w-full bg-white border border-primary text-primary hover:bg-primary/5 transition-colors rounded-md py-1">
                Schedule
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-bold text-lg mb-4">Your Service Requests</h3>
          
          {loadingServices ? (
            <div className="text-center py-6">
              <Loader2 size={36} className="animate-spin mx-auto mb-4 text-primary" />
              <p className="text-gray-600">Loading your service requests...</p>
            </div>
          ) : (
            <>
              {roomServices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-3 px-4 text-left">Service</th>
                        <th className="py-3 px-4 text-left">Details</th>
                        <th className="py-3 px-4 text-left">Ordered At</th>
                        <th className="py-3 px-4 text-right">Price</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomServices.map((service) => (
                        <tr key={service.id} className="border-t">
                          <td className="py-3 px-4">{service.type}</td>
                          <td className="py-3 px-4">
                            {service.item} x {service.quantity}
                          </td>
                          <td className="py-3 px-4">{formatDateTime(service.createdAt || '')}</td>
                          <td className="py-3 px-4 text-right">
                            {formatIndianCurrency(service.price * service.quantity)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              service.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              service.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              service.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              service.status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <BellRing size={48} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Service Requests</h3>
                  <p className="text-gray-600">You haven't made any service requests yet.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'bookings':
        return renderBookingsTab();
      case 'services':
        return renderServicesTab();
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />
      
      <div className="bg-primary text-white">
        <div className="container mx-auto p-4">
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'bookings' 
                  ? 'bg-white text-primary' 
                  : 'bg-transparent text-white hover:bg-white/10'
              }`}
            >
              Bookings
            </button>
            <button 
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'services' 
                  ? 'bg-white text-primary' 
                  : 'bg-transparent text-white hover:bg-white/10'
              }`}
            >
              Room Services
            </button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto p-4">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default GuestPanel;