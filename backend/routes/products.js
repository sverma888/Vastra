const express = require('express');
const { readDB, writeDB } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = readDB();
    let products = [...db.products];
    const { category, subcategory, search, sort, minPrice, maxPrice, page = 1, limit = 12, badge } = req.query;
    if (category) products = products.filter(p => p.category === category.toLowerCase());
    if (subcategory) products = products.filter(p => p.subcategory === subcategory.toLowerCase());
    if (badge) products = products.filter(p => p.badge === badge.toLowerCase());
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(q))
      );
    }
    if (minPrice) products = products.filter(p => p.price >= Number(minPrice));
    if (maxPrice) products = products.filter(p => p.price <= Number(maxPrice));
    if (sort === 'price-asc') products.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') products.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') products.sort((a, b) => b.rating - a.rating);
    else if (sort === 'newest' || sort === 'popular') products.sort((a, b) => b.reviews - a.reviews);
    const total = products.length;
    const startIdx = (Number(page) - 1) * Number(limit);
    const paginated = products.slice(startIdx, startIdx + Number(limit));
    res.json({ products: paginated, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/featured', (req, res) => {
  try {
    const db = readDB();
    const featured = db.products.filter(p => ['bestseller', 'trending', 'hot'].includes(p.badge)).slice(0, 8);
    res.json(featured);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const db = readDB();
    const product = db.products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const reviewsList = db.reviews.filter(r => r.productId === req.params.id);
    res.json({ ...product, reviewsList });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/review', authMiddleware, (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) return res.status(400).json({ error: 'Rating and comment required' });
    const db = readDB();
    const product = db.products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const review = {
      id: uuidv4(), productId: req.params.id,
      userId: req.user.id, userName: req.user.name,
      rating: Number(rating), comment,
      createdAt: new Date().toISOString()
    };
    db.reviews.push(review);
    const productReviews = db.reviews.filter(r => r.productId === req.params.id);
    const avg = productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length;
    const pIdx = db.products.findIndex(p => p.id === req.params.id);
    db.products[pIdx].rating = Math.round(avg * 10) / 10;
    db.products[pIdx].reviews = productReviews.length;
    writeDB(db);
    res.json(review);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const db = readDB();
    const product = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
    db.products.push(product);
    writeDB(db);
    res.json(product);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const db = readDB();
    const idx = db.products.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });
    db.products[idx] = { ...db.products[idx], ...req.body };
    writeDB(db);
    res.json(db.products[idx]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const db = readDB();
    db.products = db.products.filter(p => p.id !== req.params.id);
    writeDB(db);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;