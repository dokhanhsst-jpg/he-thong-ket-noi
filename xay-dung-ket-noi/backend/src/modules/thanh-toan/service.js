const AppError = require('../../utils/AppError');
const dao = require('./dao');

const parseId = (value) => {
	const id = Number(value);
	if (!Number.isSafeInteger(id) || id <= 0) throw new AppError('Mã không hợp lệ.');
	return id;
};

const assertParticipant = (job, user) => {
	if (user.role !== 'admin' && job.khach_hang_id !== user.id && job.tho_id !== user.id) throw new AppError('Bạn không có quyền truy cập công việc này.', 403);
};

exports.listForJob = async (user, value) => {
	const job = await dao.findJob(parseId(value));
	if (!job) throw new AppError('Không tìm thấy công việc.', 404);
	assertParticipant(job, user);
	return dao.findForJob(job.id);
};

exports.create = async (user, value, input = {}) => {
	const job = await dao.findJob(parseId(value));
	if (!job) throw new AppError('Không tìm thấy công việc.', 404);
	if (job.khach_hang_id !== user.id) throw new AppError('Chỉ khách hàng của công việc mới tạo đợt thanh toán.', 403);
	if (['hoan_tat', 'da_huy'].includes(job.trang_thai)) throw new AppError('Công việc đã kết thúc, không thể tạo thanh toán.', 409);
	const amount = Number(input.so_tien);
	const installment = Number(input.dot || 1);
	const method = input.phuong_thuc || 'chuyen_khoan';
	if (!Number.isFinite(amount) || amount <= 0) throw new AppError('Số tiền phải lớn hơn 0.');
	if (!Number.isInteger(installment) || installment < 1 || installment > 255) throw new AppError('Đợt thanh toán không hợp lệ.');
	if (!['chuyen_khoan', 'tien_mat', 'vi_dien_tu'].includes(method)) throw new AppError('Phương thức thanh toán không hợp lệ.');
	const id = await dao.create(job.id, { dot: installment, ten_dot: input.ten_dot ? String(input.ten_dot).trim() : null, so_tien: amount, phuong_thuc: method });
	return { id, message: 'Đã tạo đợt thanh toán.' };
};

exports.updateStatus = async (user, value, input = {}) => {
	const payment = await dao.findPayment(parseId(value));
	if (!payment) throw new AppError('Không tìm thấy thanh toán.', 404);
	const allowed = ['cho_thanh_toan', 'da_thanh_toan', 'hoan_tien', 'that_bai'];
	if (!allowed.includes(input.trang_thai)) throw new AppError('Trạng thái thanh toán không hợp lệ.');
	if (input.trang_thai === 'da_thanh_toan' && !input.ma_giao_dich) throw new AppError('Cần mã giao dịch để xác nhận thanh toán.');
	await dao.updateStatus(payment.id, input.trang_thai, input.ma_giao_dich || null);
	return { message: 'Đã cập nhật thanh toán.' };
};
