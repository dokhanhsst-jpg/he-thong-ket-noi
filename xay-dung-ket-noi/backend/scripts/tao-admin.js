// Tạo tài khoản đăng nhập ADMIN cho website (lưu trong bảng nguoi_dung, mật khẩu đã mã hóa bcrypt)
// Cách chạy:  node scripts/tao-admin.js admin@xaydung.vn 0900000000 "MatKhauAdmin#2026"
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

(async () => {
  const [email, sdt, matKhau] = process.argv.slice(2);
  if (!email || !sdt || !matKhau) {
    console.log('Cú pháp: node scripts/tao-admin.js <email> <sdt 10 số> "<mật khẩu>"');
    process.exit(1);
  }
  if (matKhau.length < 8) { console.log('Mật khẩu phải từ 8 ký tự.'); process.exit(1); }

  const [[kv]] = await db.query('SELECT id FROM khu_vuc ORDER BY id LIMIT 1');
  const hash = await bcrypt.hash(matKhau, 10);
  await db.query(
    `INSERT INTO nguoi_dung (ten, sdt, email, mat_khau_hash, vai_tro, khu_vuc_id, email_da_xac_thuc)
     VALUES ('Quản trị viên', ?, ?, ?, 'admin', ?, 1)`,
    [sdt, email.toLowerCase(), hash, kv.id]
  );
  console.log('Đã tạo admin:', email);
  process.exit(0);
})().catch(e => { console.error('Lỗi:', e.message); process.exit(1); });
