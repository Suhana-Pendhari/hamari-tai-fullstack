import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';

const Booking = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const response = await axios.get(`/api/bookings/${id}`);
      setBooking(response.data);
    } catch (error) {
      console.error('Fetch booking error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!booking) {
    return <div className="text-center py-12">Booking not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6 text-black">Booking Details</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">{booking.maid?.name}</h2>
            <p className="text-black">{booking.user?.name}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center text-black">
              <FiCalendar className="mr-2" />
              {new Date(booking.date).toLocaleDateString()}
            </div>
            <div className="flex items-center text-black">
              <FiClock className="mr-2" />
              {booking.startTime} - {booking.endTime}
            </div>
            <div className="flex items-center text-black">
              <FiMapPin className="mr-2" />
              {booking.address}
            </div>
            <div>
              <span className="text-black">Service: </span>
              <span className="font-semibold capitalize">{booking.serviceType}</span>
            </div>
          </div>
          <div>
            <span className="text-black">Amount: </span>
            <span className="font-semibold text-lg">₹{booking.amount}</span>
          </div>
          <div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              booking.status === 'accepted' ? 'bg-green-100 text-green-700' :
              booking.status === 'rejected' ? 'bg-red-100 text-red-700' :
              booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {booking.status}
            </span>
          </div>
          {booking.notes && (
            <div>
              <p className="text-black mb-1">Notes:</p>
              <p className="text-black">{booking.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;

