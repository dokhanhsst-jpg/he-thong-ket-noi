const router = require('express').Router();
const controller = require('./controller');
const { requireAuth } = require('../../middlewares/auth');

router.get('/cong-viec/:jobId', requireAuth('customer', 'worker'), controller.listForJob);
router.post('/cong-viec/:jobId', requireAuth('customer'), controller.create);
router.patch('/:id/trang-thai', requireAuth('admin'), controller.updateStatus);

module.exports = router;
