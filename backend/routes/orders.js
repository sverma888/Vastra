const express = require('express');
const { readDB, writeDB } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

router.get('/admin/all', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const db = readDB();
    res.json(db.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/admin/:id/status', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { status, note } = req.body;
    const db = readDB();
    const idx = db.orders.findIndex(o => o.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Order not found' });
    db.orders[idx].status = status;
    db.orders[idx].statusHistory.push({ status, time: new Date().toISOString(), note: note || '' });
    writeDB(db);
    res.json(db.orders[idx]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = readDB();
    const orders = db.orders
      .filter(o => o.userId === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/place', authMiddleware, (req, res) => {
  try {
    const { address, paymentMethod = 'cod', coupon } = req.body;
    const db = readDB();
    const cartItems = db.cart[req.user.id] || [];
    if (!cartItems.length) return res.status(400).json({ error: 'Cart is empty' });
    const enriched = cartItems.map(item => {
      const product = db.products.find(p => p.id === item.productId);
      if (!product) return null;
      const unitPrice = item.type === 'rent' ? product.rentPrice : product.price;
      return {
        ...item,
        product: { id: product.id, name: product.name, img: product.img, brand: product.brand },
        unitPrice,
        total: unitPrice * item.qty
      };
    }).filter(Boolean);
    let subtotal = enriched.reduce((s, i) => s + i.total, 0);
    let discount = 0;
    if (coupon === 'VASTRA10') discount = Math.round(subtotal * 0.1);
    if (coupon === 'FIRST20') discount = Math.round(subtotal * 0.2);
    if (coupon === 'FLAT200' && subtotal >= 1500) discount = 200;
    if (coupon === 'SAVE50' && subtotal >= 2000) discount = Math.round(subtotal * 0.5);
    const shipping = (subtotal - discount) >= 999 ? 0 : 99;
    const total = subtotal - discount + shipping;
    const order = {
      id: 'VST' + Date.now().toString().slice(-8),
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      items: enriched,
      address,
      paymentMethod,
      coupon: coupon || null,
      subtotal, discount, shipping, total,
      status: 'pending',
      statusHistory: [{ status: 'pending', time: new Date().toISOString(), note: 'Order placed' }],
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    };
    db.orders.push(order);
    db.cart[req.user.id] = [];
    writeDB(db);
    res.json(order);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = readDB();
    const order = db.orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.userId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    res.json(order);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/cancel', authMiddleware, (req, res) => {
  try {
    const db = readDB();
    const idx = db.orders.findIndex(o => o.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    if (db.orders[idx].userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (['delivered', 'cancelled'].includes(db.orders[idx].status)) return res.status(400).json({ error: 'Cannot cancel this order' });
    db.orders[idx].status = 'cancelled';
    db.orders[idx].statusHistory.push({ status: 'cancelled', time: new Date().toISOString(), note: 'Cancelled by customer' });
    writeDB(db);
    res.json(db.orders[idx]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
