const crypto = require('node:crypto');
const path = require('node:path');
const AppError = require('../../utils/AppError');
const dao = require('./dao');

const formats = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp'
};
const maximumSize = 5 * 1024 * 1024;

const matchesImageType = (buffer, mimeType) => {
	if (mimeType === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
	if (mimeType === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
	if (mimeType === 'image/webp') return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
	return false;
};

exports.upload = async (userId, input = {}) => {
	const mimeType = String(input.mime_type || '');
	const extension = formats[mimeType];
	if (!extension) throw new AppError('Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.');
	const encoded = typeof input.data === 'string' ? input.data.replace(/^data:[^;]+;base64,/, '') : '';
	if (!encoded || encoded.length > Math.ceil(maximumSize * 4 / 3) + 4) throw new AppError('Ảnh không hợp lệ hoặc vượt quá 5 MB.');
	const buffer = Buffer.from(encoded, 'base64');
	if (!buffer.length || buffer.length > maximumSize || buffer.toString('base64').replace(/=+$/, '') !== encoded.replace(/=+$/, '')) {
		throw new AppError('Ảnh không hợp lệ hoặc vượt quá 5 MB.');
	}
	if (!matchesImageType(buffer, mimeType)) throw new AppError('Nội dung tệp không khớp với định dạng ảnh đã chọn.');
	const filename = `${userId}-${crypto.randomUUID()}.${extension}`;
	const url = await dao.save(filename, buffer);
	return { url, filename };
};

exports.remove = async (userId, value) => {
	const filename = path.basename(String(value || ''));
	if (!filename.startsWith(`${userId}-`) || filename !== value) throw new AppError('Không có quyền xóa tệp này.', 403);
	try { await dao.remove(filename); }
	catch (error) {
		if (error.code === 'ENOENT') throw new AppError('Không tìm thấy tệp.', 404);
		throw error;
	}
	return { message: 'Đã xóa tệp.' };
};
