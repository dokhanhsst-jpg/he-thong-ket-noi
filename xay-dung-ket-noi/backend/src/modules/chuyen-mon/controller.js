const service = require('./service');

exports.list = async (req, res, next) => {
	try { res.json(await service.list()); } catch (error) { next(error); }
};
