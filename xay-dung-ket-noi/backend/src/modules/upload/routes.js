const router = require('express').Router();
const controller = require('./controller');
const { requireAuth } = require('../../middlewares/auth');

router.post('/', requireAuth(), controller.upload);
router.delete('/:name', requireAuth(), controller.remove);

module.exports = router;
