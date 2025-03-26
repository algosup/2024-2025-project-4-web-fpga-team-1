/**
 * FPGA animation - Visualizing delays and connections
 * This animation shows how signals propagate through an FPGA.
 * based on SDF timing data converted to JSON
 */

// Global variables
let fpgaData = null;
let animationSpeed = 1;
let animationRunning = false;
let animationFrame = null;
let canvas = null;
let ctx = null;
let modules = [];
let connections = [];
let signals = [];
let moduleInputsRequired = new Map(); // Tracking of input requirements by module
let moduleInputsReceived = new Map(); // Track entries received by module
// Initial dimensions will be dynamically adjusted
let boardWidth = 800;
let boardHeight = 600;
let moduleSize = 60;
let gridSpacing = 120;
let startTime = 0;
// Margins to prevent elements from being cut off
const MARGIN = 80;

// Add these global variables
const GRID_SIZE = 20; // Grid size in pixels
let useSchematicStyle = true; // Activate schematic style

// Variables for zoom and navigation
let zoomLevel = 1;
let panOffsetX = 0;
let panOffsetY = 0;
let isPanning = false;
let lastPanX = 0;
let lastPanY = 0;

/**
 * Initializes FPGA animation with supplied JSON data
 * @param {Object} data - JSON data containing modules and connections
 */
function initFPGABoardAnimation(data) {
    console.log("Initializing FPGA animation", data);
    fpgaData = data;

    // Data reset
    resetAnimation();

    // Initialize canvas with fixed size
    canvas = document.getElementById('fpga-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'fpga-canvas';
        canvas.width = 1200; // Larger fixed size
        canvas.height = 800; // Larger fixed size
        document.getElementById('board-container').appendChild(canvas);
    } else {
        // Keep a fixed size
        canvas.width = 1200;
        canvas.height = 800;
    }

    // Add a style to make the canvas responsive while keeping its proportions
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    canvas.style.border = '1px solid #ddd';
    canvas.style.borderRadius = '4px';

    ctx = canvas.getContext('2d');

    // Initialize controls
    initializeControls();

    // Place modules and connections
    placeModules();
    createConnections();

    // Initialize zoom and pan events
    initializeZoomPanEvents();

    // Adjust view to fit content
    fitContentToView();

    // First render
    render();
}

/**
 * Calculates the optimal canvas size based on the number of modules
 */
function calculateCanvasSize() {
    if (!fpgaData || !fpgaData.modules || fpgaData.modules.length === 0) {
        // Default size if no modules
        boardWidth = 800;
        boardHeight = 600;
        return;
    }

    const moduleCount = fpgaData.modules.length;

    // Adjust grid spacing based on the number of modules
    if (moduleCount > 100) {
        moduleSize = 40;
        gridSpacing = 80;
    } else if (moduleCount > 50) {
        moduleSize = 50;
        gridSpacing = 100;
    } else if (moduleCount > 20) {
        moduleSize = 60;
        gridSpacing = 120;
    } else {
        moduleSize = 70;
        gridSpacing = 140;
    }

    // Calculate the optimal number of columns (approximately square)
    const modulesPerRow = Math.ceil(Math.sqrt(moduleCount));

    // Calculate the number of rows needed
    const rowCount = Math.ceil(moduleCount / modulesPerRow);

    // Calculate the necessary width and height for the canvas
    boardWidth = modulesPerRow * gridSpacing + MARGIN * 2;
    boardHeight = rowCount * gridSpacing + MARGIN * 2;

    // Ensure a minimum size
    boardWidth = Math.max(boardWidth, 600);
    boardHeight = Math.max(boardHeight, 400);

    console.log(`Canvas size calculated: ${boardWidth}x${boardHeight} for ${moduleCount} modules`);
}

/**
 * Resets the animation
 */
function resetAnimation() {
    modules = [];
    connections = [];
    signals = [];
    moduleInputsRequired = new Map();
    moduleInputsReceived = new Map();
    animationRunning = false;

    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
}

/**
 * Initializes animation controls and adds zoom controls
 */
function initializeControls() {
    const controlsContainer = document.getElementById('animation-controls');
    if (!controlsContainer) return;

    // Clear existing controls
    controlsContainer.innerHTML = '';

    // Create control buttons
    const startButton = document.createElement('button');
    startButton.textContent = 'Start Animation';
    startButton.id = 'start-animation';
    startButton.className = 'btn btn-primary me-2';
    startButton.addEventListener('click', toggleAnimation);

    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset';
    resetButton.id = 'reset-animation';
    resetButton.className = 'btn btn-secondary me-2';
    resetButton.addEventListener('click', resetAnimationAndResize);

    // Add zoom buttons
    const zoomContainer = document.createElement('div');
    zoomContainer.className = 'd-flex align-items-center ms-3';

    const zoomInButton = document.createElement('button');
    zoomInButton.innerHTML = '<i class="fas fa-search-plus"></i>';
    zoomInButton.className = 'btn btn-sm btn-outline-secondary me-1';
    zoomInButton.title = 'Zoom In';
    zoomInButton.addEventListener('click', function() {
        zoomLevel = Math.min(10, zoomLevel * 1.2);
        render();
    });

    const zoomOutButton = document.createElement('button');
    zoomOutButton.innerHTML = '<i class="fas fa-search-minus"></i>';
    zoomOutButton.className = 'btn btn-sm btn-outline-secondary me-1';
    zoomOutButton.title = 'Zoom Out';
    zoomOutButton.addEventListener('click', function() {
        zoomLevel = Math.max(0.1, zoomLevel / 1.2);
        render();
    });

    const fitButton = document.createElement('button');
    fitButton.innerHTML = '<i class="fas fa-expand"></i>';
    fitButton.className = 'btn btn-sm btn-outline-secondary';
    fitButton.title = 'Fit to View';
    fitButton.addEventListener('click', function() {
        fitContentToView();
        render();
    });

    zoomContainer.appendChild(zoomOutButton);
    zoomContainer.appendChild(zoomInButton);
    zoomContainer.appendChild(fitButton);

    // Add buttons to the container
    controlsContainer.appendChild(startButton);
    controlsContainer.appendChild(resetButton);
    controlsContainer.appendChild(zoomContainer);

    // Add a legend
    const legend = document.createElement('div');
    legend.className = 'mt-3 d-flex flex-wrap';
    legend.innerHTML = `
        <div class="me-4 mb-2"><span style="display:inline-block;width:20px;height:20px;background-color:#4a90e2;margin-right:5px;"></span> LUT</div>
        <div class="me-4 mb-2"><span style="display:inline-block;width:20px;height:20px;background-color:#50c878;margin-right:5px;"></span> DFF</div>
        <div class="me-4 mb-2"><span style="display:inline-block;width:20px;height:20px;background-color:#f39c12;margin-right:5px;"></span> I/O</div>
        <div class="me-4 mb-2"><span style="display:inline-block;width:20px;height:20px;background-color:#e74c3c;margin-right:5px;"></span> Signal</div>
    `;
    controlsContainer.appendChild(legend);

    // Add usage information
    const info = document.createElement('div');
    info.className = 'mt-2 small text-muted';
    info.innerHTML = 'Navigation: Scroll to zoom, right-click and drag to pan.';
    controlsContainer.appendChild(info);

    // Add a button to toggle style
    const styleButton = document.createElement('button');
    styleButton.textContent = 'Schematic View';
    styleButton.id = 'toggle-style';
    styleButton.className = 'btn btn-outline-secondary me-2';
    styleButton.addEventListener('click', function() {
        useSchematicStyle = !useSchematicStyle;
        this.textContent = useSchematicStyle ? 'Normal View' : 'Schematic View';
        resetAnimationAndResize();
    });

    controlsContainer.appendChild(styleButton);
}

/**
 * Starts or stops the animation
 */
function toggleAnimation() {
    animationRunning = !animationRunning;

    const button = document.getElementById('start-animation');
    if (button) {
        button.textContent = animationRunning ? 'Pause Animation' : 'Start Animation';
    }

    if (animationRunning) {
        startTime = performance.now();
        signals = [];
        createInitialSignals();
        animate();
    } else if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
}

/**
 * Places modules on the canvas in a schematic style
 */
function placeModules() {
  if (!fpgaData || !fpgaData.modules) return;

  modules = [];

  // Separate modules by type
  const ioModules = fpgaData.modules.filter(m => m.type === 'IO_PORT');
  const lutModules = fpgaData.modules.filter(m => m.type.includes('LUT'));
  const dffModules = fpgaData.modules.filter(m => m.type.includes('DFF') || m.type === 'DFF');
  const otherModules = fpgaData.modules.filter(m =>
    !m.type.includes('LUT') &&
    !m.type.includes('DFF') &&
    m.type !== 'DFF' &&
    m.type !== 'IO_PORT'
  );

  // Identify inputs and outputs
  const inputs = ioModules.filter(m => m.isInput || !m.isOutput);
  const outputs = ioModules.filter(m => m.isOutput);

  // Define circuit dimensions
  const inputHeight = inputs.length * gridSpacing;
  const outputHeight = outputs.length * gridSpacing;
  const circuitHeight = Math.max(inputHeight, outputHeight, 400);

  // Define column widths
  const numColumns = 4; // Inputs, LUTs, DFFs, Outputs
  boardWidth = numColumns * gridSpacing * 3 + MARGIN * 2;
  boardHeight = circuitHeight + MARGIN * 2;

  // Place inputs on the left
  inputs.forEach((input, index) => {
    const y = MARGIN + (circuitHeight / (inputs.length + 1)) * (index + 1);
    modules.push({
      id: input.instance,
      type: 'IO_PORT',
      x: MARGIN + gridSpacing,
      y: y,
      width: moduleSize * 0.8,
      height: moduleSize * 0.8,
      color: '#f39c12', // Orange for I/O
      isInput: true,
      data: input,
      schematicShape: 'input' // For schematic rendering
    });
  });

  // Place LUTs in the second column
  lutModules.forEach((lut, index) => {
    const y = MARGIN + (circuitHeight / (lutModules.length + 1)) * (index + 1);
    modules.push({
      id: lut.instance,
      type: lut.type,
      x: MARGIN + gridSpacing * 4,
      y: y,
      width: moduleSize,
      height: moduleSize,
      color: '#4a90e2', // Blue for LUTs
      data: lut,
      schematicShape: 'lut' // For schematic rendering
    });
  });

  // Place DFFs in the third column
  dffModules.forEach((dff, index) => {
    const y = MARGIN + (circuitHeight / (dffModules.length + 1)) * (index + 1);
    modules.push({
      id: dff.instance,
      type: dff.type,
      x: MARGIN + gridSpacing * 7,
      y: y,
      width: moduleSize,
      height: moduleSize,
      color: '#50c878', // Green for DFFs
      data: dff,
      schematicShape: 'dff' // For schematic rendering
    });
  });

  // Place other modules in the middle
  otherModules.forEach((other, index) => {
    const y = MARGIN + circuitHeight / 2 + (index - otherModules.length / 2) * gridSpacing;
    modules.push({
      id: other.instance,
      type: other.type,
      x: MARGIN + gridSpacing * 5.5,
      y: y,
      width: moduleSize,
      height: moduleSize,
      color: '#9b59b6', // Purple for others
      data: other,
      schematicShape: 'other' // For schematic rendering
    });
  });

  // Place outputs on the right
  outputs.forEach((output, index) => {
    const y = MARGIN + (circuitHeight / (outputs.length + 1)) * (index + 1);
    modules.push({
      id: output.instance,
      type: 'IO_PORT',
      x: boardWidth - MARGIN - gridSpacing,
      y: y,
      width: moduleSize * 0.8,
      height: moduleSize * 0.8,
      color: '#f39c12', // Orange for I/O
      isOutput: true,
      data: output,
      schematicShape: 'output' // For schematic rendering
    });
  });
}

/**
 * Creates connections between modules and detects required inputs
 */
function createConnections() {
    if (!fpgaData || !fpgaData.connections) return;

    connections = [];

    // Reset input tracking maps
    moduleInputsRequired = new Map();
    moduleInputsReceived = new Map();

    fpgaData.connections.forEach(connectionData => {
        // Find source and target modules
        const sourceModule = findModuleByPartialId(connectionData.from);
        const targetModule = findModuleByPartialId(connectionData.to);

        if (sourceModule && targetModule) {
            const connection = {
                id: connectionData.id,
                source: sourceModule,
                target: targetModule,
                delay: getMaxDelay(connectionData.delays),
                data: connectionData
            };

            connections.push(connection);

            // Register this connection as a required input for the target module
            if (!moduleInputsRequired.has(targetModule.id)) {
                moduleInputsRequired.set(targetModule.id, new Set());
            }
            moduleInputsRequired.get(targetModule.id).add(connection.id);

            // Initialize the set of received inputs for the module
            if (!moduleInputsReceived.has(targetModule.id)) {
                moduleInputsReceived.set(targetModule.id, new Set());
            }
        }
    });
}

/**
 * Finds a module by partial ID
 */
function findModuleByPartialId(partialId) {
    return modules.find(module =>
        module.id.includes(partialId) ||
        partialId.includes(module.id)
    );
}

/**
 * Gets the maximum delay of a connection
 */
function getMaxDelay(delays) {
    if (!delays || !delays.length) return 0;

    let maxDelay = 0;

    delays.forEach(delay => {
        if (delay.rise && delay.rise.max) {
            maxDelay = Math.max(maxDelay, delay.rise.max);
        }
        if (delay.fall && delay.fall.max) {
            maxDelay = Math.max(maxDelay, delay.fall.max);
        }
    });

    return maxDelay;
}

/**
 * Creates initial signals for the animation
 */
function createInitialSignals() {
    // Find input modules (those with isInput=true or type=IO_PORT)
    const inputModules = modules.filter(module =>
        module.type === 'IO_PORT' && module.isInput
    );

    // If no specific input modules are found, use the previous method
    const sourcesToUse = inputModules.length > 0 ? inputModules :
        modules.filter(module => {
            return connections.some(conn => conn.source === module) &&
                  !connections.some(conn => conn.target === module);
        });

    // Create a signal for each source
    sourcesToUse.forEach(source => {
        propagateSignalsFromModule(source, performance.now());
    });
}

/**
 * Animates signals on the canvas
 */
function animate() {
    const currentTime = performance.now();
    const elapsedTime = (currentTime - startTime) * animationSpeed;

    // Update the progress of existing signals
    signals.forEach(signal => {
        if (!signal.active) return;

        const signalDuration = signal.connection.delay || 1000;
        signal.progress = Math.min(1, (currentTime - signal.startTime) * animationSpeed / signalDuration);

        // If the signal has reached its destination
        if (signal.progress >= 1) {
            signal.active = false;

            // Find the target module
            const targetModule = signal.connection.target;

            // Mark this input as received
            if (moduleInputsReceived.has(targetModule.id)) {
                moduleInputsReceived.get(targetModule.id).add(signal.connection.id);
            }

            // Check if all required inputs are received
            const allInputsReceived = checkAllInputsReceived(targetModule);

            // Create signals for all outgoing connections of the target module
            // only if all required inputs are received
            if (allInputsReceived || targetModule.type === 'IO_PORT') {
                propagateSignalsFromModule(targetModule, currentTime);
            }
        }
    });

    // Draw the scene
    render();

    // Continue the animation if active
    if (animationRunning) {
        animationFrame = requestAnimationFrame(animate);
    }
}

/**
 * Checks if a module has received all its required inputs
 */
function checkAllInputsReceived(module) {
    // Input modules do not have required inputs (or are directly active)
    if (module.type === 'IO_PORT' && module.isInput) {
        return true;
    }

    // If the module has no required inputs, consider it ready
    if (!moduleInputsRequired.has(module.id)) {
        return true;
    }

    const requiredInputs = moduleInputsRequired.get(module.id);
    const receivedInputs = moduleInputsReceived.get(module.id);

    // If we don't have any received inputs yet, return false
    if (!receivedInputs) return false;

    // Check if all required inputs are in the received inputs
    for (const required of requiredInputs) {
        if (!receivedInputs.has(required)) {
            return false;
        }
    }

    return true;
}

/**
 * Propagates signals from a source module
 */
function propagateSignalsFromModule(sourceModule, currentTime) {
    // Find all connections originating from this source
    const outgoingConnections = connections.filter(conn => conn.source === sourceModule);

    // Internal processing delay of the module (for non-I/O elements)
    const processingDelay = sourceModule.type === 'IO_PORT' ? 0 : 50;

    outgoingConnections.forEach(connection => {
        // Check if this signal already exists recently created (avoid duplicates)
        const existingSignal = signals.find(s =>
            s.connection === connection && s.startTime > currentTime - 5000
        );

        if (!existingSignal) {
            signals.push({
                id: `signal-${sourceModule.id}-${connection.target.id}`,
                connection: connection,
                progress: 0,
                startTime: currentTime + processingDelay, // Add processing delay
                color: '#e74c3c',
                active: true
            });
        }
    });
}

/**
 * Draws the current state of the animation with support for zoom and pan
 */
function render() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save the state before transformation
    ctx.save();

    // Apply the transformation (zoom and pan)
    ctx.translate(panOffsetX, panOffsetY);
    ctx.scale(zoomLevel, zoomLevel);

    // Draw the background grid
    drawGrid();

    // Draw the connections
    drawConnections();

    // Draw the signals
    drawSignals();

    // Draw the modules
    drawModules();

    // Add delays on the connections
    if (!animationRunning) {
        addDelayLabels();
    }

    // Restore the original state
    ctx.restore();

    // Display information about the current zoom level
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Zoom: ${zoomLevel.toFixed(1)}x`, 10, 20);
}

/**
 * Draws connections between modules in Manhattan style
 */
function drawConnections() {
  connections.forEach(connection => {
    const source = connection.source;
    const target = connection.target;

    // Starting and ending points
    let startX = source.x;
    let startY = source.y;
    let endX = target.x;
    let endY = target.y;

    // Adjust connection points based on module type
    if (source.schematicShape === 'input') {
      startX = source.x + source.width/2;
    } else if (source.schematicShape === 'output') {
      startX = source.x - source.width/2;
    } else if (source.schematicShape === 'lut') {
      startX = source.x + source.width/2;
    } else if (source.schematicShape === 'dff') {
      startX = source.x + source.width/2;
    }

    if (target.schematicShape === 'input') {
      endX = target.x + target.width/2;
    } else if (target.schematicShape === 'output') {
      endX = target.x - target.width/2;
    } else if (target.schematicShape === 'lut') {
      endX = target.x - target.width/2;
    } else if (target.schematicShape === 'dff') {
      endX = target.x - target.width/2;
    }

    // Draw the Manhattan connection (with right-angle segments)
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Calculate the midpoint
    const midX = (startX + endX) / 2;

    // Draw the path segments
    ctx.lineTo(midX, startY);
    ctx.lineTo(midX, endY);
    ctx.lineTo(endX, endY);

    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Add a small directional arrow
    const arrowSize = 6;
    const angle = Math.atan2(0, endX - midX); // Horizontal arrow

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - arrowSize * Math.cos(angle - Math.PI/6),
              endY - arrowSize * Math.sin(angle - Math.PI/6));
    ctx.lineTo(endX - arrowSize * Math.cos(angle + Math.PI/6),
              endY - arrowSize * Math.sin(angle + Math.PI/6));
    ctx.closePath();
    ctx.fillStyle = '#888';
    ctx.fill();
  });
}

/**
 * Draws signals propagating in Manhattan style
 */
function drawSignals() {
  signals.forEach(signal => {
    if (!signal.active) return;

    const source = signal.connection.source;
    const target = signal.connection.target;
    const t = signal.progress;

    // Starting and ending points (as in drawConnections)
    let startX = source.x;
    let startY = source.y;
    let endX = target.x;
    let endY = target.y;

    // Adjust connection points based on module type
    if (source.schematicShape === 'input') {
      startX = source.x + source.width/2;
    } else if (source.schematicShape === 'output') {
      startX = source.x - source.width/2;
    } else if (source.schematicShape === 'lut') {
      startX = source.x + source.width/2;
    } else if (source.schematicShape === 'dff') {
      startX = source.x + source.width/2;
    }

    if (target.schematicShape === 'input') {
      endX = target.x + target.width/2;
    } else if (target.schematicShape === 'output') {
      endX = target.x - target.width/2;
    } else if (target.schematicShape === 'lut') {
      endX = target.x - target.width/2;
    } else if (target.schematicShape === 'dff') {
      endX = target.x - target.width/2;
    }

    // Midpoint
    const midX = (startX + endX) / 2;

    // Determine the signal position along the path
    let x, y;

    // First segment: horizontal from source to midX
    if (t < 0.33) {
      x = startX + (midX - startX) * (t * 3);
      y = startY;
    }
    // Second segment: vertical from startY to endY
    else if (t < 0.66) {
      x = midX;
      y = startY + (endY - startY) * ((t - 0.33) * 3);
    }
    // Third segment: horizontal from midX to target
    else {
      x = midX + (endX - midX) * ((t - 0.66) * 3);
      y = endY;
    }

    // Draw the signal point
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();

    // Draw the path traveled
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    if (t <= 0.33) {
      // First segment partially traveled
      ctx.lineTo(x, startY);
    } else {
      // First segment complete
      ctx.lineTo(midX, startY);

      if (t <= 0.66) {
        // Second segment partially traveled
        ctx.lineTo(midX, y);
      } else {
        // Second segment complete
        ctx.lineTo(midX, endY);
        // Third segment partially traveled
        ctx.lineTo(x, endY);
      }
    }

    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

/**
 * Draws modules on the canvas with schematic symbols
 */
function drawModules() {
  // Draw the modules
  modules.forEach(module => {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    if (module.schematicShape === 'input') {
      // Input: square with triangle
      ctx.beginPath();
      // Triangle pointing to the right
      ctx.moveTo(module.x, module.y - module.height/2);
      ctx.lineTo(module.x + module.width, module.y);
      ctx.lineTo(module.x, module.y + module.height/2);
      ctx.closePath();
      ctx.fillStyle = module.color;
      ctx.fill();
      ctx.stroke();

      // Port name
      ctx.fillStyle = '#000';
      ctx.font = '11px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(simplifyName(module.id), module.x - 5, module.y);

    } else if (module.schematicShape === 'output') {
      // Output: triangle pointing to the left
      ctx.beginPath();
      ctx.moveTo(module.x, module.y - module.height/2);
      ctx.lineTo(module.x - module.width, module.y);
      ctx.lineTo(module.x, module.y + module.height/2);
      ctx.closePath();
      ctx.fillStyle = module.color;
      ctx.fill();
      ctx.stroke();

      // Port name
      ctx.fillStyle = '#000';
      ctx.font = '11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(simplifyName(module.id), module.x + 5, module.y);

    } else if (module.schematicShape === 'lut') {
      // LUT: Rectangle with "&" symbol (AND) to represent logic
      const x = module.x - module.width/2;
      const y = module.y - module.height/2;
      const w = module.width;
      const h = module.height;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.fillStyle = module.color;
      ctx.fill();
      ctx.stroke();

      // Add the LUT symbol
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LUT', module.x, module.y);

      // Name below
      ctx.font = '10px Arial';
      ctx.fillText(simplifyName(module.id), module.x, module.y + module.height/2 + 12);

    } else if (module.schematicShape === 'dff') {
      // DFF: Rectangle with clock symbol
      const x = module.x - module.width/2;
      const y = module.y - module.height/2;
      const w = module.width;
      const h = module.height;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.fillStyle = module.color;
      ctx.fill();
      ctx.stroke();

      // Add the DFF symbol
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('FF', module.x, module.y);

      // Clock symbol (triangle)
      ctx.beginPath();
      ctx.moveTo(x - 5, y + h/2 - 5);
      ctx.lineTo(x, y + h/2);
      ctx.lineTo(x - 5, y + h/2 + 5);
      ctx.stroke();

      // Name below
      ctx.font = '10px Arial';
      ctx.fillText(simplifyName(module.id), module.x, module.y + module.height/2 + 12);

    } else {
      // Other modules: Simple rectangle
      const x = module.x - module.width/2;
      const y = module.y - module.height/2;
      const w = module.width;
      const h = module.height;

      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.fillStyle = module.color;
      ctx.fill();
      ctx.stroke();

      // Module name
      ctx.fillStyle = '#fff';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(simplifyName(module.id), module.x, module.y);
    }
  });
}

/**
 * Adds delay labels on the connections
 */
function addDelayLabels() {
    connections.forEach(connection => {
        const source = connection.source;
        const target = connection.target;

        // Calculate the midpoint of the connection
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;

        // Add an offset to prevent labels from overlapping
        const offsetX = (target.y - source.y) * 0.1;
        const offsetY = (source.x - target.x) * 0.1;

        // Display the rounded delay
        const delayValue = connection.delay;
        const displayDelay = delayValue >= 1000
            ? (delayValue / 1000).toFixed(1) + ' ns'
            : delayValue.toFixed(0) + ' ps';

        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // White background for the label
        const textWidth = ctx.measureText(displayDelay).width;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(midX + offsetX - textWidth/2 - 2, midY + offsetY - 7, textWidth + 4, 14);

        // Delay text
        ctx.fillStyle = '#333';
        ctx.fillText(displayDelay, midX + offsetX, midY + offsetY);
    });
}

/**
 * Draws a rectangle with rounded corners
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    if (fill) {
        ctx.fill();
    }

    if (stroke) {
        ctx.stroke();
    }
}

/**
 * Simplifies a module name for display
 */
function simplifyName(id) {
  // Extract the simplified module name
  let displayName = id;

  // If the name is too long, extract a shorter part
  const nameParts = id.split('_');
  if (nameParts.length > 1) {
    if (id.includes('lut_')) {
      displayName = nameParts[nameParts.length - 1];
    } else if (id.includes('DFF') || id.includes('latch')) {
      displayName = nameParts[nameParts.length - 1];
    } else {
      // For I/O, use the simple name
      displayName = nameParts[0];
    }
  }

  // Limit the length
  if (displayName.length > 8) {
    displayName = displayName.substring(0, 7) + '..';
  }

  return displayName;
}

/**
 * Draws a background grid adjusted to zoom
 */
function drawGrid() {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;

    // Calculate visible bounds
    const visibleLeft = -panOffsetX / zoomLevel;
    const visibleTop = -panOffsetY / zoomLevel;
    const visibleRight = (canvas.width - panOffsetX) / zoomLevel;
    const visibleBottom = (canvas.height - panOffsetY) / zoomLevel;

    // Adjust grid size based on zoom
    const gridStep = GRID_SIZE * (zoomLevel < 0.5 ? 2 : 1);

    // Calculate grid starting points aligned to the grid
    const startX = Math.floor(visibleLeft / gridStep) * gridStep;
    const startY = Math.floor(visibleTop / gridStep) * gridStep;

    // Horizontal lines
    for (let y = startY; y <= visibleBottom; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(visibleLeft, y);
        ctx.lineTo(visibleRight, y);
        ctx.stroke();
    }

    // Vertical lines
    for (let x = startX; x <= visibleRight; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, visibleTop);
        ctx.lineTo(x, visibleBottom);
        ctx.stroke();
    }
}

// Add a window resize event handler
window.addEventListener('resize', function() {
    // Only if the canvas and data are initialized
    if (canvas && fpgaData) {
        // Recalculate size and redraw
        render();
    }
});

/**
 * Resets the animation and resizes the canvas
 */
function resetAnimationAndResize() {
    resetAnimation();
    calculateCanvasSize();

    // Update the canvas size
    if (canvas) {
        canvas.width = boardWidth;
        canvas.height = boardHeight;
    }

    placeModules();
    createConnections();
    render();
}

/**
 * Initializes zoom and pan events
 */
function initializeZoomPanEvents() {
    // Zoom handler (mouse wheel)
    canvas.addEventListener('wheel', function(e) {
        e.preventDefault();

        // Calculate the focal point of the zoom (mouse position)
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Zoom factor (adjust as needed)
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;

        // Calculate the new zoom level
        const newZoomLevel = zoomLevel * zoomFactor;

        // Limit the zoom level
        if (newZoomLevel >= 0.1 && newZoomLevel <= 10) {
            // Calculate the new pan offset to maintain the focal point
            panOffsetX = mouseX - (mouseX - panOffsetX) * zoomFactor;
            panOffsetY = mouseY - (mouseY - panOffsetY) * zoomFactor;

            zoomLevel = newZoomLevel;
            render(); // Redraw with the new zoom
        }
    });

    // Right-click handler (start panning)
    canvas.addEventListener('contextmenu', function(e) {
        e.preventDefault(); // Prevent the browser's context menu
        isPanning = true;
        lastPanX = e.clientX;
        lastPanY = e.clientY;
        canvas.style.cursor = 'grabbing';
    });

    // Mouse move handler (panning in progress)
    canvas.addEventListener('mousemove', function(e) {
        if (isPanning) {
            const deltaX = e.clientX - lastPanX;
            const deltaY = e.clientY - lastPanY;

            panOffsetX += deltaX;
            panOffsetY += deltaY;

            lastPanX = e.clientX;
            lastPanY = e.clientY;

            render(); // Redraw with the new pan offset
        }
    });

    // Mouse up handler (end panning)
    window.addEventListener('mouseup', function() {
        if (isPanning) {
            isPanning = false;
            canvas.style.cursor = 'default';
        }
    });
}

/**
 * Adjusts the view to fit all content
 */
function fitContentToView() {
    // Find the content bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    modules.forEach(module => {
        const x = module.x;
        const y = module.y;
        const halfWidth = module.width / 2;
        const halfHeight = module.height / 2;

        minX = Math.min(minX, x - halfWidth);
        minY = Math.min(minY, y - halfHeight);
        maxX = Math.max(maxX, x + halfWidth);
        maxY = Math.max(maxY, y + halfHeight);
    });

    // Add a margin
    const margin = 50;
    minX -= margin;
    minY -= margin;
    maxX += margin;
    maxY += margin;

    // Calculate the necessary zoom to fit all content
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const zoomX = canvas.width / contentWidth;
    const zoomY = canvas.height / contentHeight;

    // Use the smaller zoom level to ensure everything is visible
    zoomLevel = Math.min(zoomX, zoomY, 1); // Limit to 1x max to avoid excessive enlargement

    // Center the content
    panOffsetX = canvas.width / 2 - (minX + maxX) / 2 * zoomLevel;
    panOffsetY = canvas.height / 2 - (minY + maxY) / 2 * zoomLevel;
}