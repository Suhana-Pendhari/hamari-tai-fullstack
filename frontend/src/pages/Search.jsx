
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiMapPin, FiStar, FiDollarSign, FiClock, FiShield, FiSearch, FiFilter } from 'react-icons/fi';

const Search = () => {
  const { user } = useAuth();
  const [maids, setMaids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    lat: user?.location?.coordinates?.[1] || 28.6139,
    lng: user?.location?.coordinates?.[0] || 77.2090,
    maxDistance: 10,
    skills: [],
    minExperience: 0,
    minSalary: '',
    maxSalary: '',
    minRating: 0,
    sortBy: 'recommendation'
  });

  useEffect(() => {
    if (user?.location?.coordinates) {
      setFilters(prev => ({
        ...prev,
        lat: user.location.coordinates[1],
        lng: user.location.coordinates[0]
      }));
    }
  }, [user]);

  useEffect(() => {
    if (filters.lat && filters.lng) {
      searchMaids();
    }
  }, []);

  const searchMaids = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('lat', filters.lat);
      params.append('lng', filters.lng);
      params.append('maxDistance', filters.maxDistance);
      if (filters.skills.length > 0) {
        filters.skills.forEach(skill => params.append('skills', skill));
      }
      params.append('minExperience', filters.minExperience);
      if (filters.minSalary) params.append('minSalary', filters.minSalary);
      if (filters.maxSalary) params.append('maxSalary', filters.maxSalary);
      params.append('minRating', filters.minRating);
      params.append('sortBy', filters.sortBy);

      const response = await axios.get(`/api/search/maids?${params.toString()}`);
      setMaids(response.data.maids || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFilters(prev => ({
        ...prev,
        skills: checked
          ? [...prev.skills, value]
          : prev.skills.filter(s => s !== value)
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value
      }));
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFilters(prev => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
        },
        (error) => {
          alert('Unable to get location');
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-cream-100 to-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Find Maids</h1>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FiFilter className="mr-2 text-orange-500" />
                Filters
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FiMapPin className="mr-1 text-orange-500" />
                    Location
                  </label>
                  <button
                    onClick={handleGetLocation}
                    className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium mb-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 transition-all"
                  >
                    📍 Use Current Location
                  </button>
                  <input
                    type="number"
                    step="any"
                    name="lat"
                    placeholder="Latitude"
                    value={filters.lat}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2"
                  />
                  <input
                    type="number"
                    step="any"
                    name="lng"
                    placeholder="Longitude"
                    value={filters.lng}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Distance (km)</label>
                  <input
                    type="number"
                    name="maxDistance"
                    value={filters.maxDistance}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                  {['cleaning', 'cooking', 'babysitting', 'elderly_care'].map(skill => (
                    <label key={skill} className="flex items-center mb-2 cursor-pointer">
                      <input
                        type="checkbox"
                        value={skill}
                        checked={filters.skills.includes(skill)}
                        onChange={handleFilterChange}
                        className="mr-2 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">{skill.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Experience (years)</label>
                  <input
                    type="number"
                    name="minExperience"
                    value={filters.minExperience}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range (₹)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      name="minSalary"
                      placeholder="Min"
                      value={filters.minSalary}
                      onChange={handleFilterChange}
                      className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      type="number"
                      name="maxSalary"
                      placeholder="Max"
                      value={filters.maxSalary}
                      onChange={handleFilterChange}
                      className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    name="minRating"
                    value={filters.minRating}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700"
                  >
                    <option value="recommendation">Recommendation</option>
                    <option value="rating">Rating</option>
                    <option value="salary">Salary</option>
                    <option value="distance">Distance</option>
                  </select>
                </div>

                <button
                  onClick={searchMaids}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                >
                  <FiSearch className="mr-2" />
                  Search Maids
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              </div>
            ) : maids.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-md p-12 border border-gray-100">
                <FiSearch className="text-6xl text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-700 mb-2">No Maids Found</h3>
                <p className="text-lg text-gray-600 mb-8">Try adjusting your filters</p>
              </div>
            ) : (
              <div>
                <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100 mb-6">
                  <p className="text-lg font-semibold text-gray-900">
                    Found <span className="text-orange-600">{maids.length}</span> maids
                  </p>
                </div>
                <div className="space-y-4">
                  {maids.map((maid) => (
                    <Link
                      key={maid._id}
                      to={`/maid/${maid._id}`}
                      className="block bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100 hover:border-orange-200"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0">
                          {maid.photo ? (
                            <img src={`http://localhost:5000/${maid.photo}`} alt={maid.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <span className="text-xl font-bold text-orange-600">{maid.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 truncate">{maid.name}</h3>
                              <p className="text-sm text-gray-600">{maid.age} years old</p>
                            </div>
                            {maid.recommendationScore && (
                              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold ml-2">
                                {maid.recommendationScore.toFixed(1)}% Match
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {maid.skills && maid.skills.slice(0, 3).map(skill => (
                              <span key={skill} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-xl text-xs font-medium">
                                {skill.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm mb-3">
                            <span className="flex items-center">
                              <FiStar className="text-yellow-500 mr-1" />
                              {maid.rating?.average?.toFixed(1) || '0.0'}
                            </span>
                            <span className="flex items-center">
                              <FiDollarSign className="text-orange-500 mr-1" />
                              ₹{maid.salaryExpectation}/month
                            </span>
                            <span className="flex items-center">
                              <FiClock className="text-orange-500 mr-1" />
                              {maid.experience} yrs
                            </span>
                            <span className={`flex items-center px-2 py-1 rounded text-xs ${
                              maid.trustScore?.status === 'Trusted' ? 'bg-green-100 text-green-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              <FiShield className="mr-1" />
                              {maid.trustScore?.status || 'Verified'}
                            </span>
                          </div>
                          {maid.location?.address && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <FiMapPin className="mr-1 text-orange-500" />
                              {maid.location.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
            </div>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
