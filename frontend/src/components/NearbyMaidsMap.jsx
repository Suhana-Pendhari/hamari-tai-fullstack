import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import axios from 'axios';
import { FiStar, FiShield, FiMapPin } from 'react-icons/fi';

const mapContainerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '1rem'
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090
};

const NearbyMaidsMap = ({ userLocation, maxDistance = 10 }) => {
  const [maids, setMaids] = useState([]);
  const [selectedMaid, setSelectedMaid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [map, setMap] = useState(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (userLocation?.lat && userLocation?.lng) {
      setMapCenter({
        lat: userLocation.lat,
        lng: userLocation.lng
      });
      fetchNearbyMaids(userLocation.lat, userLocation.lng);
    } else {
      // Try to get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setMapCenter({ lat, lng });
            fetchNearbyMaids(lat, lng);
          },
          () => {
            fetchNearbyMaids(defaultCenter.lat, defaultCenter.lng);
          }
        );
      } else {
        fetchNearbyMaids(defaultCenter.lat, defaultCenter.lng);
      }
    }
  }, [userLocation, maxDistance]);

  const fetchNearbyMaids = async (lat, lng) => {
    setLoading(true);
    try {
      const response = await axios.get('/api/search/maids/nearby', {
        params: {
          lat,
          lng,
          maxDistance
        }
      });
      setMaids(response.data.maids || []);
    } catch (error) {
      console.error('Error fetching nearby maids:', error);
    } finally {
      setLoading(false);
    }
  };

  const onMapLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onMapClick = useCallback(() => {
    setSelectedMaid(null);
  }, []);

  if (!apiKey) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
        <div className="text-center space-y-4">
          <div className="text-4xl mb-4">🗺️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Google Maps Not Configured</h3>
          <p className="text-gray-600 mb-4">
            To enable map view, you need to add your Google Maps API key.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left text-sm">
            <p className="font-semibold text-blue-900 mb-2">Quick Setup:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Create <code className="bg-blue-100 px-1 rounded">frontend/.env</code> file</li>
              <li>Add: <code className="bg-blue-100 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY=your-key-here</code></li>
              <li>Get API key from: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></li>
              <li>Restart your dev server</li>
            </ol>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            💡 Don't worry! List view still works without the API key.
          </p>
        </div>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nearby Maids on Map</h3>
          {loading && (
            <p className="text-sm text-gray-600">Loading maids...</p>
          )}
          {!loading && (
            <p className="text-sm text-gray-600">
              Found <span className="font-semibold text-orange-600">{maids.length}</span> maids within {maxDistance} km
            </p>
          )}
        </div>
        
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={12}
          onLoad={onMapLoad}
          onClick={onMapClick}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true
          }}
        >
          {/* User location marker */}
          {mapCenter && (
            <Marker
              position={mapCenter}
              icon={{
                url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
              }}
              title="Your Location"
            />
          )}

          {/* Maid markers */}
          {maids.map((maid) => {
            if (!maid.location?.coordinates || maid.location.coordinates.length < 2) return null;
            
            const maidPosition = {
              lat: maid.location.coordinates[1],
              lng: maid.location.coordinates[0]
            };

            return (
              <Marker
                key={maid._id}
                position={maidPosition}
                onClick={() => setSelectedMaid(maid)}
                icon={{
                  url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                }}
                title={maid.name}
              />
            );
          })}

          {/* Info Window */}
          {selectedMaid && (
            <InfoWindow
              position={{
                lat: selectedMaid.location.coordinates[1],
                lng: selectedMaid.location.coordinates[0]
              }}
              onCloseClick={() => setSelectedMaid(null)}
            >
              <div className="p-2 max-w-xs">
                <div className="flex items-start gap-3 mb-3">
                  {selectedMaid.photo ? (
                    <img
                      src={`http://localhost:5000/${selectedMaid.photo}`}
                      alt={selectedMaid.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center">
                      <span className="text-xl font-bold text-orange-600">
                        {selectedMaid.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{selectedMaid.name}</h4>
                    <p className="text-sm text-gray-600">{selectedMaid.age} years old</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center text-yellow-600">
                      <FiStar className="mr-1" />
                      {selectedMaid.rating?.average?.toFixed(1) || '0.0'}
                    </span>
                    <span className="flex items-center text-orange-600">
                      <FiShield className="mr-1" />
                      {selectedMaid.trustScore?.status || 'Verified'}
                    </span>
                  </div>

                  {selectedMaid.skills && selectedMaid.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedMaid.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                        >
                          {skill.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {selectedMaid.location?.address && (
                    <p className="text-xs text-gray-600 flex items-center">
                      <FiMapPin className="mr-1" />
                      {selectedMaid.location.address}
                    </p>
                  )}

                  <p className="text-sm font-semibold text-orange-600">
                    ₹{selectedMaid.salaryExpectation}/month
                  </p>
                </div>

                <a
                  href={`/maid/${selectedMaid._id}`}
                  className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-all"
                >
                  View Profile
                </a>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </LoadScript>
  );
};

export default NearbyMaidsMap;

