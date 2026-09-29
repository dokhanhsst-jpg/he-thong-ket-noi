const service = require('./service');

exports.listMine = async (req, res, next) => {
	try { res.json(await service.listMine(req.user)); } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
	try { res.status(201).json(await service.create(req.user, req.body)); } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
	try { res.json(await service.getById(req.user, req.params.id)); } catch (error) { next(error); }
};

exports.resolve = async (req, res, next) => {
	try { res.json(await service.resolve(req.user.id, req.params.id, req.body)); } catch (error) { next(error); }
};
