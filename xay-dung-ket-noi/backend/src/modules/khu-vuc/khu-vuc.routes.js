const router = require('express').Router();
const controller = require('./khu-vuc.controller');

router.get('/', controller.list);

module.exports = router;
