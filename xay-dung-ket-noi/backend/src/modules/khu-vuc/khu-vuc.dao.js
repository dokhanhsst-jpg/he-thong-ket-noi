const db = require('../../config/db');

exports.findAll = async () => {
  const [rows] = await db.query('SELECT id, ten FROM khu_vuc ORDER BY ten');
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query('SELECT id, ten FROM khu_vuc WHERE id = ?', [id]);
  return rows[0] || null;
};
