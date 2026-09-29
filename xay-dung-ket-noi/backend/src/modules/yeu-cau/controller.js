const service = require('./service');

exports.listMine = async (req, res, next) => {
	try { res.json(await service.listMine(req.user.id)); } catch (error) { next(error); }
};

exports.listOpen = async (req, res, next) => {
	try { res.json(await service.listOpen(req.query)); } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
	try { res.json(await service.getById(req.user, req.params.id)); } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
	try { res.status(201).json(await service.create(req.user.id, req.body)); } catch (error) { next(error); }
};

exports.takeJob = async (req, res, next) => {
	try { res.status(201).json(await service.takeJob(req.user.id, req.params.id)); } catch (error) { next(error); }
};

exports.cancel = async (req, res, next) => {
	try { res.json(await service.cancel(req.user.id, req.params.id)); } catch (error) { next(error); }
};
