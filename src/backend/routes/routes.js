const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('main');
});

router.get('/help', (req, res) => {
    return res.render('help');
});

module.exports = router;