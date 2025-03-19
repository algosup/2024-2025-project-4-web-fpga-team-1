document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseButton = document.getElementById('browse-button');
    const jsonOutput = document.getElementById('jsonOutput');
    const fileInfo = document.getElementById('file-info');
    
    // Initialize FPGA board animation
    let boardAnimation;
    let animateButton;
    let canvasInitialized = false;
    
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
            
            // Automatically convert to JSON and visualize
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
            
            // If we already have a verilog file converted, update the visualization with timing info
            if (supportedFiles.verilog && jsonOutput.textContent && jsonOutput.textContent.trim() !== "JSON will appear here after loading a Verilog file") {
                try {
                    const designJson = JSON.parse(jsonOutput.textContent);
                    boardAnimation.loadData(designJson, sdfContent);
                } catch (err) {
                    console.error("Error updating board with SDF data:", err);
                }
            }
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
        
        // Show animation controls if we have at least one file
        if (supportedFiles.verilog || supportedFiles.sdf) {
            document.getElementById('animation-controls').classList.remove('hidden');
        }
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
            
            // Update the board visualization
            initializeAnimation(designJson, supportedFiles.sdf ? supportedFiles.sdf.content : null);
        } catch (err) {
            jsonOutput.textContent = "Error: " + err.message;
        }
    }
    
    function initializeAnimation(fpgaJson, sdfContent) {
        try {
            if (!canvasInitialized) {
                boardAnimation = new FPGABoardAnimation('fpga-canvas');
                canvasInitialized = true;
            }
            
            animateButton = document.getElementById('animate-button');
            animateButton.addEventListener('click', toggleAnimation);
            
            // Load data and force multiple redraws to ensure wires appear
            boardAnimation.loadData(fpgaJson, sdfContent);
            
            // Force immediate redraw
            boardAnimation.draw();
            
            // Schedule additional redraws to ensure visibility
            setTimeout(() => {
                boardAnimation.draw();
                console.log("Redrawing canvas after timeout");
            }, 200);
            
            document.getElementById('board-container').classList.remove('hidden');
            document.getElementById('animation-controls').classList.remove('hidden');
        } catch (err) {
            console.error("Error initializing animation:", err);
        }
    }

    function toggleAnimation() {
        try {
            const isPlaying = boardAnimation.toggleAnimation();
            animateButton.textContent = isPlaying ? 'Stop Animation' : 'Start Animation';
        } catch (err) {
            console.error("Animation error:", err);
        }
    }
});

// Add visibility observer to redraw when element comes into viewport
document.addEventListener('DOMContentLoaded', () => {
    const boardContainer = document.getElementById('board-container');
    
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && boardAnimation) {
                        console.log("Board container is now visible, forcing redraw");
                        boardAnimation.forceRedraw();
                    }
                });
            },
            { threshold: 0.1 }
        );
        
        if (boardContainer) {
            observer.observe(boardContainer);
        }
    }
    
    // Also redraw on window resize
    window.addEventListener('resize', () => {
        if (boardAnimation) {
            boardAnimation.forceRedraw();
        }
    });
});