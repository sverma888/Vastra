// ============================================
// VASTRA - Core Frontend JavaScript
// ============================================

const API = '/api';

// ---- State ----
const state = {
  user: null,
  cart: { items: [], total: 0 },
  wishlist: [],
  token: localStorage.getItem('vastra_token'),
};

// ---- API Helper ----
async function api(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  try {
    const res = await fetch(`${API}${endpoint}`, { ...options, headers: { ...headers, ...options.headers } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  } catch (err) {
    throw err;
  }
}

// ---- Toast ----
function toast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type] || '•'}</span><span>${message}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(10px)'; t.style.transition = 'all 0.3s'; setTimeout(() => t.remove(), 300); }, duration);
}

// ---- Auth ----
async function initAuth() {
  if (!state.token) return updateAuthUI();
  try {
    const data = await api('/auth/me');
    state.user = data.user;
    updateAuthUI();
    if (state.user) await loadCart();
    if (state.user) await loadWishlist();
  } catch {
    state.token = null;
    localStorage.removeItem('vastra_token');
    updateAuthUI();
  }
}

function updateAuthUI() {
  const authButtons = document.getElementById('auth-buttons');
  const userMenu = document.getElementById('user-menu');
  const cartBadge = document.getElementById('cart-badge');
  if (!authButtons && !userMenu) return;
  if (state.user) {
    if (authButtons) authButtons.classList.add('hidden');
    if (userMenu) {
      userMenu.classList.remove('hidden');
      const nameEl = userMenu.querySelector('.user-name');
      if (nameEl) nameEl.textContent = state.user.name.split(' ')[0];
      const adminLink = userMenu.querySelector('.admin-link');
      if (adminLink) adminLink.style.display = state.user.role === 'admin' ? 'flex' : 'none';
    }
  } else {
    if (authButtons) authButtons.classList.remove('hidden');
    if (userMenu) userMenu.classList.add('hidden');
  }
  if (cartBadge) {
    const count = state.cart.items.reduce((s, i) => s + i.quantity, 0);
    cartBadge.textContent = count;
    cartBadge.style.display = count > 0 ? 'flex' : 'none';
  }
}

async function login(email, password) {
  const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  state.token = data.token;
  state.user = data.user;
  localStorage.setItem('vastra_token', data.token);
  updateAuthUI();
  await loadCart();
  await loadWishlist();
  return data;
}

async function register(name, email, password, phone) {
  const data = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, phone }) });
  state.token = data.token;
  state.user = data.user;
  localStorage.setItem('vastra_token', data.token);
  updateAuthUI();
  return data;
}

function logout() {
  state.token = null;
  state.user = null;
  state.cart = { items: [], total: 0 };
  state.wishlist = [];
  localStorage.removeItem('vastra_token');
  updateAuthUI();
  updateCartUI();
  toast('Logged out successfully', 'info');
  setTimeout(() => window.location.href = '/', 500);
}

// ---- Cart ----
async function loadCart() {
  if (!state.user) return;
  try {
    const data = await api('/cart');
    state.cart = data.cart || { items: [] };
    state.cart.total = data.total || 0;
    updateCartUI();
  } catch (err) { console.error('Cart load error:', err); }
}

async function addToCart(productId, options = {}) {
  if (!state.user) { openLoginModal(); toast('Please login to add items to cart', 'warning'); return; }
  try {
    const data = await api('/cart/add', { method: 'POST', body: JSON.stringify({ productId, ...options }) });
    state.cart = data.cart;
    await loadCart();
    toast('Added to cart! 🛍️', 'success');
    openCart();
  } catch (err) { toast(err.message, 'error'); }
}

async function updateCartItem(itemId, quantity) {
  try {
    const data = await api(`/cart/update/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) });
    state.cart = data.cart;
    await loadCart();
  } catch (err) { toast(err.message, 'error'); }
}

async function removeFromCart(itemId) {
  try {
    await api(`/cart/remove/${itemId}`, { method: 'DELETE' });
    await loadCart();
    toast('Removed from cart', 'info');
  } catch (err) { toast(err.message, 'error'); }
}

function updateCartUI() {
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  const cartBadge = document.getElementById('cart-badge');
  const cartCount = document.getElementById('cart-count');
  const items = state.cart?.items || [];
  const count = items.reduce((s, i) => s + i.quantity, 0);

  if (cartBadge) { cartBadge.textContent = count; cartBadge.style.display = count > 0 ? 'flex' : 'none'; }
  if (cartCount) cartCount.textContent = `${count} item${count !== 1 ? 's' : ''}`;

  if (!cartItems) return;
  if (items.length === 0) {
    cartItems.innerHTML = `<div class="cart-empty"><i class="fa-solid fa-bag-shopping"></i><p>Your cart is empty</p><a href="/pages/shop.html" class="btn btn-primary btn-sm" style="margin-top:16px">Browse Products</a></div>`;
  } else {
    cartItems.innerHTML = items.map(item => {
      const product = item.product || {};
      const price = item.orderType === 'rent' ? (product.rentPrice || product.price * 0.1) * item.rentDays : product.price;
      const img = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : 'img/placeholder.jpg';
      return `
        <div class="cart-item" data-item-id="${item._id}">
          <img src="${img}" alt="${product.name || ''}" onerror="this.src='img/placeholder.jpg'">
          <div class="cart-item-info">
            <div class="cart-item-name">${product.name || 'Product'}</div>
            <div class="cart-item-meta">${item.size ? 'Size: ' + item.size : ''} ${item.orderType === 'rent' ? `• Rent ${item.rentDays}d` : ''}</div>
            <div class="cart-item-price">₹${Math.round(price * item.quantity).toLocaleString('en-IN')}</div>
            <div class="qty-control">
              <button class="qty-btn" onclick="updateCartItem('${item._id}', ${item.quantity - 1})">−</button>
              <span class="qty-num">${item.quantity}</span>
              <button class="qty-btn" onclick="updateCartItem('${item._id}', ${item.quantity + 1})">+</button>
              <button class="cart-remove" onclick="removeFromCart('${item._id}')">Remove</button>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  const subtotal = state.cart.total || 0;
  const shipping = subtotal > 999 ? 0 : 49;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  if (cartTotal) cartTotal.innerHTML = `
    <div class="cart-total-row"><span>Subtotal</span><span>₹${Math.round(subtotal).toLocaleString('en-IN')}</span></div>
    <div class="cart-total-row"><span>Shipping</span><span>${shipping === 0 ? '<span style="color:var(--success)">Free</span>' : '₹' + shipping}</span></div>
    <div class="cart-total-row"><span>GST (18%)</span><span>₹${tax.toLocaleString('en-IN')}</span></div>
    <div class="cart-total-row grand-total"><span>Total</span><span>₹${Math.round(total).toLocaleString('en-IN')}</span></div>`;
}

// ---- Cart Sidebar ----
function openCart() {
  document.getElementById('cart-sidebar')?.classList.add('open');
  document.getElementById('cart-overlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-sidebar')?.classList.remove('open');
  document.getElementById('cart-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

// ---- Wishlist ----
async function loadWishlist() {
  if (!state.user) return;
  try {
    const data = await api('/wishlist');
    state.wishlist = data.wishlist.map(p => p._id || p);
    updateWishlistUI();
  } catch (err) { console.error('Wishlist load error:', err); }
}

async function toggleWishlist(productId) {
  if (!state.user) { openLoginModal(); toast('Please login to save items', 'warning'); return; }
  try {
    const data = await api(`/wishlist/toggle/${productId}`, { method: 'POST' });
    state.wishlist = data.wishlist;
    updateWishlistUI();
    toast(data.added ? 'Added to wishlist ❤️' : 'Removed from wishlist', data.added ? 'success' : 'info');
  } catch (err) { toast(err.message, 'error'); }
}

function updateWishlistUI() {
  document.querySelectorAll('[data-wishlist-btn]').forEach(btn => {
    const pid = btn.dataset.productId;
    const isWishlisted = state.wishlist.includes(pid);
    btn.classList.toggle('wishlisted', isWishlisted);
    btn.innerHTML = isWishlisted ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>';
  });
}

// ---- Auth Modals ----
function openLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) modal.classList.add('hidden');
}

function switchToRegister() {
  document.getElementById('login-modal')?.classList.add('hidden');
  document.getElementById('register-modal')?.classList.remove('hidden');
}

function switchToLogin() {
  document.getElementById('register-modal')?.classList.add('hidden');
  document.getElementById('login-modal')?.classList.remove('hidden');
}

// ---- Products ----
async function fetchProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  return await api(`/products${query ? '?' + query : ''}`);
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let html = '';
  for (let i = 0; i < 5; i++) {
    if (i < full) html += '<i class="fa-solid fa-star"></i>';
    else if (i === full && half) html += '<i class="fa-solid fa-star-half-stroke"></i>';
    else html += '<i class="fa-regular fa-star"></i>';
  }
  return html;
}

function renderProductCard(p) {
  const discountedPrice = p.price - (p.price * p.discount / 100);
  const isWishlisted = state.wishlist.includes(p._id);
  return `
    <div class="product-card" data-product-id="${p._id}">
      <div class="card-image">
        <a href="/pages/product.html?id=${p._id}">
          <img src="${p.images?.[0] || 'img/placeholder.jpg'}" alt="${p.name}" loading="lazy" onerror="this.src='img/placeholder.jpg'">
        </a>
        ${p.discount > 0 ? `<div class="card-badge"><span class="badge badge-danger">-${p.discount}%</span></div>` : ''}
        ${p.isRentable ? `<div style="position:absolute;bottom:12px;left:12px"><span class="badge badge-accent">Rentable</span></div>` : ''}
        <div class="card-actions">
          <button class="card-action-btn ${isWishlisted ? 'wishlisted' : ''}" data-wishlist-btn data-product-id="${p._id}" onclick="toggleWishlist('${p._id}')" title="Wishlist">
            ${isWishlisted ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>'}
          </button>
          <a href="/pages/product.html?id=${p._id}" class="card-action-btn" title="Quick View"><i class="fa-regular fa-eye"></i></a>
        </div>
      </div>
      <div class="card-body">
        <div class="card-brand">${p.brand}</div>
        <div class="card-name">${p.name}</div>
        <div class="card-rating">
          <span class="stars">${renderStars(p.rating || 0)}</span>
          <span>(${p.numReviews || 0})</span>
        </div>
        <div class="card-price">
          <span class="price-now">₹${Math.round(discountedPrice).toLocaleString('en-IN')}</span>
          ${p.discount > 0 ? `<span class="price-old">₹${p.price.toLocaleString('en-IN')}</span>` : ''}
          ${p.isRentable && p.rentPrice ? `<span class="price-rent">Rent ₹${p.rentPrice}/day</span>` : ''}
        </div>
        <div class="card-footer">
          <button class="btn btn-primary btn-sm" onclick="addToCart('${p._id}', {quantity:1})">
            <i class="fa-solid fa-bag-shopping"></i> Add
          </button>
          ${p.isRentable ? `<button class="btn btn-outline btn-sm" onclick="addToCart('${p._id}', {orderType:'rent',rentDays:1})">Rent</button>` : ''}
        </div>
      </div>
    </div>`;
}

// ---- Header Mobile ----
function toggleMobileMenu() {
  document.getElementById('navbar')?.classList.toggle('open');
}

// ---- User Dropdown ----
function toggleUserDropdown() {
  const dd = document.getElementById('user-dropdown');
  if (dd) dd.classList.toggle('hidden');
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();

  // Cart button
  document.getElementById('cart-btn')?.addEventListener('click', openCart);
  document.getElementById('cart-close')?.addEventListener('click', closeCart);
  document.getElementById('cart-overlay')?.addEventListener('click', closeCart);

  // User dropdown
  document.getElementById('user-btn')?.addEventListener('click', (e) => { e.stopPropagation(); toggleUserDropdown(); });
  document.addEventListener('click', (e) => {
    const dd = document.getElementById('user-dropdown');
    if (dd && !dd.contains(e.target) && e.target.id !== 'user-btn') dd.classList.add('hidden');
  });

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', logout);

  // Auth modals
  document.getElementById('open-login')?.addEventListener('click', (e) => { e.preventDefault(); openLoginModal(); });
  document.getElementById('modal-login-close')?.addEventListener('click', closeLoginModal);
  document.getElementById('modal-register-close')?.addEventListener('click', () => document.getElementById('register-modal')?.classList.add('hidden'));

  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.querySelector('[id$="-modal"]')?.classList.add('hidden'); });
  });

  // Login form
  const loginForm = document.getElementById('login-form');
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('[type=submit]');
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
    try {
      const email = loginForm.querySelector('[name=email]').value;
      const password = loginForm.querySelector('[name=password]').value;
      await login(email, password);
      closeLoginModal();
      toast(`Welcome back, ${state.user.name}! 👋`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally { btn.disabled = false; btn.textContent = 'Login'; }
  });

  // Register form
  const regForm = document.getElementById('register-form');
  regForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = regForm.querySelector('[type=submit]');
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
    try {
      const name = regForm.querySelector('[name=name]').value;
      const email = regForm.querySelector('[name=email]').value;
      const password = regForm.querySelector('[name=password]').value;
      const phone = regForm.querySelector('[name=phone]').value;
      await register(name, email, password, phone);
      document.getElementById('register-modal')?.classList.add('hidden');
      toast(`Welcome to Vastra, ${state.user.name}! 🎉`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally { btn.disabled = false; btn.textContent = 'Create Account'; }
  });

  // Mobile menu
  document.getElementById('mobile-menu-btn')?.addEventListener('click', toggleMobileMenu);

  // Newsletter
  document.getElementById('newsletter-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    toast('Subscribed! 🎉 Check your email for offers', 'success');
    e.target.reset();
  });

  // Checkout btn
  document.getElementById('checkout-btn')?.addEventListener('click', () => {
    if (!state.user) { closeCart(); openLoginModal(); toast('Please login to checkout', 'warning'); return; }
    if (!state.cart?.items?.length) { toast('Your cart is empty', 'warning'); return; }
    window.location.href = '/pages/checkout.html';
  });

  // Search
  const searchInput = document.getElementById('search-input');
  let searchTimeout;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const q = e.target.value.trim();
      if (q.length > 2) window.location.href = `/pages/shop.html?search=${encodeURIComponent(q)}`;
    }, 600);
  });
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim();
      if (q) window.location.href = `/pages/shop.html?search=${encodeURIComponent(q)}`;
    }
  });
});
