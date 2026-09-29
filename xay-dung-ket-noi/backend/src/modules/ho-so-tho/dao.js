const db = require('../../config/db');

exports.ensureProfile = async (workerId) => {
	await db.query('INSERT IGNORE INTO ho_so_tho (nguoi_dung_id) VALUES (?)', [workerId]);
};

exports.findById = async (workerId) => {
	const [rows] = await db.query(
		`SELECT nd.id, nd.ten, nd.avatar_url, nd.khu_vuc_id, kv.ten AS ten_khu_vuc,
						hs.chuc_danh, hs.chuyen_mon_chinh_id, cm.ten AS ten_chuyen_mon,
						hs.gioi_thieu, hs.so_nam_kinh_nghiem, hs.hinh_thuc_lam_viec, hs.gio_lam_viec,
						hs.gia_tu, hs.gia_den, hs.don_vi_gia, hs.dang_nhan_viec,
						hs.ban_kinh_nhan_viec_km, hs.da_xac_minh, hs.so_du_an_hoan_thanh,
						hs.diem_trung_binh, hs.so_danh_gia, hs.ty_le_phan_hoi
			 FROM ho_so_tho hs JOIN nguoi_dung nd ON nd.id = hs.nguoi_dung_id
			 JOIN khu_vuc kv ON kv.id = nd.khu_vuc_id
			 LEFT JOIN chuyen_mon cm ON cm.id = hs.chuyen_mon_chinh_id
			WHERE hs.nguoi_dung_id = ? LIMIT 1`,
		[workerId]
	);
	if (!rows[0]) return null;
	const [[specialties], [areas], [portfolio], [certificates]] = await Promise.all([
		db.query('SELECT chuyen_mon_id FROM ho_so_tho_chuyen_mon WHERE tho_id = ?', [workerId]),
		db.query('SELECT khu_vuc_id FROM ho_so_tho_khu_vuc WHERE tho_id = ?', [workerId]),
		db.query('SELECT id, tieu_de, mo_ta, anh_url, ngay_hoan_thanh FROM cong_trinh_tieu_bieu WHERE tho_id = ? ORDER BY id DESC', [workerId]),
		db.query('SELECT id, ten_chung_chi, don_vi_cap, nam_cap, anh_url FROM chung_chi_tho WHERE tho_id = ? ORDER BY id DESC', [workerId])
	]);
	return { ...rows[0], chuyen_mon_ids: specialties.map((row) => row.chuyen_mon_id), khu_vuc_ids: areas.map((row) => row.khu_vuc_id), cong_trinh: portfolio, chung_chi: certificates };
};

exports.findAll = async ({ specialtyId, areaId, limit, offset }) => {
	const filters = ["nd.vai_tro = 'worker'", "nd.trang_thai = 'hoat_dong'", 'hs.dang_nhan_viec = 1'];
	const values = [];
	if (specialtyId) { filters.push('EXISTS (SELECT 1 FROM ho_so_tho_chuyen_mon x WHERE x.tho_id = hs.nguoi_dung_id AND x.chuyen_mon_id = ?)'); values.push(specialtyId); }
	if (areaId) { filters.push('EXISTS (SELECT 1 FROM ho_so_tho_khu_vuc x WHERE x.tho_id = hs.nguoi_dung_id AND x.khu_vuc_id = ?)'); values.push(areaId); }
	values.push(limit, offset);
	const [rows] = await db.query(
		`SELECT nd.id, nd.ten, nd.avatar_url, kv.ten AS ten_khu_vuc, hs.chuc_danh,
						hs.gioi_thieu, hs.so_nam_kinh_nghiem, hs.gia_tu, hs.gia_den,
						hs.diem_trung_binh, hs.so_danh_gia, hs.so_du_an_hoan_thanh
			 FROM ho_so_tho hs JOIN nguoi_dung nd ON nd.id = hs.nguoi_dung_id
			 JOIN khu_vuc kv ON kv.id = nd.khu_vuc_id
			WHERE ${filters.join(' AND ')}
			ORDER BY hs.diem_trung_binh DESC, hs.so_du_an_hoan_thanh DESC, nd.id DESC
			LIMIT ? OFFSET ?`,
		values
	);
	return rows;
};

exports.update = async (workerId, data) => {
	const connection = await db.getConnection();
	try {
		await connection.beginTransaction();
		await connection.query(
			`INSERT INTO ho_so_tho
				 (nguoi_dung_id, chuc_danh, chuyen_mon_chinh_id, gioi_thieu, so_nam_kinh_nghiem,
					hinh_thuc_lam_viec, gio_lam_viec, gia_tu, gia_den, don_vi_gia, dang_nhan_viec, ban_kinh_nhan_viec_km)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			 ON DUPLICATE KEY UPDATE chuc_danh = VALUES(chuc_danh), chuyen_mon_chinh_id = VALUES(chuyen_mon_chinh_id),
				 gioi_thieu = VALUES(gioi_thieu), so_nam_kinh_nghiem = VALUES(so_nam_kinh_nghiem),
				 hinh_thuc_lam_viec = VALUES(hinh_thuc_lam_viec), gio_lam_viec = VALUES(gio_lam_viec),
				 gia_tu = VALUES(gia_tu), gia_den = VALUES(gia_den), don_vi_gia = VALUES(don_vi_gia),
				 dang_nhan_viec = VALUES(dang_nhan_viec), ban_kinh_nhan_viec_km = VALUES(ban_kinh_nhan_viec_km)`,
			[workerId, data.chuc_danh, data.chuyen_mon_chinh_id, data.gioi_thieu, data.so_nam_kinh_nghiem,
				data.hinh_thuc_lam_viec, data.gio_lam_viec, data.gia_tu, data.gia_den,
				data.don_vi_gia, data.dang_nhan_viec, data.ban_kinh_nhan_viec_km]
		);
		if (data.chuyen_mon_ids) {
			await connection.query('DELETE FROM ho_so_tho_chuyen_mon WHERE tho_id = ?', [workerId]);
			if (data.chuyen_mon_ids.length) {
				await connection.query('INSERT INTO ho_so_tho_chuyen_mon (tho_id, chuyen_mon_id) VALUES ?',
					[data.chuyen_mon_ids.map((id) => [workerId, id])]);
			}
		}
		if (data.khu_vuc_ids) {
			await connection.query('DELETE FROM ho_so_tho_khu_vuc WHERE tho_id = ?', [workerId]);
			if (data.khu_vuc_ids.length) {
				await connection.query('INSERT INTO ho_so_tho_khu_vuc (tho_id, khu_vuc_id) VALUES ?',
					[data.khu_vuc_ids.map((id) => [workerId, id])]);
			}
		}
		await connection.commit();
	} catch (error) {
		await connection.rollback();
		throw error;
	} finally { connection.release(); }
};
