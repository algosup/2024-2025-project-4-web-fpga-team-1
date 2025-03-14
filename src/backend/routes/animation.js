const express = require('express');
const router = express.Router();
const path = require('path');

// Route to render the animation page
router.get('/', (req, res) => {
    res.render('animation');
});

// Route to serve the converter.js file directly
router.get('/converter.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../utils/converter.js'));
});

module.exports = router;