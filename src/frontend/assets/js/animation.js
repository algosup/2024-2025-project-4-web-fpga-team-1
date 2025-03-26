document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseButton = document.getElementById('browse-button');
    const fileInfo = document.getElementById('file-info');
    const jsonOutput = document.getElementById('jsonOutput');
    const boardContainer = document.getElementById('board-container');
    const animationControls = document.getElementById('animation-controls');

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
        sdfFile = null;

        Array.from(files).forEach(file => {
            const extension = file.name.split('.').pop().toLowerCase();

            if (extension === 'sdf') {
                sdfFile = file;
            }
        });

        updateFileInfo();
        processFiles();
    }

    // Update file information display
    function updateFileInfo() {
        let infoText = '<p>No SDF file loaded yet</p>';

        if (sdfFile) {
            infoText = `<p><strong>SDF File:</strong> ${sdfFile.name} (${formatFileSize(sdfFile.size)})</p>`;
        }

        fileInfo.innerHTML = `<h3>Loaded File:</h3>${infoText}`;
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

        // Check if SDF file is present
        if (!sdfFile) {
            jsonOutput.textContent = 'Error: SDF file is missing or empty. Please upload an SDF (.sdf) file.';
            return;
        }

        // SDF file is present, proceed with parsing
        const sdfReader = new FileReader();
        sdfReader.onload = function(e) {
            const sdfContent = e.target.result;
            try {
                parsedData = parseSdfFile(sdfContent);
                displayResults(parsedData);
            } catch (error) {
                jsonOutput.textContent = `Error: ${error.message}`;
            }
        };
        sdfReader.readAsText(sdfFile);
    }

    // Replace the existing parseSdfFile function with this one

    function parseSdfFile(sdfContent) {
      // The first level of parsing is handled by converter.js
      // We expose it globally to make it accessible
      window.converterSdfToJson = window.sdfToJson || sdfToJson;

      // Then we apply our restructuring
      return sdfToJson(sdfContent);
    }

    // Replace the sdfToJson function in your animation.js file

    function sdfToJson(sdfContent) {
      // Use the existing parser to get the raw structure
      const rawData = parseSdfRaw(sdfContent);

      // Restructure the data to separate modules and connections
      return restructureFpgaData(rawData);
    }

    // Function to parse SDF into raw structure (as before)
    function parseSdfRaw(sdfContent) {
      // Call the external parser or use the code from converter.js
      // This part remains unchanged, it uses the existing parser

      // Use the window.sdfToJson function if available
      if (window.sdfToJson) {
        return window.sdfToJson(sdfContent);
      }

      // Otherwise, if the code is accessible, import it or copy it here
      // Code from converter.js parser...

      // As a last resort, try calling the API
      console.error("SDF parser not available. Attempting to call the API...");
      return { type: 'DELAYFILE', parsed: false, error: "Parser not available" };
    }

    // Function to restructure FPGA data

    function restructureFpgaData(rawData) {
      if (!rawData || !rawData.cells || rawData.type !== 'DELAYFILE') {
        return rawData; // Return as is if format is incorrect
      }

      const result = {
        type: 'FPGA',
        header: rawData.header,
        modules: [],
        connections: []
      };

      // Map to track already created modules (by ID)
      const moduleMap = new Map();

      // First pass: extract explicitly defined modules
      rawData.cells.forEach(cell => {
        const cellType = cell.properties.celltype;

        if (cellType !== 'fpga_interconnect') {
          // It's a functional module (LUT, DFF, etc.)
          const moduleInstance = cell.properties.instance;

          const module = {
            type: cellType,
            instance: moduleInstance,
            delays: extractDelays(cell.delays),
            timingchecks: cell.timingchecks || []
          };

          result.modules.push(module);
          moduleMap.set(moduleInstance, module);
        }
      });

      // Second pass: handle connections and detect missing modules
      rawData.cells.forEach(cell => {
        const cellType = cell.properties.celltype;

        if (cellType === 'fpga_interconnect') {
          // It's a connection between modules
          const instance = cell.properties.instance;
          const pathInfo = extractPathInfo(instance);

          // Create source/destination modules if they don't exist yet
          if (pathInfo.from && !moduleMap.has(pathInfo.fromClean)) {
            const ioModule = {
              type: 'IO_PORT',
              instance: pathInfo.fromClean,
              isInput: true,
              delays: [],
              timingchecks: []
            };
            result.modules.push(ioModule);
            moduleMap.set(pathInfo.fromClean, ioModule);
          }

          if (pathInfo.to && !moduleMap.has(pathInfo.toClean)) {
            const ioModule = {
              type: 'IO_PORT',
              instance: pathInfo.toClean,
              isOutput: true,
              delays: [],
              timingchecks: []
            };
            result.modules.push(ioModule);
            moduleMap.set(pathInfo.toClean, ioModule);
          }

          // Add the connection
          const connection = {
            id: instance,
            from: pathInfo.from,
            to: pathInfo.to,
            fromClean: pathInfo.fromClean,
            toClean: pathInfo.toClean,
            delays: extractDelays(cell.delays)
          };

          result.connections.push(connection);
        }
      });

      return result;
    }

    // Extract path information from instance name
    function extractPathInfo(instanceName) {
      // Typical format: routing_segment_SOURCE_output_X_Y_to_TARGET_input_A_B
      const parts = instanceName.split('_');
      let fromPart = '';
      let toPart = '';
      let isFromPart = true;
      let toIndex = parts.indexOf('to');

      if (toIndex === -1) {
        return { from: '', to: '', fromClean: '', toClean: '' };
      }

      // Extract the source part (before "to")
      for (let i = 2; i < toIndex; i++) {
        fromPart += (fromPart ? '_' : '') + parts[i];
      }

      // Extract the destination part (after "to")
      for (let i = toIndex + 1; i < parts.length; i++) {
        toPart += (toPart ? '_' : '') + parts[i];
      }

      // Clean names to extract base modules
      const fromClean = cleanModuleName(fromPart);
      const toClean = cleanModuleName(toPart);

      return {
        from: fromPart,
        to: toPart,
        fromClean: fromClean,
        toClean: toClean
      };
    }

    // Clean a module name by removing suffixes like "output_0_0"
    function cleanModuleName(name) {
      // Remove common suffixes
      return name
        .replace(/output_\d+_\d+$/, '')
        .replace(/input_\d+_\d+$/, '')
        .replace(/clock_\d+_\d+$/, '')
        .replace(/_+$/, ''); // Remove trailing underscores
    }

    // Extract delays from a cell
    function extractDelays(delays) {
      if (!delays || !delays.length) return [];

      const result = [];

      delays.forEach(delay => {
        if (delay.paths) {
          delay.paths.forEach(path => {
            result.push({
              from: path.from,
              to: path.to,
              rise: path.rise,
              fall: path.fall
            });
          });
        }
      });

      return result;
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