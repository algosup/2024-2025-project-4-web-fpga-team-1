const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/upload', upload.array('files'), (req, res) => {
    res.json({ message: 'Files uploaded successfully', files: req.files });
});

router.get('/', (req, res) => {
    return res.render('animation');
});

module.exports = router;