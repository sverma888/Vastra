const express = require('express');
const { readDB, writeDB } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = readDB();
    const ids = db.wishlist[req.user.id] || [];
    const products = ids.map(id => db.products.find(p => p.id === id)).filter(Boolean);
    res.json(products);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/toggle/:productId', authMiddleware, (req, res) => {
  try {
    const db = readDB();
    if (!db.wishlist[req.user.id]) db.wishlist[req.user.id] = [];
    const idx = db.wishlist[req.user.id].indexOf(req.params.productId);
    let action;
    if (idx > -1) { db.wishlist[req.user.id].splice(idx, 1); action = 'removed'; }
    else { db.wishlist[req.user.id].push(req.params.productId); action = 'added'; }
    writeDB(db);
    res.json({ action, count: db.wishlist[req.user.id].length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
