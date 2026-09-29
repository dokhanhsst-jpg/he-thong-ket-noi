const AppError = require('../../utils/AppError');
const dao = require('./dao');

const parseId = (value, label) => {
	const id = Number(value);
	if (!Number.isSafeInteger(id) || id <= 0) throw new AppError(`${label} không hợp lệ.`);
	return id;
};

exports.listForRequest = async (user, value) => {
	const requestId = parseId(value, 'Yêu cầu');
	const request = await dao.findRequest(requestId);
	if (!request) throw new AppError('Không tìm thấy yêu cầu.', 404);
	if (user.role !== 'admin' && user.id !== request.khach_hang_id && user.role !== 'worker') {
		throw new AppError('Bạn không có quyền xem báo giá này.', 403);
	}
	return dao.findForRequest(requestId);
};

exports.listMine = (workerId) => dao.findMine(workerId);

exports.create = async (workerId, input = {}) => {
	const requestId = parseId(input.yeu_cau_id, 'Yêu cầu');
	const amount = Number(input.so_tien);
	if (!Number.isFinite(amount) || amount <= 0) throw new AppError('Số tiền báo giá phải lớn hơn 0.');
	const days = input.so_ngay_thuc_hien == null || input.so_ngay_thuc_hien === '' ? null : Number(input.so_ngay_thuc_hien);
	if (days != null && (!Number.isInteger(days) || days <= 0 || days > 65535)) throw new AppError('Số ngày thực hiện không hợp lệ.');
	const request = await dao.findRequest(requestId);
	if (!request || request.trang_thai !== 'dang_mo') throw new AppError('Yêu cầu không tồn tại hoặc đã ngừng nhận báo giá.', 409);
	const id = await dao.create(workerId, {
		yeu_cau_id: requestId, so_tien: amount,
		mo_ta: input.mo_ta ? String(input.mo_ta).trim() : null,
		so_ngay_thuc_hien: days, ngay_bat_dau_de_xuat: input.ngay_bat_dau_de_xuat || null
	});
	return { id, message: 'Đã gửi báo giá.' };
};

exports.choose = async (customerId, value) => {
	const result = await dao.choose(customerId, parseId(value, 'Báo giá'));
	if (!result) throw new AppError('Báo giá không tồn tại, không thuộc yêu cầu của bạn hoặc không còn hiệu lực.', 409);
	return { ...result, message: 'Đã chọn báo giá và tạo công việc.' };
};

exports.withdraw = async (workerId, value) => {
	if (!(await dao.withdraw(workerId, parseId(value, 'Báo giá')))) throw new AppError('Không thể rút báo giá này.', 404);
	return { message: 'Đã rút báo giá.' };
};
