import React, { useState } from 'react';
import { Hotel, User, Lock, Mail, Phone, UserPlus, Users, CalendarClock, ClipboardCheck, BedDouble } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '../App';

interface SignupPageProps {
  onSignup: (username: string, email: string, password: string, role: UserRole, fullName: string, phone: string) => Promise<boolean>;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignup }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('guest');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const roles: { value: UserRole; label: string; icon: React.ReactNode; description: string }[] = [
    { 
      value: 'guest', 
      label: 'Guest', 
      icon: <BedDouble size={32} className="text-primary" />,
      description: 'Book rooms, request services, and manage your stays'
    },
    // Normally these roles would be restricted, but we'll include them for the demo
    { 
      value: 'housekeeping', 
      label: 'Housekeeping Staff', 
      icon: <ClipboardCheck size={32} className="text-primary" />,
      description: 'Manage room cleaning and maintenance tasks'
    },
    { 
      value: 'receptionist', 
      label: 'Receptionist', 
      icon: <CalendarClock size={32} className="text-primary" />,
      description: 'Manage bookings, check-ins, and guest services'
    },
    { 
      value: 'admin', 
      label: 'Administrator', 
      icon: <Users size={32} className="text-primary" />,
      description: 'Full system access with staff management and analytics'
    }
  ];

  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedRole) {
        setError('Please select your role');
        return;
      }
      setError('');
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password || !email || !fullName) {
      setError('Please fill all required fields');
      return;
    }
    
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      // Call the API signup service through the parent component
      const success = await onSignup(username, email, password, selectedRole, fullName, phone);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Registration failed. Please try again later.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
          <div className="text-center mb-8">
            <Hotel size={48} className="mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Create an Account</h1>
            <p className="text-gray-600">Join Luxe Hotel Management System</p>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {/* Steps indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step === 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className="w-16 h-1 bg-gray-200">
              <div className={`h-full bg-primary ${step === 2 ? 'w-full' : 'w-0'}`}></div>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step === 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <div>
                <h2 className="text-xl font-bold mb-4 text-center">Select Your Role</h2>
                <p className="text-gray-600 mb-6 text-center">Choose the role that best describes how you'll use our system</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {roles.map((role) => (
                    <div 
                      key={role.value}
                      className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-primary ${
                        selectedRole === role.value 
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedRole(role.value)}
                    >
                      <div className="flex flex-col items-center">
                        <div className="mb-2">
                          {role.icon}
                        </div>
                        <h3 className="font-bold text-lg mb-1">{role.label}</h3>
                        <p className="text-sm text-gray-600 text-center">{role.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button 
                    type="button" 
                    className="btn-primary px-6"
                    onClick={handleNextStep}
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold mb-4 text-center">
                  Personal Information
                  {selectedRole && (
                    <span className="block text-sm font-normal mt-1 text-primary">
                      Signing up as: {roles.find(r => r.value === selectedRole)?.label}
                    </span>
                  )}
                </h2>
                
                <div className="mb-4">
                  <label htmlFor="fullName" className="block text-gray-700 font-medium mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-gray-500" />
                    </div>
                    <input
                      type="text"
                      id="fullName"
                      className="input-field pl-10"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="username" className="block text-gray-700 font-medium mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserPlus size={18} className="text-gray-500" />
                    </div>
                    <input
                      type="text"
                      id="username"
                      className="input-field pl-10"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={18} className="text-gray-500" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      className="input-field pl-10"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={18} className="text-gray-500" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      className="input-field pl-10"
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setPhone(value);
                      }}
                      maxLength={10}
                      pattern="[0-9]{10}"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-500" />
                    </div>
                    <input
                      type="password"
                      id="password"
                      className="input-field pl-10"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-500" />
                    </div>
                    <input
                      type="password"
                      id="confirmPassword"
                      className="input-field pl-10"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button 
                    type="button" 
                    className="btn-secondary px-6"
                    onClick={handlePrevStep}
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary px-6"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </div>
            )}
          </form>
          
          <div className="mt-6 text-center text-gray-600">
            <p>Already have an account?</p>
            <Link to="/login" className="text-primary hover:underline mt-1 inline-block">
              Login here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage; 