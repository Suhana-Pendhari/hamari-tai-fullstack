
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiStar, FiDollarSign, FiClock, FiShield, FiMapPin, FiMessageCircle, FiCalendar } from 'react-icons/fi';

const MaidProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [maid, setMaid] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    serviceType: '',
    date: '',
    startTime: '',
    endTime: '',
    address: user?.location?.address || '',
    notes: ''
  });

  useEffect(() => {
    fetchMaidProfile();
    fetchReviews();
  }, [id]);

  const fetchMaidProfile = async () => {
    try {
      const response = await axios.get(`/api/maids/${id}`);
      setMaid(response.data);
    } catch (error) {
      console.error('Fetch maid error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`/api/reviews/maid/${id}`);
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Fetch reviews error:', error);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/bookings', {
        maid: id,
        ...bookingData,
        location: {
          lat: user?.location?.coordinates?.[1] || 0,
          lng: user?.location?.coordinates?.[0] || 0
        }
      });
      alert('Booking request sent successfully!');
      setShowBookingForm(false);
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create booking');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-cream-100 to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!maid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-cream-100 to-gray-50 py-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Maid Not Found</h2>
          <Link to="/search" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-semibold">
            Search Maids
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-cream-100 to-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
            <div className="w-24 h-24 lg:w-28 lg:h-28 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0">
              {maid.photo ? (
                <img src={`http://localhost:5000/${maid.photo}`} alt={maid.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span className="text-2xl font-bold text-orange-600">{maid.name.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{maid.name}</h1>
              <p className="text-lg text-gray-600 mb-4">{maid.age} years old</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {maid.skills.map(skill => (
                  <span key={skill} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-xl text-sm font-medium">
                    {skill.replace('_', ' ')}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm mb-6">
                <span className="flex items-center">
                  <FiStar className="text-yellow-500 mr-2" />
                  {maid.rating.average.toFixed(1)} ({maid.rating.count})
                </span>
                <span className="flex items-center">
                  <FiDollarSign className="text-orange-500 mr-2" />
                  ₹{maid.salaryExpectation}/month
                </span>
                <span className="flex items-center">
                  <FiClock className="text-orange-500 mr-2" />
                  {maid.experience} years exp
                </span>
                <span className={`px-3 py-1 rounded-xl font-medium ${
                  maid.trustScore.status === 'Trusted' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  <FiShield className="mr-1 inline" />
                  {maid.trustScore.status}
                </span>
              </div>

              {maid.location?.address && (
                <p className="text-lg text-gray-700 flex items-center">
                  <FiMapPin className="mr-2 text-orange-500" />
                  {maid.location.address}
                </p>
              )}
              {maid.bio && (
                <p className="text-gray-700 mt-4 leading-relaxed">{maid.bio}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Availability */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Availability</h2>
              {maid.availability ? (
                <div className="space-y-2 text-gray-700">
                  <p>Days: {maid.availability.days?.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ') || 'Flexible'}</p>
                  <p>Time: {maid.availability.startTime} - {maid.availability.endTime}</p>
                </div>
              ) : (
                <p className="text-gray-600">Availability not specified</p>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Reviews ({reviews.length})
              </h2>
              {reviews.length === 0 ? (
                <p className="text-gray-600">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {reviews.slice(0, 5).map(review => (
                    <div key={review._id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="font-semibold text-gray-900">{review.user?.name || 'Anonymous'}</span>
                          <div className="ml-3 flex">
                            {[...Array(5)].map((_, i) => (
                              <FiStar
                                key={i}
                                className={`w-5 h-5 ${
                                  i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 text-sm">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {user?.role === 'user' && (
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Book Now</h2>
                
                {!showBookingForm ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowBookingForm(true)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 px-6 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                    >
                      <FiCalendar className="mr-2" />
                      Request Booking
                    </button>
                    <button
                      onClick={() => navigate(`/chat?user=${maid.user?._id || maid.user?.id}`)}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-medium transition-all flex items-center justify-center"
                    >
                      <FiMessageCircle className="mr-2" />
                      Send Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                      <select
                        required
                        value={bookingData.serviceType}
                        onChange={(e) => setBookingData({ ...bookingData, serviceType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Select service</option>
                        {maid.skills.map(skill => (
                          <option key={skill} value={skill}>
                            {skill.charAt(0).toUpperCase() + skill.slice(1).replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={bookingData.date}
                        onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <input
                          type="time"
                          required
                          value={bookingData.startTime}
                          onChange={(e) => setBookingData({ ...bookingData, startTime: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                        <input
                          type="time"
                          required
                          value={bookingData.endTime}
                          onChange={(e) => setBookingData({ ...bookingData, endTime: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <input
                        type="text"
                        required
                        value={bookingData.address}
                        onChange={(e) => setBookingData({ ...bookingData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                      <textarea
                        value={bookingData.notes}
                        onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        rows="3"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                      >
                        Send Request
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowBookingForm(false)}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-xl font-semibold transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaidProfile;
