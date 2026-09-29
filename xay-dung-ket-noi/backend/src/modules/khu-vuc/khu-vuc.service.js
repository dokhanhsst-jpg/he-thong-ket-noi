const dao = require('./khu-vuc.dao');

exports.list = () => dao.findAll();
exports.exists = async (id) => !!(await dao.findById(id));
