const db = require('../../config/db');

exports.findJob = async (jobId) => {
	const [rows] = await db.query('SELECT id, khach_hang_id, tho_id, trang_thai FROM cong_viec WHERE id = ? LIMIT 1', [jobId]);
	return rows[0] || null;
};

exports.findForJob = async (jobId) => {
	const [rows] = await db.query('SELECT * FROM thanh_toan WHERE cong_viec_id = ? ORDER BY dot', [jobId]);
	return rows;
};

exports.create = async (jobId, data) => {
	const [result] = await db.query(
		'INSERT INTO thanh_toan (cong_viec_id, dot, ten_dot, so_tien, phuong_thuc) VALUES (?, ?, ?, ?, ?)',
		[jobId, data.dot, data.ten_dot, data.so_tien, data.phuong_thuc]
	);
	return result.insertId;
};

exports.updateStatus = async (id, status, transactionId) => {
	const [result] = await db.query(
		`UPDATE thanh_toan SET trang_thai = ?, ma_giao_dich = ?,
			 thanh_toan_luc = IF(? = 'da_thanh_toan', NOW(), thanh_toan_luc) WHERE id = ?`,
		[status, transactionId, status, id]
	);
	return result.affectedRows > 0;
};

exports.findPayment = async (id) => {
	const [rows] = await db.query(
		`SELECT tt.*, cv.khach_hang_id, cv.tho_id FROM thanh_toan tt
			 JOIN cong_viec cv ON cv.id = tt.cong_viec_id WHERE tt.id = ? LIMIT 1`, [id]
	);
	return rows[0] || null;
};
