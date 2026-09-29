const service = require('./service');

exports.listMine = async (req, res, next) => {
	try { res.json(await service.listMine(req.user)); } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
	try { res.json(await service.getById(req.user, req.params.id)); } catch (error) { next(error); }
};

exports.addProgress = async (req, res, next) => {
	try { res.status(201).json(await service.addProgress(req.user, req.params.id, req.body)); } catch (error) { next(error); }
};

exports.updateStatus = async (req, res, next) => {
	try { res.json(await service.updateStatus(req.user, req.params.id, req.body)); } catch (error) { next(error); }
};
