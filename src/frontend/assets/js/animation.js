document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseButton = document.getElementById('browse-button');
    const jsonOutput = document.getElementById('jsonOutput');
    const fileInfo = document.getElementById('file-info');
    
    // File storage
    const supportedFiles = {
        verilog: null,
        sdf: null
    };

    // Set up event listeners
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    browseButton.addEventListener('click', () => fileInput.click());

    function handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        dropZone.classList.add('dragover');
    }

    function handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        dropZone.classList.remove('dragover');
    }

    function handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        dropZone.classList.remove('dragover');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            Array.from(files).forEach(file => processFile(file));
        }
    }

    function handleFileSelect(event) {
        const files = event.target.files;
        if (files.length > 0) {
            Array.from(files).forEach(file => processFile(file));
        }
    }

    function processFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        
        if (extension === 'v' || extension === 'sv') {
            processVerilogFile(file);
        } else if (extension === 'sdf') {
            processSdfFile(file);
        } else {
            alert('Please select Verilog (.v, .sv) or SDF (.sdf) files only');
        }
    }

    function processVerilogFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const verilogContent = e.target.result;
            supportedFiles.verilog = {
                name: file.name,
                content: verilogContent
            };
            
            updateFileDisplay();
            
            // Automatically convert to JSON when a Verilog file is loaded
            convertVerilogToJson();
        };
        reader.readAsText(file);
    }

    function processSdfFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const sdfContent = e.target.result;
            supportedFiles.sdf = {
                name: file.name,
                content: sdfContent
            };
            
            updateFileDisplay();
        };
        reader.readAsText(file);
    }

    function updateFileDisplay() {
        let infoHtml = '<h3>Loaded Files:</h3><ul>';
        
        if (supportedFiles.verilog) {
            infoHtml += `<li>Verilog: ${supportedFiles.verilog.name}</li>`;
        }
        
        if (supportedFiles.sdf) {
            infoHtml += `<li>SDF: ${supportedFiles.sdf.name}</li>`;
        }
        
        infoHtml += '</ul>';
        
        fileInfo.innerHTML = infoHtml;
    }

    function convertVerilogToJson() {
        // Check if we have a verilog file loaded
        if (!supportedFiles.verilog) {
            jsonOutput.textContent = "Error: Please upload a Verilog (.v) file first";
            return;
        }
        
        try {
            // Call the parseVerilog function from converter.js
            const designJson = parseVerilog(supportedFiles.verilog.content);
            jsonOutput.textContent = JSON.stringify(designJson, null, 2);
        } catch (err) {
            jsonOutput.textContent = "Error: " + err.message;
        }
    }
});