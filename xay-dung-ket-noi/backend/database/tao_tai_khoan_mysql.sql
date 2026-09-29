-- =====================================================================
--  TẠO TÀI KHOẢN MYSQL CHO ỨNG DỤNG  (chạy bằng tài khoản root trong Workbench)
--  Chạy SAU khi đã chạy schema.sql
--  !! Đổi 2 mật khẩu bên dưới trước khi chạy !!
-- =====================================================================

-- 1) Tài khoản cho ỨNG DỤNG Node.js: chỉ được đọc/ghi dữ liệu, không được sửa cấu trúc bảng
CREATE USER IF NOT EXISTS 'xdkn_app'@'localhost' IDENTIFIED BY 'DoiMatKhauApp#2026';
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON xay_dung_ket_noi.* TO 'xdkn_app'@'localhost';

-- 2) Tài khoản cho BẠN dùng trong Workbench: toàn quyền trên đúng database này (không dùng root hằng ngày)
CREATE USER IF NOT EXISTS 'xdkn_dev'@'localhost' IDENTIFIED BY 'DoiMatKhauDev#2026';
GRANT ALL PRIVILEGES ON xay_dung_ket_noi.* TO 'xdkn_dev'@'localhost';

FLUSH PRIVILEGES;

-- Kiểm tra
SHOW GRANTS FOR 'xdkn_app'@'localhost';
SHOW GRANTS FOR 'xdkn_dev'@'localhost';

-- Nếu cần đổi mật khẩu sau này:
-- ALTER USER 'xdkn_app'@'localhost' IDENTIFIED BY 'MatKhauMoi#123';
-- Nếu Node.js chạy trên máy khác với MySQL, thay 'localhost' bằng IP máy Node hoặc '%'.
