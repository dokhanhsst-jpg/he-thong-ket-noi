const db = require('../../config/db');

exports.findForUser = async (user) => {
	const condition = user.role === 'admin'
		? '1 = 1'
		: '(cv.khach_hang_id = ? OR cv.tho_id = ?)';
	const values = user.role === 'admin' ? [] : [user.id, user.id];
	const [rows] = await db.query(
		`SELECT tc.*, cv.khach_hang_id, cv.tho_id, yc.tieu_de,
						nd.ten AS ten_nguoi_tao, ad.ten AS ten_admin_xu_ly
			 FROM tranh_chap tc JOIN cong_viec cv ON cv.id = tc.cong_viec_id
			 JOIN yeu_cau yc ON yc.id = cv.yeu_cau_id
			 JOIN nguoi_dung nd ON nd.id = tc.nguoi_tao_id
			 LEFT JOIN nguoi_dung ad ON ad.id = tc.admin_xu_ly_id
			WHERE ${condition} ORDER BY tc.created_at DESC`, values
	);
	return rows;
};

exports.findById = async (id) => {
	const [rows] = await db.query(
		`SELECT tc.*, cv.khach_hang_id, cv.tho_id, yc.tieu_de
			 FROM tranh_chap tc JOIN cong_viec cv ON cv.id = tc.cong_viec_id
			 JOIN yeu_cau yc ON yc.id = cv.yeu_cau_id WHERE tc.id = ? LIMIT 1`, [id]
	);
	return rows[0] || null;
};

exports.create = async ({ jobId, userId, reason }) => {
	const [result] = await db.query(
		"INSERT INTO tranh_chap (cong_viec_id, nguoi_tao_id, ly_do) VALUES (?, ?, ?)",
		[jobId, userId, reason]
	);
	await db.query("UPDATE cong_viec SET trang_thai = 'tranh_chap' WHERE id = ? AND trang_thai = 'dang_thuc_hien'", [jobId]);
	return result.insertId;
};

exports.resolve = async (id, adminId, status, outcome) => {
	const [result] = await db.query(
		'UPDATE tranh_chap SET trang_thai = ?, ket_qua = ?, admin_xu_ly_id = ?, giai_quyet_luc = NOW() WHERE id = ? AND trang_thai IN (?, ?)',
		[status, outcome, adminId, id, 'moi', 'dang_xu_ly']
	);
	return result.affectedRows > 0;
};
