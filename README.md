# IndiaFoodMap MERN

Hyperlocal street food discovery platform with map-based exploration, SEO-first vendor pages, auth-protected vendor submission, and review system.

## Tech Stack

- Frontend: React + Vite + Tailwind CSS + React Router + React Helmet + React Leaflet
- Backend: Node.js + Express + JWT auth + mock OTP endpoints
- Database: MongoDB + Mongoose

## Implemented Features

- Dark glassmorphism UI inspired by provided reference images
- Multi-page frontend:
	- Home landing with market gap, keyword section, feature grid, roadmap, revenue model, competitive stats
	- Explore Map page with Leaflet markers
	- Vendor Detail page (slug-based dynamic SEO page)
	- Add Vendor page (protected route)
	- Login/Register page
- Auth system:
	- Register/Login with JWT
	- Protected add-vendor route
	- Current user endpoint
- Vendor system:
	- Add vendors with GPS, menu items, multiple images, SEO metadata, WhatsApp number
	- Get all vendors with filters
	- Get vendor by slug or id
	- Add reviews and auto rating aggregation
- SEO:
	- Dynamic meta tags with React Helmet
	- JSON-LD schema on vendor detail page
- Language toggle:
	- Basic EN/HI toggle in UI
- OTP:
	- Mock OTP request/verify endpoints (Twilio-ready integration point)

## Folder Structure

- client: React app
- server: Express API

## Environment Variables

### server/.env

PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/indiafoodmap?retryWrites=true&w=majority
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=super_secret_change_me
JWT_EXPIRES_IN=7d
OTP_EXPIRY_SECONDS=300
ADMIN_EMAIL=admin@indiafoodmap.in
ADMIN_PASSWORD=Admin@12345
ADMIN_NAME=IndiaFoodMap Admin

### client/.env

VITE_API_BASE_URL=http://localhost:5000/api

## Local Setup

1. Install everything:

npm run install:all

2. Seed demo data:

npm run seed

Seed creates:
- demo user: admin@indiafoodmap.in
- demo password: password123
- sample vendors with coordinates and media

3. Start application:

npm run dev

4. Access:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## API Endpoints

### Health

- GET /api/health

### Auth

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/otp/request
- POST /api/auth/otp/verify

### Admin

- Admin user is bootstrapped automatically on server start from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- Login is done from the same `/auth` page and same backend port.
- Admin-only APIs:
	- GET /api/admin/overview
	- GET /api/admin/users
	- PUT /api/admin/users/:id
	- DELETE /api/admin/users/:id
	- GET /api/admin/vendors
	- POST /api/admin/vendors
	- PUT /api/admin/vendors/:id
	- DELETE /api/admin/vendors/:id

### Vendors

- GET /api/vendors
- GET /api/vendors/stats/overview
- GET /api/vendors/:slugOrId
- POST /api/vendors (auth required)
- POST /api/vendors/:id/reviews

## Deployment Notes

### Frontend (Vercel)

- Root directory: client
- Build command: npm run build
- Output directory: dist
- Env: VITE_API_BASE_URL=<your-backend-url>/api

### Backend (Render/Railway)

- Root directory: server
- Start command: npm start
- Env:
	- PORT
	- MONGO_URI (MongoDB Atlas URI)
	- CLIENT_ORIGIN (frontend URL)
	- JWT_SECRET
	- JWT_EXPIRES_IN
	- OTP_EXPIRY_SECONDS

### MongoDB Atlas

- Create an Atlas cluster and a database named `indiafoodmap`.
- Replace `MONGO_URI` in `server/.env` with the Atlas connection string for that cluster.
- In Atlas Network Access, allow your current IP while developing.
- Open MongoDB Compass and connect with the same Atlas URI.
- In Compass, select the `indiafoodmap` database to see the app data.
- If you seed data locally, run the seed command after switching `MONGO_URI` so the records are written into Atlas.
