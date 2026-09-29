const service = require('./service');

exports.listForWorker = async (req, res, next) => {
	try { res.json(await service.listForWorker(req.params.workerId)); } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
	try { res.status(201).json(await service.create(req.user.id, req.body)); } catch (error) { next(error); }
};

exports.setHelpful = async (req, res, next) => {
	try { res.json(await service.setHelpful(req.user.id, req.params.id, req.body.helpful !== false)); } catch (error) { next(error); }
};

exports.reply = async (req, res, next) => {
	try { res.json(await service.reply(req.user.id, req.params.id, req.body.phan_hoi)); } catch (error) { next(error); }
};

exports.thank = async (req, res, next) => {
	try { res.json(await service.thank(req.user.id, req.params.id)); } catch (error) { next(error); }
};
