const router = require('express').Router();
const controller = require('./controller');
const { requireAuth } = require('../../middlewares/auth');

router.use(requireAuth());
router.get('/', controller.listConversations);
router.post('/', controller.createConversation);
router.get('/:id/tin-nhan', controller.listMessages);
router.post('/:id/tin-nhan', controller.sendMessage);
router.put('/:id/da-doc', controller.markRead);

module.exports = router;
