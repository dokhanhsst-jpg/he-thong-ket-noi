const db = require('../../config/db');

exports.findConversations = async (userId) => {
	const [rows] = await db.query(
		`SELECT c.id, c.yeu_cau_id, c.khach_hang_id, c.tho_id, c.cap_nhat_cuoi,
						IF(c.khach_hang_id = ?, th.ten, kh.ten) AS ten_nguoi_kia,
						(SELECT tm.noi_dung FROM tin_nhan tm WHERE tm.cuoc_hoi_thoai_id = c.id ORDER BY tm.id DESC LIMIT 1) AS tin_nhan_cuoi,
						(SELECT tm.created_at FROM tin_nhan tm WHERE tm.cuoc_hoi_thoai_id = c.id ORDER BY tm.id DESC LIMIT 1) AS tin_nhan_luc,
						(SELECT COUNT(*) FROM tin_nhan tm WHERE tm.cuoc_hoi_thoai_id = c.id AND tm.nguoi_gui_id <> ? AND tm.da_doc = 0) AS chua_doc
			 FROM cuoc_hoi_thoai c JOIN nguoi_dung kh ON kh.id = c.khach_hang_id
			 JOIN nguoi_dung th ON th.id = c.tho_id
			WHERE c.khach_hang_id = ? OR c.tho_id = ? ORDER BY c.cap_nhat_cuoi DESC`,
		[userId, userId, userId, userId]
	);
	return rows;
};

exports.findParticipant = async (conversationId, userId) => {
	const [rows] = await db.query(
		'SELECT * FROM cuoc_hoi_thoai WHERE id = ? AND (khach_hang_id = ? OR tho_id = ?) LIMIT 1',
		[conversationId, userId, userId]
	);
	return rows[0] || null;
};

exports.createConversation = async ({ requestId, customerId, workerId }) => {
	await db.query(
		`INSERT INTO cuoc_hoi_thoai (yeu_cau_id, khach_hang_id, tho_id) VALUES (?, ?, ?)
		 ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
		[requestId, customerId, workerId]
	);
	const [rows] = await db.query(
		'SELECT id FROM cuoc_hoi_thoai WHERE khach_hang_id = ? AND tho_id = ? AND yeu_cau_id <=> ? LIMIT 1',
		[customerId, workerId, requestId]
	);
	return rows[0]?.id;
};

exports.findMessages = async (conversationId, beforeId, limit) => {
	const [rows] = await db.query(
		`SELECT id, cuoc_hoi_thoai_id, nguoi_gui_id, loai, noi_dung, tep_url, da_doc, created_at
			 FROM tin_nhan WHERE cuoc_hoi_thoai_id = ? AND (? IS NULL OR id < ?)
			ORDER BY id DESC LIMIT ?`, [conversationId, beforeId, beforeId, limit]
	);
	return rows.reverse();
};

exports.createMessage = async (conversationId, userId, data) => {
	const [result] = await db.query(
		'INSERT INTO tin_nhan (cuoc_hoi_thoai_id, nguoi_gui_id, loai, noi_dung, tep_url) VALUES (?, ?, ?, ?, ?)',
		[conversationId, userId, data.loai, data.noi_dung, data.tep_url]
	);
	await db.query('UPDATE cuoc_hoi_thoai SET cap_nhat_cuoi = NOW() WHERE id = ?', [conversationId]);
	return result.insertId;
};

exports.markRead = async (conversationId, userId) => {
	const [result] = await db.query(
		'UPDATE tin_nhan SET da_doc = 1 WHERE cuoc_hoi_thoai_id = ? AND nguoi_gui_id <> ? AND da_doc = 0',
		[conversationId, userId]
	);
	return result.affectedRows;
};
