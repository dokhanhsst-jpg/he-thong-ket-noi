const AppError = require('../../utils/AppError');
const dao = require('./dao');

const parseId = (value) => {
	const id = Number(value);
	if (!Number.isSafeInteger(id) || id <= 0) throw new AppError('Mã công việc không hợp lệ.');
	return id;
};

const assertParticipant = (job, user) => {
	if (user.role !== 'admin' && job.khach_hang_id !== user.id && job.tho_id !== user.id) {
		throw new AppError('Bạn không có quyền truy cập công việc này.', 403);
	}
};

exports.listMine = (user) => dao.findForUser(user);

exports.getById = async (user, value) => {
	const job = await dao.findById(parseId(value));
	if (!job) throw new AppError('Không tìm thấy công việc.', 404);
	assertParticipant(job, user);
	return job;
};

exports.addProgress = async (user, value, input = {}) => {
	const job = await dao.findById(parseId(value));
	if (!job) throw new AppError('Không tìm thấy công việc.', 404);
	assertParticipant(job, user);
	if (['hoan_tat', 'da_huy'].includes(job.trang_thai)) throw new AppError('Công việc đã kết thúc, không thể cập nhật tiến độ.', 409);
	const content = typeof input.noi_dung === 'string' ? input.noi_dung.trim() : '';
	const percent = Number(input.phan_tram ?? 0);
	if (!content) throw new AppError('Nội dung tiến độ là bắt buộc.');
	if (!Number.isInteger(percent) || percent < 0 || percent > 100) throw new AppError('Tiến độ phải từ 0 đến 100.');
	const id = await dao.addProgress(job.id, user.id, { noi_dung: content, phan_tram: percent, anh_url: input.anh_url || null });
	return { id, message: 'Đã cập nhật tiến độ.' };
};

exports.updateStatus = async (user, value, input = {}) => {
	const job = await dao.findById(parseId(value));
	if (!job) throw new AppError('Không tìm thấy công việc.', 404);
	assertParticipant(job, user);
	const transitions = {
		cho_xac_nhan: ['dang_thuc_hien', 'da_huy'],
		dang_thuc_hien: ['hoan_tat', 'da_huy', 'tranh_chap'],
		tranh_chap: [], hoan_tat: [], da_huy: []
	};
	const nextStatus = input.trang_thai;
	if (!transitions[job.trang_thai]?.includes(nextStatus)) throw new AppError('Không thể chuyển trạng thái công việc như yêu cầu.', 409);
	if (user.role !== 'admin') {
		const allowedByRole = user.role === 'worker'
			? ['dang_thuc_hien', 'tranh_chap']
			: ['da_huy', 'hoan_tat'];
		if (!allowedByRole.includes(nextStatus)) throw new AppError('Vai trò của bạn không thể thực hiện thay đổi trạng thái này.', 403);
	}
	if (nextStatus === 'da_huy' && !String(input.ly_do_huy || '').trim()) throw new AppError('Vui lòng nhập lý do hủy.');
	await dao.updateStatus(job.id, nextStatus, nextStatus === 'da_huy' ? String(input.ly_do_huy).trim().slice(0, 255) : null);
	return { message: 'Đã cập nhật trạng thái công việc.', trang_thai: nextStatus };
};
