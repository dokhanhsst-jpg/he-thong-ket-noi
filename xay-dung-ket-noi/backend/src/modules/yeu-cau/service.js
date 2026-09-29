const AppError = require('../../utils/AppError');
const dao = require('./dao');
const specialtyDao = require('../chuyen-mon/dao');
const areaService = require('../khu-vuc/khu-vuc.service');

const parseId = (value, label) => {
	const id = Number(value);
	if (!Number.isSafeInteger(id) || id <= 0) throw new AppError(`${label} không hợp lệ.`);
	return id;
};

exports.listMine = (customerId) => dao.findMine(customerId);

exports.listOpen = ({ chuyen_mon_id, khu_vuc_id, limit = 20, page = 1 }) => {
	const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
	const parsedPage = Math.max(Number(page) || 1, 1);
	const specialtyId = chuyen_mon_id ? parseId(chuyen_mon_id, 'Chuyên môn') : null;
	const areaId = khu_vuc_id ? parseId(khu_vuc_id, 'Khu vực') : null;
	return dao.findOpen({ specialtyId, areaId, limit: parsedLimit, offset: (parsedPage - 1) * parsedLimit });
};

exports.getById = async (user, value) => {
	const request = await dao.findById(parseId(value, 'Yêu cầu'));
	if (!request) throw new AppError('Không tìm thấy yêu cầu.', 404);
	if (user.role !== 'admin' && user.role !== 'worker' && request.khach_hang_id !== user.id) {
		throw new AppError('Bạn không có quyền xem yêu cầu này.', 403);
	}
	return request;
};

exports.create = async (customerId, input = {}) => {
	const title = typeof input.tieu_de === 'string' ? input.tieu_de.trim() : '';
	const description = typeof input.mo_ta === 'string' ? input.mo_ta.trim() : '';
	if (!title || title.length > 200) throw new AppError('Tiêu đề là bắt buộc và tối đa 200 ký tự.');
	if (!description) throw new AppError('Mô tả công việc là bắt buộc.');

	const specialtyId = parseId(input.chuyen_mon_id, 'Chuyên môn');
	const areaId = parseId(input.khu_vuc_id, 'Khu vực');
	if (!(await specialtyDao.findById(specialtyId))) throw new AppError('Chuyên môn không hợp lệ.');
	if (!(await areaService.exists(areaId))) throw new AppError('Khu vực không hợp lệ.');

	const budgetFrom = input.ngan_sach_tu == null || input.ngan_sach_tu === '' ? null : Number(input.ngan_sach_tu);
	const budgetTo = input.ngan_sach_den == null || input.ngan_sach_den === '' ? null : Number(input.ngan_sach_den);
	if ([budgetFrom, budgetTo].some((value) => value != null && (!Number.isFinite(value) || value < 0))) {
		throw new AppError('Ngân sách phải là số không âm.');
	}
	if (budgetFrom != null && budgetTo != null && budgetTo < budgetFrom) {
		throw new AppError('Ngân sách đến phải lớn hơn hoặc bằng ngân sách từ.');
	}

	const urgency = input.muc_do || 'binh_thuong';
	if (!['binh_thuong', 'can_gap'].includes(urgency)) throw new AppError('Mức độ yêu cầu không hợp lệ.');
	const days = input.so_ngay_mong_muon == null || input.so_ngay_mong_muon === ''
		? null : Number(input.so_ngay_mong_muon);
	if (days != null && (!Number.isInteger(days) || days < 1 || days > 65535)) {
		throw new AppError('Số ngày mong muốn không hợp lệ.');
	}

	const id = await dao.create(customerId, {
		tieu_de: title, mo_ta: description, chuyen_mon_id: specialtyId, khu_vuc_id: areaId,
		dia_chi_chi_tiet: input.dia_chi_chi_tiet || null, ngan_sach_tu: budgetFrom,
		ngan_sach_den: budgetTo, so_ngay_mong_muon: days,
		han_hoan_thanh: input.han_hoan_thanh || null, muc_do: urgency
	});
	return { id, message: 'Đã tạo yêu cầu.' };
};

exports.cancel = async (customerId, value) => {
	const changed = await dao.cancel(customerId, parseId(value, 'Yêu cầu'));
	if (!changed) throw new AppError('Yêu cầu không tồn tại, không thuộc về bạn hoặc không còn mở.', 404);
	return { message: 'Đã hủy yêu cầu.' };
};

exports.takeJob = async (workerId, value) => {
	const result = await dao.takeJob(parseId(value, 'Yêu cầu'), workerId);
	if (result.error === 'not_found') throw new AppError('Không tìm thấy yêu cầu.', 404);
	if (result.error === 'not_open') throw new AppError('Việc này đã có người nhận.', 409);
	if (result.error === 'profile_unavailable') {
		throw new AppError('Bạn cần có hồ sơ thợ và bật trạng thái nhận việc để nhận công việc.', 409);
	}
	return { congViecId: result.congViecId, message: 'Bạn đã nhận việc này.' };
};
