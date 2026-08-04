# Bismillah General Store

A full-stack e-commerce grocery store built with the MERN stack (MongoDB, Express.js, React, Node.js).

**A project by Liaqat Engineering Project**
**Developed by Muhammad Umair Ahmad 27**

## Live Demo

- **Frontend:** [https://bismillah-general-store.vercel.app](https://bismillah-general-store.vercel.app)
- **Backend API:** [https://bismillah-store-api.vercel.app/api](https://bismillah-store-api.vercel.app/api)

## Features

### Customer Features
- Browse products with search, filter, and sort
- Shopping cart with quantity management
- Checkout with shipping details
- Order history and tracking
- Live chat support
- User registration and authentication

### Admin Features
- Dashboard with analytics charts (daily/monthly revenue, orders, profit)
- Product management (CRUD with image upload)
- Category management
- Order management with status updates
- Stock management with movement history
- Sales and bill records
- User management (block/unblock)
- Recycle bin for soft-deleted items
- Chat support panel

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 19 | Frontend UI |
| Vite | Build tool |
| Ant Design | UI components |
| Bootstrap | CSS framework |
| Chart.js | Dashboard charts |
| Express.js | Backend API |
| MongoDB | Database |
| Mongoose | ODM |
| JWT | Authentication |
| Cloudinary | Image storage |
| Socket.IO | Real-time chat |

## Project Structure

```
Bismillah-General-Store/
├── api/                    # Vercel serverless function
│   └── index.js           # Express app entry for Vercel
├── src/                   # Frontend source
│   ├── components/        # Reusable components
│   ├── config/            # Configuration
│   ├── context/           # React Context (Auth, Cart)
│   ├── pages/             # Page components
│   └── utils/             # Utility functions
├── server/                # Backend source
│   ├── config/            # DB, Cloudinary config
│   ├── middleware/         # Auth, upload middleware
│   ├── models/            # Mongoose schemas
│   └── routes/            # API routes
├── vercel.json            # Vercel deployment config
└── package.json
```

## Local Development

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Cloudinary account (for images)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/Muhammad-Umair-Ahmad-27/Bismillah-General-Store.git
cd Bismillah-General-Store
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd server
npm install
cd ..
```

4. **Configure environment variables**

Create `server/.env`:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

5. **Start development servers**

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
npm run dev
```

6. **Open browser**
```
Frontend: http://localhost:5173
Backend:  http://localhost:5000/api
```

## Deployment to Vercel

### Frontend Deployment

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import the GitHub repository
4. Configure:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Environment Variable:** `VITE_API_URL` = your backend URL
5. Deploy

### Backend Deployment

1. Create a new Vercel project for the backend
2. Import the same GitHub repository
3. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Output Directory:** `.` (leave empty)
   - **Environment Variables:** Add all backend env vars
4. Deploy

### Alternative: Deploy Backend on Railway/Render

1. Create account on [Railway](https://railway.app) or [Render](https://render.com)
2. Connect GitHub repository
3. Set environment variables
4. Deploy

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register user | No |
| POST | /api/auth/login | Login user | No |
| GET | /api/products | Get products | Yes |
| POST | /api/products | Create product | Admin |
| PUT | /api/products/:id | Update product | Admin |
| DELETE | /api/products/:id | Delete product | Admin |
| GET | /api/categories | Get categories | Yes |
| POST | /api/orders | Place order | Yes |
| GET | /api/orders | Get orders | Yes |
| GET | /api/dashboard/stats | Dashboard stats | Admin |
| GET | /api/dashboard/chart-data | Chart data | Admin |
| POST | /api/contact | Send contact message | No |
| POST | /api/chats | Create/get chat | Yes |
| POST | /api/chats/:id/messages | Send message | Yes |

## Database Models

- **User** - uid, fullName, email, password, phone, avatar, role, status
- **Product** - name, price, costPrice, stock, unit, category, images, featured
- **Category** - name, slug, icon, image
- **Order** - userId, items, total, status, shipping
- **Chat** - userId, userEmail, userName, status, lastMessage
- **Message** - chatId, senderId, senderName, senderRole, text
- **StockMovement** - productId, type, quantity, previousStock, newStock
- **ContactMessage** - name, email, subject, message, read

## License

MIT License

## Contact

**Muhammad Umair Ahmad 27**
- Email: m.umar.work.pk@gmail.com
- GitHub: [Muhammad-Umair-Ahmad-27](https://github.com/Muhammad-Umair-Ahmad-27)

**Liaqat Engineering Project**
- Faisalabad, Punjab, Pakistan
