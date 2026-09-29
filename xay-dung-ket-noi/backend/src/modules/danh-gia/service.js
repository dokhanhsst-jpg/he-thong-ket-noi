const AppError = require('../../utils/AppError');
const dao = require('./dao');

const idValue = (value, label) => {
	const id = Number(value);
	if (!Number.isSafeInteger(id) || id <= 0) throw new AppError(`${label} không hợp lệ.`);
	return id;
};

exports.listForWorker = async (value) => dao.findForWorker(idValue(value, 'Mã thợ'));

exports.create = async (reviewerId, input = {}) => {
	const jobId = idValue(input.cong_viec_id, 'Công việc');
	const stars = Number(input.so_sao);
	if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new AppError('Số sao phải từ 1 đến 5.');
	const job = await dao.findJob(jobId);
	if (!job || job.trang_thai !== 'hoan_tat') throw new AppError('Chỉ có thể đánh giá công việc đã hoàn tất.', 409);
	const targetId = job.khach_hang_id === reviewerId ? job.tho_id : job.tho_id === reviewerId ? job.khach_hang_id : null;
	if (!targetId) throw new AppError('Bạn không tham gia công việc này.', 403);
	const id = await dao.create({ cong_viec_id: jobId, reviewerId, targetId, so_sao: stars, noi_dung: input.noi_dung ? String(input.noi_dung).trim() : null });
	return { id, message: 'Đã gửi đánh giá.' };
};

exports.setHelpful = async (userId, value, helpful) => {
	const review = await dao.findById(idValue(value, 'Đánh giá'));
	if (!review) throw new AppError('Không tìm thấy đánh giá.', 404);
	if (review.nguoi_danh_gia_id === userId) throw new AppError('Bạn không thể tự đánh dấu đánh giá của mình là hữu ích.');
	await dao.setHelpful(review.id, userId, helpful);
	return { message: helpful ? 'Đã ghi nhận đánh giá hữu ích.' : 'Đã bỏ đánh dấu hữu ích.' };
};

exports.reply = async (userId, value, text) => {
	const review = await dao.findById(idValue(value, 'Đánh giá'));
	if (!review) throw new AppError('Không tìm thấy đánh giá.', 404);
	if (review.nguoi_duoc_danh_gia_id !== userId) throw new AppError('Bạn không có quyền phản hồi đánh giá này.', 403);
	const reply = typeof text === 'string' ? text.trim() : '';
	if (!reply) throw new AppError('Nội dung phản hồi là bắt buộc.');
	await dao.reply(review.id, reply);
	return { message: 'Đã phản hồi đánh giá.' };
};

exports.thank = async (userId, value) => {
	if (!(await dao.thank(idValue(value, 'Đánh giá'), userId))) throw new AppError('Chỉ người viết đánh giá mới có thể cảm ơn.', 403);
	return { message: 'Đã gửi lời cảm ơn.' };
};
