-- =====================================================================
--  XÂY DỰNG KẾT NỐI — CƠ SỞ DỮ LIỆU ĐẦY ĐỦ (MySQL 8.0.16+)
--  Chạy toàn bộ file trong MySQL Workbench (Ctrl+Shift+Enter)
--  Nếu đã chạy bản demo cũ, bỏ comment dòng DROP bên dưới để tạo lại từ đầu.
-- =====================================================================
-- DROP DATABASE IF EXISTS xay_dung_ket_noi;
CREATE DATABASE IF NOT EXISTS xay_dung_ket_noi
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE xay_dung_ket_noi;

-- =====================================================================
-- 1. DANH MỤC
-- =====================================================================

-- Khu vực 2 cấp: Tỉnh/Thành -> Quận/Huyện (tự tham chiếu)
CREATE TABLE khu_vuc (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ten       VARCHAR(100) NOT NULL,
  cap       ENUM('tinh_thanh','quan_huyen') NOT NULL DEFAULT 'quan_huyen',
  parent_id INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_khu_vuc (parent_id, ten),
  CONSTRAINT fk_khu_vuc_parent FOREIGN KEY (parent_id) REFERENCES khu_vuc(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Chuyên môn / loại công việc (dùng cho cả thợ lẫn yêu cầu)
CREATE TABLE chuyen_mon (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ten             VARCHAR(100) NOT NULL,
  mo_ta           VARCHAR(255) NULL,
  thu_tu          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  dang_hoat_dong  TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_chuyen_mon_ten (ten)
) ENGINE=InnoDB;

-- Thẻ tự do (Tường, Sơn lại, Khẩn cấp, Căn hộ...)
CREATE TABLE the (
  id  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ten VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_the_ten (ten)
) ENGINE=InnoDB;

-- Giá tham khảo theo khu vực & hạng mục (mục "Báo giá chuẩn theo khu vực" ở index)
CREATE TABLE gia_tham_khao (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  chuyen_mon_id  INT UNSIGNED NOT NULL,
  khu_vuc_id     INT UNSIGNED NOT NULL,
  don_vi         ENUM('ngay','gio','m2','cong_trinh') NOT NULL DEFAULT 'ngay',
  gia_min        DECIMAL(12,0) NOT NULL,
  gia_max        DECIMAL(12,0) NOT NULL,
  cap_nhat_luc   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_gia_tham_khao (chuyen_mon_id, khu_vuc_id, don_vi),
  CONSTRAINT fk_gtk_cm FOREIGN KEY (chuyen_mon_id) REFERENCES chuyen_mon(id) ON DELETE CASCADE,
  CONSTRAINT fk_gtk_kv FOREIGN KEY (khu_vuc_id)    REFERENCES khu_vuc(id)    ON DELETE CASCADE,
  CONSTRAINT ck_gtk_gia CHECK (gia_min >= 0 AND gia_max >= gia_min)
) ENGINE=InnoDB;

-- =====================================================================
-- 2. NGƯỜI DÙNG & HỒ SƠ THỢ
-- =====================================================================

CREATE TABLE nguoi_dung (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ten                VARCHAR(100) NOT NULL,
  sdt                VARCHAR(10)  NOT NULL,
  email              VARCHAR(150) NOT NULL,
  mat_khau_hash      VARCHAR(255) NOT NULL,
  vai_tro            ENUM('customer','worker','admin') NOT NULL,
  khu_vuc_id         INT UNSIGNED NOT NULL,
  avatar_url         VARCHAR(255) NULL,
  trang_thai         ENUM('hoat_dong','khoa') NOT NULL DEFAULT 'hoat_dong',
  email_da_xac_thuc  TINYINT(1) NOT NULL DEFAULT 0,
  sdt_da_xac_thuc    TINYINT(1) NOT NULL DEFAULT 0,
  dang_nhap_cuoi_luc DATETIME NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_nguoi_dung_sdt (sdt),
  UNIQUE KEY uq_nguoi_dung_email (email),
  KEY idx_nguoi_dung_vai_tro (vai_tro),
  CONSTRAINT fk_nd_kv FOREIGN KEY (khu_vuc_id) REFERENCES khu_vuc(id) ON UPDATE CASCADE,
  CONSTRAINT ck_nd_sdt CHECK (sdt REGEXP '^0[0-9]{9}$')
) ENGINE=InnoDB;

-- Quan hệ 1-1 với nguoi_dung (vai_tro = 'worker'); khóa chính chính là id người dùng
CREATE TABLE ho_so_tho (
  nguoi_dung_id          INT UNSIGNED NOT NULL,
  chuc_danh              VARCHAR(120) NULL,              -- "Thợ sửa nhà chuyên nghiệp"
  chuyen_mon_chinh_id    INT UNSIGNED NULL,
  gioi_thieu             TEXT NULL,
  so_nam_kinh_nghiem     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  hinh_thuc_lam_viec     ENUM('toan_thoi_gian','ban_thoi_gian','du_an_theo_goi','linh_hoat') NOT NULL DEFAULT 'linh_hoat',
  gio_lam_viec           VARCHAR(100) NULL,              -- "7h – 17h"
  gia_tu                 DECIMAL(12,0) NULL,
  gia_den                DECIMAL(12,0) NULL,
  don_vi_gia             ENUM('ngay','gio') NOT NULL DEFAULT 'ngay',
  dang_nhan_viec         TINYINT(1) NOT NULL DEFAULT 1,  -- "Đang hoạt động"
  ban_kinh_nhan_viec_km  TINYINT UNSIGNED NOT NULL DEFAULT 5,
  da_xac_minh            TINYINT(1) NOT NULL DEFAULT 0,
  -- Cột thống kê (được trigger tự cập nhật, KHÔNG sửa tay)
  so_du_an_hoan_thanh    INT UNSIGNED NOT NULL DEFAULT 0,
  diem_trung_binh        DECIMAL(2,1) NOT NULL DEFAULT 0.0,
  so_danh_gia            INT UNSIGNED NOT NULL DEFAULT 0,
  ty_le_phan_hoi         DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (nguoi_dung_id),
  KEY idx_hst_diem (diem_trung_binh),
  CONSTRAINT fk_hst_nd FOREIGN KEY (nguoi_dung_id)       REFERENCES nguoi_dung(id) ON DELETE CASCADE,
  CONSTRAINT fk_hst_cm FOREIGN KEY (chuyen_mon_chinh_id) REFERENCES chuyen_mon(id) ON DELETE SET NULL,
  CONSTRAINT ck_hst_gia CHECK (gia_tu IS NULL OR gia_den IS NULL OR gia_den >= gia_tu),
  CONSTRAINT ck_hst_diem CHECK (diem_trung_binh BETWEEN 0 AND 5),
  CONSTRAINT ck_hst_phanhoi CHECK (ty_le_phan_hoi BETWEEN 0 AND 100)
) ENGINE=InnoDB;

-- N-N: chuyên môn của thợ (Trần, tường, điện nước...)
CREATE TABLE ho_so_tho_chuyen_mon (
  tho_id         INT UNSIGNED NOT NULL,
  chuyen_mon_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (tho_id, chuyen_mon_id),
  CONSTRAINT fk_hstcm_tho FOREIGN KEY (tho_id)        REFERENCES ho_so_tho(nguoi_dung_id) ON DELETE CASCADE,
  CONSTRAINT fk_hstcm_cm  FOREIGN KEY (chuyen_mon_id) REFERENCES chuyen_mon(id)           ON DELETE CASCADE
) ENGINE=InnoDB;

-- N-N: khu vực phục vụ của thợ (Hoàn Kiếm, Hai Bà Trưng...)
CREATE TABLE ho_so_tho_khu_vuc (
  tho_id      INT UNSIGNED NOT NULL,
  khu_vuc_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (tho_id, khu_vuc_id),
  CONSTRAINT fk_hstkv_tho FOREIGN KEY (tho_id)     REFERENCES ho_so_tho(nguoi_dung_id) ON DELETE CASCADE,
  CONSTRAINT fk_hstkv_kv  FOREIGN KEY (khu_vuc_id) REFERENCES khu_vuc(id)              ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE cong_trinh_tieu_bieu (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tho_id            INT UNSIGNED NOT NULL,
  tieu_de           VARCHAR(200) NOT NULL,
  mo_ta             TEXT NULL,
  anh_url           VARCHAR(255) NULL,
  ngay_hoan_thanh   DATE NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ctb_tho (tho_id),
  CONSTRAINT fk_ctb_tho FOREIGN KEY (tho_id) REFERENCES ho_so_tho(nguoi_dung_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE chung_chi_tho (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tho_id          INT UNSIGNED NOT NULL,
  ten_chung_chi   VARCHAR(150) NOT NULL,
  don_vi_cap      VARCHAR(150) NULL,
  nam_cap         SMALLINT UNSIGNED NULL,
  anh_url         VARCHAR(255) NULL,
  PRIMARY KEY (id),
  KEY idx_cc_tho (tho_id),
  CONSTRAINT fk_cc_tho FOREIGN KEY (tho_id) REFERENCES ho_so_tho(nguoi_dung_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 3. YÊU CẦU (khách hàng đặt nhu cầu) & BÁO GIÁ (thợ "Nhận việc")
-- =====================================================================

CREATE TABLE yeu_cau (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  khach_hang_id      INT UNSIGNED NOT NULL,
  tieu_de            VARCHAR(200) NOT NULL,
  chuyen_mon_id      INT UNSIGNED NOT NULL,             -- "Loại công việc"
  mo_ta              TEXT NOT NULL,
  khu_vuc_id         INT UNSIGNED NOT NULL,
  dia_chi_chi_tiet   VARCHAR(255) NULL,
  ngan_sach_tu       DECIMAL(12,0) NULL,
  ngan_sach_den      DECIMAL(12,0) NULL,
  so_ngay_mong_muon  SMALLINT UNSIGNED NULL,            -- "1 tuần" -> 7
  han_hoan_thanh     DATE NULL,
  muc_do             ENUM('binh_thuong','can_gap') NOT NULL DEFAULT 'binh_thuong',
  trang_thai         ENUM('dang_mo','da_chot','dang_thuc_hien','hoan_thanh','da_huy','het_han') NOT NULL DEFAULT 'dang_mo',
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_yc_loc (trang_thai, khu_vuc_id, chuyen_mon_id, created_at),
  KEY idx_yc_khach (khach_hang_id, trang_thai),
  FULLTEXT KEY ft_yc (tieu_de, mo_ta),
  CONSTRAINT fk_yc_kh FOREIGN KEY (khach_hang_id) REFERENCES nguoi_dung(id) ON DELETE RESTRICT,
  CONSTRAINT fk_yc_cm FOREIGN KEY (chuyen_mon_id) REFERENCES chuyen_mon(id),
  CONSTRAINT fk_yc_kv FOREIGN KEY (khu_vuc_id)    REFERENCES khu_vuc(id),
  CONSTRAINT ck_yc_ns CHECK (ngan_sach_tu IS NULL OR ngan_sach_den IS NULL OR ngan_sach_den >= ngan_sach_tu)
) ENGINE=InnoDB;

CREATE TABLE yeu_cau_the (
  yeu_cau_id INT UNSIGNED NOT NULL,
  the_id     INT UNSIGNED NOT NULL,
  PRIMARY KEY (yeu_cau_id, the_id),
  CONSTRAINT fk_yct_yc  FOREIGN KEY (yeu_cau_id) REFERENCES yeu_cau(id) ON DELETE CASCADE,
  CONSTRAINT fk_yct_the FOREIGN KEY (the_id)     REFERENCES the(id)     ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE anh_yeu_cau (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  yeu_cau_id  INT UNSIGNED NOT NULL,
  url         VARCHAR(255) NOT NULL,
  thu_tu      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_ayc (yeu_cau_id),
  CONSTRAINT fk_ayc_yc FOREIGN KEY (yeu_cau_id) REFERENCES yeu_cau(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Thợ bấm "Nhận việc" = gửi báo giá. Mỗi thợ chỉ báo giá 1 lần / yêu cầu.
CREATE TABLE bao_gia (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  yeu_cau_id          INT UNSIGNED NOT NULL,
  tho_id              INT UNSIGNED NOT NULL,
  so_tien             DECIMAL(12,0) NULL,
  mo_ta               TEXT NULL,
  so_ngay_thuc_hien   SMALLINT UNSIGNED NULL,
  ngay_bat_dau_de_xuat DATE NULL,
  trang_thai          ENUM('cho_khach','duoc_chon','bi_tu_choi','da_rut') NOT NULL DEFAULT 'cho_khach',
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bao_gia (yeu_cau_id, tho_id),
  KEY idx_bg_tho (tho_id, trang_thai),
  CONSTRAINT fk_bg_yc  FOREIGN KEY (yeu_cau_id) REFERENCES yeu_cau(id) ON DELETE CASCADE,
  CONSTRAINT fk_bg_tho FOREIGN KEY (tho_id)     REFERENCES ho_so_tho(nguoi_dung_id) ON DELETE CASCADE,
  CONSTRAINT ck_bg_tien CHECK (so_tien > 0)
) ENGINE=InnoDB;

-- =====================================================================
-- 4. CÔNG VIỆC (hợp đồng), TIẾN ĐỘ, THANH TOÁN
-- =====================================================================

-- Sinh ra khi khách chọn 1 báo giá. Mỗi yêu cầu tối đa 1 công việc.
CREATE TABLE cong_viec (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  yeu_cau_id         INT UNSIGNED NOT NULL,
  bao_gia_id         INT UNSIGNED NOT NULL,
  khach_hang_id      INT UNSIGNED NOT NULL,
  tho_id             INT UNSIGNED NOT NULL,
  gia_chot           DECIMAL(12,0) NULL,
  ngay_bat_dau       DATE NULL,
  ngay_du_kien_xong  DATE NULL,
  ngay_hoan_thanh    DATETIME NULL,
  trang_thai         ENUM('cho_xac_nhan','dang_thuc_hien','hoan_tat','da_huy','tranh_chap') NOT NULL DEFAULT 'cho_xac_nhan',
  ly_do_huy          VARCHAR(255) NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cv_yeu_cau (yeu_cau_id),
  UNIQUE KEY uq_cv_bao_gia (bao_gia_id),
  KEY idx_cv_tho (tho_id, trang_thai),
  KEY idx_cv_khach (khach_hang_id, trang_thai),
  CONSTRAINT fk_cv_yc   FOREIGN KEY (yeu_cau_id)    REFERENCES yeu_cau(id),
  CONSTRAINT fk_cv_bg   FOREIGN KEY (bao_gia_id)    REFERENCES bao_gia(id),
  CONSTRAINT fk_cv_kh   FOREIGN KEY (khach_hang_id) REFERENCES nguoi_dung(id),
  CONSTRAINT fk_cv_tho  FOREIGN KEY (tho_id)        REFERENCES ho_so_tho(nguoi_dung_id),
  CONSTRAINT ck_cv_gia  CHECK (gia_chot > 0),
  CONSTRAINT ck_cv_khac CHECK (khach_hang_id <> tho_id),
  CONSTRAINT ck_cv_ngay CHECK (ngay_bat_dau IS NULL OR ngay_du_kien_xong IS NULL OR ngay_du_kien_xong >= ngay_bat_dau)
) ENGINE=InnoDB;

CREATE TABLE tien_do_cong_viec (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cong_viec_id       INT UNSIGNED NOT NULL,
  nguoi_cap_nhat_id  INT UNSIGNED NOT NULL,
  noi_dung           TEXT NOT NULL,
  phan_tram          TINYINT UNSIGNED NOT NULL DEFAULT 0,
  anh_url            VARCHAR(255) NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_td_cv (cong_viec_id, created_at),
  CONSTRAINT fk_td_cv FOREIGN KEY (cong_viec_id)      REFERENCES cong_viec(id) ON DELETE CASCADE,
  CONSTRAINT fk_td_nd FOREIGN KEY (nguoi_cap_nhat_id) REFERENCES nguoi_dung(id),
  CONSTRAINT ck_td_pt CHECK (phan_tram BETWEEN 0 AND 100)
) ENGINE=InnoDB;

-- Thanh toán theo giai đoạn (đợt 1: đặt cọc, đợt 2: nghiệm thu...)
CREATE TABLE thanh_toan (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cong_viec_id    INT UNSIGNED NOT NULL,
  dot             TINYINT UNSIGNED NOT NULL DEFAULT 1,
  ten_dot         VARCHAR(100) NULL,
  so_tien         DECIMAL(12,0) NOT NULL,
  phuong_thuc     ENUM('chuyen_khoan','tien_mat','vi_dien_tu') NOT NULL DEFAULT 'chuyen_khoan',
  trang_thai      ENUM('cho_thanh_toan','da_thanh_toan','hoan_tien','that_bai') NOT NULL DEFAULT 'cho_thanh_toan',
  ma_giao_dich    VARCHAR(100) NULL,
  thanh_toan_luc  DATETIME NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tt_dot (cong_viec_id, dot),
  CONSTRAINT fk_tt_cv FOREIGN KEY (cong_viec_id) REFERENCES cong_viec(id) ON DELETE RESTRICT,
  CONSTRAINT ck_tt_tien CHECK (so_tien > 0)
) ENGINE=InnoDB;

-- =====================================================================
-- 5. CHAT & THÔNG BÁO
-- =====================================================================

CREATE TABLE cuoc_hoi_thoai (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  yeu_cau_id     INT UNSIGNED NULL,
  khach_hang_id  INT UNSIGNED NOT NULL,
  tho_id         INT UNSIGNED NOT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cap_nhat_cuoi  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cht (khach_hang_id, tho_id, yeu_cau_id),
  KEY idx_cht_tho (tho_id),
  CONSTRAINT fk_cht_yc  FOREIGN KEY (yeu_cau_id)    REFERENCES yeu_cau(id) ON DELETE SET NULL,
  CONSTRAINT fk_cht_kh  FOREIGN KEY (khach_hang_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
  CONSTRAINT fk_cht_tho FOREIGN KEY (tho_id)        REFERENCES nguoi_dung(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tin_nhan (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cuoc_hoi_thoai_id    INT UNSIGNED NOT NULL,
  nguoi_gui_id         INT UNSIGNED NOT NULL,
  loai                 ENUM('van_ban','hinh_anh','bao_gia','he_thong') NOT NULL DEFAULT 'van_ban',
  noi_dung             TEXT NULL,
  tep_url              VARCHAR(255) NULL,
  da_doc               TINYINT(1) NOT NULL DEFAULT 0,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tn (cuoc_hoi_thoai_id, id),
  CONSTRAINT fk_tn_cht FOREIGN KEY (cuoc_hoi_thoai_id) REFERENCES cuoc_hoi_thoai(id) ON DELETE CASCADE,
  CONSTRAINT fk_tn_nd  FOREIGN KEY (nguoi_gui_id)      REFERENCES nguoi_dung(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE thong_bao (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nguoi_dung_id  INT UNSIGNED NOT NULL,
  loai           VARCHAR(40) NOT NULL,          -- yeu_cau_moi, bao_gia_moi, cong_viec, danh_gia...
  tieu_de        VARCHAR(200) NOT NULL,
  noi_dung       VARCHAR(500) NULL,
  lien_ket       VARCHAR(255) NULL,
  da_doc         TINYINT(1) NOT NULL DEFAULT 0,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tb (nguoi_dung_id, da_doc, id),
  CONSTRAINT fk_tb_nd FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 6. ĐÁNH GIÁ HAI CHIỀU & TRANH CHẤP
-- =====================================================================

CREATE TABLE danh_gia (
  id                     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cong_viec_id           INT UNSIGNED NOT NULL,
  nguoi_danh_gia_id      INT UNSIGNED NOT NULL,
  nguoi_duoc_danh_gia_id INT UNSIGNED NOT NULL,
  so_sao                 TINYINT UNSIGNED NOT NULL,
  noi_dung               TEXT NULL,
  huu_ich_count          INT UNSIGNED NOT NULL DEFAULT 0,   -- 👍 (trigger cập nhật)
  phan_hoi               TEXT NULL,                          -- thợ "Trả lời"
  phan_hoi_luc           DATETIME NULL,
  da_cam_on              TINYINT(1) NOT NULL DEFAULT 0,      -- ❤️ "Cảm ơn"
  created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dg (cong_viec_id, nguoi_danh_gia_id),
  KEY idx_dg_duoc (nguoi_duoc_danh_gia_id, created_at),
  CONSTRAINT fk_dg_cv  FOREIGN KEY (cong_viec_id)           REFERENCES cong_viec(id),
  CONSTRAINT fk_dg_ng  FOREIGN KEY (nguoi_danh_gia_id)      REFERENCES nguoi_dung(id),
  CONSTRAINT fk_dg_duoc FOREIGN KEY (nguoi_duoc_danh_gia_id) REFERENCES nguoi_dung(id),
  CONSTRAINT ck_dg_sao  CHECK (so_sao BETWEEN 1 AND 5),
  CONSTRAINT ck_dg_khac CHECK (nguoi_danh_gia_id <> nguoi_duoc_danh_gia_id)
) ENGINE=InnoDB;

CREATE TABLE danh_gia_huu_ich (
  danh_gia_id    INT UNSIGNED NOT NULL,
  nguoi_dung_id  INT UNSIGNED NOT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (danh_gia_id, nguoi_dung_id),
  CONSTRAINT fk_dghi_dg FOREIGN KEY (danh_gia_id)   REFERENCES danh_gia(id)   ON DELETE CASCADE,
  CONSTRAINT fk_dghi_nd FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tranh_chap (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cong_viec_id     INT UNSIGNED NOT NULL,
  nguoi_tao_id     INT UNSIGNED NOT NULL,
  ly_do            TEXT NOT NULL,
  trang_thai       ENUM('moi','dang_xu_ly','da_giai_quyet','tu_choi') NOT NULL DEFAULT 'moi',
  ket_qua          TEXT NULL,
  admin_xu_ly_id   INT UNSIGNED NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  giai_quyet_luc   DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_tc_cv (cong_viec_id),
  KEY idx_tc_tt (trang_thai),
  CONSTRAINT fk_tc_cv    FOREIGN KEY (cong_viec_id)   REFERENCES cong_viec(id),
  CONSTRAINT fk_tc_tao   FOREIGN KEY (nguoi_tao_id)   REFERENCES nguoi_dung(id),
  CONSTRAINT fk_tc_admin FOREIGN KEY (admin_xu_ly_id) REFERENCES nguoi_dung(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 7. BẢO MẬT (nút "Quên mật khẩu?" ở trang đăng nhập)
-- =====================================================================
CREATE TABLE token_dat_lai_mat_khau (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nguoi_dung_id  INT UNSIGNED NOT NULL,
  token_hash     CHAR(64) NOT NULL,             -- SHA-256 của token gửi qua email
  het_han_luc    DATETIME NOT NULL,
  da_dung        TINYINT(1) NOT NULL DEFAULT 0,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_token (token_hash),
  CONSTRAINT fk_tk_nd FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 8. TRIGGER & PROCEDURE — bảo vệ quy tắc nghiệp vụ ngay trong CSDL
-- =====================================================================
DELIMITER $$

-- Chỉ tài khoản vai trò worker mới có hồ sơ thợ
CREATE TRIGGER trg_ho_so_tho_bi BEFORE INSERT ON ho_so_tho FOR EACH ROW
BEGIN
  IF (SELECT vai_tro FROM nguoi_dung WHERE id = NEW.nguoi_dung_id) <> 'worker' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chỉ tài khoản thợ mới có hồ sơ thợ.';
  END IF;
END$$

-- Chỉ tài khoản customer mới đặt yêu cầu
CREATE TRIGGER trg_yeu_cau_bi BEFORE INSERT ON yeu_cau FOR EACH ROW
BEGIN
  IF (SELECT vai_tro FROM nguoi_dung WHERE id = NEW.khach_hang_id) <> 'customer' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chỉ khách hàng mới được đặt yêu cầu.';
  END IF;
END$$

-- Chỉ báo giá cho yêu cầu đang mở
CREATE TRIGGER trg_bao_gia_bi BEFORE INSERT ON bao_gia FOR EACH ROW
BEGIN
  IF (SELECT trang_thai FROM yeu_cau WHERE id = NEW.yeu_cau_id) <> 'dang_mo' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Yêu cầu này không còn nhận báo giá.';
  END IF;
END$$

-- Tự đồng bộ trạng thái yêu cầu khi công việc thay đổi
CREATE TRIGGER trg_cong_viec_ai AFTER INSERT ON cong_viec FOR EACH ROW
BEGIN
  UPDATE yeu_cau SET trang_thai = 'da_chot' WHERE id = NEW.yeu_cau_id;
END$$

CREATE TRIGGER trg_cong_viec_bu BEFORE UPDATE ON cong_viec FOR EACH ROW
BEGIN
  IF NEW.trang_thai = 'hoan_tat' AND OLD.trang_thai <> 'hoan_tat' AND NEW.ngay_hoan_thanh IS NULL THEN
    SET NEW.ngay_hoan_thanh = NOW();
  END IF;
END$$

CREATE TRIGGER trg_cong_viec_au AFTER UPDATE ON cong_viec FOR EACH ROW
BEGIN
  IF NEW.trang_thai <> OLD.trang_thai THEN
    UPDATE yeu_cau SET trang_thai = CASE NEW.trang_thai
        WHEN 'cho_xac_nhan'   THEN 'da_chot'
        WHEN 'dang_thuc_hien' THEN 'dang_thuc_hien'
        WHEN 'hoan_tat'       THEN 'hoan_thanh'
        WHEN 'da_huy'         THEN 'da_huy'
        ELSE trang_thai END
    WHERE id = NEW.yeu_cau_id;

    IF NEW.trang_thai = 'hoan_tat' THEN
      UPDATE ho_so_tho SET so_du_an_hoan_thanh =
        (SELECT COUNT(*) FROM cong_viec WHERE tho_id = NEW.tho_id AND trang_thai = 'hoan_tat')
      WHERE nguoi_dung_id = NEW.tho_id;
    END IF;
  END IF;
END$$

-- Chỉ đánh giá khi công việc HOÀN TẤT và đúng 2 bên tham gia
CREATE TRIGGER trg_danh_gia_bi BEFORE INSERT ON danh_gia FOR EACH ROW
BEGIN
  DECLARE v_kh INT UNSIGNED; DECLARE v_tho INT UNSIGNED; DECLARE v_tt VARCHAR(20);
  SELECT khach_hang_id, tho_id, trang_thai INTO v_kh, v_tho, v_tt
    FROM cong_viec WHERE id = NEW.cong_viec_id;
  IF v_tt IS NULL OR v_tt <> 'hoan_tat' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chỉ được đánh giá sau khi công việc hoàn tất.';
  END IF;
  IF NOT ((NEW.nguoi_danh_gia_id = v_kh  AND NEW.nguoi_duoc_danh_gia_id = v_tho)
       OR (NEW.nguoi_danh_gia_id = v_tho AND NEW.nguoi_duoc_danh_gia_id = v_kh)) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Người đánh giá không thuộc công việc này.';
  END IF;
END$$

-- Tính lại điểm trung bình & số đánh giá của thợ
CREATE PROCEDURE sp_cap_nhat_diem_tho(IN p_id INT UNSIGNED)
BEGIN
  UPDATE ho_so_tho SET
    diem_trung_binh = COALESCE((SELECT ROUND(AVG(so_sao),1) FROM danh_gia WHERE nguoi_duoc_danh_gia_id = p_id), 0),
    so_danh_gia     = (SELECT COUNT(*) FROM danh_gia WHERE nguoi_duoc_danh_gia_id = p_id)
  WHERE nguoi_dung_id = p_id;
END$$

CREATE TRIGGER trg_danh_gia_ai AFTER INSERT ON danh_gia FOR EACH ROW
BEGIN CALL sp_cap_nhat_diem_tho(NEW.nguoi_duoc_danh_gia_id); END$$

CREATE TRIGGER trg_danh_gia_au AFTER UPDATE ON danh_gia FOR EACH ROW
BEGIN CALL sp_cap_nhat_diem_tho(NEW.nguoi_duoc_danh_gia_id); END$$

CREATE TRIGGER trg_danh_gia_ad AFTER DELETE ON danh_gia FOR EACH ROW
BEGIN CALL sp_cap_nhat_diem_tho(OLD.nguoi_duoc_danh_gia_id); END$$

-- Đếm 👍
CREATE TRIGGER trg_huu_ich_ai AFTER INSERT ON danh_gia_huu_ich FOR EACH ROW
BEGIN UPDATE danh_gia SET huu_ich_count = huu_ich_count + 1 WHERE id = NEW.danh_gia_id; END$$

CREATE TRIGGER trg_huu_ich_ad AFTER DELETE ON danh_gia_huu_ich FOR EACH ROW
BEGIN UPDATE danh_gia SET huu_ich_count = GREATEST(huu_ich_count - 1, 0) WHERE id = OLD.danh_gia_id; END$$

DELIMITER ;

-- =====================================================================
-- 9. VIEW phục vụ giao diện
-- =====================================================================

-- Trang my-reviews: 142 tổng / 139 5★ / 3 4★ / chưa trả lời
CREATE VIEW v_thong_ke_sao_tho AS
SELECT nguoi_duoc_danh_gia_id AS tho_id,
       COUNT(*)                          AS tong,
       ROUND(AVG(so_sao),1)              AS diem_tb,
       SUM(so_sao = 5)                   AS sao5,
       SUM(so_sao = 4)                   AS sao4,
       SUM(so_sao = 3)                   AS sao3,
       SUM(so_sao = 2)                   AS sao2,
       SUM(so_sao = 1)                   AS sao1,
       SUM(phan_hoi IS NULL)             AS chua_tra_loi
FROM danh_gia GROUP BY nguoi_duoc_danh_gia_id;

-- Trang skilled-worker: danh sách yêu cầu đang mở kèm thông tin hiển thị
CREATE VIEW v_yeu_cau_dang_mo AS
SELECT yc.id, yc.tieu_de, yc.mo_ta, yc.muc_do, yc.ngan_sach_tu, yc.ngan_sach_den,
       yc.han_hoan_thanh, yc.created_at, yc.khu_vuc_id, yc.chuyen_mon_id,
       nd.ten AS ten_khach_hang, kv.ten AS ten_khu_vuc, cm.ten AS ten_chuyen_mon,
       (SELECT COUNT(*) FROM bao_gia bg WHERE bg.yeu_cau_id = yc.id) AS so_bao_gia
FROM yeu_cau yc
JOIN nguoi_dung nd ON nd.id = yc.khach_hang_id
JOIN khu_vuc kv    ON kv.id = yc.khu_vuc_id
JOIN chuyen_mon cm ON cm.id = yc.chuyen_mon_id
WHERE yc.trang_thai = 'dang_mo';

-- =====================================================================
-- 10. DỮ LIỆU MẪU DANH MỤC
-- =====================================================================
INSERT INTO khu_vuc (ten, cap, parent_id) VALUES
  ('Hà Nội','tinh_thanh',NULL), ('TP. Hồ Chí Minh','tinh_thanh',NULL), ('Đà Nẵng','tinh_thanh',NULL);

INSERT INTO khu_vuc (ten, cap, parent_id)
SELECT v.ten, 'quan_huyen', p.id FROM (
  SELECT 'Sơn Tây' ten,'Hà Nội' tinh UNION ALL SELECT 'Ba Vì','Hà Nội' UNION ALL SELECT 'Hà Đông','Hà Nội'
  UNION ALL SELECT 'Cầu Giấy','Hà Nội' UNION ALL SELECT 'Đống Đa','Hà Nội' UNION ALL SELECT 'Thanh Xuân','Hà Nội'
  UNION ALL SELECT 'Hoàn Kiếm','Hà Nội' UNION ALL SELECT 'Hai Bà Trưng','Hà Nội' UNION ALL SELECT 'Long Biên','Hà Nội'
  UNION ALL SELECT 'Tây Hồ','Hà Nội'
  UNION ALL SELECT 'Quận 7','TP. Hồ Chí Minh' UNION ALL SELECT 'Bình Thạnh','TP. Hồ Chí Minh'
  UNION ALL SELECT 'Gò Vấp','TP. Hồ Chí Minh' UNION ALL SELECT 'Phú Nhuận','TP. Hồ Chí Minh'
  UNION ALL SELECT 'Hải Châu','Đà Nẵng' UNION ALL SELECT 'Ngũ Hành Sơn','Đà Nẵng' UNION ALL SELECT 'Thanh Khê','Đà Nẵng'
) v JOIN khu_vuc p ON p.ten = v.tinh AND p.parent_id IS NULL;

INSERT INTO chuyen_mon (ten, thu_tu) VALUES
  ('Sửa chữa nhà ở',1),('Cải tạo nội thất',2),('Sửa trần - tường',3),('Sửa điện - nước',4),
  ('Chống thấm',5),('Xây dựng nhỏ',6),('Sơn nhà',7),('Khác',99);

INSERT INTO the (ten) VALUES
  ('Sửa nhà'),('Tường'),('Sơn lại'),('Trần'),('Nội thất'),('Sơn'),('Điện nước'),('Căn hộ'),('Khẩn cấp');
