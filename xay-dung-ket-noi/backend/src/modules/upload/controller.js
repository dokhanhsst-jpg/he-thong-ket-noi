const service = require('./service');

exports.upload = async (req, res, next) => {
	try { res.status(201).json(await service.upload(req.user.id, req.body)); } catch (error) { next(error); }
};

exports.remove = async (req, res, next) => {
	try { res.json(await service.remove(req.user.id, req.params.name)); } catch (error) { next(error); }
};
