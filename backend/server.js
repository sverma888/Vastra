require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const app = express();
connectDB();

// Middleware
// app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5000", credentials: true }));
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/admin", require("./routes/admin"));

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", message: "Vastra API running" }));

// Serve frontend for all non-API routes (SPA support)
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
  }
});

app.post('/api/coupon/validate', (req, res) => {
  const { code, subtotal } = req.body;
  const coupons = {
    'VASTRA10': { discount: 0.10, description: '10% off', minOrder: 500 },
    'FIRST20':  { discount: 0.20, description: '20% off', minOrder: 1000 },
    'FLAT200':  { discount: 200,  type: 'flat', description: '₹200 off', minOrder: 1500 },
    'SAVE50':   { discount: 0.50, description: '50% off', minOrder: 2000 }
  };
  const coupon = coupons[code && code.toUpperCase()];
  if (!coupon) return res.status(404).json({ error: 'Invalid coupon code' });
  if (Number(subtotal) < coupon.minOrder) return res.status(400).json({ error: 'Minimum order ₹' + coupon.minOrder + ' required' });
  const discountAmt = coupon.type === 'flat' ? coupon.discount : Math.round(Number(subtotal) * coupon.discount);
  res.json({ valid: true, code: code.toUpperCase(), discountAmount: discountAmt, description: coupon.description });
});

app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const { readDB, writeDB } = require('./database');
  const db = readDB();
  if (!db.newsletter.includes(email)) { db.newsletter.push(email); writeDB(db); }
  res.json({ message: 'Subscribed successfully!' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || "Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Vastra server running on http://localhost:${PORT}`));
