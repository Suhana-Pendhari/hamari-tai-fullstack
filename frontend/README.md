# Hamari Tai Frontend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Features

- React Router for navigation
- Protected routes with role-based access
- Real-time chat with Socket.io
- Responsive design with Tailwind CSS
- File uploads for maid registration

## Environment Variables

The frontend proxies API requests to `http://localhost:5000` by default (configured in `vite.config.js`).

