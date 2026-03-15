// js/components.js - Shared header, footer, product card HTML

function renderHeader() {
  const user = getUser();
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const nav = [
    { href: 'index.html', label: 'Home' },
    { href: 'shop.html', label: 'Shop' },
    { href: 'about.html', label: 'About' },
    { href: 'account.html', label: 'Account' }
  ];

  const header = document.getElementById('site-header');
  if (!header) return;
  header.innerHTML = `
    <a href="index.html" class="header-logo">VASTRA<span>.</span></a>
    <nav class="header-nav">
      ${nav.map(n => `<a href="${n.href}" class="${currentPage === n.href ? 'active' : ''}">${n.label}</a>`).join('')}
    </nav>
    <div class="header-search">
      <i class="fas fa-search search-icon"></i>
      <input type="text" id="header-search" placeholder="Search clothes, brands...">
      <div class="search-results-dropdown" id="search-dropdown"></div>
    </div>
    <div class="header-actions">
      <a href="wishlist.html" class="header-btn" title="Wishlist">
        <i class="far fa-heart"></i>
      </a>
      <a href="cart.html" class="header-btn" title="Cart">
        <i class="fas fa-bag-shopping"></i>
        <span class="cart-count">0</span>
      </a>
      ${user
        ? `<div class="user-dropdown-wrap" style="position:relative">
            <button class="header-btn" id="user-btn" title="${user.name}">
              <i class="fas fa-user-circle"></i>
            </button>
            <div id="user-dropdown" style="display:none;position:absolute;right:0;top:50px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow-lg);min-width:180px;z-index:999;overflow:hidden">
              <div style="padding:14px 16px;border-bottom:1px solid var(--border)">
                <div style="font-weight:600;font-size:14px">${user.name}</div>
                <div style="font-size:12px;color:var(--text-muted)">${user.email}</div>
              </div>
              <a href="account.html" style="display:flex;align-items:center;gap:10px;padding:12px 16px;text-decoration:none;color:var(--text);font-size:14px;transition:var(--transition)" onmouseover="this.style.background='var(--primary-light)'" onmouseout="this.style.background=''"><i class="fas fa-user" style="color:var(--text-muted);width:16px"></i> My Account</a>
              <a href="orders.html" style="display:flex;align-items:center;gap:10px;padding:12px 16px;text-decoration:none;color:var(--text);font-size:14px;transition:var(--transition)" onmouseover="this.style.background='var(--primary-light)'" onmouseout="this.style.background=''"><i class="fas fa-box" style="color:var(--text-muted);width:16px"></i> My Orders</a>
              ${user.role === 'admin' ? `<a href="admin.html" style="display:flex;align-items:center;gap:10px;padding:12px 16px;text-decoration:none;color:var(--text);font-size:14px" onmouseover="this.style.background='var(--primary-light)'" onmouseout="this.style.background=''"><i class="fas fa-chart-bar" style="color:var(--text-muted);width:16px"></i> Admin Panel</a>` : ''}
              <button onclick="logout()" style="display:flex;align-items:center;gap:10px;padding:12px 16px;width:100%;border:none;background:transparent;cursor:pointer;color:#e74c3c;font-size:14px;font-family:var(--font-body);border-top:1px solid var(--border)" onmouseover="this.style.background='#fef0f0'" onmouseout="this.style.background=''"><i class="fas fa-sign-out-alt" style="width:16px"></i> Logout</button>
            </div>
          </div>`
        : `<a href="login.html" class="btn btn-primary btn-sm">Login</a>`
      }
    </div>
  `;

  // Search logic
  let searchTimeout;
  const searchInput = document.getElementById('header-search');
  const dropdown = document.getElementById('search-dropdown');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      const q = searchInput.value.trim();
      if (!q) { dropdown.classList.remove('active'); return; }
      searchTimeout = setTimeout(async () => {
        try {
          const data = await apiCall(`/products?search=${encodeURIComponent(q)}&limit=6`);
          if (!data.products.length) { dropdown.classList.remove('active'); return; }
          dropdown.innerHTML = data.products.map(p => `
            <div class="search-result-item" onclick="location.href='product.html?id=${p.id}'">
              <img src="${p.img}" alt="${p.name}" onerror="this.style.display='none'">
              <div>
                <div class="sri-name">${p.name}</div>
                <div class="sri-price">${fmt(p.price)}</div>
              </div>
            </div>
          `).join('');
          dropdown.classList.add('active');
        } catch {}
      }, 300);
    });
    document.addEventListener('click', e => { if (!e.target.closest('.header-search')) dropdown.classList.remove('active'); });
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && searchInput.value.trim()) location.href = `shop.html?search=${encodeURIComponent(searchInput.value.trim())}`;
    });
  }

  // User dropdown toggle
  const userBtn = document.getElementById('user-btn');
  const userDropdown = document.getElementById('user-dropdown');
  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', e => { e.stopPropagation(); userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none'; });
    document.addEventListener('click', () => { if (userDropdown) userDropdown.style.display = 'none'; });
  }
}

function renderFooter() {
  const footer = document.getElementById('site-footer');
  if (!footer) return;
  footer.innerHTML = `
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="logo-text">VASTRA.</div>
        <p>Your ultimate fashion destination. Buy or rent premium ethnic and western wear at unbeatable prices.</p>
        <p><strong>Address:</strong> Knowledge Park 1, Greater Noida, UP</p>
        <p><strong>Phone:</strong> +91 9431509888</p>
        <p><strong>Hours:</strong> 10:00 AM – 10:00 PM, Mon–Sat</p>
        <div class="footer-social">
          <a href="#" class="social-icon"><i class="fab fa-facebook-f"></i></a>
          <a href="#" class="social-icon"><i class="fab fa-instagram"></i></a>
          <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a>
          <a href="#" class="social-icon"><i class="fab fa-pinterest"></i></a>
          <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a>
        </div>
      </div>
      <div class="footer-col">
        <h4>About</h4>
        <a href="about.html">About Us</a>
        <a href="#">Delivery Information</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Terms & Conditions</a>
        <a href="#">Contact Us</a>
      </div>
      <div class="footer-col">
        <h4>My Account</h4>
        <a href="login.html">Sign In</a>
        <a href="cart.html">View Cart</a>
        <a href="wishlist.html">My Wishlist</a>
        <a href="orders.html">Track My Order</a>
        <a href="#">Help & FAQ</a>
      </div>
      <div class="footer-col">
        <h4>Categories</h4>
        <a href="shop.html?category=men">Men's Fashion</a>
        <a href="shop.html?category=women">Women's Fashion</a>
        <a href="shop.html?category=boys">Boys' Wear</a>
        <a href="shop.html?category=girls">Girls' Wear</a>
        <a href="shop.html?sort=popular">Best Sellers</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© 2025 Vastra.com — All rights reserved</p>
      <div style="display:flex;gap:20px">
        <a href="#" style="color:rgba(255,255,255,0.4);font-size:13px;text-decoration:none">Privacy</a>
        <a href="#" style="color:rgba(255,255,255,0.4);font-size:13px;text-decoration:none">Terms</a>
        <a href="#" style="color:rgba(255,255,255,0.4);font-size:13px;text-decoration:none">Sitemap</a>
      </div>
    </div>
  `;
}

function productCardHTML(p) {
  return `
    <div class="product-card" onclick="location.href='product.html?id=${p.id}'">
      ${badgeHTML(p.badge)}
      <button class="wishlist-btn" onclick="event.stopPropagation();toggleWishlist('${p.id}',this)" title="Add to wishlist">
        <i class="far fa-heart"></i>
      </button>
      <div class="img-wrap">
        <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x400/f5f5f0/088178?text=No+Image'">
        <div class="card-overlay">
          <button class="overlay-btn buy" onclick="event.stopPropagation();quickAddToCart('${p.id}','buy')">
            <i class="fas fa-bag-shopping"></i> Buy ₹${p.price.toLocaleString('en-IN')}
          </button>
          <button class="overlay-btn rent" onclick="event.stopPropagation();quickAddToCart('${p.id}','rent')">
            <i class="fas fa-calendar-alt"></i> Rent ₹${p.rentPrice}
          </button>
        </div>
      </div>
      <div class="card-info">
        <div class="brand">${p.brand}</div>
        <div class="prod-name">${p.name}</div>
        <div class="stars">${stars(p.rating)}<span>(${p.reviews})</span></div>
        <div class="prices">
          <span class="price">${fmt(p.price)}</span>
          <span class="rent-price">Rent ₹${p.rentPrice}/day</span>
        </div>
      </div>
    </div>
  `;
}

async function toggleWishlist(productId, btn) {
  if (!isLoggedIn()) { toast('Please login to save items', 'info'); location.href = 'login.html'; return; }
  try {
    const res = await apiCall(`/wishlist/toggle/${productId}`, 'POST');
    const icon = btn.querySelector('i');
    if (res.action === 'added') { icon.className = 'fas fa-heart'; btn.style.color = 'var(--accent)'; toast('Added to wishlist ♥'); }
    else { icon.className = 'far fa-heart'; btn.style.color = ''; toast('Removed from wishlist'); }
  } catch (e) { toast(e.message, 'error'); }
}

async function quickAddToCart(productId, type) {
  if (!isLoggedIn()) { toast('Please login to add to cart', 'info'); location.href = 'login.html'; return; }
  try {
    await apiCall('/cart/add', 'POST', { productId, qty: 1, type });
    toast(`Added to cart! ${type === 'rent' ? '(Rental)' : ''}`, 'success');
    refreshCartCount();
  } catch (e) { toast(e.message, 'error'); }
}

function logout() {
  clearAuth();
  toast('Logged out successfully');
  setTimeout(() => location.href = 'index.html', 800);
}

// Auto-render on load
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  refreshCartCount();
});
