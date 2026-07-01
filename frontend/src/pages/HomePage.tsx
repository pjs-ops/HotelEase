import React from 'react';
import { Link } from 'react-router-dom';
import { Hotel, Users, Calendar, ClipboardCheck, UserPlus, Shield, BedDouble, Star } from 'lucide-react';
import { User } from '../App';
import { motion } from 'framer-motion';

interface HomePageProps {
  user: User | null;
  onLogout: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ user, onLogout }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <div className="animate-fade-in-page">
          {/* Hero Section */}
          <section className="relative bg-primary text-white py-20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-900 to-accent opacity-60 pointer-events-none" />
            <div className="container mx-auto px-4 text-center relative z-10 flex flex-col items-center justify-center">
              <Hotel size={64} className="mx-auto mb-6 text-accent animate-bounce" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in-down delay-100">Welcome to HotelEase Management</h1>
              <p className="text-xl mb-8 max-w-2xl mx-auto animate-fade-in-up delay-300">Your premier solution for hotel booking and management</p>
              {/* No login/signup buttons here */}
              {user && (
                <Link to="/dashboard" className="btn-secondary text-lg px-8 py-3 animate-fade-in-up delay-500">
                  Go to Dashboard
                </Link>
              )}
            </div>
          </section>
          
          {/* User Types Section */}
          {!user && (
            <section className="py-16 bg-white">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-8 text-primary animate-fade-in-down delay-200">Choose Your Experience</h2>
                <p className="text-lg text-center mb-12 max-w-3xl mx-auto animate-fade-in-up delay-400">Our platform serves different user types with specialized features</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto justify-center items-stretch">
                  {/* Guest Card */}
                  <motion.div
                    className="bg-gray-50 rounded-lg shadow-md p-8 border-t-4 border-accent flex flex-col justify-between"
                    initial={{ x: -200, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-accent/20 p-3 rounded-full">
                        <BedDouble size={32} className="text-accent" />
                      </div>
                      <h3 className="text-2xl font-bold">Hotel Guests</h3>
                    </div>
                    <p className="mb-6 text-gray-600">Looking to book a stay or manage your reservations?</p>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start gap-2">
                        <Star size={18} className="text-accent mt-1 flex-shrink-0" />
                        <span>Book rooms with real-time availability</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Star size={18} className="text-accent mt-1 flex-shrink-0" />
                        <span>Request room service and additional amenities</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Star size={18} className="text-accent mt-1 flex-shrink-0" />
                        <span>View and manage your reservations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Star size={18} className="text-accent mt-1 flex-shrink-0" />
                        <span>Secure & Private: Your data is always protected with us.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Star size={18} className="text-accent mt-1 flex-shrink-0" />
                        <span>24/7 Support: Our team is here to help you anytime.</span>
                      </li>
                    </ul>
                  </motion.div>
                  
                  {/* Staff Card */}
                  <motion.div
                    className="bg-gray-50 rounded-lg shadow-md p-8 border-t-4 border-primary flex flex-col justify-between"
                    initial={{ x: 200, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-primary/20 p-3 rounded-full">
                        <Shield size={32} className="text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold">Hotel Staff</h3>
                    </div>
                    <p className="mb-6 text-gray-600">Are you an employee of HotelEase?</p>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start gap-2">
                        <Star size={18} className="text-primary mt-1 flex-shrink-0" />
                        <span>Administrators manage the entire system</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Star size={18} className="text-primary mt-1 flex-shrink-0" />
                        <span>Receptionists handle bookings and check-ins</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Star size={18} className="text-primary mt-1 flex-shrink-0" />
                        <span>Housekeeping staff manage room maintenance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Star size={18} className="text-primary mt-1 flex-shrink-0" />
                        <span>Seamless Experience: Easy-to-use tools for all staff roles.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Star size={18} className="text-primary mt-1 flex-shrink-0" />
                        <span>Trusted Platform: Used by top hotels for reliable management.</span>
                      </li>
                    </ul>
                  </motion.div>
                </div>
              </div>
            </section>
          )}
          
          {/* Features Section */}
          <section className="py-10 bg-light-gray">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-6 text-primary animate-fade-in-down">Our Management System Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="card text-center transition-transform duration-300 hover:scale-105 hover:shadow-xl animate-fade-in-up">
                  <Users size={48} className="mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-bold mb-2">Staff Management</h3>
                  <p>Efficiently manage hotel staff, roles, and responsibilities.</p>
                </div>
                
                <div className="card text-center transition-transform duration-300 hover:scale-105 hover:shadow-xl animate-fade-in-up delay-100">
                  <Calendar size={48} className="mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-bold mb-2">Reservation System</h3>
                  <p>Handle bookings, check-ins, and check-outs with ease.</p>
                </div>
                
                <div className="card text-center transition-transform duration-300 hover:scale-105 hover:shadow-xl animate-fade-in-up delay-200">
                  <ClipboardCheck size={48} className="mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-bold mb-2">Housekeeping</h3>
                  <p>Track room status and manage cleaning tasks efficiently.</p>
                </div>
              </div>
            </div>
          </section>
          
          {/* CTA Section */}
          <section className="py-10 bg-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-4 text-primary">Ready to Experience HotelEase?</h2>
              <p className="text-lg mb-6 max-w-2xl mx-auto">Join our platform today and enjoy seamless hotel management whether you're a guest or staff member.</p>
              {!user && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/login" className="btn-primary text-base font-medium px-6 py-2 rounded-md text-center">
                    Login
                  </Link>
                  <Link to="/signup" className="bg-accent text-primary font-medium text-base px-6 py-2 rounded-md hover:bg-accent/90 transition-colors text-center">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
      
      <footer className="bg-primary text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p>HotelEase Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;