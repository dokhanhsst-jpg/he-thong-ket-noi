const db = require('../../config/db');

exports.findMine = async (customerId) => {
	const [rows] = await db.query(
		`SELECT yc.id, yc.tieu_de, yc.mo_ta, yc.ngan_sach_tu, yc.ngan_sach_den,
						yc.trang_thai, yc.created_at, kv.ten AS ten_khu_vuc, cm.ten AS ten_chuyen_mon
			 FROM yeu_cau yc
			 JOIN khu_vuc kv ON kv.id = yc.khu_vuc_id
			 JOIN chuyen_mon cm ON cm.id = yc.chuyen_mon_id
			WHERE yc.khach_hang_id = ?
			ORDER BY yc.created_at DESC, yc.id DESC`,
		[customerId]
	);
	return rows;
};

exports.findOpen = async ({ specialtyId, areaId, limit, offset }) => {
	const conditions = ["yc.trang_thai = 'dang_mo'"];
	const values = [];
	if (specialtyId) { conditions.push('yc.chuyen_mon_id = ?'); values.push(specialtyId); }
	if (areaId) { conditions.push('yc.khu_vuc_id = ?'); values.push(areaId); }
	values.push(limit, offset);
	const [rows] = await db.query(
		`SELECT yc.id, yc.tieu_de, yc.mo_ta, yc.muc_do, yc.ngan_sach_tu, yc.ngan_sach_den,
						yc.han_hoan_thanh, yc.created_at, yc.khu_vuc_id, yc.chuyen_mon_id,
						nd.ten AS ten_khach_hang, kv.ten AS ten_khu_vuc, cm.ten AS ten_chuyen_mon,
						(SELECT COUNT(*) FROM bao_gia bg WHERE bg.yeu_cau_id = yc.id) AS so_bao_gia
			 FROM yeu_cau yc
			 JOIN nguoi_dung nd ON nd.id = yc.khach_hang_id
			 JOIN khu_vuc kv ON kv.id = yc.khu_vuc_id
			 JOIN chuyen_mon cm ON cm.id = yc.chuyen_mon_id
			WHERE ${conditions.join(' AND ')}
			ORDER BY yc.created_at DESC, yc.id DESC LIMIT ? OFFSET ?`,
		values
	);
	return rows;
};

exports.findById = async (id) => {
	const [rows] = await db.query(
		`SELECT yc.*, nd.ten AS ten_khach_hang, kv.ten AS ten_khu_vuc, cm.ten AS ten_chuyen_mon
			 FROM yeu_cau yc
			 JOIN nguoi_dung nd ON nd.id = yc.khach_hang_id
			 JOIN khu_vuc kv ON kv.id = yc.khu_vuc_id
			 JOIN chuyen_mon cm ON cm.id = yc.chuyen_mon_id
			WHERE yc.id = ? LIMIT 1`,
		[id]
	);
	return rows[0] || null;
};

exports.create = async (customerId, data) => {
	const [result] = await db.query(
		`INSERT INTO yeu_cau
			 (khach_hang_id, tieu_de, chuyen_mon_id, mo_ta, khu_vuc_id, dia_chi_chi_tiet,
				ngan_sach_tu, ngan_sach_den, so_ngay_mong_muon, han_hoan_thanh, muc_do)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[customerId, data.tieu_de, data.chuyen_mon_id, data.mo_ta, data.khu_vuc_id,
			data.dia_chi_chi_tiet || null, data.ngan_sach_tu, data.ngan_sach_den,
			data.so_ngay_mong_muon, data.han_hoan_thanh, data.muc_do]
	);
	return result.insertId;
};

exports.cancel = async (customerId, id) => {
	const [result] = await db.query(
		`UPDATE yeu_cau SET trang_thai = 'da_huy'
			WHERE id = ? AND khach_hang_id = ? AND trang_thai = 'dang_mo'`,
		[id, customerId]
	);
	return result.affectedRows > 0;
};

exports.takeJob = async (requestId, workerId) => {
	const connection = await db.getConnection();
	try {
		await connection.beginTransaction();
		const [[request]] = await connection.query(
			`SELECT id, khach_hang_id, ngan_sach_den, trang_thai
				 FROM yeu_cau WHERE id = ? FOR UPDATE`,
			[requestId]
		);
		if (!request) {
			await connection.rollback();
			return { error: 'not_found' };
		}
		if (request.trang_thai !== 'dang_mo') {
			await connection.rollback();
			return { error: 'not_open' };
		}

		const [[profile]] = await connection.query(
			`SELECT dang_nhan_viec FROM ho_so_tho
				 WHERE nguoi_dung_id = ? FOR UPDATE`,
			[workerId]
		);
		if (!profile || Number(profile.dang_nhan_viec) !== 1) {
			await connection.rollback();
			return { error: 'profile_unavailable' };
		}

		const [offers] = await connection.query(
			'SELECT id FROM bao_gia WHERE yeu_cau_id = ? AND tho_id = ? FOR UPDATE',
			[requestId, workerId]
		);
		let offerId;
		if (offers[0]) {
			offerId = offers[0].id;
			await connection.query(
				"UPDATE bao_gia SET so_tien = ?, trang_thai = 'duoc_chon' WHERE id = ?",
				[request.ngan_sach_den, offerId]
			);
		} else {
			const [offerResult] = await connection.query(
				`INSERT INTO bao_gia (yeu_cau_id, tho_id, so_tien, trang_thai)
				 VALUES (?, ?, ?, 'duoc_chon')`,
				[requestId, workerId, request.ngan_sach_den]
			);
			offerId = offerResult.insertId;
		}

		await connection.query(
			"UPDATE bao_gia SET trang_thai = 'bi_tu_choi' WHERE yeu_cau_id = ? AND id <> ? AND trang_thai = 'cho_khach'",
			[requestId, offerId]
		);
		const [jobResult] = await connection.query(
			`INSERT INTO cong_viec (yeu_cau_id, bao_gia_id, khach_hang_id, tho_id, gia_chot, trang_thai)
			 VALUES (?, ?, ?, ?, ?, 'cho_xac_nhan')`,
			[requestId, offerId, request.khach_hang_id, workerId, request.ngan_sach_den]
		);
		await connection.query("UPDATE yeu_cau SET trang_thai = 'da_chot' WHERE id = ?", [requestId]);
		await connection.commit();
		return { congViecId: jobResult.insertId };
	} catch (error) {
		await connection.rollback();
		throw error;
	} finally {
		connection.release();
	}
};
