const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../database');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    const db = readDB();
    if (db.users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = { id: uuidv4(), name, email, password: hashed, phone: phone || '', role: 'customer', address: {}, createdAt: new Date().toISOString() };
    db.users.push(user);
    writeDB(db);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const db = readDB();
    const user = db.users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/profile', authMiddleware, (req, res) => {
  try {
    const db = readDB();
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, address, currentPassword, newPassword } = req.body;
    const db = readDB();
    const idx = db.users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    if (name) db.users[idx].name = name;
    if (phone !== undefined) db.users[idx].phone = phone;
    if (address) db.users[idx].address = address;
    if (newPassword && currentPassword) {
      const valid = await bcrypt.compare(currentPassword, db.users[idx].password);
      if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
      db.users[idx].password = await bcrypt.hash(newPassword, 10);
    }
    writeDB(db);
    const { password, ...safeUser } = db.users[idx];
    res.json(safeUser);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;