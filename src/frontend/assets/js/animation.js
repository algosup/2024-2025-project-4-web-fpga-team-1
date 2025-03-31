document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseButton = document.getElementById('browse-button');
    const lutExampleButton = document.getElementById('lut-example-button');
    const ffExampleButton = document.getElementById('ff-example-button');
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

    // LUT Example button functionality
    lutExampleButton.addEventListener('click', function() {
        loadExampleCircuit('lut');
    });

    // Flip Flop Example button functionality
    ffExampleButton.addEventListener('click', function() {
        loadExampleCircuit('ff');
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

    // Function to load example circuits
    function loadExampleCircuit(type) {
        // Clear previous data
        sdfFile = null;
        
        let exampleName = '';
        let exampleData = null;
        
        if (type === 'lut') {
            exampleName = 'LUT Example';
            exampleData = getLUTExampleData();
        } else if (type === 'ff') {
            exampleName = 'Flip Flop Example';
            exampleData = getFlipFlopExampleData();
        }
        
        // Update UI with success message
        fileInfo.innerHTML = `<h3>Loaded Example:</h3><p><strong>${exampleName}</strong> (predefined circuit)</p>`;
        
        // Process the example data
        parsedData = exampleData;
        displayResults(parsedData);
    }

    // LUT Example data
    function getLUTExampleData() {
        return {
            "type": "FPGA",
            "header": {
                "sdfversion": "2.1",
                "design": "LUT",
                "vendor": "Example",
                "program": "FPGA Visualizer",
                "version": "1.0",
                "divider": "/",
                "timescale": 1
            },
            "modules": [
                {
                    "type": "IO_PORT",
                    "instance": "A",
                    "isInput": true,
                    "delays": [],
                    "timingchecks": []
                },
                {
                    "type": "IO_PORT",
                    "instance": "B",
                    "isInput": true,
                    "delays": [],
                    "timingchecks": []
                },
                {
                    "type": "IO_PORT",
                    "instance": "C",
                    "isInput": true,
                    "delays": [],
                    "timingchecks": []
                },
                {
                    "type": "LUT_K",
                    "instance": "lut_core",
                    "delays": [
                        {
                            "from": "in[0]",
                            "to": "out",
                            "rise": {
                                "min": 152,
                                "typical": 152,
                                "max": 152
                            },
                            "fall": {
                                "min": 152,
                                "typical": 152,
                                "max": 152
                            }
                        },
                        {
                            "from": "in[1]",
                            "to": "out",
                            "rise": {
                                "min": 150,
                                "typical": 150,
                                "max": 150
                            },
                            "fall": {
                                "min": 150,
                                "typical": 150,
                                "max": 150
                            }
                        },
                        {
                            "from": "in[2]",
                            "to": "out",
                            "rise": {
                                "min": 148,
                                "typical": 148,
                                "max": 148
                            },
                            "fall": {
                                "min": 148,
                                "typical": 148,
                                "max": 148
                            }
                        }
                    ],
                    "timingchecks": []
                },
                {
                    "type": "IO_PORT",
                    "instance": "Y",
                    "isOutput": true,
                    "delays": [],
                    "timingchecks": []
                }
            ],
            "connections": [
                {
                    "id": "routing_segment_A_to_lut_core_input_0",
                    "from": "A",
                    "to": "lut_core_input_0",
                    "fromClean": "A",
                    "toClean": "lut_core",
                    "delays": [
                        {
                            "from": "datain",
                            "to": "dataout",
                            "rise": {
                                "min": 500,
                                "typical": 500,
                                "max": 500
                            },
                            "fall": {
                                "min": 500,
                                "typical": 500,
                                "max": 500
                            }
                        }
                    ]
                },
                {
                    "id": "routing_segment_B_to_lut_core_input_1",
                    "from": "B",
                    "to": "lut_core_input_1",
                    "fromClean": "B",
                    "toClean": "lut_core",
                    "delays": [
                        {
                            "from": "datain",
                            "to": "dataout",
                            "rise": {
                                "min": 550,
                                "typical": 550,
                                "max": 550
                            },
                            "fall": {
                                "min": 550,
                                "typical": 550,
                                "max": 550
                            }
                        }
                    ]
                },
                {
                    "id": "routing_segment_C_to_lut_core_input_2",
                    "from": "C",
                    "to": "lut_core_input_2",
                    "fromClean": "C",
                    "toClean": "lut_core",
                    "delays": [
                        {
                            "from": "datain",
                            "to": "dataout",
                            "rise": {
                                "min": 600,
                                "typical": 600,
                                "max": 600
                            },
                            "fall": {
                                "min": 600,
                                "typical": 600,
                                "max": 600
                            }
                        }
                    ]
                },
                {
                    "id": "routing_segment_lut_core_to_Y",
                    "from": "lut_core",
                    "to": "Y_input_0",
                    "fromClean": "lut_core",
                    "toClean": "Y",
                    "delays": [
                        {
                            "from": "datain",
                            "to": "dataout",
                            "rise": {
                                "min": 750,
                                "typical": 750,
                                "max": 750
                            },
                            "fall": {
                                "min": 750,
                                "typical": 750,
                                "max": 750
                            }
                        }
                    ]
                }
            ]
        };
    }

    // Flip Flop Example data
    function getFlipFlopExampleData() {
        return {
            "type": "FPGA",
            "header": {
                "sdfversion": "2.1",
                "design": "FF1",
                "vendor": "Example",
                "program": "FPGA Visualizer",
                "version": "1.0",
                "divider": "/",
                "timescale": 1
            },
            "modules": [
                {
                    "type": "IO_PORT",
                    "instance": "D",
                    "isInput": true,
                    "delays": [],
                    "timingchecks": []
                },
                {
                    "type": "IO_PORT",
                    "instance": "clk",
                    "isInput": true,
                    "delays": [],
                    "timingchecks": []
                },
                {
                    "type": "IO_PORT",
                    "instance": "reset",
                    "isInput": true,
                    "delays": [],
                    "timingchecks": []
                },
                {
                    "type": "LUT_K",
                    "instance": "lut_mux",
                    "delays": [
                        {
                            "from": "in[1]",
                            "to": "out",
                            "rise": {
                                "min": 152,
                                "typical": 152,
                                "max": 152
                            },
                            "fall": {
                                "min": 152,
                                "typical": 152,
                                "max": 152
                            }
                        },
                        {
                            "from": "in[2]",
                            "to": "out",
                            "rise": {
                                "min": 150,
                                "typical": 150,
                                "max": 150
                            },
                            "fall": {
                                "min": 150,
                                "typical": 150,
                                "max": 150
                            }
                        }
                    ],
                    "timingchecks": []
                },
                {
                    "type": "DFF",
                    "instance": "latch_Q",
                    "delays": [
                        {
                            "from": {
                                "type": "posedge",
                                "value": "clock"
                            },
                            "to": "Q",
                            "rise": {
                                "min": 303,
                                "typical": 303,
                                "max": 303
                            },
                            "fall": {
                                "min": 303,
                                "typical": 303,
                                "max": 303
                            }
                        }
                    ],
                    "timingchecks": [
                        {
                            "type": "TIMINGCHECK",
                            "checks": [
                                {
                                    "type": "SETUP",
                                    "from": "D",
                                    "to": {
                                        "type": "posedge",
                                        "value": "clock"
                                    },
                                    "value": {
                                        "min": -46,
                                        "typical": -46,
                                        "max": -46
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    "type": "IO_PORT",
                    "instance": "Q",
                    "isOutput": true,
                    "delays": [],
                    "timingchecks": []
                }
            ],
            "connections": [
                {
                    "id": "routing_segment_D_to_lut_mux_input_2",
                    "from": "D",
                    "to": "lut_mux_input_2",
                    "fromClean": "D",
                    "toClean": "lut_mux",
                    "delays": [
                        {
                            "from": "datain",
                            "to": "dataout",
                            "rise": {
                                "min": 235.697,
                                "typical": 235.697,
                                "max": 235.697
                            },
                            "fall": {
                                "min": 235.697,
                                "typical": 235.697,
                                "max": 235.697
                            }
                        }
                    ]
                },
                {
                    "id": "routing_segment_reset_to_lut_mux_input_1",
                    "from": "reset",
                    "to": "lut_mux_input_1",
                    "fromClean": "reset",
                    "toClean": "lut_mux",
                    "delays": [
                        {
                            "from": "datain",
                            "to": "dataout",
                            "rise": {
                                "min": 617.438,
                                "typical": 617.438,
                                "max": 617.438
                            },
                            "fall": {
                                "min": 617.438,
                                "typical": 617.438,
                                "max": 617.438
                            }
                        }
                    ]
                },
                {
                    "id": "routing_segment_clk_to_latch_Q_clock",
                    "from": "clk",
                    "to": "latch_Q_clock_0_0",
                    "fromClean": "clk",
                    "toClean": "latch_Q",
                    "delays": [
                        {
                            "from": "datain",
                            "to": "dataout",
                            "rise": {
                                "min": 210,
                                "typical": 210,
                                "max": 210
                            },
                            "fall": {
                                "min": 210,
                                "typical": 210,
                                "max": 210
                            }
                        }
                    ]
                },
                {
                    "id": "routing_segment_lut_mux_to_latch_Q",
                    "from": "lut_mux",
                    "to": "latch_Q_input_0_0",
                    "fromClean": "lut_mux",
                    "toClean": "latch_Q",
                    "delays": [
                        {
                            "from": "datain",
                            "to": "dataout",
                            "rise": {
                                "min": 96,
                                "typical": 96,
                                "max": 96
                            },
                            "fall": {
                                "min": 96,
                                "typical": 96,
                                "max": 96
                            }
                        }
                    ]
                },
                {
                    "id": "routing_segment_latch_Q_to_Q",
                    "from": "latch_Q",
                    "to": "Q_input_0_0",
                    "fromClean": "latch_Q",
                    "toClean": "Q",
                    "delays": [
                        {
                            "from": "datain",
                            "to": "dataout",
                            "rise": {
                                "min": 1079.77,
                                "typical": 1079.77,
                                "max": 1079.77
                            },
                            "fall": {
                                "min": 1079.77,
                                "typical": 1079.77,
                                "max": 1079.77
                            }
                        }
                    ]
                }
            ]
        };
    }

    function parseSdfFile(sdfContent) {
        // Use the global sdfToJson function
        const rawData = window.sdfToJson(sdfContent);
        
        // Then pass to restructuring function
        return restructureFpgaData(rawData);
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