
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiSearch, FiUser, FiLogOut, FiMessageCircle, FiShield } from 'react-icons/fi';
import Logo from './Logo';

const Navbar = () => {
  const { isAuthenticated, user, logout, isAdmin, isMaid } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Logo size="md" />
          </div>

          <div className="flex items-center space-x-1 md:space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl text-sm font-medium transition-all duration-200"
                >
                  <FiHome className="mr-1.5 text-lg" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
                
                {user?.role === 'user' && (
                  <>
                    <Link
                      to="/search"
                      className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl text-sm font-medium transition-all duration-200"
                    >
                      <FiSearch className="mr-1.5 text-lg" />
                      <span className="hidden sm:inline">Search</span>
                    </Link>
                    <Link
                      to="/dashboard"
                      className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl text-sm font-medium transition-all duration-200"
                    >
                      <FiUser className="mr-1.5 text-lg" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                    <Link
                      to="/chat"
                      className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl text-sm font-medium transition-all duration-200"
                    >
                      <FiMessageCircle className="mr-1.5 text-lg" />
                      <span className="hidden sm:inline">Messages</span>
                    </Link>
                  </>
                )}
                
                {isMaid && (
                  <>
                    <Link
                      to="/maid-dashboard"
                      className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl text-sm font-medium transition-all duration-200"
                    >
                      <FiUser className="mr-1.5 text-lg" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                    <Link
                      to="/chat"
                      className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl text-sm font-medium transition-all duration-200"
                    >
                      <FiMessageCircle className="mr-1.5 text-lg" />
                      <span className="hidden sm:inline">Messages</span>
                    </Link>
                  </>
                )}
                
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl text-sm font-medium transition-all duration-200"
                  >
                    <FiShield className="mr-1.5 text-lg" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
                
                <div className="flex items-center space-x-2 ml-2 md:ml-4 bg-gray-50 px-3 py-2 rounded-xl border">
                  <span className="text-xs md:text-sm text-gray-700 truncate max-w-24 md:max-w-32">{user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all duration-200"
                    title="Logout"
                  >
                    <FiLogOut className="text-lg" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl text-sm font-medium transition-all duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
