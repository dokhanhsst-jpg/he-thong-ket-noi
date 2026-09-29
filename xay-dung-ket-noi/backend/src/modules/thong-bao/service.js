const AppError = require('../../utils/AppError');
const dao = require('./dao');

exports.listMine = (userId, { chi_chua_doc, limit = 30, before_id } = {}) => {
	const pageSize = Math.min(Math.max(Number(limit) || 30, 1), 100);
	const beforeId = before_id == null ? null : Number(before_id);
	if (beforeId != null && (!Number.isSafeInteger(beforeId) || beforeId <= 0)) throw new AppError('Mã thông báo không hợp lệ.');
	return dao.findMine(userId, { unreadOnly: chi_chua_doc === 'true' || chi_chua_doc === '1', limit: pageSize, beforeId });
};

exports.markRead = async (userId, value) => {
	const id = Number(value);
	if (!Number.isSafeInteger(id) || id <= 0) throw new AppError('Mã thông báo không hợp lệ.');
	if (!(await dao.markRead(userId, id))) throw new AppError('Không tìm thấy thông báo.', 404);
	return { message: 'Đã đánh dấu đã đọc.' };
};

exports.markAllRead = async (userId) => ({ updated: await dao.markAllRead(userId) });

exports.create = (data) => dao.create(data);
