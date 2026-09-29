const db = require('../../config/db');

exports.findMine = async (userId, { unreadOnly, limit, beforeId }) => {
	const conditions = ['nguoi_dung_id = ?'];
	const values = [userId];
	if (unreadOnly) conditions.push('da_doc = 0');
	if (beforeId) { conditions.push('id < ?'); values.push(beforeId); }
	values.push(limit);
	const [rows] = await db.query(
		`SELECT id, loai, tieu_de, noi_dung, lien_ket, da_doc, created_at
			 FROM thong_bao WHERE ${conditions.join(' AND ')} ORDER BY id DESC LIMIT ?`, values
	);
	return rows;
};

exports.markRead = async (userId, id) => {
	const [result] = await db.query('UPDATE thong_bao SET da_doc = 1 WHERE id = ? AND nguoi_dung_id = ?', [id, userId]);
	return result.affectedRows > 0;
};

exports.markAllRead = async (userId) => {
	const [result] = await db.query('UPDATE thong_bao SET da_doc = 1 WHERE nguoi_dung_id = ? AND da_doc = 0', [userId]);
	return result.affectedRows;
};

exports.create = async (data) => {
	const [result] = await db.query(
		'INSERT INTO thong_bao (nguoi_dung_id, loai, tieu_de, noi_dung, lien_ket) VALUES (?, ?, ?, ?, ?)',
		[data.nguoi_dung_id, data.loai, data.tieu_de, data.noi_dung, data.lien_ket]
	);
	return result.insertId;
};
