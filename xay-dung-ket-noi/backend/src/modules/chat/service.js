const AppError = require('../../utils/AppError');
const dao = require('./dao');
const requestDao = require('../yeu-cau/dao');

const parseId = (value, label) => {
	const id = Number(value);
	if (!Number.isSafeInteger(id) || id <= 0) throw new AppError(`${label} không hợp lệ.`);
	return id;
};

const requireConversation = async (conversationId, userId) => {
	const conversation = await dao.findParticipant(parseId(conversationId, 'Cuộc trò chuyện'), userId);
	if (!conversation) throw new AppError('Không tìm thấy cuộc trò chuyện.', 404);
	return conversation;
};

exports.listConversations = (userId) => dao.findConversations(userId);

exports.createConversation = async (user, input = {}) => {
	const workerId = parseId(input.tho_id, 'Mã thợ');
	if (workerId === user.id) throw new AppError('Không thể tự tạo cuộc trò chuyện với chính mình.');
	let requestId = input.yeu_cau_id == null || input.yeu_cau_id === '' ? null : parseId(input.yeu_cau_id, 'Yêu cầu');
	if (user.role === 'customer') {
		if (requestId) {
			const request = await requestDao.findById(requestId);
			if (!request || request.khach_hang_id !== user.id) throw new AppError('Yêu cầu không thuộc về bạn.', 403);
		}
		return { id: await dao.createConversation({ requestId, customerId: user.id, workerId }) };
	}
	if (user.role === 'worker') {
		const request = requestId ? await requestDao.findById(requestId) : null;
		if (requestId && !request) throw new AppError('Không tìm thấy yêu cầu.', 404);
		if (request && request.khach_hang_id !== workerId) throw new AppError('Khách hàng không khớp với yêu cầu.');
		return { id: await dao.createConversation({ requestId, customerId: workerId, workerId: user.id }) };
	}
	throw new AppError('Vai trò không được phép tạo cuộc trò chuyện.', 403);
};

exports.listMessages = async (userId, value, { before_id, limit = 50 } = {}) => {
	const conversation = await requireConversation(value, userId);
	const beforeId = before_id ? parseId(before_id, 'Mã tin nhắn') : null;
	const pageSize = Math.min(Math.max(Number(limit) || 50, 1), 100);
	return dao.findMessages(conversation.id, beforeId, pageSize);
};

exports.sendMessage = async (userId, value, input = {}) => {
	const conversation = await requireConversation(value, userId);
	const content = typeof input.noi_dung === 'string' ? input.noi_dung.trim() : '';
	const fileUrl = input.tep_url ? String(input.tep_url).trim() : null;
	const type = input.loai || (fileUrl ? 'hinh_anh' : 'van_ban');
	if (!['van_ban', 'hinh_anh'].includes(type)) throw new AppError('Loại tin nhắn không hợp lệ.');
	if (!content && !fileUrl) throw new AppError('Tin nhắn không được để trống.');
	const id = await dao.createMessage(conversation.id, userId, { loai: type, noi_dung: content || null, tep_url: fileUrl });
	return { id, message: 'Đã gửi tin nhắn.' };
};

exports.markRead = async (userId, value) => {
	const conversation = await requireConversation(value, userId);
	return { updated: await dao.markRead(conversation.id, userId) };
};
