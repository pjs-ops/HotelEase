import React, { useState, useEffect } from 'react';
import { Calendar, UserCheck, UserMinus, Search, Filter, Plus, Edit, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import NavigationBar from '../components/NavigationBar';
import { User, UserRole } from '../App';
import { format } from 'date-fns';
import { bookingService } from '../lib/services';
import { Booking } from '../lib/services/bookingService';
import { roomService } from '../lib/services';
import { Room } from '../lib/services/roomService';
import { userService } from '../lib/services';

interface ReceptionistPanelProps {
  user: User | null;
  onLogout: () => void;
}

interface NewReservationData {
  guestName: string;
  phone: string;
  roomType: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  totalPrice?: number;
}

const ReceptionistPanel: React.FC<ReceptionistPanelProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('reservations');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Reservations state
  const [reservations, setReservations] = useState<Booking[]>([]);
  const [loadingReservations, setLoadingReservations] = useState<boolean>(false);
  
  // New reservation dialog state
  const [showNewReservationDialog, setShowNewReservationDialog] = useState(false);
  const [newReservation, setNewReservation] = useState<NewReservationData>({
    guestName: '',
    phone: '',
    roomType: 'Standard',
    roomNumber: '',
    checkIn: '',
    checkOut: '',
    guests: '1'
  });
  
  // Edit reservation state
  const [editingReservation, setEditingReservation] = useState<Booking | null>(null);
  
  // First let's add a new state for available rooms
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  
  // Manual check-out state
  const [selectedCheckoutRoom, setSelectedCheckoutRoom] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [checkoutDetails, setCheckoutDetails] = useState<{
    roomRate: number;
    roomService: number;
    miniBar: number;
    total: number;
  }>({
    roomRate: 0,
    roomService: 0,
    miniBar: 0,
    total: 0
  });
  
  // Load reservations from API with proper filtering for check-in and check-out tabs
  useEffect(() => {
    const fetchReservations = async () => {
      setLoadingReservations(true);
      setError(null);
      try {
        let fetchedReservations;
        
        if (activeTab === 'check-in') {
          // For check-in tab, get only confirmed bookings with today's check-in date
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          console.log('Fetching check-in reservations for today:', today.toISOString());
          fetchedReservations = await bookingService.getAllBookings({
            status: 'confirmed',
            fromDate: today.toISOString()
          });
          
          // Further filter to only include today's check-ins
          fetchedReservations = fetchedReservations.filter(res => {
            const checkInDate = new Date(res.checkIn);
            checkInDate.setHours(0, 0, 0, 0);
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            return checkInDate.getTime() === todayDate.getTime();
          });
          
          console.log('Today\'s check-ins:', fetchedReservations);
        } 
        else if (activeTab === 'check-out') {
          // For check-out tab, get ALL checked-in bookings, not just today's
          console.log('Fetching all checked-in reservations for checkout tab');
          fetchedReservations = await bookingService.getAllBookings({
            status: 'checked-in'
          });
          
          console.log('All checked-in rooms for checkout:', fetchedReservations);
        }
        else {
          // For the main reservations tab, get all bookings
          fetchedReservations = await bookingService.getAllBookings();
        }
        
        setReservations(fetchedReservations);
      } catch (err) {
        console.error('Error fetching reservations:', err);
        setError('Failed to load reservations. Please try again.');
      } finally {
        setLoadingReservations(false);
      }
    };

    fetchReservations();
  }, [activeTab]);

  // Add useEffect to fetch available rooms
  useEffect(() => {
    const fetchAvailableRooms = async () => {
      if (showNewReservationDialog) {
        try {
          const rooms = await roomService.getAllRooms({ status: 'Available' });
          console.log('Available rooms fetched:', rooms);
          setAvailableRooms(rooms);
        } catch (err) {
          console.error('Error fetching available rooms:', err);
          setError('Failed to load available rooms. Please try again.');
        }
      }
    };

    fetchAvailableRooms();
  }, [showNewReservationDialog]);

  // Add a useEffect to calculate price when room or dates change
  useEffect(() => {
    const updatePrice = async () => {
      if (newReservation.roomNumber && newReservation.checkIn && newReservation.checkOut) {
        // Find the selected room - use getRoomId helper to match with the roomNumber
        const selectedRoom = availableRooms.find(room => getRoomId(room) === newReservation.roomNumber);
        
        if (selectedRoom) {
          try {
            // Calculate number of nights
            const checkIn = new Date(newReservation.checkIn);
            const checkOut = new Date(newReservation.checkOut);
            
            // Make sure dates are valid
            if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
              console.error('Invalid date format');
              return;
            }
            
            const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
            
            // Calculate total price (using basePrice for simplicity)
            const totalPrice = selectedRoom.basePrice * nights;
            
            console.log(`Calculating price: ${nights} nights at ${selectedRoom.basePrice} per night = ${totalPrice}`);
            
            // Update the reservation data with the calculated price
            setNewReservation(prev => ({ ...prev, totalPrice }));
          } catch (err) {
            console.error('Error calculating price:', err);
          }
        }
      }
    };
    
    updatePrice();
  }, [newReservation.roomNumber, newReservation.checkIn, newReservation.checkOut, availableRooms]);

  // Add useEffect to validate room selection when dialog opens
  useEffect(() => {
    if (showNewReservationDialog && newReservation.roomNumber && !isValidMongoId(newReservation.roomNumber)) {
      console.warn(`Invalid room ID format detected on dialog open: ${newReservation.roomNumber}. Resetting selection.`);
      setNewReservation(prev => ({ ...prev, roomNumber: '' }));
    }
  }, [showNewReservationDialog]);

  const handleCheckIn = async (id: string) => {
    setLoading(true);
    try {
      // Update booking status in the API
      await bookingService.updateBooking(id, { status: 'checked-in' });
      
      // Update local state
      setReservations(reservations.map(res => 
        res.id === id ? { ...res, status: 'checked-in' } : res
      ));
    } catch (err) {
      console.error('Error updating booking status:', err);
      setError('Failed to check in guest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (id: string) => {
    setLoading(true);
    try {
      // Update booking status in the API
      await bookingService.updateBooking(id, { status: 'checked-out' });
      
      // Find the booking to get the roomId
      const booking = reservations.find(res => res.id === id);
      if (booking) {
        // Get room ID (it might be an object or string)
        let roomId = typeof booking.roomId === 'object' 
          ? (booking.roomId as any).id || (booking.roomId as any)._id
          : booking.roomId;
          
        // Update room status to available
        await roomService.updateRoom(roomId, { status: 'Available' });
      }
      
      // Update local state
      setReservations(reservations.map(res => 
        res.id === id ? { ...res, status: 'checked-out' } : res
      ));
      
      // Show success message
      alert('Guest checked out successfully. Room is now available.');
    } catch (err) {
      console.error('Error updating booking status:', err);
      setError('Failed to check out guest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewReservationDialog = () => {
    setShowNewReservationDialog(true);
    setNewReservation({
      guestName: '',
      phone: '',
      roomType: 'Standard',
      roomNumber: '',
      checkIn: '',
      checkOut: '',
      guests: '1',
      totalPrice: 0
    });
    const modalForm = document.getElementById('newReservationModal');
    if (modalForm) {
      (modalForm as HTMLDialogElement).showModal();
    }
  };

  const createGuestUser = async (guestName: string, phone: string): Promise<string> => {
    try {
      console.log(`Creating guest user for: ${guestName}, ${phone}`);
      
      // Generate a unique username based on name and timestamp
      const username = guestName.toLowerCase().replace(/\s+/g, '.') + '.' + Date.now().toString().slice(-5);
      const email = username + '@guest.hotelease.com';
      
      // Create a temporary password (user will need to reset it to access)
      const password = 'Guest' + Date.now().toString().slice(-6);
      
      // Create the guest user via API
      const userData = {
        username,
        email,
        password,
        role: 'guest' as const,
        fullName: guestName,
        phone
      };
      
      console.log('Creating user with data:', userData);
      const user = await userService.createUser(userData);
      console.log('Created guest user successfully:', user);
      
      if (!user || !user.id) {
        throw new Error('Guest user created but no ID was returned');
      }
      
      // Show credentials to receptionist so they can provide to guest
      alert(`Guest account created successfully!
Username: ${username}
Password: ${password}
Please provide these credentials to the guest for their access.`);
      
      return user.id;
    } catch (err) {
      console.error('Error creating guest user:', err);
      throw new Error(`Failed to create guest account: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Helper function to validate MongoDB ObjectId format
  const isValidMongoId = (id: string): boolean => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  // Helper function to get room ID consistently (handles both id and _id)
  const getRoomId = (room: any): string => {
    return room.id || room._id;
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReservation.guestName || !newReservation.phone) {
      setError('Please enter guest name and phone number');
      return;
    }
    
    if (!newReservation.roomNumber) {
      setError('Please select a room');
      return;
    }
    
    let roomId = newReservation.roomNumber;
    
    // Validate that roomNumber is a valid MongoDB ObjectId
    if (!isValidMongoId(roomId)) {
      console.error(`Room ID "${roomId}" is not a valid MongoDB ObjectId. Attempting to resolve.`);
      
      // It might be the display text instead of the ID - try to find the room by matching the display text
      const displayText = roomId; // The display text appears to be in roomId
      const foundRoom = availableRooms.find(room => 
        `${room.roomNumber} - ${room.type} (₹${room.basePrice}/night)` === displayText
      );
      
      if (foundRoom) {
        console.log(`Found matching room by display text. Using ID: ${getRoomId(foundRoom)}`);
        roomId = getRoomId(foundRoom);
        
        // Recalculate price with the correct room
        if (newReservation.checkIn && newReservation.checkOut) {
          const checkIn = new Date(newReservation.checkIn);
          const checkOut = new Date(newReservation.checkOut);
          const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
          const calculatedPrice = foundRoom.basePrice * nights;
          newReservation.totalPrice = calculatedPrice;
          console.log(`Corrected price calculation: ${nights} nights at ₹${foundRoom.basePrice}/night = ₹${calculatedPrice}`);
        }
      } else {
        // Try to extract room number from the display text
        const match = displayText.match(/^(\d+)/);
        if (match && match[1]) {
          const roomNumber = match[1];
          const matchingRoom = availableRooms.find(room => room.roomNumber === roomNumber);
          
          if (matchingRoom) {
            console.log(`Found room by room number ${roomNumber}. Using ID: ${getRoomId(matchingRoom)}`);
            roomId = getRoomId(matchingRoom);
            
            // Recalculate price with the correct room
            if (newReservation.checkIn && newReservation.checkOut) {
              const checkIn = new Date(newReservation.checkIn);
              const checkOut = new Date(newReservation.checkOut);
              const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
              const calculatedPrice = matchingRoom.basePrice * nights;
              newReservation.totalPrice = calculatedPrice;
              console.log(`Corrected price calculation: ${nights} nights at ₹${matchingRoom.basePrice}/night = ₹${calculatedPrice}`);
            }
          } else {
            setError(`Invalid room ID format: ${roomId}. Please select a room from the dropdown.`);
            return;
          }
        } else {
          setError(`Invalid room ID format: ${roomId}. Please select a room from the dropdown.`);
          return;
        }
      }
    }
    
    if (!newReservation.checkIn || !newReservation.checkOut) {
      setError('Please select check-in and check-out dates');
      return;
    }
    
    setLoading(true);
    try {
      // Log the state for debugging
      console.log('Creating reservation with data:', { ...newReservation, roomNumber: roomId });
      console.log('Available rooms:', availableRooms);
      
      // Calculate nights and verify total price one more time to ensure correct value
      const selectedRoom = availableRooms.find(room => getRoomId(room) === roomId);
      console.log('Selected room ID:', roomId);
      console.log('Found selected room:', selectedRoom);
      
      if (!selectedRoom) {
        // If the room is not found, try to fetch the room directly by ID
        try {
          console.log('Room not found in availableRooms, fetching by ID...');
          const room = await roomService.getRoomById(roomId);
          console.log('Fetched room by ID:', room);
          
          if (room) {
            // Calculate with the directly fetched room
            const checkIn = new Date(newReservation.checkIn);
            const checkOut = new Date(newReservation.checkOut);
            const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
            const calculatedPrice = room.basePrice * nights;
            
            console.log(`Final price calculation: ${nights} nights at ₹${room.basePrice}/night = ₹${calculatedPrice}`);
            
            // Create guest user account if needed
            let guestId;
            try {
              console.log('Creating guest user account...');
              guestId = await createGuestUser(newReservation.guestName, newReservation.phone);
              console.log('Guest user created with ID:', guestId);
              
              if (!guestId) {
                throw new Error('Failed to get a valid guest ID');
              }
            } catch (guestError) {
              console.error('Failed to create guest user:', guestError);
              setError(`Guest account creation failed: ${guestError instanceof Error ? guestError.message : 'Unknown error'}`);
              setLoading(false);
              return;
            }
            
            // Create new reservation via API
            const bookingData = {
              roomId: roomId, // Use the resolved roomId
              guestId,
              checkIn: newReservation.checkIn,
              checkOut: newReservation.checkOut,
              numberOfGuests: parseInt(newReservation.guests),
              totalPrice: calculatedPrice,
            };
            
            console.log('Sending booking data to API:', bookingData);
            const createdBooking = await bookingService.createBooking(bookingData);
            console.log('Received created booking from API:', createdBooking);
            
            // Add guest information to the booking for display
            const bookingWithGuestInfo = {
              ...createdBooking,
              guestName: newReservation.guestName,
              phone: newReservation.phone
            };
            
            // Update local state
            setReservations([...reservations, bookingWithGuestInfo]);
            
            // Show success message
            alert('Reservation created successfully!');
            
            // Reset form and close dialog
            setNewReservation({
              guestName: '',
              phone: '',
              roomType: 'Standard',
              roomNumber: '',
              checkIn: '',
              checkOut: '',
              guests: '1',
              totalPrice: 0
            });
            
            const modalForm = document.getElementById('newReservationModal');
            if (modalForm) {
              (modalForm as HTMLDialogElement).close();
            }
            return; // Return early as we've handled the booking
          }
        } catch (fetchError) {
          console.error('Error fetching room by ID:', fetchError);
        }
        
        throw new Error(`Selected room (ID: ${roomId}) not found. Please try again.`);
      }
      
      const checkIn = new Date(newReservation.checkIn);
      const checkOut = new Date(newReservation.checkOut);
      const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
      const calculatedPrice = selectedRoom.basePrice * nights;
      
      console.log(`Final price calculation: ${nights} nights at ₹${selectedRoom.basePrice}/night = ₹${calculatedPrice}`);
      
      // Create guest user account if needed
      let guestId;
      try {
        console.log('Creating guest user account...');
        guestId = await createGuestUser(newReservation.guestName, newReservation.phone);
        console.log('Guest user created with ID:', guestId);
        
        if (!guestId) {
          throw new Error('Failed to get a valid guest ID');
        }
      } catch (guestError) {
        console.error('Failed to create guest user:', guestError);
        setError(`Guest account creation failed: ${guestError instanceof Error ? guestError.message : 'Unknown error'}`);
        setLoading(false);
        return;
      }
      
      // Create new reservation via API
      const bookingData = {
        roomId: roomId, // Use the resolved roomId
        guestId,
        checkIn: newReservation.checkIn,
        checkOut: newReservation.checkOut,
        numberOfGuests: parseInt(newReservation.guests),
        totalPrice: calculatedPrice,
      };
      
      console.log('Sending booking data to API:', bookingData);
      const createdBooking = await bookingService.createBooking(bookingData);
      console.log('Received created booking from API:', createdBooking);
      
      // Add guest information to the booking for display
      const bookingWithGuestInfo = {
        ...createdBooking,
        guestName: newReservation.guestName,
        phone: newReservation.phone
      };
      
      // Update local state
      setReservations([...reservations, bookingWithGuestInfo]);
      
      // Show success message
      alert('Reservation created successfully!');
      
      // Reset form and close dialog
      setNewReservation({
        guestName: '',
        phone: '',
        roomType: 'Standard',
        roomNumber: '',
        checkIn: '',
        checkOut: '',
        guests: '1',
        totalPrice: 0
      });
      
      const modalForm = document.getElementById('newReservationModal');
      if (modalForm) {
        (modalForm as HTMLDialogElement).close();
      }
    } catch (err) {
      console.error('Error creating reservation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditReservation = (reservation: Booking) => {
    setEditingReservation(reservation);
    const modalForm = document.getElementById('editReservationModal');
    if (modalForm) {
      (modalForm as HTMLDialogElement).showModal();
    }
  };
  
  const handleUpdateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReservation) return;
    
    setLoading(true);
    try {
      // Update booking via API
      const updatedBooking = await bookingService.updateBooking(editingReservation.id, {
        checkIn: editingReservation.checkIn,
        checkOut: editingReservation.checkOut
      });
      
      // Update local state
      setReservations(reservations.map(res => 
        res.id === editingReservation.id ? { ...res, ...updatedBooking } : res
      ));
      
      // Close modal
      const modalForm = document.getElementById('editReservationModal');
      if (modalForm) {
        (modalForm as HTMLDialogElement).close();
      }
      
      setEditingReservation(null);
    } catch (err) {
      console.error('Error updating reservation:', err);
      setError('Failed to update reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCheckoutRoom) {
      setError('Please select a room to check out');
      return;
    }
    
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }
    
    setLoading(true);
    try {
      // Update booking status in the API
      await bookingService.updateBooking(selectedCheckoutRoom, { 
        status: 'checked-out',
        paymentStatus: 'completed'
      });
      
      // Find the booking to get the roomId
      const booking = reservations.find(res => res.id === selectedCheckoutRoom);
      if (booking) {
        // Get room ID (it might be an object or string)
        let roomId = typeof booking.roomId === 'object' 
          ? (booking.roomId as any).id || (booking.roomId as any)._id
          : booking.roomId;
          
        // Update room status to available
        await roomService.updateRoom(roomId, { status: 'Available' });
        
        // Update local state
        setReservations(reservations.map(res => 
          res.id === selectedCheckoutRoom ? { ...res, status: 'checked-out', paymentStatus: 'completed' } : res
        ));
        
        // Show success message
        alert('Checkout completed successfully!');
        
        // Reset form
        setSelectedCheckoutRoom('');
        setPaymentMethod('');
        setCheckoutDetails({
          roomRate: 0,
          roomService: 0,
          miniBar: 0,
          total: 0
        });
      }
    } catch (err) {
      console.error('Error completing check out:', err);
      setError('Failed to complete check out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update the updateCheckoutDetails function to handle edge cases better
  const updateCheckoutDetails = (reservationId: string) => {
    console.log('Updating checkout details for reservation:', reservationId);
    const reservation = reservations.find(res => res.id === reservationId);
    if (reservation) {
      try {
        // Calculate number of nights
        const checkIn = new Date(reservation.checkIn);
        const checkOut = new Date(reservation.checkOut);
        const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
        
        // Calculate room rate (base price * nights)
        const roomRate = reservation.totalPrice || 0;
        
        // Generate some random service charges for demo
        const roomService = Math.floor(Math.random() * 1000) + 500; // Random between 500-1500
        const miniBar = Math.floor(Math.random() * 500) + 200; // Random between 200-700
        
        // Calculate total
        const total = roomRate + roomService + miniBar;
        
        console.log('Checkout details:', {
          roomRate,
          roomService,
          miniBar,
          total,
          nights
        });
        
        setCheckoutDetails({
          roomRate,
          roomService,
          miniBar,
          total
        });
      } catch (err) {
        console.error('Error calculating checkout details:', err);
        // Set some fallback values
        setCheckoutDetails({
          roomRate: reservation.totalPrice || 5000,
          roomService: 1000,
          miniBar: 500,
          total: (reservation.totalPrice || 5000) + 1500
        });
      }
    } else {
      console.warn('Reservation not found:', reservationId);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'reservations':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">Reservations</h2>
              <button 
                className="btn-primary flex items-center gap-1"
                onClick={handleOpenNewReservationDialog}
              >
                <Plus size={18} />
                <span>New Reservation</span>
              </button>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="mb-4 flex gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search reservations..."
                  className="input-field pl-10"
                />
              </div>
              <select className="input-field">
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="checked-in">Checked In</option>
                <option value="checked-out">Checked Out</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            {loadingReservations ? (
              <div className="text-center py-8">
                <Loader2 size={36} className="animate-spin mx-auto mb-4 text-primary" />
                <p className="text-gray-600">Loading reservations...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left">Guest</th>
                      <th className="py-3 px-4 text-left">Room</th>
                      <th className="py-3 px-4 text-left">Check-in</th>
                      <th className="py-3 px-4 text-left">Check-out</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((reservation) => (
                      <tr key={reservation.id} className="border-t">
                        <td className="py-3 px-4">
                          {reservation.guestName || 
                           (reservation.guest && typeof reservation.guest === 'object' 
                            ? (reservation.guest.fullName || reservation.guest.username) 
                            : 'Guest')}
                        </td>
                        <td className="py-3 px-4">
                          {(reservation.room && typeof reservation.room === 'object' && reservation.room.roomNumber) 
                            ? `${reservation.room.roomNumber} - ${reservation.room.type || ''}`
                            : (typeof reservation.roomId === 'object' && reservation.roomId)
                              ? `${(reservation.roomId as any).roomNumber || 'Room'} - ${(reservation.roomId as any).type || ''}`
                              : reservation.roomId || 'Room'}
                        </td>
                        <td className="py-3 px-4">{format(new Date(reservation.checkIn), 'MMM dd, yyyy')}</td>
                        <td className="py-3 px-4">{format(new Date(reservation.checkOut), 'MMM dd, yyyy')}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            reservation.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            reservation.status === 'checked-in' ? 'bg-green-100 text-green-800' :
                            reservation.status === 'checked-out' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {reservation.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button 
                              className="p-1 text-blue-600 hover:text-blue-800"
                              onClick={() => handleEditReservation(reservation)}
                            >
                              <Edit size={18} />
                            </button>
                            {reservation.status === 'confirmed' && (
                              <button 
                                className="p-1 text-green-600 hover:text-green-800"
                                onClick={() => handleCheckIn(reservation.id)}
                                disabled={loading}
                              >
                                <UserCheck size={18} />
                              </button>
                            )}
                            {reservation.status === 'checked-in' && (
                              <button 
                                className="p-1 text-orange-600 hover:text-orange-800"
                                onClick={() => handleCheckOut(reservation.id)}
                                disabled={loading}
                              >
                                <UserMinus size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {reservations.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          No reservations found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
        
      case 'check-in':
        return (
          <div>
            <h2 className="text-xl font-bold text-primary mb-4">Guest Check-in</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search by reservation number, guest name, or phone..."
                  className="input-field pl-10"
                />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="font-bold text-lg mb-4">Today's Expected Check-ins</h3>
              
              {loadingReservations ? (
                <div className="text-center py-6">
                  <Loader2 size={36} className="animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-gray-600">Loading check-ins...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-3 px-4 text-left">Guest</th>
                        <th className="py-3 px-4 text-left">Room</th>
                        <th className="py-3 px-4 text-left">Reservation #</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations
                        .filter(res => 
                          res.status === 'confirmed' && 
                          new Date(res.checkIn).toDateString() === new Date().toDateString()
                        )
                        .map(reservation => (
                          <tr key={reservation.id} className="border-t">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium">
                                  {reservation.guestName || reservation.guest?.fullName || reservation.guest?.username || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {reservation.phone || reservation.guest?.phone || 'No phone'}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {(reservation.room && typeof reservation.room === 'object' && reservation.room.roomNumber) 
                                ? `${reservation.room.roomNumber} - ${reservation.room.type || ''}`
                                : (typeof reservation.roomId === 'object' && reservation.roomId)
                                  ? `${(reservation.roomId as any).roomNumber || 'Room'} - ${(reservation.roomId as any).type || ''}`
                                  : reservation.roomId || 'Room'}
                            </td>
                            <td className="py-3 px-4">RES-{reservation.id.substring(0, 8)}</td>
                            <td className="py-3 px-4 text-center">
                              <button 
                                className="btn-primary text-sm"
                                onClick={() => handleCheckIn(reservation.id)}
                                disabled={loading}
                              >
                                Check In
                              </button>
                            </td>
                          </tr>
                        ))
                      }
                      {reservations.filter(res => 
                        res.status === 'confirmed' && 
                        new Date(res.checkIn).toDateString() === new Date().toDateString()
                      ).length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-500">
                            No check-ins scheduled for today.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'check-out':
        return (
          <div>
            <h2 className="text-xl font-bold text-primary mb-4">Guest Check-out</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search by room number, guest name, or phone..."
                  className="input-field pl-10"
                />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="font-bold text-lg mb-4">Today's Expected Check-outs</h3>
              
              {loadingReservations ? (
                <div className="text-center py-6">
                  <Loader2 size={36} className="animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-gray-600">Loading check-outs...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-3 px-4 text-left">Guest</th>
                        <th className="py-3 px-4 text-left">Room</th>
                        <th className="py-3 px-4 text-left">Check-in Date</th>
                        <th className="py-3 px-4 text-right">Balance</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations
                        .filter(res => 
                          res.status === 'checked-in' && 
                          new Date(res.checkOut).toDateString() === new Date().toDateString()
                        )
                        .map(reservation => (
                          <tr key={reservation.id} className="border-t">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium">
                                  {reservation.guestName || 
                                    (reservation.guest && typeof reservation.guest === 'object'
                                     ? (reservation.guest.fullName || reservation.guest.username) 
                                     : 'Guest')}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {reservation.phone || (reservation.guest?.phone || 'No phone')}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {(reservation.room && typeof reservation.room === 'object' && reservation.room.roomNumber) 
                                ? `${reservation.room.roomNumber} (${reservation.room.type || 'Standard'})`
                                : (typeof reservation.roomId === 'object' && reservation.roomId)
                                  ? `${(reservation.roomId as any).roomNumber || 'Room'} (${(reservation.roomId as any).type || 'Standard'})`
                                  : `Room ${reservation.roomId || ''}`}
                            </td>
                            <td className="py-3 px-4">{format(new Date(reservation.checkIn), 'MMM dd, yyyy')}</td>
                            <td className="py-3 px-4 text-right">₹{reservation.totalPrice}</td>
                            <td className="py-3 px-4 text-center">
                              <button 
                                className="btn-primary text-sm py-1"
                                onClick={() => handleCheckOut(reservation.id)}
                                disabled={loading}
                              >
                                Check Out
                              </button>
                            </td>
                          </tr>
                        ))}
                      {reservations.filter(res => 
                        res.status === 'checked-in' && 
                        new Date(res.checkOut).toDateString() === new Date().toDateString()
                      ).length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500">
                            No check-outs scheduled for today.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-lg mb-4">Manual Check-out</h3>
              
              {reservations.filter(res => res.status === 'checked-in').length === 0 && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                  No checked-in guests available for checkout. 
                  Please check-in guests first or verify reservation status.
                </div>
              )}
              
              <form className="space-y-4" onSubmit={handleManualCheckout}>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Room Number
                  </label>
                  <select 
                    className="input-field w-full md:w-1/3"
                    value={selectedCheckoutRoom}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      console.log('Selected room for checkout:', selectedId);
                      setSelectedCheckoutRoom(selectedId);
                      if (selectedId) {
                        updateCheckoutDetails(selectedId);
                      }
                    }}
                    required
                  >
                    <option value="">Select Room</option>
                    {reservations
                      .filter(res => res.status === 'checked-in')
                      .map(reservation => {
                        const roomNumber = reservation.room?.roomNumber || 
                          (typeof reservation.roomId === 'object' ? 
                            (reservation.roomId as any).roomNumber : 
                            `Room ${reservation.roomId?.toString().slice(-3) || ''}`);
                        
                        const guestName = reservation.guestName || 
                          (reservation.guest?.fullName || reservation.guest?.username || 'Guest');
                        
                        const optionText = `${roomNumber} - ${guestName}`;
                        console.log(`Rendering option: ${optionText} with ID: ${reservation.id}`);
                        
                        return (
                          <option key={reservation.id} value={reservation.id}>
                            {optionText}
                          </option>
                        );
                      })}
                  </select>
                  <p className="text-gray-500 text-sm mt-1">Total checked-in rooms: {reservations.filter(res => res.status === 'checked-in').length}</p>
                </div>
                
                {selectedCheckoutRoom && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Room Charges</h4>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span>Room Rate</span>
                        <span>₹{checkoutDetails.roomRate.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Room Service</span>
                        <span>₹{checkoutDetails.roomService.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mini Bar</span>
                        <span>₹{checkoutDetails.miniBar.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-2">
                        <span>Total</span>
                        <span>₹{checkoutDetails.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Payment Method
                  </label>
                  <select 
                    className="input-field w-full md:w-1/3"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  >
                    <option value="">Select Payment Method</option>
                    <option value="credit">Credit Card</option>
                    <option value="debit">Debit Card</option>
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
                
                <div>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={loading || !selectedCheckoutRoom || !paymentMethod}
                  >
                    {loading ? 'Processing...' : 'Complete Check-out'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
        
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header user={user} onLogout={onLogout} />
      <NavigationBar title="Receptionist Panel" />
      
      <main className="flex-grow bg-gray-100 p-4">
        <div className="container mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-primary">Receptionist Panel</h1>
            <p className="text-gray-600">Manage reservations, check-ins, and check-outs</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-white rounded-lg shadow-md p-4">
              <nav>
                <ul className="space-y-1">
                  <li>
                    <button
                      className={`w-full flex items-center gap-2 p-3 rounded-md transition-colors ${
                        activeTab === 'reservations' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setActiveTab('reservations')}
                    >
                      <Calendar size={20} />
                      <span>Reservations</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`w-full flex items-center gap-2 p-3 rounded-md transition-colors ${
                        activeTab === 'check-in' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setActiveTab('check-in')}
                    >
                      <UserCheck size={20} />
                      <span>Check-in</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`w-full flex items-center gap-2 p-3 rounded-md transition-colors ${
                        activeTab === 'check-out' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setActiveTab('check-out')}
                    >
                      <UserMinus size={20} />
                      <span>Check-out</span>
                    </button>
                  </li>
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
      
      {/* New Reservation Modal */}
      <dialog id="newReservationModal" className="modal bg-white rounded-lg p-6 shadow-xl max-w-md">
        <div className="modal-content">
          <h3 className="text-lg font-bold mb-4">New Reservation</h3>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleCreateReservation}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Guest Name</label>
              <input
                type="text"
                className="input-field"
                value={newReservation.guestName}
                onChange={(e) => setNewReservation({ ...newReservation, guestName: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                className="input-field"
                value={newReservation.phone}
                onChange={(e) => setNewReservation({ ...newReservation, phone: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Room Type</label>
              <select
                className="input-field"
                value={newReservation.roomType}
                onChange={(e) => setNewReservation({ ...newReservation, roomType: e.target.value })}
                required
              >
                <option value="Standard">Standard</option>
                <option value="Deluxe">Deluxe</option>
                <option value="Suite">Suite</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Room</label>
              <select
                className="input-field"
                value={newReservation.roomNumber}
                onChange={(e) => {
                  const selectedRoomId = e.target.value;
                  const selectedIndex = e.target.selectedIndex;
                  const selectedText = e.target.options[selectedIndex].text;
                  
                  console.log('Debug room selection:');
                  console.log('- Selected room value:', selectedRoomId);
                  console.log('- Selected room text:', selectedText);
                  console.log('- Selected option index:', selectedIndex);
                  console.log('- Is valid MongoDB ID?', /^[0-9a-fA-F]{24}$/.test(selectedRoomId));
                  
                  // If it appears the value might be the display text instead of ID, try to find the room
                  if (selectedRoomId && !isValidMongoId(selectedRoomId)) {
                    console.error('⚠️ Invalid MongoDB ID format detected in selection!');
                    
                    // Check if we can find the room by using the text
                    const foundRoom = availableRooms.find(room => 
                      `${room.roomNumber} - ${room.type} (₹${room.basePrice}/night)` === selectedRoomId
                    );
                    
                    if (foundRoom) {
                      console.log('Found room by display text:', foundRoom);
                      // Use the correct ID - check both id and _id properties
                      const correctId = getRoomId(foundRoom);
                      console.log('Using correct room ID:', correctId);
                      
                      // Update room number using correct ID
                      setNewReservation({ ...newReservation, roomNumber: correctId });
                      
                      // Calculate price immediately
                      if (correctId && newReservation.checkIn && newReservation.checkOut) {
                        const checkIn = new Date(newReservation.checkIn);
                        const checkOut = new Date(newReservation.checkOut);
                        const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
                        const calculatedPrice = foundRoom.basePrice * nights;
                        
                        console.log(`Immediate price calculation: ${nights} nights at ₹${foundRoom.basePrice}/night = ₹${calculatedPrice}`);
                        setNewReservation(prev => ({ ...prev, roomNumber: correctId, totalPrice: calculatedPrice }));
                      }
                      return; // Exit early since we've handled it
                    }
                  }
                  
                  // Update the room number in state with the selected value
                  setNewReservation({ ...newReservation, roomNumber: selectedRoomId });
                  
                  // Calculate price immediately if dates are selected
                  if (selectedRoomId && newReservation.checkIn && newReservation.checkOut) {
                    const selectedRoom = availableRooms.find(room => getRoomId(room) === selectedRoomId);
                    if (selectedRoom) {
                      const checkIn = new Date(newReservation.checkIn);
                      const checkOut = new Date(newReservation.checkOut);
                      const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
                      const calculatedPrice = selectedRoom.basePrice * nights;
                      
                      console.log(`Immediate price calculation: ${nights} nights at ₹${selectedRoom.basePrice}/night = ₹${calculatedPrice}`);
                      setNewReservation(prev => ({ ...prev, roomNumber: selectedRoomId, totalPrice: calculatedPrice }));
                    }
                  }
                }}
                autoComplete="off"
                required
              >
                <option value="">Select a Room</option>
                {availableRooms
                  .filter(room => !newReservation.roomType || room.type === newReservation.roomType)
                  .map(room => (
                    <option key={getRoomId(room)} value={getRoomId(room)}>
                      {room.roomNumber} - {room.type} (₹{room.basePrice}/night)
                    </option>
                  ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Check-in Date</label>
              <input
                type="date"
                className="input-field"
                value={newReservation.checkIn}
                onChange={(e) => {
                  const newCheckIn = e.target.value;
                  
                  // Update check-in date
                  setNewReservation({ ...newReservation, checkIn: newCheckIn });
                  
                  // Calculate price immediately if all required data is available
                  if (newReservation.roomNumber && newCheckIn && newReservation.checkOut) {
                    const selectedRoom = availableRooms.find(room => getRoomId(room) === newReservation.roomNumber);
                    if (selectedRoom) {
                      const checkIn = new Date(newCheckIn);
                      const checkOut = new Date(newReservation.checkOut);
                      const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
                      const calculatedPrice = selectedRoom.basePrice * nights;
                      
                      console.log(`Check-in date price calculation: ${nights} nights at ₹${selectedRoom.basePrice}/night = ₹${calculatedPrice}`);
                      setNewReservation(prev => ({ ...prev, checkIn: newCheckIn, totalPrice: calculatedPrice }));
                    }
                  }
                }}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Check-out Date</label>
              <input
                type="date"
                className="input-field"
                value={newReservation.checkOut}
                onChange={(e) => {
                  const newCheckOut = e.target.value;
                  
                  // Update check-out date
                  setNewReservation({ ...newReservation, checkOut: newCheckOut });
                  
                  // Calculate price immediately if all required data is available
                  if (newReservation.roomNumber && newReservation.checkIn && newCheckOut) {
                    const selectedRoom = availableRooms.find(room => getRoomId(room) === newReservation.roomNumber);
                    if (selectedRoom) {
                      const checkIn = new Date(newReservation.checkIn);
                      const checkOut = new Date(newCheckOut);
                      const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
                      const calculatedPrice = selectedRoom.basePrice * nights;
                      
                      console.log(`Check-out date price calculation: ${nights} nights at ₹${selectedRoom.basePrice}/night = ₹${calculatedPrice}`);
                      setNewReservation(prev => ({ ...prev, checkOut: newCheckOut, totalPrice: calculatedPrice }));
                    }
                  }
                }}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Number of Guests</label>
              <input
                type="number"
                min="1"
                className="input-field"
                value={newReservation.guests}
                onChange={(e) => setNewReservation({ ...newReservation, guests: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Total Price</label>
              <div className="input-field bg-gray-100 flex items-center">
                <span className="font-medium text-gray-800">
                  ₹{newReservation.totalPrice ? newReservation.totalPrice.toLocaleString() : '0'}
                </span>
              </div>
              {newReservation.checkIn && newReservation.checkOut && newReservation.roomNumber && (
                <p className="text-sm text-gray-600 mt-1">
                  {(() => {
                    const checkIn = new Date(newReservation.checkIn);
                    const checkOut = new Date(newReservation.checkOut);
                    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
                    return `${nights} night${nights > 1 ? 's' : ''}`;
                  })()}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  const modalForm = document.getElementById('newReservationModal');
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
                {loading ? 'Creating...' : 'Create Reservation'}
              </button>
            </div>
          </form>
        </div>
      </dialog>
      
      {/* Edit Reservation Modal */}
      <dialog id="editReservationModal" className="modal bg-white rounded-lg p-6 shadow-xl max-w-md">
        <div className="modal-content">
          <h3 className="text-lg font-bold mb-4">Edit Reservation</h3>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          {editingReservation && (
            <form onSubmit={handleUpdateReservation}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Guest Name</label>
                <input
                  type="text"
                  className="input-field bg-gray-100"
                  value={editingReservation.guestName || editingReservation.guest?.fullName || editingReservation.guest?.username || 'N/A'}
                  readOnly
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Room</label>
                <input
                  type="text"
                  className="input-field bg-gray-100"
                  value={
                    (editingReservation.room && typeof editingReservation.room === 'object' && editingReservation.room.roomNumber) 
                      ? `${editingReservation.room.roomNumber} - ${editingReservation.room.type || ''}`
                      : (typeof editingReservation.roomId === 'object' && editingReservation.roomId)
                        ? `${(editingReservation.roomId as any).roomNumber || 'Room'} - ${(editingReservation.roomId as any).type || ''}`
                        : editingReservation.roomId || 'Room'
                  }
                  readOnly
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Check-in Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={editingReservation.checkIn.split('T')[0]}
                  onChange={(e) => setEditingReservation({ 
                    ...editingReservation, 
                    checkIn: e.target.value 
                  })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Check-out Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={editingReservation.checkOut.split('T')[0]}
                  onChange={(e) => setEditingReservation({ 
                    ...editingReservation, 
                    checkOut: e.target.value 
                  })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    const modalForm = document.getElementById('editReservationModal');
                    if (modalForm) {
                      (modalForm as HTMLDialogElement).close();
                    }
                    setEditingReservation(null);
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
                  {loading ? 'Updating...' : 'Update Reservation'}
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </div>
  );
};

export default ReceptionistPanel;