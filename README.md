# Hamari Tai - Har Ek Ghar Me Hamari Tai

A complete MERN-stack web application connecting verified domestic workers (maids) with households. Features AI-based verification, trust scoring, intelligent matching, and secure communication.

## Features

- **AI-Powered Verification**: Multi-tier OCR system using Google Cloud Vision API (primary), with Tesseract.js fallback
- **Smart Recommendation Engine**: Geospatial queries, skills matching, salary range, and ratings
- **Trust Score System**: AI NLP analysis of reviews to assign trust levels (Trusted, Verified, Needs Review)
- **Role-Based Authentication**: Separate dashboards for users, maids, and admins
- **Real-time Chat**: Socket.io-based secure in-app messaging
- **Booking System**: Complete booking request and management workflow
- **Review & Rating**: Comprehensive review system with sentiment analysis
- **Admin Panel**: Document verification, user/maid management
- **Google Maps Integration**: Interactive map view for nearby maid discovery

## Tech Stack

### Backend
- Node.js + Express
- MongoDB with Mongoose
- JWT Authentication
- Socket.io for real-time chat
- Google Cloud Vision API for OCR (primary)
- Tesseract.js for OCR (fallback)
- Natural.js for NLP sentiment analysis
- Multer for file uploads

### Frontend
- React 18
- React Router v6
- Tailwind CSS
- Axios for API calls
- Socket.io-client for real-time features
- Google Maps JavaScript API for location visualization
- Google Cloud Vision API for client-side OCR
- Vite as build tool

## Project Structure

```
Hamari Tai/
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── utils/
│   ├── uploads/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Maids
- `POST /api/maids/register` - Register maid profile (with file uploads)
- `GET /api/maids/profile` - Get maid profile
- `PUT /api/maids/profile` - Update maid profile
- `GET /api/maids/:id` - Get maid by ID

### Search
- `GET /api/search/maids` - Search maids with filters
- `GET /api/search/maids/nearby` - Get nearby maids

### Bookings
- `POST /api/bookings` - Create booking request
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id/status` - Update booking status

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/maid/:maidId` - Get reviews for maid
- `GET /api/reviews/user` - Get user reviews

### Chat
- `GET /api/chat/rooms` - Get chat rooms
- `GET /api/chat/messages/:roomId` - Get messages
- `POST /api/chat/messages` - Send message

### Admin
- `GET /api/admin/dashboard` - Get dashboard stats
- `GET /api/admin/maids/pending` - Get pending verifications
- `PUT /api/admin/maids/:id/verify` - Verify/reject maid
- `GET /api/admin/users` - Get all users
- `GET /api/admin/maids` - Get all maids

## Key Features Implementation

### AI OCR Document Extraction
- **Primary**: Google Cloud Vision API for high-accuracy text extraction
- **Client-side**: Google Cloud Vision API (via REST) for immediate feedback
- **Fallback**: Tesseract.js for server-side processing when Vision API is unavailable
- Automatically extracts document numbers and names
- Stores OCR data with confidence scores for verification
- OCR priority: Client Vision API → Server Vision API → Tesseract.js

### Recommendation Engine
- Calculates distance using Haversine formula
- Scores based on:
  - Location proximity (40 points)
  - Skills match (25 points)
  - Salary range (15 points)
  - Rating (10 points)
  - Trust score (10 points)

### Trust Score Calculation
- Document verification (30 points)
- Review sentiment analysis (25 points)
- Rating average (25 points)
- Experience (10 points)
- Response rate (10 points)

### Geospatial Queries
- MongoDB 2dsphere indexes for location-based search
- Distance-based filtering and sorting
- Google Maps integration for visual location discovery
- Interactive map view with maid markers and info windows

## Development Notes

- File uploads are stored in `backend/uploads/`
- Socket.io is configured for real-time chat
- All routes are protected with JWT authentication
- Role-based access control for admin routes
- Error handling and validation throughout

## Google Technologies Used

This project integrates several Google technologies to enhance functionality and user experience:

### 1. Google Maps JavaScript API
**Purpose**: Location-based maid discovery and visualization
- **Why**: Provides interactive map visualization for nearby maid search, making it easier for users to see maid locations relative to their position
- **Features**: 
  - Interactive map with user location marker
  - Maid location markers with clickable info windows
  - Distance visualization on map
  - Integration with existing geospatial search

### 2. Google Cloud Vision API (Client-side OCR)
**Purpose**: AI-based document OCR for immediate user feedback
- **Why**: Provides high-accuracy text extraction directly in the browser, giving users instant feedback when uploading Aadhaar/PAN documents
- **Features**:
  - Real-time OCR processing on file upload
  - Automatic extraction of document numbers and names
  - Confidence score display
  - Preview of extracted data before submission

### 3. Google Cloud Vision API (Server-side OCR)
**Purpose**: Advanced OCR verification and fallback processing
- **Why**: Server-side processing ensures reliable OCR even when client-side fails, and provides higher accuracy for document verification
- **Features**:
  - Fallback OCR when client-side processing fails
  - Admin-triggered re-verification
  - Stores extracted text and confidence scores in MongoDB
  - Part of multi-tier OCR fallback chain

### OCR Priority Chain
1. **Google Cloud Vision API (Client)** - First attempt for immediate feedback
2. **Google Cloud Vision API (Server)** - Fallback when client fails or for admin re-verification
3. **Tesseract.js** - Final fallback when Google services are unavailable

## Environment Variables

### Backend (.env)
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to Google Cloud service account JSON file

### Frontend (.env or .env.local)
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps JavaScript API key
- `VITE_GOOGLE_VISION_API_KEY` - Google Cloud Vision API key (for client-side OCR)

**Note**: The application will function without Google services, but with reduced features (fallback to Tesseract.js for OCR, no map view).

## Future Enhancements

- Payment integration
- Push notifications
- Mobile app (React Native)
- Multi-language support
- Video call integration

## License

ISC

## Author

Built for connecting verified domestic workers with households.

