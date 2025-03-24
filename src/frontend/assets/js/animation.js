document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseButton = document.getElementById('browse-button');
    const fileInfo = document.getElementById('file-info');
    const jsonOutput = document.getElementById('jsonOutput');
    const boardContainer = document.getElementById('board-container');
    const animationControls = document.getElementById('animation-controls');
    
    let verilogFile = null;
    let sdfFile = null;
    let parsedData = null;
    
    // Browse button functionality
    browseButton.addEventListener('click', function() {
        fileInput.click();
    });
    
    // File input change handler
    fileInput.addEventListener('change', function(e) {
        handleFiles(e.target.files);
    });
    
    // Drag and drop handlers
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', function() {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });
    
    // Function to handle the uploaded files
    function handleFiles(files) {
        verilogFile = null;
        sdfFile = null;
        
        Array.from(files).forEach(file => {
            const extension = file.name.split('.').pop().toLowerCase();
            
            if (extension === 'v' || extension === 'sv') {
                verilogFile = file;
            } else if (extension === 'sdf') {
                sdfFile = file;
            }
        });
        
        updateFileInfo();
        processFiles();
    }
    
    // Update file information display
    function updateFileInfo() {
        let infoText = '<p>No files loaded yet</p>';
        
        if (verilogFile || sdfFile) {
            const fileList = [];
            
            if (verilogFile) {
                fileList.push(`<p><strong>Verilog File:</strong> ${verilogFile.name} (${formatFileSize(verilogFile.size)})</p>`);
            }
            
            if (sdfFile) {
                fileList.push(`<p><strong>SDF File:</strong> ${sdfFile.name} (${formatFileSize(sdfFile.size)})</p>`);
            }
            
            infoText = fileList.join('');
        }
        
        fileInfo.innerHTML = `<h3>Loaded Files:</h3>${infoText}`;
    }
    
    // Format file size in KB/MB
    function formatFileSize(bytes) {
        if (bytes < 1024) {
            return bytes + ' bytes';
        } else if (bytes < 1048576) {
            return (bytes / 1024).toFixed(2) + ' KB';
        } else {
            return (bytes / 1048576).toFixed(2) + ' MB';
        }
    }
    
    // Process the uploaded files
    function processFiles() {
        // Clear any previous results
        jsonOutput.textContent = '';
        boardContainer.classList.add('hidden');
        animationControls.classList.add('hidden');
        
        // Check if both required files are present
        if (!verilogFile) {
            jsonOutput.textContent = 'Error: Verilog file is missing or empty. Please upload a Verilog (.v) file.';
            return;
        }
        
        if (!sdfFile) {
            jsonOutput.textContent = 'Error: SDF file is missing or empty. Please upload an SDF (.sdf) file.';
            return;
        }
        
        // Both files are present, proceed with parsing
        const verilogReader = new FileReader();
        verilogReader.onload = function(e) {
            const verilogContent = e.target.result;
            
            const sdfReader = new FileReader();
            sdfReader.onload = function(e) {
                const sdfContent = e.target.result;
                try {
                    parsedData = parseFiles(verilogContent, sdfContent);
                    displayResults(parsedData);
                } catch (error) {
                    jsonOutput.textContent = `Error: ${error.message}`;
                }
            };
            sdfReader.readAsText(sdfFile);
        };
        verilogReader.readAsText(verilogFile);
    }
    
    // Display the parsed results
    function displayResults(data) {
        // Display JSON
        jsonOutput.textContent = JSON.stringify(data, null, 2);
        
        // Show the board container
        boardContainer.classList.remove('hidden');
        animationControls.classList.remove('hidden');
        
        // Initialize the board visualization
        initBoardVisualization(data);
    }
    
    // Initialize board visualization
    function initBoardVisualization(data) {
        if (typeof initFPGABoardAnimation === 'function') {
            initFPGABoardAnimation(data);
        } else {
            console.error('Board animation functions not available');
        }
    }
});