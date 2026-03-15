const express = require('express');
const { readDB, writeDB } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = readDB();
    const cartItems = db.cart[req.user.id] || [];
    const enriched = cartItems.map(item => {
      const product = db.products.find(p => p.id === item.productId);
      return product ? { ...item, product } : null;
    }).filter(Boolean);
    const subtotal = enriched.reduce((s, i) => s + (i.type === 'rent' ? i.product.rentPrice : i.product.price) * i.qty, 0);
    res.json({ items: enriched, subtotal, count: enriched.reduce((s, i) => s + i.qty, 0) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/add', authMiddleware, (req, res) => {
  try {
    const { productId, qty = 1, size, color, type = 'buy' } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });
    const db = readDB();
    const product = db.products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!db.cart[req.user.id]) db.cart[req.user.id] = [];
    const existing = db.cart[req.user.id].find(i => i.productId === productId && i.size === (size||'') && i.type === type);
    if (existing) existing.qty += Number(qty);
    else db.cart[req.user.id].push({ productId, qty: Number(qty), size: size||'', color: color||'', type, addedAt: new Date().toISOString() });
    writeDB(db);
    res.json({ message: 'Added to cart', count: db.cart[req.user.id].reduce((s, i) => s + i.qty, 0) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/update', authMiddleware, (req, res) => {
  try {
    const { productId, qty, size } = req.body;
    const db = readDB();
    if (!db.cart[req.user.id]) return res.status(404).json({ error: 'Cart empty' });
    const item = db.cart[req.user.id].find(i => i.productId === productId && i.size === (size||''));
    if (!item) return res.status(404).json({ error: 'Item not in cart' });
    if (Number(qty) <= 0) db.cart[req.user.id] = db.cart[req.user.id].filter(i => !(i.productId === productId && i.size === (size||'')));
    else item.qty = Number(qty);
    writeDB(db);
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/remove/:productId', authMiddleware, (req, res) => {
  try {
    const { size } = req.query;
    const db = readDB();
    if (!db.cart[req.user.id]) return res.json({ message: 'Empty' });
    db.cart[req.user.id] = db.cart[req.user.id].filter(i => !(i.productId === req.params.productId && i.size === (size||'')));
    writeDB(db);
    res.json({ message: 'Removed' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/clear', authMiddleware, (req, res) => {
  try {
    const db = readDB();
    db.cart[req.user.id] = [];
    writeDB(db);
    res.json({ message: 'Cleared' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;