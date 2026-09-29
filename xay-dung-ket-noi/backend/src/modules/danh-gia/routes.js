const router = require('express').Router();
const controller = require('./controller');
const { requireAuth } = require('../../middlewares/auth');

router.get('/tho/:workerId', controller.listForWorker);
router.post('/', requireAuth('customer', 'worker'), controller.create);
router.put('/:id/huu-ich', requireAuth(), controller.setHelpful);
router.put('/:id/phan-hoi', requireAuth('worker'), controller.reply);
router.post('/:id/cam-on', requireAuth(), controller.thank);

module.exports = router;
