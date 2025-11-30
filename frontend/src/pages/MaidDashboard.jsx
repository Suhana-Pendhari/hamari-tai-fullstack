
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiEdit, FiShield, FiStar, FiMessageCircle } from 'react-icons/fi';

const MaidDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [maid, setMaid] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMaidProfile();
    fetchBookings();
  }, [filter]);

  const fetchMaidProfile = async () => {
    try {
      const response = await axios.get('/api/maids/profile');
      setMaid(response.data);
    } catch (error) {
      console.error('Fetch maid profile error:', error);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await axios.get('/api/bookings', { params });
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Fetch bookings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await axios.put(`/api/bookings/${bookingId}/status`, { status });
      fetchBookings();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const updateActiveStatus = async (isActive) => {
    try {
      await axios.put('/api/maids/status', { isActive });
      fetchMaidProfile();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading && !maid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-cream-100 to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!maid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-cream-100 to-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xl text-gray-700 mb-8">You haven't created your maid profile yet.</p>
          <Link
            to="/maid-register"
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold"
          >
            Create Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-cream-100 to-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Maid Dashboard</h1>
          <button
            onClick={() => navigate('/maid-register?edit=true')}
            className="flex items-center text-orange-600 hover:text-orange-700 font-medium px-4 py-2 rounded-lg hover:bg-orange-50"
          >
            <FiEdit className="mr-2" />
            Edit Profile
          </button>
        </div>

        {/* Profile Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-start space-x-6">
            <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center">
              {maid.photo ? (
                <img src={`http://localhost:5000/${maid.photo}`} alt={maid.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span className="text-2xl font-bold text-orange-600">{maid.name.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">{maid.name}</h2>
              <div className="flex flex-wrap gap-4 text-sm mb-4">
                <span className="flex items-center">
                  <FiStar className="mr-1 text-yellow-500" />
                  {maid.rating.average.toFixed(1)} ({maid.rating.count})
                </span>
                <span className="flex items-center">
                  <FiShield className={`mr-1 ${maid.trustScore.status === 'Trusted' ? 'text-green-500' : 'text-blue-500'}`} />
                  {maid.trustScore.status}
                </span>
                <span className={`font-semibold ${
                  maid.verificationStatus === 'verified' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {maid.verificationStatus}
                </span>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={maid.isActive}
                  onChange={(e) => updateActiveStatus(e.target.checked)}
                  className="mr-2 w-4 h-4 text-orange-600 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Available for work</span>
              </label>
            </div>
          </div>
        </div>

        {/* Bookings */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Job Requests</h2>
        <div className="mb-6 flex space-x-2 flex-wrap gap-2">
          {['all', 'pending', 'accepted', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === status
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-md p-8 border border-gray-100">
            <p className="text-lg text-gray-600">No job requests found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <div key={booking._id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">{booking.user?.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        booking.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        booking.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="flex items-center mb-1">
                          <FiCalendar className="mr-2 text-orange-500" />
                          {new Date(booking.date).toLocaleDateString()}
                        </p>
                        <p className="flex items-center">
                          <FiClock className="mr-2 text-orange-500" />
                          {booking.startTime} - {booking.endTime}
                        </p>
                      </div>
                      <div>
                        <p>Service: <span className="font-semibold text-orange-600">{booking.serviceType}</span></p>
                        <p>Amount: <span className="text-xl font-bold text-orange-600">₹{booking.amount}</span></p>
                      </div>
                    </div>
                    {booking.address && <p className="text-sm text-gray-600 mt-2">📍 {booking.address}</p>}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                      to={`/chat?user=${booking.user?._id || booking.user?.id}`}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium flex items-center transition-all"
                    >
                      <FiMessageCircle className="mr-1" />
                      Chat
                    </Link>
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateBookingStatus(booking._id, 'accepted')}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium flex items-center"
                        >
                          <FiCheckCircle className="mr-1" />
                          Accept
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking._id, 'rejected')}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium flex items-center"
                        >
                          <FiXCircle className="mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                    {booking.status === 'accepted' && (
                      <button
                        onClick={() => updateBookingStatus(booking._id, 'completed')}
                        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium flex items-center"
                      >
                        <FiCheckCircle className="mr-1" />
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MaidDashboard;
