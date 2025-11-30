# Hamari Tai Backend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hamari-tai
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

3. Start MongoDB (if running locally)

4. Run the server:
```bash
npm run dev
```

5. Seed the database (optional):
```bash
npm run seed
```

## API Documentation

All API endpoints require authentication except `/api/auth/register` and `/api/auth/login`.

Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## File Uploads

Uploaded files are stored in the `uploads/` directory. Make sure this directory exists or it will be created automatically.

## Socket.io

The server includes Socket.io for real-time chat. Connect to `http://localhost:5000` from the frontend.

