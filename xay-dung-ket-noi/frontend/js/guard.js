(function () {
  const need = document.currentScript.dataset.role;
  const u = getUser();
  if (!getToken() || !u) { location.href = 'dangnhap.html'; return; }
  if (need && u.role !== need) location.href = homeOf(u.role);
})();
