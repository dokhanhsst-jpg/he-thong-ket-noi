const router = require('express').Router();
const controller = require('./controller');
const { requireAuth } = require('../../middlewares/auth');

router.get('/me', requireAuth('worker'), controller.listMine);
router.get('/yeu-cau/:requestId', requireAuth(), controller.listForRequest);
router.post('/', requireAuth('worker'), controller.create);
router.post('/:id/chon', requireAuth('customer'), controller.choose);
router.post('/:id/rut', requireAuth('worker'), controller.withdraw);

module.exports = router;
