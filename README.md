# Hamari Tai - Har Ek Ghar Me Hamari Tai

A complete MERN-stack web application connecting verified domestic workers (maids) with households. Features AI-based verification, trust scoring, intelligent matching, and secure communication.

## Features

- **AI-Powered Verification**: OCR-based document extraction (Aadhaar/PAN) using Tesseract.js
- **Smart Recommendation Engine**: Geospatial queries, skills matching, salary range, and ratings
- **Trust Score System**: AI NLP analysis of reviews to assign trust levels (Trusted, Verified, Needs Review)
- **Role-Based Authentication**: Separate dashboards for users, maids, and admins
- **Real-time Chat**: Socket.io-based secure in-app messaging
- **Booking System**: Complete booking request and management workflow
- **Review & Rating**: Comprehensive review system with sentiment analysis
- **Admin Panel**: Document verification, user/maid management, and analytics

## Tech Stack

### Backend
- Node.js + Express
- MongoDB with Mongoose
- JWT Authentication
- Socket.io for real-time chat
- Tesseract.js for OCR
- Natural.js for NLP sentiment analysis
- Multer for file uploads

### Frontend
- React 18
- React Router v6
- Tailwind CSS
- Axios for API calls
- Socket.io-client for real-time features
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

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hamari-tai
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

4. Start the server:
```bash
npm run dev
```

5. (Optional) Seed the database:
```bash
npm run seed
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Default Login Credentials (After Seeding)

- **Admin**: admin@hamaritai.com / admin123
- **User**: rajesh@example.com / password123
- **Maid**: maid1@example.com / password123

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
- Uses Tesseract.js to extract text from uploaded Aadhaar/PAN documents
- Automatically extracts document numbers and names
- Stores OCR data for verification

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

## Development Notes

- File uploads are stored in `backend/uploads/`
- Socket.io is configured for real-time chat
- All routes are protected with JWT authentication
- Role-based access control for admin routes
- Error handling and validation throughout

## Future Enhancements

- Payment integration
- Push notifications
- Advanced analytics dashboard
- Mobile app (React Native)
- Multi-language support
- Video call integration

## License

ISC

## Author

Built for connecting verified domestic workers with households.

