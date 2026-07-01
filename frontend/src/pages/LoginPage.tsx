import React, { useState } from 'react';
import { Hotel, User, Lock, Shield, BedDouble, CalendarClock, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserRole } from '../App';

interface LoginPageProps {
  onLogin: (username: string, password: string, role: UserRole) => Promise<boolean>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }
    
    setLoading(true);
    try {
      // Call the API login service through the parent component
      const success = await onLogin(username, password, selectedRole);
      if (!success) {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('Login failed. Please try again later.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const roles: { value: UserRole; label: string; icon: React.ReactNode; description: string }[] = [
    { 
      value: 'guest', 
      label: 'Guest', 
      icon: <BedDouble size={24} className="text-primary" />,
      description: 'Hotel guests with bookings'
    },
    { 
      value: 'housekeeping', 
      label: 'Housekeeping', 
      icon: <ClipboardCheck size={24} className="text-primary" />,
      description: 'Cleaning and maintenance staff'
    },
    { 
      value: 'receptionist', 
      label: 'Receptionist', 
      icon: <CalendarClock size={24} className="text-primary" />,
      description: 'Front desk and booking staff'
    },
    { 
      value: 'admin', 
      label: 'Administrator', 
      icon: <Shield size={24} className="text-primary" />,
      description: 'System administrators'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Hotel size={48} className="mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Login to Luxe Hotel</h1>
            <p className="text-gray-600">Please select your role and enter your credentials</p>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Select Your Role</label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    className={`p-4 border rounded-md transition-all ${
                      selectedRole === role.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-300 hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedRole(role.value)}
                    disabled={loading}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-2">
                        {role.icon}
                      </div>
                      <span className="font-medium">{role.label}</span>
                      <span className="text-xs mt-1 text-gray-500">{role.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-700 font-medium mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  id="username"
                  className="input-field pl-10"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-500" />
                </div>
                <input
                  type="password"
                  id="password"
                  className="input-field pl-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-gray-600">
            <p>Don't have an account?</p>
            <Link to="/signup" className="text-primary hover:underline mt-1 inline-block">
              Sign up here
            </Link>
            <p className="text-xs mt-4 text-gray-500">
              Staff accounts are typically provided by administrators.<br />
              Guests can create their own accounts to book rooms and services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;