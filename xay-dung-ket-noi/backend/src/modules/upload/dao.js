const fs = require('node:fs/promises');
const path = require('node:path');

const uploadDirectory = path.resolve(__dirname, '../../../uploads');

exports.save = async (filename, buffer) => {
	await fs.mkdir(uploadDirectory, { recursive: true });
	await fs.writeFile(path.join(uploadDirectory, filename), buffer, { flag: 'wx' });
	return `/uploads/${filename}`;
};

exports.remove = async (filename) => {
	await fs.unlink(path.join(uploadDirectory, filename));
};
