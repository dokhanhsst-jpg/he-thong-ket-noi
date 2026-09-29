const db = require('../../config/db');

const COLS = 'id, ten, sdt, email, mat_khau_hash, vai_tro, khu_vuc_id';

exports.findByEmailOrPhone = async (identifier) => {
  const [rows] = await db.query(
    `SELECT ${COLS} FROM nguoi_dung WHERE email = ? OR sdt = ? LIMIT 1`,
    [identifier, identifier]
  );
  return rows[0] || null;
};

exports.existsByEmailOrPhone = async (email, sdt) => {
  const [rows] = await db.query(
    'SELECT id FROM nguoi_dung WHERE email = ? OR sdt = ? LIMIT 1',
    [email, sdt]
  );
  return rows.length > 0;
};

exports.create = async ({ ten, sdt, email, matKhauHash, vaiTro, khuVucId }) => {
  const [result] = await db.query(
    `INSERT INTO nguoi_dung (ten, sdt, email, mat_khau_hash, vai_tro, khu_vuc_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [ten, sdt, email, matKhauHash, vaiTro, khuVucId]
  );
  return result.insertId;
};
