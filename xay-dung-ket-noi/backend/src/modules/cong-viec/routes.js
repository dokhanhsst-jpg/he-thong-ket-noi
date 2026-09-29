const router = require('express').Router();
const controller = require('./controller');
const { requireAuth } = require('../../middlewares/auth');

router.get('/me', requireAuth('customer', 'worker'), controller.listMine);
router.get('/:id', requireAuth('customer', 'worker'), controller.getById);
router.post('/:id/tien-do', requireAuth('customer', 'worker'), controller.addProgress);
router.patch('/:id/trang-thai', requireAuth('customer', 'worker'), controller.updateStatus);

module.exports = router;
