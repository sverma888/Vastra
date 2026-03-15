// js/api.js - Central API client for all Vastra pages
// const API = 'http://localhost:5000/api';
const API = window.location.origin + '/api';

function getToken() { return localStorage.getItem('vastra_token'); }
function getUser() { const u = localStorage.getItem('vastra_user'); return u ? JSON.parse(u) : null; }
function setAuth(token, user) { localStorage.setItem('vastra_token', token); localStorage.setItem('vastra_user', JSON.stringify(user)); }
function clearAuth() { localStorage.removeItem('vastra_token'); localStorage.removeItem('vastra_user'); }
function isLoggedIn() { return !!getToken(); }

async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (getToken()) headers['Authorization'] = `Bearer ${getToken()}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + endpoint, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Format price in INR
function fmt(price) { return '₹' + price.toLocaleString('en-IN'); }

// Show toast notification
function toast(msg, type = 'success') {
  const existing = document.querySelectorAll('.vastra-toast');
  existing.forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = `vastra-toast vastra-toast--${type}`;
  el.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span> ${msg}`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3000);
}

// Update cart badge count in header
async function refreshCartCount() {
  if (!isLoggedIn()) return;
  try {
    const cart = await apiCall('/cart');
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = cart.count || 0;
      el.style.display = cart.count > 0 ? 'flex' : 'none';
    });
  } catch {}
}

// Render star rating HTML
function stars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) html += '<i class="fas fa-star"></i>';
    else if (i - 0.5 <= rating) html += '<i class="fas fa-star-half-alt"></i>';
    else html += '<i class="far fa-star"></i>';
  }
  return html;
}

// Badge label
function badgeHTML(badge) {
  if (!badge) return '';
  const map = { bestseller: '🏆 Bestseller', trending: '🔥 Trending', hot: '⚡ Hot', new: '✨ New', sale: '🏷️ Sale', premium: '👑 Premium' };
  return `<span class="prod-badge prod-badge--${badge}">${map[badge] || badge}</span>`;
}
