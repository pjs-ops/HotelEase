import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Hotel } from 'lucide-react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import ReceptionistPanel from './pages/ReceptionistPanel';
import HousekeepingPanel from './pages/HousekeepingPanel';
import GuestPanel from './pages/GuestPanel';
import ProtectedRoute from './components/ProtectedRoute';
import { authService } from './lib/services';

export type UserRole = 'admin' | 'receptionist' | 'housekeeping' | 'guest' | null;

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  fullName?: string;
  [key: string]: any;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check for existing user session on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = async (username: string, password: string, role: UserRole) => {
    try {
      const authResponse = await authService.login({ username, password });
      setUser(authResponse.user);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const handleSignup = async (
    username: string, 
    email: string, 
    password: string, 
    role: UserRole, 
    fullName: string, 
    phone: string
  ) => {
    try {
      const authResponse = await authService.register({ 
        username, 
        email, 
        password, 
        role, 
        fullName, 
        phone 
      });
      setUser(authResponse.user);
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Hotel size={48} className="animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-white font-poppins">
        <Routes>
          <Route path="/" element={<HomePage user={user} onLogout={handleLogout} />} />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />} 
          />
          <Route 
            path="/signup" 
            element={user ? <Navigate to="/dashboard" /> : <SignupPage onSignup={handleSignup} />} 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute user={user}>
                <Dashboard user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute user={user} requiredRole="admin">
                <AdminPanel user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/receptionist" 
            element={
              <ProtectedRoute user={user} requiredRole="receptionist">
                <ReceptionistPanel user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/housekeeping" 
            element={
              <ProtectedRoute user={user} requiredRole="housekeeping">
                <HousekeepingPanel user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/guest" 
            element={
              <ProtectedRoute user={user} requiredRole="guest">
                <GuestPanel user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;