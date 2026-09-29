// Đặt file này vào: <thư mục website>/js/api.js
const API = (() => {
  const BASE_URL = 'http://localhost:3000/api';
  const KEY = 'token';

  const getToken = () => localStorage.getItem(KEY) || sessionStorage.getItem(KEY);

  function saveToken(token, remember = true) {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    (remember ? localStorage : sessionStorage).setItem(KEY, token);
  }

  function logout() {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    window.location.href = 'dangnhap.html';
  }

  async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let res;
    try {
      res = await fetch(BASE_URL + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    } catch {
      throw new Error('Không kết nối được máy chủ.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Có lỗi xảy ra.');
    return data;
  }

  return {
    get: (p) => request('GET', p),
    post: (p, b) => request('POST', p, b),
    put: (p, b) => request('PUT', p, b),
    delete: (p) => request('DELETE', p),
    saveToken, getToken, logout
  };
})();
