const service = require('./khu-vuc.service');

exports.list = async (req, res, next) => {
  try { res.json(await service.list()); } catch (e) { next(e); }
};
