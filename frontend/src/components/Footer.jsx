import { Link } from 'react-router-dom';
import { FiHome, FiMail, FiPhone, FiMapPin, FiFacebook, FiTwitter, FiInstagram } from 'react-icons/fi';
import Logo from './Logo';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Logo size="md" />
            <p className="text-gray-400 text-sm leading-relaxed">
              हर एक घर में हमारी ताई - Connecting verified domestic workers with households through AI-powered matching and secure communication.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <FiFacebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <FiTwitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <FiInstagram className="w-5 h-5" />
              </a>
            </div>
          </div> 

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-orange-500 transition-colors text-sm flex items-center">
                  <FiHome className="mr-2 w-4 h-4" />
                  Home
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Search Maids
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Register
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Cleaning Services</li>
              <li>Cooking Services</li>
              <li>Babysitting</li>
              <li>Elderly Care</li>
              <li>Verified Workers</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="flex items-start">
                <FiMapPin className="mr-2 mt-1 w-4 h-4 flex-shrink-0" />
                <span>123 Main Street, City, State 12345</span>
              </li>
              <li className="flex items-center">
                <FiPhone className="mr-2 w-4 h-4 flex-shrink-0" />
                <span>+91 123 456 7890</span>
              </li>
              <li className="flex items-center">
                <FiMail className="mr-2 w-4 h-4 flex-shrink-0" />
                <span>contact@hamaritai.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Hamari Tai. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="#" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link to="#" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                Terms of Service
              </Link>
              <Link to="#" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                About Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
