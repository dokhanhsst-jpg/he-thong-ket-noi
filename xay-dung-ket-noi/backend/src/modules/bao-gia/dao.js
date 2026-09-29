const db = require('../../config/db');

exports.findForRequest = async (requestId) => {
	const [rows] = await db.query(
		`SELECT bg.id, bg.yeu_cau_id, bg.tho_id, bg.so_tien, bg.mo_ta,
						bg.so_ngay_thuc_hien, bg.ngay_bat_dau_de_xuat, bg.trang_thai, bg.created_at,
						nd.ten AS ten_tho, hs.diem_trung_binh, hs.so_danh_gia
			 FROM bao_gia bg JOIN nguoi_dung nd ON nd.id = bg.tho_id
			 LEFT JOIN ho_so_tho hs ON hs.nguoi_dung_id = bg.tho_id
			WHERE bg.yeu_cau_id = ? ORDER BY bg.created_at DESC`,
		[requestId]
	);
	return rows;
};

exports.findMine = async (workerId) => {
	const [rows] = await db.query(
		`SELECT bg.*, yc.tieu_de, yc.khu_vuc_id, kv.ten AS ten_khu_vuc
			 FROM bao_gia bg JOIN yeu_cau yc ON yc.id = bg.yeu_cau_id
			 JOIN khu_vuc kv ON kv.id = yc.khu_vuc_id
			WHERE bg.tho_id = ? ORDER BY bg.created_at DESC`,
		[workerId]
	);
	return rows;
};

exports.findRequest = async (requestId) => {
	const [rows] = await db.query('SELECT id, khach_hang_id, trang_thai FROM yeu_cau WHERE id = ? LIMIT 1', [requestId]);
	return rows[0] || null;
};

exports.create = async (workerId, data) => {
	const [result] = await db.query(
		`INSERT INTO bao_gia (yeu_cau_id, tho_id, so_tien, mo_ta, so_ngay_thuc_hien, ngay_bat_dau_de_xuat)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		[data.yeu_cau_id, workerId, data.so_tien, data.mo_ta, data.so_ngay_thuc_hien, data.ngay_bat_dau_de_xuat]
	);
	return result.insertId;
};

exports.choose = async (customerId, offerId) => {
	const connection = await db.getConnection();
	try {
		await connection.beginTransaction();
		const [[offer]] = await connection.query(
			`SELECT bg.*, yc.khach_hang_id, yc.trang_thai AS yeu_cau_trang_thai
				 FROM bao_gia bg JOIN yeu_cau yc ON yc.id = bg.yeu_cau_id
				WHERE bg.id = ? FOR UPDATE`, [offerId]
		);
		if (!offer || offer.khach_hang_id !== customerId || offer.yeu_cau_trang_thai !== 'dang_mo' || offer.trang_thai !== 'cho_khach') {
			await connection.rollback();
			return null;
		}
		await connection.query("UPDATE bao_gia SET trang_thai = 'duoc_chon' WHERE id = ?", [offerId]);
		await connection.query("UPDATE bao_gia SET trang_thai = 'bi_tu_choi' WHERE yeu_cau_id = ? AND id <> ? AND trang_thai = 'cho_khach'", [offer.yeu_cau_id, offerId]);
		const [result] = await connection.query(
			`INSERT INTO cong_viec (yeu_cau_id, bao_gia_id, khach_hang_id, tho_id, gia_chot)
			 VALUES (?, ?, ?, ?, ?)`,
			[offer.yeu_cau_id, offerId, customerId, offer.tho_id, offer.so_tien]
		);
		await connection.commit();
		return { id: result.insertId, yeu_cau_id: offer.yeu_cau_id, bao_gia_id: Number(offerId) };
	} catch (error) {
		await connection.rollback();
		throw error;
	} finally { connection.release(); }
};

exports.withdraw = async (workerId, offerId) => {
	const [result] = await db.query(
		`UPDATE bao_gia SET trang_thai = 'da_rut' WHERE id = ? AND tho_id = ? AND trang_thai = 'cho_khach'`,
		[offerId, workerId]
	);
	return result.affectedRows > 0;
};
