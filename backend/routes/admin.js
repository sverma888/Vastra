const express = require('express');
const { readDB } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.get('/stats', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const db = readDB();
    const orders = db.orders;
    const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
    res.json({
      totalProducts: db.products.length,
      totalUsers: db.users.filter(u => u.role !== 'admin').length,
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      totalRevenue,
      newsletter: db.newsletter.length,
      recentOrders: orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
      lowStock: db.products.filter(p => p.stock < 5)
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/users', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const db = readDB();
    res.json(db.users.map(({ password, ...u }) => u));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;