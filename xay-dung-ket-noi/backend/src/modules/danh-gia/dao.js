const db = require('../../config/db');

exports.findForWorker = async (workerId) => {
	const [rows] = await db.query(
		`SELECT dg.id, dg.cong_viec_id, dg.nguoi_danh_gia_id, dg.nguoi_duoc_danh_gia_id,
						dg.so_sao, dg.noi_dung, dg.huu_ich_count, dg.phan_hoi, dg.phan_hoi_luc,
						dg.da_cam_on, dg.created_at, nd.ten AS ten_nguoi_danh_gia, yc.tieu_de
			 FROM danh_gia dg JOIN nguoi_dung nd ON nd.id = dg.nguoi_danh_gia_id
			 JOIN cong_viec cv ON cv.id = dg.cong_viec_id
			 JOIN yeu_cau yc ON yc.id = cv.yeu_cau_id
			WHERE dg.nguoi_duoc_danh_gia_id = ? ORDER BY dg.created_at DESC`, [workerId]
	);
	return rows;
};

exports.findJob = async (jobId) => {
	const [rows] = await db.query(
		'SELECT id, khach_hang_id, tho_id, trang_thai FROM cong_viec WHERE id = ? LIMIT 1', [jobId]
	);
	return rows[0] || null;
};

exports.create = async (data) => {
	const [result] = await db.query(
		`INSERT INTO danh_gia (cong_viec_id, nguoi_danh_gia_id, nguoi_duoc_danh_gia_id, so_sao, noi_dung)
		 VALUES (?, ?, ?, ?, ?)`,
		[data.cong_viec_id, data.reviewerId, data.targetId, data.so_sao, data.noi_dung]
	);
	return result.insertId;
};

exports.findById = async (id) => {
	const [rows] = await db.query('SELECT * FROM danh_gia WHERE id = ? LIMIT 1', [id]);
	return rows[0] || null;
};

exports.setHelpful = async (reviewId, userId, helpful) => {
	if (helpful) await db.query('INSERT IGNORE INTO danh_gia_huu_ich (danh_gia_id, nguoi_dung_id) VALUES (?, ?)', [reviewId, userId]);
	else await db.query('DELETE FROM danh_gia_huu_ich WHERE danh_gia_id = ? AND nguoi_dung_id = ?', [reviewId, userId]);
};

exports.reply = async (reviewId, reply) => {
	await db.query('UPDATE danh_gia SET phan_hoi = ?, phan_hoi_luc = NOW() WHERE id = ?', [reply, reviewId]);
};

exports.thank = async (reviewId, reviewerId) => {
	const [result] = await db.query(
		'UPDATE danh_gia SET da_cam_on = 1 WHERE id = ? AND nguoi_danh_gia_id = ?', [reviewId, reviewerId]
	);
	return result.affectedRows > 0;
};
