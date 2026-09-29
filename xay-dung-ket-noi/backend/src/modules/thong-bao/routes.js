const router = require('express').Router();
const controller = require('./controller');
const { requireAuth } = require('../../middlewares/auth');

router.use(requireAuth());
router.get('/', controller.listMine);
router.put('/da-doc-tat-ca', controller.markAllRead);
router.put('/:id/da-doc', controller.markRead);

module.exports = router;
