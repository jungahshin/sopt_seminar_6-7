var express = require('express');
var router = express.Router();

router.use('/', require('./webtoon'));

module.exports = router;
