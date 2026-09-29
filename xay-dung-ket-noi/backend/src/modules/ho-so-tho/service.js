const AppError = require('../../utils/AppError');
const dao = require('./dao');
const specialtyDao = require('../chuyen-mon/dao');
const areaService = require('../khu-vuc/khu-vuc.service');

const parseIds = (values, label) => {
	if (!Array.isArray(values)) throw new AppError(`${label} phải là danh sách.`);
	const ids = values.map(Number);
	if (ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) throw new AppError(`${label} không hợp lệ.`);
	return [...new Set(ids)];
};

exports.getMine = async (workerId) => {
	await dao.ensureProfile(workerId);
	return dao.findById(workerId);
};

exports.updateMine = async (workerId, input = {}) => {
	const years = input.so_nam_kinh_nghiem == null ? 0 : Number(input.so_nam_kinh_nghiem);
	const rateFrom = input.gia_tu == null || input.gia_tu === '' ? null : Number(input.gia_tu);
	const rateTo = input.gia_den == null || input.gia_den === '' ? null : Number(input.gia_den);
	const radius = input.ban_kinh_nhan_viec_km == null ? 5 : Number(input.ban_kinh_nhan_viec_km);
	if (!Number.isInteger(years) || years < 0 || years > 255) throw new AppError('Số năm kinh nghiệm không hợp lệ.');
	if ([rateFrom, rateTo].some((value) => value != null && (!Number.isFinite(value) || value < 0))) throw new AppError('Mức giá không hợp lệ.');
	if (rateFrom != null && rateTo != null && rateTo < rateFrom) throw new AppError('Giá đến phải lớn hơn hoặc bằng giá từ.');
	if (!Number.isInteger(radius) || radius < 0 || radius > 255) throw new AppError('Bán kính nhận việc không hợp lệ.');

	const workTypes = ['toan_thoi_gian', 'ban_thoi_gian', 'du_an_theo_goi', 'linh_hoat'];
	const workType = input.hinh_thuc_lam_viec || 'linh_hoat';
	const priceUnit = input.don_vi_gia || 'ngay';
	if (!workTypes.includes(workType) || !['ngay', 'gio'].includes(priceUnit)) throw new AppError('Hình thức làm việc hoặc đơn vị giá không hợp lệ.');

	const specialtyIds = input.chuyen_mon_ids === undefined ? null : parseIds(input.chuyen_mon_ids, 'Chuyên môn');
	const areaIds = input.khu_vuc_ids === undefined ? null : parseIds(input.khu_vuc_ids, 'Khu vực');
	if (specialtyIds) {
		const found = await Promise.all(specialtyIds.map((id) => specialtyDao.findById(id)));
		if (found.some((row) => !row)) throw new AppError('Có chuyên môn không hợp lệ.');
	}
	if (areaIds) {
		const found = await Promise.all(areaIds.map((id) => areaService.exists(id)));
		if (found.some((exists) => !exists)) throw new AppError('Có khu vực không hợp lệ.');
	}

	const primarySpecialty = input.chuyen_mon_chinh_id == null || input.chuyen_mon_chinh_id === ''
		? (specialtyIds?.[0] || null) : Number(input.chuyen_mon_chinh_id);
	if (primarySpecialty != null && (!Number.isSafeInteger(primarySpecialty) || !(await specialtyDao.findById(primarySpecialty)))) {
		throw new AppError('Chuyên môn chính không hợp lệ.');
	}
	if (specialtyIds && primarySpecialty && !specialtyIds.includes(primarySpecialty)) specialtyIds.push(primarySpecialty);

	await dao.update(workerId, {
		chuc_danh: input.chuc_danh ? String(input.chuc_danh).trim().slice(0, 120) : null,
		chuyen_mon_chinh_id: primarySpecialty,
		gioi_thieu: input.gioi_thieu ? String(input.gioi_thieu).trim() : null,
		so_nam_kinh_nghiem: years, hinh_thuc_lam_viec: workType,
		gio_lam_viec: input.gio_lam_viec ? String(input.gio_lam_viec).trim().slice(0, 100) : null,
		gia_tu: rateFrom, gia_den: rateTo, don_vi_gia: priceUnit,
		dang_nhan_viec: input.dang_nhan_viec === false || input.dang_nhan_viec === 0 ? 0 : 1,
		ban_kinh_nhan_viec_km: radius, chuyen_mon_ids: specialtyIds, khu_vuc_ids: areaIds
	});
	return this.getMine(workerId);
};

exports.list = async ({ chuyen_mon_id, khu_vuc_id, limit = 20, page = 1 } = {}) => {
	const parseFilter = (value, label) => {
		if (!value) return null;
		const id = Number(value);
		if (!Number.isSafeInteger(id) || id <= 0) throw new AppError(`${label} không hợp lệ.`);
		return id;
	};
	const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 100);
	return dao.findAll({
		specialtyId: parseFilter(chuyen_mon_id, 'Chuyên môn'),
		areaId: parseFilter(khu_vuc_id, 'Khu vực'),
		limit: pageSize,
		offset: (Math.max(Number(page) || 1, 1) - 1) * pageSize
	});
};

exports.getById = async (value) => {
	const id = Number(value);
	if (!Number.isSafeInteger(id) || id <= 0) throw new AppError('Mã hồ sơ không hợp lệ.');
	const profile = await dao.findById(id);
	if (!profile) throw new AppError('Không tìm thấy hồ sơ thợ.', 404);
	return profile;
};
