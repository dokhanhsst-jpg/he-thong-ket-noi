const roleOptions = document.querySelectorAll('.role-option');
const registerForm = document.getElementById('registerForm');
const formMessage = document.getElementById('formMessage');
const areaSelect = document.getElementById('areaId');
const submitButton = registerForm.querySelector('[type="submit"]');
let selectedRole = document.querySelector('input[name="role"]:checked')?.value || 'customer';

function showMessage(message, type = '') {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
}

roleOptions.forEach((option) => {
  option.addEventListener('click', () => {
    roleOptions.forEach((item) => item.classList.remove('active'));
    option.classList.add('active');
    const roleInput = option.querySelector('input[name="role"]');
    if (roleInput) roleInput.checked = true;
    selectedRole = option.dataset.role || roleInput?.value || '';
  });
});

async function loadAreas() {
  try {
    const areas = await API.get('/khu-vuc');
    areaSelect.replaceChildren(new Option('Chọn khu vực', ''));
    areas.forEach((area) => areaSelect.add(new Option(area.ten, area.id)));
  } catch (error) {
    areaSelect.replaceChildren(new Option('Không tải được khu vực', ''));
    showMessage(error.message, 'error');
  }
}

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const areaId = Number(areaSelect.value);

  if (!name || !phone || !email) {
    showMessage('Vui lòng nhập đầy đủ họ tên, số điện thoại và email.', 'error');
    return;
  }
  if (password.length < 8) {
    showMessage('Mật khẩu phải có ít nhất 8 ký tự.', 'error');
    return;
  }
  if (password !== confirmPassword) {
    showMessage('Mật khẩu xác nhận không khớp.', 'error');
    return;
  }
  if (!areaId) {
    showMessage('Vui lòng chọn khu vực.', 'error');
    return;
  }

  if (!['customer', 'worker'].includes(selectedRole)) {
    showMessage('Vui lòng chọn vai trò (Khách hàng hoặc Thợ lành nghề).', 'error');
    return;
  }

  submitButton.disabled = true;
  showMessage('Đang tạo tài khoản...');

  try {
    const result = await API.post('/auth/register', {
      name,
      phone,
      email,
      areaId,
      password,
      role: selectedRole
    });

    API.saveToken(result.token);
    API.saveUser(result.user);
    showMessage('Đăng ký thành công. Đang chuyển trang...', 'success');
    window.location.href = result.user.role === 'worker' ? 'worker.html' : 'customer.html';
  } catch (error) {
    showMessage(error.message, 'error');
  } finally {
    submitButton.disabled = false;
  }
});

loadAreas();
