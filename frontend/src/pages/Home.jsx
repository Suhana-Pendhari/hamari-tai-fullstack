import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiShield, FiStar, FiMapPin, FiCheckCircle, FiUser } from 'react-icons/fi';
import Logo from '../components/Logo';

const Home = () => {
  const { isAuthenticated, isMaid } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-cream-50 to-white">
      {/* Hero Section - Reduced Height */}
      <div
        className="relative bg-cover bg-center bg-no-repeat py-20 lg:py-24"
        style={{
          backgroundImage: "url('https://img.freepik.com/free-photo/digital-art-8m-women-strike-movement_23-2151356201.jpg')"
        }}
      >
        {/* Lighter overlay - Image now visible */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800/60 via-gray-900/40 to-gray-800/60"></div>

        {/* Subtle orange accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400/15 via-transparent to-orange-500/10"></div>

        {/* Light vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white drop-shadow-2xl">
            हमारी ताई
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl mb-6 text-orange-100 font-semibold drop-shadow-xl">
            हर एक घर में हमारी ताई
            </p>
            <p className="text-lg md:text-xl mb-8 text-white drop-shadow-xl leading-relaxed">
              Connect with verified domestic workers. AI-powered matching and secure communication.
            </p>

            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300"
                >
                  Login
                </Link>
              </div>
            ) : (
              isMaid ? (
                <Link
                  to="/maid-dashboard"
                  className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 inline-flex items-center"
                >
                  <FiUser className="mr-2 text-xl" />
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  to="/search"
                  className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 inline-flex items-center"
                >
                  <FiSearch className="mr-2 text-xl" />
                  Find a Maid
                </Link>
              )
            )}
          </div>
        </div>
      </div>


      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Why Choose Us?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Trusted service for thousands of families
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
            <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FiShield className="text-3xl text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 text-center">Verified Maids</h3>
            <p className="text-gray-700 text-center leading-relaxed">
              AI-powered document verification and trust scoring
            </p>
          </div>

          <div className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
            <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FiStar className="text-3xl text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 text-center">Smart Matching</h3>
            <p className="text-gray-700 text-center leading-relaxed">
              Perfect matches based on location and skills
            </p>
          </div>

          <div className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FiMapPin className="text-3xl text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 text-center">Nearby Search</h3>
            <p className="text-gray-700 text-center leading-relaxed">
              Find maids in your local area quickly
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section - ADDED BACK */}
      <div className="bg-gradient-to-r from-cream-50 to-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">How It Works</h2>
            <p className="text-xl text-gray-600">Simple 4-step process</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: 1, title: 'Register', desc: 'Create your account' },
              { num: 2, title: 'Verify', desc: 'AI checks documents' },
              { num: 3, title: 'Match', desc: 'Find perfect maids' },
              { num: 4, title: 'Connect', desc: 'Chat & book services' }
            ].map((step, index) => (
              <div key={index} className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-200">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-900 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">1000+</div>
              <div className="text-gray-300 text-lg">Verified Maids</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">5000+</div>
              <div className="text-gray-300 text-lg">Happy Families</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">98%</div>
              <div className="text-gray-300 text-lg">Satisfaction</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-gray-300 text-lg">Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
