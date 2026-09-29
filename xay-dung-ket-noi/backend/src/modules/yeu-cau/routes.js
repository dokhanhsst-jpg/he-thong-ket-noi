const router = require('express').Router();
const controller = require('./controller');
const { requireAuth } = require('../../middlewares/auth');

router.get('/cua-toi', requireAuth('customer'), controller.listMine);
router.get('/', requireAuth('worker'), controller.listOpen);
router.post('/', requireAuth('customer'), controller.create);
router.post('/:id/nhan-viec', requireAuth('worker'), controller.takeJob);
router.get('/:id', requireAuth(), controller.getById);
router.delete('/:id', requireAuth('customer'), controller.cancel);

module.exports = router;
