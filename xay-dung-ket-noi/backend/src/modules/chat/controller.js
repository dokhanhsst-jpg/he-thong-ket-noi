const service = require('./service');

exports.listConversations = async (req, res, next) => {
	try { res.json(await service.listConversations(req.user.id)); } catch (error) { next(error); }
};

exports.createConversation = async (req, res, next) => {
	try { res.status(201).json(await service.createConversation(req.user, req.body)); } catch (error) { next(error); }
};

exports.listMessages = async (req, res, next) => {
	try { res.json(await service.listMessages(req.user.id, req.params.id, req.query)); } catch (error) { next(error); }
};

exports.sendMessage = async (req, res, next) => {
	try { res.status(201).json(await service.sendMessage(req.user.id, req.params.id, req.body)); } catch (error) { next(error); }
};

exports.markRead = async (req, res, next) => {
	try { res.json(await service.markRead(req.user.id, req.params.id)); } catch (error) { next(error); }
};
