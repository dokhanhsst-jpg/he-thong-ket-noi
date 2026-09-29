const service = require('./service');

exports.listForRequest = async (req, res, next) => {
	try { res.json(await service.listForRequest(req.user, req.params.requestId)); } catch (error) { next(error); }
};

exports.listMine = async (req, res, next) => {
	try { res.json(await service.listMine(req.user.id)); } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
	try { res.status(201).json(await service.create(req.user.id, req.body)); } catch (error) { next(error); }
};

exports.choose = async (req, res, next) => {
	try { res.status(201).json(await service.choose(req.user.id, req.params.id)); } catch (error) { next(error); }
};

exports.withdraw = async (req, res, next) => {
	try { res.json(await service.withdraw(req.user.id, req.params.id)); } catch (error) { next(error); }
};
