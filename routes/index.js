var express = require('express');
var router = express.Router();

router.use('/comment', require('./comment'));
router.use('/eplist', require('./eplist'));
router.use('/wtlist', require('./wtlist'));
router.use('/user', require('./user'));

module.exports = router;
