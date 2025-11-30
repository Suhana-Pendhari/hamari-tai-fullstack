
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiShield, FiCheckCircle, FiXCircle, FiUsers, FiUserCheck, FiRefreshCw, FiEye } from 'react-icons/fi';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingMaids, setPendingMaids] = useState([]);
  const [allMaids, setAllMaids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllMaids, setShowAllMaids] = useState(false);
  const [maidFilter, setMaidFilter] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (showAllMaids) {
      fetchAllMaids();
    }
  }, [showAllMaids, maidFilter]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, maidsRes] = await Promise.all([
        axios.get('/api/admin/dashboard'),
        axios.get('/api/admin/maids/pending')
      ]);
      setStats(statsRes.data.stats);
      setPendingMaids(maidsRes.data.maids || []);
    } catch (error) {
      console.error('Fetch dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMaids = async () => {
    try {
      const params = maidFilter !== 'all' ? { status: maidFilter } : {};
      const response = await axios.get('/api/admin/maids', { params });
      setAllMaids(response.data.maids || []);
    } catch (error) {
      console.error('Fetch all maids error:', error);
    }
  };

  const verifyMaid = async (maidId, status) => {
    try {
      await axios.put(`/api/admin/maids/${maidId}/verify`, { verificationStatus: status });
      fetchDashboardData();
      if (showAllMaids) {
        fetchAllMaids();
      }
      alert(`Maid ${status} successfully`);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to verify maid');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-cream-100 to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-cream-100 to-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Stats Cards */}
        {stats && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <FiUsers className="text-4xl text-orange-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Maids</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalMaids}</p>
                </div>
                <FiUserCheck className="text-4xl text-orange-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending Verifications</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.pendingVerifications}</p>
                </div>
                <FiShield className="text-4xl text-orange-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Bookings</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeBookings}</p>
                </div>
                <FiCheckCircle className="text-4xl text-orange-500" />
              </div>
            </div>
          </div>
        )}

        {/* Pending Verifications */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-semibold text-gray-900">Pending Verifications</h2>
            <button
              onClick={() => {
                setShowAllMaids(!showAllMaids);
                if (!showAllMaids) {
                  fetchAllMaids();
                }
              }}
              className="flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <FiEye className="mr-2" />
              {showAllMaids ? 'Hide All Maids' : 'View All Maids'}
            </button>
          </div>
          
          {pendingMaids.length === 0 ? (
            <div className="text-center py-12">
              <FiShield className="text-6xl text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600">No pending verifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingMaids.map(maid => (
                <div key={maid._id} className="bg-gray-50 border border-orange-200 rounded-xl p-6 hover:shadow-md transition-all">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{maid.name}</h3>
                      <p className="text-gray-600 mb-3">{maid.age} years old</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {maid.skills && maid.skills.map(skill => (
                          <span key={skill} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-xl text-sm font-medium">
                            {skill.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                      <div className="space-y-1 text-sm text-gray-700">
                        <p><strong>Aadhaar:</strong> {maid.documents?.aadhaar?.number || 'Not extracted'}</p>
                        <p><strong>PAN:</strong> {maid.documents?.pan?.number || 'Not extracted'}</p>
                        <p className="text-xs">Created: {new Date(maid.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => verifyMaid(maid._id, 'verified')}
                        className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center"
                      >
                        <FiCheckCircle className="mr-2" />
                        Verify
                      </button>
                      <button
                        onClick={() => verifyMaid(maid._id, 'rejected')}
                        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center"
                      >
                        <FiXCircle className="mr-2" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Maids Section */}
        {showAllMaids && (
          <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
              <h2 className="text-2xl font-semibold text-gray-900">All Maids</h2>
              <div className="flex gap-3">
                <select
                  value={maidFilter}
                  onChange={(e) => setMaidFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={fetchAllMaids}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center"
                >
                  <FiRefreshCw className="mr-2" />
                  Refresh
                </button>
              </div>
            </div>
            
            {allMaids.length === 0 ? (
              <div className="text-center py-12">
                <FiUsers className="text-6xl text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600">No maids found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allMaids.map(maid => (
                  <div key={maid._id} className={`border rounded-xl p-6 hover:shadow-md transition-all ${
                    maid.verificationStatus === 'verified' ? 'border-green-200 bg-green-50/50' :
                    maid.verificationStatus === 'pending' ? 'border-orange-200 bg-orange-50/50' :
                    'border-red-200 bg-red-50/50'
                  }`}>
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{maid.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            maid.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                            maid.verificationStatus === 'pending' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {maid.verificationStatus.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{maid.age} years old</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {maid.skills && maid.skills.slice(0, 4).map(skill => (
                            <span key={skill} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-xl text-sm">
                              {skill.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                        <div className="text-sm text-gray-700 space-y-1">
                          <p><strong>Email:</strong> {maid.user?.email || 'N/A'}</p>
                          <p><strong>Phone:</strong> {maid.user?.phone || 'N/A'}</p>
                          <p className="text-xs">Created: {new Date(maid.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {maid.verificationStatus === 'pending' && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => verifyMaid(maid._id, 'verified')}
                            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center"
                          >
                            <FiCheckCircle className="mr-2" />
                            Verify
                          </button>
                          <button
                            onClick={() => verifyMaid(maid._id, 'rejected')}
                            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center"
                          >
                            <FiXCircle className="mr-2" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
