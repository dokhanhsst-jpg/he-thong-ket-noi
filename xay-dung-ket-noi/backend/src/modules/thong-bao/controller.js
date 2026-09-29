const service = require('./service');

exports.listMine = async (req, res, next) => {
	try { res.json(await service.listMine(req.user.id, req.query)); } catch (error) { next(error); }
};

exports.markRead = async (req, res, next) => {
	try { res.json(await service.markRead(req.user.id, req.params.id)); } catch (error) { next(error); }
};

exports.markAllRead = async (req, res, next) => {
	try { res.json(await service.markAllRead(req.user.id)); } catch (error) { next(error); }
};
