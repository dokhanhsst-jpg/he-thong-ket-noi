const db = require('../../config/db');

exports.findAll = async () => {
	const [rows] = await db.query(
		'SELECT id, ten, mo_ta FROM chuyen_mon WHERE dang_hoat_dong = 1 ORDER BY thu_tu, ten'
	);
	return rows;
};

exports.findById = async (id) => {
	const [rows] = await db.query(
		'SELECT id, ten, mo_ta FROM chuyen_mon WHERE id = ? AND dang_hoat_dong = 1 LIMIT 1',
		[id]
	);
	return rows[0] || null;
};
