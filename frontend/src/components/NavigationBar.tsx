import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';

interface NavigationBarProps {
  title: string;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ title }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {location.pathname !== '/dashboard' && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
            >
              <ChevronLeft size={20} />
              <span>Back to Dashboard</span>
            </button>
          )}
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <button
          onClick={handleHome}
          className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
        >
          <Home size={20} />
          <span className="hidden sm:inline">Home</span>
        </button>
      </div>
    </div>
  );
};

export default NavigationBar;