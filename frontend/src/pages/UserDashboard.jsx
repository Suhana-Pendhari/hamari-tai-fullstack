
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiMessageCircle, FiStar } from 'react-icons/fi';

const UserDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showReviewForm, setShowReviewForm] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 0, comment: '' });

  useEffect(() => {
    fetchBookings();
  }, [filter]);

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleReviewSubmit = async (bookingId, maidId) => {
    if (reviewData.rating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      await axios.post('/api/reviews', {
        maid: maidId,
        booking: bookingId,
        rating: reviewData.rating,
        comment: reviewData.comment
      });
      alert('Review submitted successfully!');
      setShowReviewForm(null);
      setReviewData({ rating: 0, comment: '' });
      fetchBookings(); // Refresh bookings
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit review');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-cream-100 to-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
        </div>

        {/* Filter Buttons */}
        <div className="mb-8 flex space-x-2 flex-wrap gap-2">
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
          <div className="text-center py-20 bg-white rounded-2xl shadow-md p-12 border border-gray-100">
            <FiCalendar className="text-6xl text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No Bookings Found</h3>
            <p className="text-lg text-gray-600 mb-6">Start booking maids for your home.</p>
            <Link
              to="/search"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold inline-flex items-center"
            >
              Find Maids Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <div key={booking._id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">{booking.maid?.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
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
                    {booking.address && (
                      <p className="text-sm text-gray-600 mt-2">📍 {booking.address}</p>
                    )}
                    {booking.notes && (
                      <p className="text-sm text-gray-600 mt-2">💬 {booking.notes}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 min-w-fit">
                    <Link
                      to={`/maid/${booking.maid?._id}`}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium flex items-center transition-all"
                    >
                      View Profile
                    </Link>
                    <Link
                      to={`/chat?user=${booking.maid?.user?._id || booking.maid?.user?.id}`}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium flex items-center transition-all"
                    >
                      <FiMessageCircle className="mr-1" />
                      Chat
                    </Link>
                    {booking.status === 'completed' && !booking.hasReview && (
                      <button
                        onClick={() => {
                          setShowReviewForm(booking._id);
                          setReviewData({ rating: 0, comment: '' });
                        }}
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-sm font-medium flex items-center transition-all"
                      >
                        <FiStar className="mr-1" />
                        Review
                      </button>
                    )}
                  </div>
                  {showReviewForm === booking._id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Leave a Review</h4>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewData({ ...reviewData, rating: star })}
                              className="focus:outline-none"
                            >
                              <FiStar
                                className={`w-6 h-6 ${
                                  star <= reviewData.rating
                                    ? 'text-yellow-500 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Comment (optional)</label>
                        <textarea
                          value={reviewData.comment}
                          onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          rows="3"
                          placeholder="Share your experience..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReviewSubmit(booking._id, booking.maid?._id)}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium"
                        >
                          Submit Review
                        </button>
                        <button
                          onClick={() => {
                            setShowReviewForm(null);
                            setReviewData({ rating: 0, comment: '' });
                          }}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
