import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, ClipboardCheck, CreditCard, Plus, BarChart as ChartBar, Settings, BedDouble, Hotel, UserCog, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import { UserRole, User } from '../App';

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
}

interface StaffMember {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (user?.role) {
      const timer = setTimeout(() => {
        setRedirecting(true);
        const redirectTimer = setInterval(() => {
          setCountdown(prevCount => {
            if (prevCount <= 1) {
              clearInterval(redirectTimer);
              navigateToRolePanel(user.role as UserRole);
              return 0;
            }
            return prevCount - 1;
          });
        }, 1000);
        
        return () => clearInterval(redirectTimer);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [user?.role]);

  const navigateToRolePanel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'receptionist':
        navigate('/receptionist');
        break;
      case 'housekeeping':
        navigate('/housekeeping');
        break;
      case 'guest':
        navigate('/guest');
        break;
      default:
        break;
    }
  };

  const roleModules = {
    admin: {
      title: 'Administrator Dashboard',
      description: 'Welcome to the administration portal. Here you can manage all aspects of the hotel system including staff, rooms, pricing, and view analytics.',
      path: '/admin',
      icon: <UserCog size={64} className="text-primary" />,
      color: 'blue',
      features: [
        'Staff management and role assignment',
        'Room pricing configuration',
        'Financial reports and analytics',
        'System settings and customization'
      ]
    },
    receptionist: {
      title: 'Receptionist Portal',
      description: 'Welcome to the reception desk portal. Here you can manage guest bookings, check-ins, check-outs, and handle room assignments.',
      path: '/receptionist',
      icon: <Calendar size={64} className="text-emerald-600" />,
      color: 'emerald',
      features: [
        'Guest check-in and check-out processing',
        'Reservation management and modifications',
        'Room availability overview',
        'Guest service request handling'
      ]
    },
    housekeeping: {
      title: 'Housekeeping Portal',
      description: 'Welcome to the housekeeping portal. Here you can manage room cleaning schedules, maintenance tasks, and inventory.',
      path: '/housekeeping',
      icon: <ClipboardCheck size={64} className="text-amber-600" />,
      color: 'amber',
      features: [
        'Room cleaning status updates',
        'Maintenance request management',
        'Supply inventory tracking',
        'Daily task scheduling'
      ]
    },
    guest: {
      title: 'Guest Portal',
      description: 'Welcome to the guest portal. Here you can manage your bookings, request services, and view your bill.',
      path: '/guest',
      icon: <BedDouble size={64} className="text-rose-600" />,
      color: 'rose',
      features: [
        'View and manage your reservations',
        'Order room service and amenities',
        'Request housekeeping and maintenance',
        'Access your bill and payment information'
      ]
    }
  };

  if (!user || !user.role) {
    return null;
  }

  const currentRole = roleModules[user.role as keyof typeof roleModules];
  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      'blue': 'bg-blue-100 border-blue-500 text-blue-800',
      'emerald': 'bg-emerald-100 border-emerald-500 text-emerald-800',
      'amber': 'bg-amber-100 border-amber-500 text-amber-800',
      'rose': 'bg-rose-100 border-rose-500 text-rose-800'
    };
    return colorMap[color] || 'bg-gray-100 border-gray-500 text-gray-800';
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header user={user} onLogout={onLogout} />
      
      <main className="flex-grow bg-gray-100 p-4 md:p-8">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Role Header */}
            <div className={`p-8 border-b ${getColorClass(currentRole.color)}`}>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="bg-white p-6 rounded-full shadow-md">
                  {currentRole.icon}
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{currentRole.title}</h1>
                  <p className="text-lg">
                    Welcome, <span className="font-medium">{user.fullName || user.username}</span>!
                  </p>
                </div>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-xl font-medium mb-4">About Your Portal</h2>
                <p className="text-gray-700 mb-6">{currentRole.description}</p>
                
                <h3 className="text-lg font-medium mb-2">Key Features:</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mb-8">
                  {currentRole.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Redirect Section */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                {redirecting ? (
                  <div className="flex flex-col items-center">
                    <Loader2 size={36} className="text-primary animate-spin mb-4" />
                    <p className="text-lg font-medium">
                      Redirecting to your dashboard in {countdown} seconds...
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-1">Ready to get started?</h3>
                      <p className="text-gray-600">Go to your dedicated dashboard to access all features.</p>
                    </div>
                    <button
                      onClick={() => navigateToRolePanel(user.role as UserRole)}
                      className="btn-primary whitespace-nowrap"
                    >
                      Go to {user.role} Dashboard
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white py-4 border-t">
        <div className="container mx-auto text-center text-gray-600">
          <p>HotelEase Management System</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;