const service = require('./service');

exports.getMine = async (req, res, next) => {
	try { res.json(await service.getMine(req.user.id)); } catch (error) { next(error); }
};

exports.updateMine = async (req, res, next) => {
	try { res.json(await service.updateMine(req.user.id, req.body)); } catch (error) { next(error); }
};

exports.list = async (req, res, next) => {
	try { res.json(await service.list(req.query)); } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
	try { res.json(await service.getById(req.params.id)); } catch (error) { next(error); }
};
