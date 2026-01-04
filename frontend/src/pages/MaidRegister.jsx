
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import { processDocumentWithVisionAPI } from '../utils/googleOCR';

const MaidRegister = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: '',
    skills: [],
    experience: '',
    availability: {
      days: [],
      startTime: '',
      endTime: ''
    },
    salaryExpectation: '',
    location: {
      lat: user?.location?.coordinates?.[1] || '',
      lng: user?.location?.coordinates?.[0] || '',
      address: user?.location?.address || ''
    },
    bio: ''
  });
  const [files, setFiles] = useState({
    photo: null,
    aadhaar: null,
    pan: null
  });
  const [ocrResults, setOcrResults] = useState({
    aadhaar: null,
    pan: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(isEditMode);
  const [showSuccess, setShowSuccess] = useState(false);
  const [processingOCR, setProcessingOCR] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      fetchMaidProfile();
    }
  }, [isEditMode]);

  const fetchMaidProfile = async () => {
    try {
      setLoadingProfile(true);
      const response = await axios.get('/api/maids/profile');
      const maid = response.data;
      
      setFormData({
        name: maid.name || user?.name || '',
        age: maid.age || '',
        skills: maid.skills || [],
        experience: maid.experience || '',
        availability: maid.availability || {
          days: [],
          startTime: '',
          endTime: ''
        },
        salaryExpectation: maid.salaryExpectation || '',
        location: {
          lat: maid.location?.coordinates?.[1] || user?.location?.coordinates?.[1] || '',
          lng: maid.location?.coordinates?.[0] || user?.location?.coordinates?.[0] || '',
          address: maid.location?.address || user?.location?.address || ''
        },
        bio: maid.bio || ''
      });
    } catch (error) {
      console.error('Fetch maid profile error:', error);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'day') {
      setFormData(prev => ({
        ...prev,
        availability: {
         ...prev.availability,
          days: checked
            ? [...prev.availability.days, value]
            : prev.availability.days.filter(d => d !== value)
        }
      }));
    } else if (name.startsWith('availability.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        availability: {
         ...prev.availability,
          [field]: value
        }
      }));
    } else if (name === 'skill') {
      setFormData(prev => ({
        ...prev,
        skills: checked
          ? [...prev.skills, value]
          : prev.skills.filter(s => s !== value)
      }));
    } else if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
         ...prev.location,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || '' : value
      }));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    const fileType = e.target.name; // 'aadhaar' or 'pan'
    
    setFiles({
      ...files,
      [fileType]: file
    });

    // Process OCR immediately when file is selected
    if (file && (fileType === 'aadhaar' || fileType === 'pan')) {
      setProcessingOCR(true);
      try {
        const documentType = fileType === 'aadhaar' ? 'aadhaar' : 'pan';
        const result = await processDocumentWithVisionAPI(file, documentType);
        
        if (result.success) {
          setOcrResults(prev => ({
            ...prev,
            [fileType]: result.data
          }));
          
          // Auto-fill name if extracted
          if (result.data.name && !formData.name) {
            setFormData(prev => ({
              ...prev,
              name: result.data.name
            }));
          }
        } else {
          console.warn(`OCR failed for ${fileType}:`, result.error);
          // Continue without OCR - will use server-side fallback
        }
      } catch (error) {
        console.error(`OCR error for ${fileType}:`, error);
        // Continue without OCR - will use server-side fallback
      } finally {
        setProcessingOCR(false);
      }
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
        },
        (error) => {
          alert('Unable to get location');
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Client-side validation
    if (formData.skills.length === 0) {
      setError('Please select at least one skill');
      setLoading(false);
      return;
    }

    if (formData.availability.days.length === 0) {
      setError('Please select at least one availability day');
      setLoading(false);
      return;
    }

    if (!formData.location.lat || !formData.location.lng) {
      setError('Please provide location coordinates');
      setLoading(false);
      return;
    }

    // Documents are only required when creating, not editing
    if (!isEditMode && (!files.aadhaar || !files.pan)) {
      setError('Please upload both Aadhaar and PAN documents');
      setLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'availability' || key === 'location' || key === 'skills') {
        formDataToSend.append(key, JSON.stringify(formData[key]));
      } else {
        formDataToSend.append(key, formData[key]);
      }
    });

    if (files.photo) formDataToSend.append('photo', files.photo);
    if (files.aadhaar) formDataToSend.append('aadhaar', files.aadhaar);
    if (files.pan) formDataToSend.append('pan', files.pan);

    try {
      if (isEditMode) {
        // Update existing profile
        const response = await axios.put('/api/maids/profile', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        setShowSuccess(true);
        setTimeout(() => {
          navigate('/maid-dashboard');
        }, 1500);
      } else {
        // Create new profile
        const response = await axios.post('/api/maids/register', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        setShowSuccess(true);
        setTimeout(() => {
          navigate('/maid-dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          (error.response?.data?.errors && error.response.data.errors.length > 0 
                            ? error.response.data.errors.map(e => e.msg || e.message).join(', ')
                            : 'Failed to create profile');
      setError(errorMessage);
      console.error('Full error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-cream-100 to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-cream-100 to-gray-50 py-12">
      {showSuccess && (
        <Toast 
          message={isEditMode ? "Profile updated successfully!" : "Maid profile created successfully!"} 
          onClose={() => setShowSuccess(false)} 
        />
      )}
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          {isEditMode ? 'Edit Maid Profile' : 'Create Maid Profile'}
        </h1>

        <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl">
                <p className="font-semibold mb-1">Error:</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
                <input
                  type="number"
                  name="age"
                  required
                  min="18"
                  max="70"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience (years) *</label>
                <input
                  type="number"
                  name="experience"
                  required
                  min="0"
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Skills * (Select at least one)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-xl">
                {['cleaning', 'cooking', 'babysitting', 'elderly_care'].map(skill => (
                  <label key={skill} className="flex items-center p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      name="skill"
                      value={skill}
                      checked={formData.skills.includes(skill)}
                      onChange={handleChange}
                      className="mr-3 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700 capitalize font-medium">{skill.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Salary Expectation (₹/month) *</label>
              <input
                type="number"
                name="salaryExpectation"
                required
                min="0"
                value={formData.salaryExpectation}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Availability Days *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-xl">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <label key={day} className="flex items-center p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      name="day"
                      value={day}
                      checked={formData.availability.days.includes(day)}
                      onChange={handleChange}
                      className="mr-3 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700 capitalize font-medium">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                <input
                  type="time"
                  name="availability.startTime"
                  required
                  value={formData.availability.startTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                <input
                  type="time"
                  name="availability.endTime"
                  required
                  value={formData.availability.endTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Location *</label>
              <button
                type="button"
                onClick={handleGetLocation}
                className="w-full mb-3 bg-orange-50 border-2 border-orange-200 text-orange-700 py-3 px-4 rounded-xl hover:bg-orange-100 font-medium transition-all"
              >
                📍 Use Current Location
              </button>
              <input
                type="text"
                name="location.address"
                required
                placeholder="Full address"
                value={formData.location.address}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 mb-3"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="any"
                  name="location.lat"
                  required
                  placeholder="Latitude"
                  value={formData.location.lat}
                  onChange={handleChange}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="number"
                  step="any"
                  name="location.lng"
                  required
                  placeholder="Longitude"
                  value={formData.location.lng}
                  onChange={handleChange}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Bio (optional)</label>
              <textarea
                name="bio"
                rows="4"
                maxLength={500}
                value={formData.bio}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-vertical"
                placeholder="Tell us about yourself, your experience, and what makes you great..."
              />
              <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Profile Photo (optional)</label>
              <input
                type="file"
                name="photo"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Aadhaar Document {!isEditMode && '*'}
                </label>
                <input
                  type="file"
                  name="aadhaar"
                  accept="image/*,application/pdf"
                  required={!isEditMode}
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {isEditMode ? 'Leave empty to keep existing document' : 'Upload Aadhaar card image or PDF'}
                </p>
                {processingOCR && files.aadhaar && (
                  <p className="text-xs text-orange-600 mt-1">Processing OCR...</p>
                )}
                {ocrResults.aadhaar && !processingOCR && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-semibold text-green-800 mb-1">✓ OCR Extraction Successful</p>
                    {ocrResults.aadhaar.aadhaarNumber && (
                      <p className="text-xs text-green-700"><strong>Aadhaar:</strong> {ocrResults.aadhaar.aadhaarNumber}</p>
                    )}
                    {ocrResults.aadhaar.name && (
                      <p className="text-xs text-green-700"><strong>Name:</strong> {ocrResults.aadhaar.name}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-1">Confidence: {ocrResults.aadhaar.confidence?.toFixed(1) || 'N/A'}%</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  PAN Document {!isEditMode && '*'}
                </label>
                <input
                  type="file"
                  name="pan"
                  accept="image/*,application/pdf"
                  required={!isEditMode}
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {isEditMode ? 'Leave empty to keep existing document' : 'Upload PAN card image or PDF'}
                </p>
                {processingOCR && files.pan && (
                  <p className="text-xs text-orange-600 mt-1">Processing OCR...</p>
                )}
                {ocrResults.pan && !processingOCR && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-semibold text-green-800 mb-1">✓ OCR Extraction Successful</p>
                    {ocrResults.pan.panNumber && (
                      <p className="text-xs text-green-700"><strong>PAN:</strong> {ocrResults.pan.panNumber}</p>
                    )}
                    {ocrResults.pan.name && (
                      <p className="text-xs text-green-700"><strong>Name:</strong> {ocrResults.pan.name}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-1">Confidence: {ocrResults.pan.confidence?.toFixed(1) || 'N/A'}%</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white py-4 px-8 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isEditMode ? 'Updating Profile...' : 'Creating Profile...'}
                  </>
                ) : (
                  isEditMode ? 'Update Profile' : 'Create Profile'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/maid-dashboard')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-4 px-8 rounded-xl font-semibold transition-all border border-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MaidRegister;
