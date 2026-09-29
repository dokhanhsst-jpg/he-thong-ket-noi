const AppError = require('../../utils/AppError');
const dao = require('./dao');
const jobDao = require('../cong-viec/dao');

const parseId = (value) => {
	const id = Number(value);
	if (!Number.isSafeInteger(id) || id <= 0) throw new AppError('Mã không hợp lệ.');
	return id;
};

const canAccess = (record, user) => user.role === 'admin' || record.khach_hang_id === user.id || record.tho_id === user.id;

exports.listMine = (user) => dao.findForUser(user);

exports.create = async (user, input = {}) => {
	const jobId = parseId(input.cong_viec_id);
	const job = await jobDao.findById(jobId);
	if (!job) throw new AppError('Không tìm thấy công việc.', 404);
	if (job.khach_hang_id !== user.id && job.tho_id !== user.id) throw new AppError('Bạn không tham gia công việc này.', 403);
	if (!['dang_thuc_hien', 'tranh_chap'].includes(job.trang_thai)) throw new AppError('Chỉ có thể mở tranh chấp cho công việc đang thực hiện.', 409);
	const reason = typeof input.ly_do === 'string' ? input.ly_do.trim() : '';
	if (!reason) throw new AppError('Lý do tranh chấp là bắt buộc.');
	const id = await dao.create({ jobId, userId: user.id, reason });
	return { id, message: 'Đã gửi tranh chấp.' };
};

exports.getById = async (user, value) => {
	const record = await dao.findById(parseId(value));
	if (!record) throw new AppError('Không tìm thấy tranh chấp.', 404);
	if (!canAccess(record, user)) throw new AppError('Bạn không có quyền xem tranh chấp này.', 403);
	return record;
};

exports.resolve = async (admin, value, input = {}) => {
	const id = parseId(value);
	const record = await dao.findById(id);
	if (!record) throw new AppError('Không tìm thấy tranh chấp.', 404);
	const status = input.trang_thai;
	const outcome = typeof input.ket_qua === 'string' ? input.ket_qua.trim() : '';
	if (!['da_giai_quyet', 'tu_choi'].includes(status) || !outcome) throw new AppError('Cần trạng thái và kết quả xử lý hợp lệ.');
	if (!(await dao.resolve(id, admin, status, outcome))) throw new AppError('Tranh chấp đã được xử lý.', 409);
	return { message: 'Đã cập nhật kết quả tranh chấp.' };
};
