const service = require('./service');

exports.listForJob = async (req, res, next) => {
	try { res.json(await service.listForJob(req.user, req.params.jobId)); } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
	try { res.status(201).json(await service.create(req.user, req.params.jobId, req.body)); } catch (error) { next(error); }
};

exports.updateStatus = async (req, res, next) => {
	try { res.json(await service.updateStatus(req.user, req.params.id, req.body)); } catch (error) { next(error); }
};
