const express = require('express');
const cors = require('cors');
const path = require('path');
const { readDB, writeDB, initDB } = require('./database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

initDB();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/admin',    require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/coupon/validate', (req, res) => {
  const { code, subtotal } = req.body;
  const coupons = {
    'VASTRA10': { discount: 0.10, description: '10% off',   minOrder: 500  },
    'FIRST20':  { discount: 0.20, description: '20% off',   minOrder: 1000 },
    'FLAT200':  { discount: 200,  type: 'flat', description: '₹200 off', minOrder: 1500 },
    'SAVE50':   { discount: 0.50, description: '50% off',   minOrder: 2000 }
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
  const db = readDB();
  if (!db.newsletter.includes(email)) { db.newsletter.push(email); writeDB(db); }
  res.json({ message: 'Subscribed successfully!' });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  const fs = require('fs');
  const pages = ['shop','login','register','account','cart','checkout','about','product','orders','admin','wishlist'];
  const page = pages.find(p => req.path.includes(p));
  const file = page ? page + '.html' : 'index.html';
  const filePath = path.join(__dirname, '../frontend', file);
  if (fs.existsSync(filePath)) res.sendFile(filePath);
  else res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Auto-seed if database is empty
async function autoSeed() {
  const db = readDB();
  if (db.products.length > 0) return;
  console.log('Seeding database...');
  const products = [
    { id: uuidv4(), brand: "Peter England", name: "Navy Blue 3-Piece Suit Set For Mens", price: 9999, rentPrice: 999, category: "men", subcategory: "suits", img: "img/MEN/10.jpg", rating: 5, reviews: 128, stock: 15, sizes: ["S","M","L","XL","XXL"], colors: ["Navy Blue"], description: "Premium 3-piece suit perfect for formal occasions.", badge: "bestseller" },
    { id: uuidv4(), brand: "Red Tape", name: "Men Black Leather Flat Boots", price: 2799, rentPrice: 299, category: "men", subcategory: "footwear", img: "img/MEN/5.jpg", rating: 4, reviews: 87, stock: 22, sizes: ["7","8","9","10","11"], colors: ["Black"], description: "Durable leather boots for casual and semi-formal outings.", badge: "new" },
    { id: uuidv4(), brand: "Arrow", name: "Men Slim Fit Formal Shirt White", price: 1299, rentPrice: 149, category: "men", subcategory: "shirts", img: "img/MEN/1.jpg", rating: 4, reviews: 214, stock: 40, sizes: ["S","M","L","XL"], colors: ["White","Blue","Grey"], description: "Classic slim-fit formal shirt for office and events.", badge: "" },
    { id: uuidv4(), brand: "Levi's", name: "Men 511 Slim Fit Jeans Dark Blue", price: 2499, rentPrice: 249, category: "men", subcategory: "jeans", img: "img/MEN/2.jpg", rating: 5, reviews: 340, stock: 55, sizes: ["28","30","32","34","36"], colors: ["Dark Blue","Black"], description: "The iconic slim fit jeans built for all-day comfort.", badge: "trending" },
    { id: uuidv4(), brand: "Nike", name: "Men Air Max Running Shoes", price: 5499, rentPrice: 549, category: "men", subcategory: "footwear", img: "img/MEN/3.jpg", rating: 5, reviews: 192, stock: 18, sizes: ["7","8","9","10","11"], colors: ["White/Black","Grey"], description: "Lightweight Air Max sneakers for running and casual wear.", badge: "hot" },
    { id: uuidv4(), brand: "Manyavar", name: "Men Silk Kurta Set Golden", price: 4599, rentPrice: 459, category: "men", subcategory: "ethnic", img: "img/MEN/4.jpg", rating: 5, reviews: 76, stock: 12, sizes: ["S","M","L","XL","XXL"], colors: ["Golden","Maroon","Green"], description: "Elegant silk kurta set for weddings and festive occasions.", badge: "bestseller" },
    { id: uuidv4(), brand: "Van Heusen", name: "Men Chino Trousers Beige", price: 1799, rentPrice: 179, category: "men", subcategory: "trousers", img: "img/MEN/6.jpg", rating: 4, reviews: 156, stock: 35, sizes: ["28","30","32","34","36"], colors: ["Beige","Olive","Navy"], description: "Smart casual chinos perfect for a business casual look.", badge: "" },
    { id: uuidv4(), brand: "Puma", name: "Men Dry Cell Sports T-Shirt", price: 999, rentPrice: 99, category: "men", subcategory: "tshirts", img: "img/MEN/7.jpg", rating: 4, reviews: 289, stock: 60, sizes: ["S","M","L","XL","XXL"], colors: ["Black","Blue","Red"], description: "Moisture-wicking sport tee for gym and outdoor activities.", badge: "sale" },
    { id: uuidv4(), brand: "Blackberrys", name: "Men Wool Blend Overcoat Charcoal", price: 7499, rentPrice: 749, category: "men", subcategory: "jackets", img: "img/MEN/8.jpg", rating: 5, reviews: 43, stock: 8, sizes: ["M","L","XL","XXL"], colors: ["Charcoal","Black"], description: "Luxurious wool blend overcoat for cold winters.", badge: "premium" },
    { id: uuidv4(), brand: "Wrangler", name: "Men Regular Fit Denim Shirt", price: 1599, rentPrice: 159, category: "men", subcategory: "shirts", img: "img/MEN/9.jpg", rating: 4, reviews: 112, stock: 28, sizes: ["S","M","L","XL"], colors: ["Blue","Grey"], description: "Classic denim shirt for a rugged casual look.", badge: "" },
    { id: uuidv4(), brand: "Udbhav Export", name: "Purple Semi Stitched Lehenga Choli", price: 4999, rentPrice: 499, category: "women", subcategory: "ethnic", img: "img/WOMEN/7.jpg", rating: 5, reviews: 165, stock: 10, sizes: ["XS","S","M","L","XL"], colors: ["Purple","Pink","Blue"], description: "Stunning semi-stitched lehenga choli with intricate embroidery.", badge: "bestseller" },
    { id: uuidv4(), brand: "Lino Perros", name: "Rhinestones Embellished Party Block Heels", price: 1899, rentPrice: 199, category: "women", subcategory: "footwear", img: "img/WOMEN/10.jpg", rating: 4, reviews: 98, stock: 20, sizes: ["4","5","6","7","8"], colors: ["Gold","Silver","Black"], description: "Glamorous block heels adorned with rhinestones for parties.", badge: "new" },
    { id: uuidv4(), brand: "W for Woman", name: "Women Floral Print Anarkali Kurta", price: 1699, rentPrice: 169, category: "women", subcategory: "ethnic", img: "img/WOMEN/1.jpg", rating: 4, reviews: 234, stock: 30, sizes: ["XS","S","M","L","XL","XXL"], colors: ["Pink","Green","Yellow"], description: "Elegant floral print anarkali that flares beautifully.", badge: "" },
    { id: uuidv4(), brand: "H&M", name: "Women Slim Fit Blazer Black", price: 2999, rentPrice: 299, category: "women", subcategory: "westernwear", img: "img/WOMEN/2.jpg", rating: 5, reviews: 178, stock: 22, sizes: ["XS","S","M","L","XL"], colors: ["Black","White","Camel"], description: "Sharp slim-fit blazer for a powerful professional look.", badge: "trending" },
    { id: uuidv4(), brand: "Biba", name: "Women Cotton Palazzo Set", price: 1399, rentPrice: 139, category: "women", subcategory: "ethnic", img: "img/WOMEN/3.jpg", rating: 4, reviews: 310, stock: 45, sizes: ["XS","S","M","L","XL","XXL"], colors: ["Teal","Coral","White"], description: "Breezy cotton palazzo set perfect for summer outings.", badge: "sale" },
    { id: uuidv4(), brand: "Nykaa Fashion", name: "Women Bodycon Mini Dress Red", price: 1599, rentPrice: 159, category: "women", subcategory: "westernwear", img: "img/WOMEN/4.jpg", rating: 4, reviews: 89, stock: 16, sizes: ["XS","S","M","L"], colors: ["Red","Black","White"], description: "Chic bodycon mini dress for nights out.", badge: "hot" },
    { id: uuidv4(), brand: "Fabindia", name: "Women Hand Block Print Silk Saree", price: 5999, rentPrice: 599, category: "women", subcategory: "sarees", img: "img/WOMEN/6.jpg", rating: 5, reviews: 57, stock: 8, sizes: ["Free Size"], colors: ["Mustard","Indigo","Red"], description: "Handcrafted block print silk saree.", badge: "premium" },
    { id: uuidv4(), brand: "YK", name: "Black 5-Piece Suit Set For Boys", price: 2999, rentPrice: 299, category: "boys", subcategory: "suits", img: "img/BOY'S/6.jpg", rating: 5, reviews: 93, stock: 18, sizes: ["2-3Y","3-4Y","4-5Y","5-6Y","6-7Y","7-8Y"], colors: ["Black","Navy","Cream"], description: "Adorable 5-piece suit set for little gentlemen at weddings.", badge: "bestseller" },
    { id: uuidv4(), brand: "Firstcry", name: "Boys Graphic Print Hoodie Blue", price: 799, rentPrice: 79, category: "boys", subcategory: "hoodies", img: "img/BOY'S/1.jpg", rating: 4, reviews: 167, stock: 40, sizes: ["2-3Y","4-5Y","6-7Y","8-9Y","10-11Y"], colors: ["Blue","Grey","Red"], description: "Super soft hoodie with cool graphic print for boys.", badge: "" },
    { id: uuidv4(), brand: "Adidas Kids", name: "Boys Sports Running Shoes", price: 1999, rentPrice: 199, category: "boys", subcategory: "footwear", img: "img/BOY'S/4.jpg", rating: 5, reviews: 204, stock: 28, sizes: ["1","2","3","4","5"], colors: ["White/Blue","Black/Red"], description: "Lightweight sports shoes for the active young athlete.", badge: "trending" },
    { id: uuidv4(), brand: "Manyavar Kids", name: "Boys Kurta Pyjama Set Yellow", price: 1299, rentPrice: 129, category: "boys", subcategory: "ethnic", img: "img/BOY'S/5.jpg", rating: 5, reviews: 71, stock: 20, sizes: ["2-3Y","4-5Y","6-7Y"], colors: ["Yellow","Peach","Green"], description: "Festive kurta pyjama for Diwali, Eid and weddings.", badge: "hot" },
    { id: uuidv4(), brand: "One Friday", name: "Girls Round Neck Party Dress Pink", price: 3999, rentPrice: 399, category: "girls", subcategory: "dresses", img: "img/GIRL'S/2.jpg", rating: 5, reviews: 145, stock: 16, sizes: ["2-3Y","4-5Y","6-7Y"], colors: ["Pink","Lavender","Yellow"], description: "Beautiful party dress perfect for birthdays and celebrations.", badge: "bestseller" },
    { id: uuidv4(), brand: "N.L.ENTERPRISES", name: "Velcro Wedges For Girls White", price: 599, rentPrice: 59, category: "girls", subcategory: "footwear", img: "img/GIRL'S/10.jpg", rating: 4, reviews: 78, stock: 30, sizes: ["1","2","3","4","5"], colors: ["White","Pink","Gold"], description: "Cute velcro wedges for little divas.", badge: "" },
    { id: uuidv4(), brand: "PSPEACHES", name: "Girls Polyester Readymade Lehenga Choli", price: 1599, rentPrice: 159, category: "girls", subcategory: "ethnic", img: "img/GIRL'S/5.jpg", rating: 5, reviews: 121, stock: 18, sizes: ["2-3Y","4-5Y","6-7Y"], colors: ["Red","Pink","Green"], description: "Gorgeous readymade lehenga choli for festive occasions.", badge: "trending" },
    { id: uuidv4(), brand: "XMARTY WEARS", name: "Black Girls Long Boots", price: 899, rentPrice: 89, category: "girls", subcategory: "footwear", img: "img/GIRL'S/9.jpg", rating: 4, reviews: 54, stock: 18, sizes: ["1","2","3","4","5"], colors: ["Black","Brown"], description: "Sleek long boots to complete any outfit look.", badge: "hot" }
  ];
  db.products = products;
  if (db.users.length === 0) {
    const adminPass = await bcrypt.hash('admin123', 10);
    const demoPass  = await bcrypt.hash('demo123', 10);
    db.users = [
      { id: uuidv4(), name: 'Admin User',    email: 'admin@vastra.com', password: adminPass, role: 'admin',    phone: '+91 9431509888', address: {}, createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'Demo Customer', email: 'demo@vastra.com',  password: demoPass,  role: 'customer', phone: '+91 9876543210', address: {}, createdAt: new Date().toISOString() }
    ];
  }
  writeDB(db);
  console.log('✅ Database seeded automatically');
}

autoSeed();

app.listen(PORT, () => console.log(`✅ Vastra server running on http://localhost:${PORT}`));