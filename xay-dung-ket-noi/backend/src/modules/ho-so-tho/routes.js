const router = require('express').Router();
const controller = require('./controller');
const { requireAuth } = require('../../middlewares/auth');

router.get('/me', requireAuth('worker'), controller.getMine);
router.put('/me', requireAuth('worker'), controller.updateMine);
router.get('/', controller.list);
router.get('/:id', controller.getById);

module.exports = router;
