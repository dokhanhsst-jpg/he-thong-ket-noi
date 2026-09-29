const router = require('express').Router();
const controller = require('./controller');
const { requireAuth } = require('../../middlewares/auth');

router.get('/', requireAuth(), controller.listMine);
router.post('/', requireAuth('customer', 'worker'), controller.create);
router.get('/:id', requireAuth(), controller.getById);
router.patch('/:id/giai-quyet', requireAuth('admin'), controller.resolve);

module.exports = router;
