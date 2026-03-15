# 🛍️ VASTRA — Full Stack E-Commerce Platform

A complete, production-ready fashion e-commerce website with Buy & Rent functionality.
Built with **Node.js + Express** (backend) and **Vanilla HTML/CSS/JS** (frontend).
**No database setup required** — uses a JSON file as a database, works out of the box!

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- **Node.js** v16+ installed → https://nodejs.org

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Seed the database (36 products + admin user)
node backend/seed.js

# 3. Start the server
npm start

# Open your browser at:
# http://localhost:3000
```

---

## 🔑 Login Credentials

| Role     | Email                | Password   |
|----------|----------------------|------------|
| Admin    | admin@vastra.com     | admin123   |
| Customer | (register yourself)  | (your own) |

---

## 📁 Project Structure

```
vastra/
├── backend/
│   ├── server.js          ← Main Express server (entry point)
│   ├── database.js        ← JSON file-based database
│   ├── seed.js            ← Seed 36 products + admin user
│   ├── data/
│   │   └── db.json        ← Auto-created database file
│   ├── middleware/
│   │   └── auth.js        ← JWT authentication middleware
│   └── routes/
│       ├── auth.js        ← Register, Login, Profile
│       ├── products.js    ← CRUD, Search, Filter, Reviews
│       ├── cart.js        ← Cart management
│       ├── orders.js      ← Orders & Checkout
│       ├── wishlist.js    ← Wishlist toggle
│       └── admin.js       ← Admin dashboard stats
│
├── frontend/
│   ├── index.html         ← Homepage
│   ├── shop.html          ← Product listing with filters
│   ├── product.html       ← Product detail page
│   ├── cart.html          ← Shopping cart
│   ├── checkout.html      ← Checkout & order placement
│   ├── orders.html        ← Order history & tracking
│   ├── account.html       ← User profile & dashboard
│   ├── admin.html         ← Admin panel
│   ├── login.html         ← Login page
│   ├── register.html      ← Registration page
│   ├── wishlist.html      ← Wishlist page
│   ├── about.html         ← About & contact page
│   ├── css/
│   │   └── global.css     ← All styles (CSS variables + components)
│   ├── js/
│   │   ├── api.js         ← API client, auth helpers, utilities
│   │   └── components.js  ← Shared header, footer, product cards
│   └── img/               ← Place your product images here
│       ├── MEN/
│       ├── WOMEN/
│       ├── BOY'S/
│       └── GIRL'S/
│
├── package.json
└── README.md
```

---

## 🌟 Features

### Customer Features
- ✅ Register / Login with JWT authentication
- ✅ Browse products with advanced filters (category, price, badge)
- ✅ Search with live dropdown results
- ✅ Sort by price, rating, popularity
- ✅ Add to cart (Buy or Rent mode)
- ✅ Apply coupon codes (VASTRA10, FIRST20, FLAT200, SAVE50)
- ✅ Full checkout with address form
- ✅ Order tracking with status timeline
- ✅ Wishlist management
- ✅ Write product reviews & ratings
- ✅ Profile & address management
- ✅ Change password

### Admin Features
- ✅ Dashboard with revenue, order, product stats
- ✅ Manage all orders + update status
- ✅ Add / delete products
- ✅ View all customers
- ✅ Low stock alerts

---

## 🛒 Coupon Codes

| Code       | Discount         | Min Order |
|------------|------------------|-----------|
| VASTRA10   | 10% off          | ₹500      |
| FIRST20    | 20% off          | ₹1,000    |
| FLAT200    | ₹200 flat off    | ₹1,500    |
| SAVE50     | 50% off          | ₹2,000    |

---

## 🖼️ Adding Your Product Images

Copy your product images to the `frontend/img/` folder preserving the same paths used in `backend/seed.js`:
```
frontend/img/MEN/10.jpg
frontend/img/WOMEN/7.jpg
frontend/img/BOY'S/6.jpg
frontend/img/GIRL'S/2.jpg
... etc
```

---

## 🌍 Deploy to Production

### Option 1: Railway.app (Free)
```bash
# Push to GitHub, then connect repo to railway.app
# Set PORT environment variable if needed
```

### Option 2: Render.com (Free)
```bash
# Build command: npm install && node backend/seed.js
# Start command: npm start
```

### Option 3: VPS / Heroku
```bash
# Set environment variables:
PORT=3000
JWT_SECRET=your_super_secret_key_here
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root:
```env
PORT=3000
JWT_SECRET=vastra_super_secret_2025
```

---

## 📡 API Endpoints

| Method | Endpoint                    | Description              | Auth |
|--------|-----------------------------|--------------------------|------|
| POST   | /api/auth/register          | Register new user        | No   |
| POST   | /api/auth/login             | Login user               | No   |
| GET    | /api/auth/profile           | Get profile              | Yes  |
| PUT    | /api/auth/profile           | Update profile           | Yes  |
| GET    | /api/products               | List products (filtered) | No   |
| GET    | /api/products/:id           | Single product           | No   |
| POST   | /api/products/:id/review    | Add review               | Yes  |
| GET    | /api/cart                   | Get cart                 | Yes  |
| POST   | /api/cart/add               | Add to cart              | Yes  |
| PUT    | /api/cart/update            | Update qty               | Yes  |
| DELETE | /api/cart/remove/:id        | Remove item              | Yes  |
| GET    | /api/orders                 | My orders                | Yes  |
| POST   | /api/orders/place           | Place order              | Yes  |
| PUT    | /api/orders/:id/cancel      | Cancel order             | Yes  |
| POST   | /api/wishlist/toggle/:id    | Toggle wishlist          | Yes  |
| POST   | /api/coupon/validate        | Validate coupon          | No   |
| GET    | /api/admin/stats            | Dashboard stats          | Admin|

---

© 2025 Vastra — Built with ❤️ in Greater Noida
