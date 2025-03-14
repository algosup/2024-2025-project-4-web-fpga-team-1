const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.array('files'), (req, res) => {
    const files = req.files;
    const verilogFile = files.find(file => file.originalname.endsWith('.v'));
    const sdfFile = files.find(file => file.originalname.endsWith('.sdf'));

    if (!verilogFile || !sdfFile) {
        return res.status(400).json({ message: 'Both .v and .sdf files are required.' });
    }

    // Process the Verilog and SDF files
    const verilogFilePath = path.join(__dirname, '../uploads', verilogFile.filename);
    const sdfFilePath = path.join(__dirname, '../uploads', sdfFile.filename);

    // Read and parse the files (this is a simplified example)
    const verilogContent = fs.readFileSync(verilogFilePath, 'utf-8');
    const sdfContent = fs.readFileSync(sdfFilePath, 'utf-8');

    // Extract necessary data for animation (this is a placeholder, you need to implement the actual parsing logic)
    const animationData = {
        verilog: verilogContent,
        sdf: sdfContent
    };

    // Send the processed data back to the client
    res.json({ message: 'Files uploaded and processed successfully', data: animationData });
});

router.get('/', (req, res) => {
    return res.render('animation');
});

module.exports = router;