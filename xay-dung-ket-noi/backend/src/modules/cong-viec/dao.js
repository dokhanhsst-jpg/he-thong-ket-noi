const db = require('../../config/db');

exports.findForUser = async (user) => {
	const ownerColumn = user.role === 'worker' ? 'cv.tho_id' : 'cv.khach_hang_id';
	const [rows] = await db.query(
		`SELECT cv.*, yc.tieu_de, yc.khu_vuc_id, kv.ten AS ten_khu_vuc,
						kh.ten AS ten_khach_hang, th.ten AS ten_tho
			 FROM cong_viec cv JOIN yeu_cau yc ON yc.id = cv.yeu_cau_id
			 JOIN khu_vuc kv ON kv.id = yc.khu_vuc_id
			 JOIN nguoi_dung kh ON kh.id = cv.khach_hang_id
			 JOIN nguoi_dung th ON th.id = cv.tho_id
			WHERE ${ownerColumn} = ? ORDER BY cv.updated_at DESC`,
		[user.id]
	);
	return rows;
};

exports.findById = async (id) => {
	const [rows] = await db.query(
		`SELECT cv.*, yc.tieu_de, kh.ten AS ten_khach_hang, th.ten AS ten_tho
			 FROM cong_viec cv JOIN yeu_cau yc ON yc.id = cv.yeu_cau_id
			 JOIN nguoi_dung kh ON kh.id = cv.khach_hang_id
			 JOIN nguoi_dung th ON th.id = cv.tho_id WHERE cv.id = ? LIMIT 1`, [id]
	);
	if (!rows[0]) return null;
	const [progress] = await db.query(
		`SELECT id, nguoi_cap_nhat_id, noi_dung, phan_tram, anh_url, created_at
			 FROM tien_do_cong_viec WHERE cong_viec_id = ? ORDER BY created_at DESC, id DESC`, [id]
	);
	return { ...rows[0], tien_do: progress };
};

exports.addProgress = async (jobId, userId, data) => {
	const [result] = await db.query(
		`INSERT INTO tien_do_cong_viec (cong_viec_id, nguoi_cap_nhat_id, noi_dung, phan_tram, anh_url)
		 VALUES (?, ?, ?, ?, ?)`,
		[jobId, userId, data.noi_dung, data.phan_tram, data.anh_url]
	);
	return result.insertId;
};

exports.updateStatus = async (jobId, status, cancelReason) => {
	const [result] = await db.query(
		`UPDATE cong_viec SET trang_thai = ?, ly_do_huy = ?,
			 ngay_hoan_thanh = IF(? = 'hoan_tat', NOW(), ngay_hoan_thanh)
			WHERE id = ?`,
		[status, cancelReason, status, jobId]
	);
	return result.affectedRows > 0;
};
