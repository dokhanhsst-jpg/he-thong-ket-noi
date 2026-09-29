// js/api.js — lớp gọi API dùng chung cho toàn bộ frontend.
// Khớp với cách gọi đã có sẵn trong dangnhap.html / register.html:
//   API.get(path), API.post(path, body), API.saveToken(token, remember)
const API = (() => {
  const BASE = 'http://localhost:3000/api';
  const TOKEN_KEY = 'xdkn_token';
  const USER_KEY = 'xdkn_user';

  const store = (remember) => (remember === false ? sessionStorage : localStorage);
  const other = (remember) => (remember === false ? localStorage : sessionStorage);

  function saveToken(token, remember = true) {
    store(remember).setItem(TOKEN_KEY, token);
    other(remember).removeItem(TOKEN_KEY);
  }
  function saveUser(user, remember = true) {
    store(remember).setItem(USER_KEY, JSON.stringify(user));
    other(remember).removeItem(USER_KEY);
  }
  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  }
  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  }
  function clear() {
    [localStorage, sessionStorage].forEach((s) => { s.removeItem(TOKEN_KEY); s.removeItem(USER_KEY); });
  }
  function logout() {
    clear();
    location.href = 'dangnhap.html';
  }

  async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    let res;
    try {
      res = await fetch(BASE + path, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
    } catch {
      throw new Error('Không kết nối được máy chủ. Kiểm tra backend đang chạy ở cổng 3000.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) clear();
      throw new Error(data.message || data.error || `Lỗi ${res.status}`);
    }
    return data;
  }

  // Hiển thị trạng thái đăng nhập lên vùng có id="navActions" (nếu trang có).
  // roleNeeded: 'customer' | 'worker' | null (null = trang công khai, ai cũng xem được)
  function initNav(roleNeeded) {
    const box = document.getElementById('navActions');
    const user = getUser();
    const token = getToken();

    if (roleNeeded && (!token || !user)) {
      location.href = 'dangnhap.html';
      return null;
    }
    if (roleNeeded && user && user.role !== roleNeeded) {
      location.href = user.role === 'worker' ? 'skilled-worker.html' : 'customer.html';
      return null;
    }
    if (box) {
      if (user && token) {
        const homeLink = user.role === 'worker' ? 'skilled-worker.html' : 'customer.html';
        box.innerHTML =
          `<a href="${homeLink}" class="btn btn-secondary">${escapeHtml(user.name || 'Tài khoản')}</a>` +
          `<a href="#" class="btn btn-primary" id="btnLogout">Đăng xuất</a>`;
        const btn = document.getElementById('btnLogout');
        if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); logout(); });
      }
    }
    return user;
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    put: (path, body) => request('PUT', path, body),
    del: (path) => request('DELETE', path),
    saveToken, saveUser, getToken, getUser, clear, logout, initNav, escapeHtml
  };
})();
