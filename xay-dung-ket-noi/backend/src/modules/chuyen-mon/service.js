const dao = require('./dao');

exports.list = () => dao.findAll();
