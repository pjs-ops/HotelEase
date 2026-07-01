import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hotel, LogOut, User as UserIcon, UserPlus } from 'lucide-react';
import { UserRole, User } from '../App';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <Hotel size={28} className="text-accent" />
          <span className="text-xl font-bold">HotelEase</span>
        </Link>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <UserIcon size={18} />
                <span className="hidden sm:inline">{user.fullName || user.username}</span>
                <span className="bg-accent text-primary text-xs px-2 py-1 rounded-full capitalize">
                  {user.role}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-1 hover:text-accent transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                to="/login" 
                className="btn-secondary"
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="bg-accent text-primary hover:bg-accent/90 py-2 px-4 rounded-md flex items-center gap-1"
              >
                <UserPlus size={16} />
                <span>Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;