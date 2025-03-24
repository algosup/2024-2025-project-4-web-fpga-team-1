// Board animation state
let animationData = null;
let canvas = null;
let ctx = null;
let animationRunning = false;
let animationFrame = null;
let animationSpeed = 0.1; // milliseconds in animation = real milliseconds * animationSpeed
let signalFlows = [];

// Element dimensions and positioning
const elementSize = 50;
const padding = 40;
const wireThickness = 3;

// Colors
const colors = {
    background: '#f8f9fa',
    wire: '#6c757d',
    activeWire: '#fd7e14',
    input: '#dc3545',
    activeInput: '#28a745',
    output: '#dc3545',
    activeOutput: '#28a745',
    lut: '#007bff',
    activeLut: '#0056b3',
    dff: '#6610f2',
    activeDff: '#520dc2',
    signal: 'rgba(255, 215, 0, 0.8)'
};

// Initialize the board visualization
function initFPGABoardAnimation(data) {
    animationData = data;
    canvas = document.getElementById('fpga-canvas');
    ctx = canvas.getContext('2d');
    
    // Set up animation controls
    const animateButton = document.getElementById('animate-button');
    animateButton.addEventListener('click', toggleAnimation);
    
    // Resize canvas
    resizeCanvas();
    
    // Calculate board layout
    calculateBoardLayout();
    
    // Initial draw
    drawBoard();
    
    // Handle window resize
    window.addEventListener('resize', function() {
        resizeCanvas();
        calculateBoardLayout();
        drawBoard();
    });
}

// Calculate layout of FPGA elements
function calculateBoardLayout() {
    if (!animationData || !animationData.design) return;
    
    const design = animationData.design.module;
    
    // Create a map of all elements
    const elements = {};
    
    // Add ports as elements
    design.ports.forEach((port, index) => {
        const isInput = port.direction === 'input';
        elements[port.name] = {
            id: port.name,
            type: isInput ? 'input' : 'output',
            name: port.name,
            connections: [],
            x: 0, y: 0,
            active: false
        };
    });
    
    // Add cells as elements (if any)
    if (design.cells) {
        design.cells.forEach(cell => {
            elements[cell.instance] = {
                id: cell.instance,
                type: cell.type.startsWith('LUT') ? 'lut' : 
                      cell.type === 'DFF' ? 'dff' : 'cell',
                name: cell.instance,
                connections: [],
                x: 0, y: 0,
                active: false
            };
        });
    }
    
    // Add wires and connections from interconnects
    design.interconnects.forEach(interconnect => {
        // Add source wire if not exists
        if (!elements[interconnect.datain]) {
            elements[interconnect.datain] = {
                id: interconnect.datain,
                type: 'wire',
                name: interconnect.datain,
                connections: [],
                x: 0, y: 0,
                active: false
            };
        }
        
        // Add target wire if not exists
        if (!elements[interconnect.dataout]) {
            elements[interconnect.dataout] = {
                id: interconnect.dataout,
                type: 'wire',
                name: interconnect.dataout,
                connections: [],
                x: 0, y: 0,
                active: false
            };
        }
        
        // Add connection
        const delay = animationData.timing?.cells?.[interconnect.instance]?.delays?.['datain->dataout']?.avg || 100;
        
        elements[interconnect.datain].connections.push({
            to: interconnect.dataout,
            delay: delay
        });
    });
    
    // Add connections from assignments
    design.assignments.forEach(assignment => {
        if (!elements[assignment.source]) {
            elements[assignment.source] = {
                id: assignment.source,
                type: 'wire',
                name: assignment.source,
                connections: [],
                x: 0, y: 0,
                active: false
            };
        }
        
        if (!elements[assignment.target]) {
            elements[assignment.target] = {
                id: assignment.target,
                type: 'wire',
                name: assignment.target,
                connections: [],
                x: 0, y: 0,
                active: false
            };
        }
        
        elements[assignment.source].connections.push({
            to: assignment.target,
            delay: 50 // Small delay for visualization
        });
    });
    
    // Position elements
    const inputs = Object.values(elements).filter(e => e.type === 'input');
    const outputs = Object.values(elements).filter(e => e.type === 'output');
    const others = Object.values(elements).filter(e => 
        e.type !== 'input' && e.type !== 'output' && e.type !== 'wire');
    
    // Canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = Math.max(
        (Math.max(inputs.length, outputs.length) * (elementSize + padding)) + padding * 2,
        500
    );
    
    // Update canvas height if needed
    if (canvas.height < canvasHeight) {
        canvas.height = canvasHeight;
    }
    
    // Position inputs on the left
    inputs.forEach((input, index) => {
        input.x = padding;
        input.y = padding + index * (elementSize + padding);
    });
    
    // Position outputs on the right
    outputs.forEach((output, index) => {
        output.x = canvasWidth - padding - elementSize;
        output.y = padding + index * (elementSize + padding);
    });
    
    // Position other elements in the middle
    const middleX = canvasWidth / 2 - elementSize / 2;
    
    others.forEach((element, index) => {
        element.x = middleX;
        element.y = padding + index * (elementSize + padding);
    });
    
    // Position wires based on connections (simplified)
    const wires = Object.values(elements).filter(e => e.type === 'wire');
    wires.forEach(wire => {
        // Find elements that connect to this wire
        const sources = Object.values(elements).filter(e => 
            e.connections.some(conn => conn.to === wire.id));
        
        // Find elements this wire connects to
        const targets = wire.connections.map(conn => elements[conn.to]).filter(Boolean);
        
        if (sources.length > 0 && targets.length > 0) {
            // Position wire between sources and targets (average position)
            let avgSourceX = sources.reduce((sum, e) => sum + e.x, 0) / sources.length;
            let avgSourceY = sources.reduce((sum, e) => sum + e.y, 0) / sources.length;
            
            let avgTargetX = targets.reduce((sum, e) => sum + e.x, 0) / targets.length;
            let avgTargetY = targets.reduce((sum, e) => sum + e.y, 0) / targets.length;
            
            wire.x = (avgSourceX + avgTargetX) / 2;
            wire.y = (avgSourceY + avgTargetY) / 2;
        }
    });
    
    // Store layout
    animationData.layout = {
        elements,
        canvasWidth,
        canvasHeight
    };
}

// Resize canvas to fit container
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = Math.max(500, container.clientHeight);
}

// Draw the FPGA board
function drawBoard() {
    if (!animationData || !animationData.layout) return;
    
    // Clear canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const { elements } = animationData.layout;
    
    // Draw connections first (so they're behind elements)
    Object.values(elements).forEach(element => {
        if (!element.connections) return;
        
        element.connections.forEach(conn => {
            const target = elements[conn.to];
            if (target) {
                drawConnection(element, target, element.active && target.active);
            }
        });
    });
    
    // Draw elements
    Object.values(elements).forEach(element => {
        if (element.type !== 'wire') {
            drawElement(element);
        }
    });
    
    // Draw signal flows
    drawSignalFlows();
}

// Draw a connection between two elements
function drawConnection(source, target, active) {
    ctx.beginPath();
    ctx.moveTo(source.x + elementSize / 2, source.y + elementSize / 2);
    ctx.lineTo(target.x + elementSize / 2, target.y + elementSize / 2);
    ctx.strokeStyle = active ? colors.activeWire : colors.wire;
    ctx.lineWidth = wireThickness;
    ctx.stroke();
}

// Draw an element (input, output, lut, dff)
function drawElement(element) {
    const x = element.x;
    const y = element.y;
    
    // Select color based on element type and state
    let fillColor;
    switch (element.type) {
        case 'input':
            fillColor = element.active ? colors.activeInput : colors.input;
            break;
        case 'output':
            fillColor = element.active ? colors.activeOutput : colors.output;
            break;
        case 'lut':
            fillColor = element.active ? colors.activeLut : colors.lut;
            break;
        case 'dff':
            fillColor = element.active ? colors.activeDff : colors.dff;
            break;
        default:
            fillColor = element.active ? colors.activeWire : colors.wire;
    }
    
    // Draw element shape
    ctx.fillStyle = fillColor;
    
    if (element.type === 'input' || element.type === 'output') {
        // Draw circle for inputs/outputs
        ctx.beginPath();
        ctx.arc(x + elementSize / 2, y + elementSize / 2, elementSize / 2, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Draw rectangle for other elements
        ctx.fillRect(x, y, elementSize, elementSize);
    }
    
    // Draw element label
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Shorten the label if too long
    let label = element.name;
    if (label.length > 10) {
        label = label.substring(0, 7) + '...';
    }
    
    ctx.fillText(label, x + elementSize / 2, y + elementSize / 2);
}

// Draw signal flow animations
function drawSignalFlows() {
    ctx.fillStyle = colors.signal;
    
    signalFlows.forEach(flow => {
        // Draw signal as a moving circle
        ctx.beginPath();
        ctx.arc(flow.x, flow.y, 6, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Toggle animation state
function toggleAnimation() {
    const animateButton = document.getElementById('animate-button');
    
    if (animationRunning) {
        stopAnimation();
        animateButton.textContent = 'Start Animation';
    } else {
        startAnimation();
        animateButton.textContent = 'Stop Animation';
    }
}

// Start the animation
function startAnimation() {
    if (!animationData || animationRunning) return;
    
    animationRunning = true;
    signalFlows = [];
    
    // Reset all elements to inactive
    const elements = animationData.layout.elements;
    Object.values(elements).forEach(element => {
        element.active = false;
    });
    
    // Activate inputs
    Object.values(elements)
        .filter(e => e.type === 'input')
        .forEach(input => {
            input.active = true;
            
            // Start signal propagation from inputs
            input.connections.forEach(conn => {
                const target = elements[conn.to];
                if (target) {
                    createSignalFlow(input, target, conn.delay);
                }
            });
        });
    
    // Start animation loop
    animationFrame = requestAnimationFrame(updateAnimation);
}

// Stop the animation
function stopAnimation() {
    if (!animationRunning) return;
    
    animationRunning = false;
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
    
    // Reset all elements to inactive
    const elements = animationData.layout.elements;
    Object.values(elements).forEach(element => {
        element.active = false;
    });
    
    signalFlows = [];
    drawBoard();
}

// Create a signal flow animation between source and target
function createSignalFlow(source, target, delay) {
    const startX = source.x + elementSize / 2;
    const startY = source.y + elementSize / 2;
    const endX = target.x + elementSize / 2;
    const endY = target.y + elementSize / 2;
    
    const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const speed = distance / (delay * animationSpeed);  // pixels per ms
    
    const flow = {
        startX,
        startY,
        endX,
        endY,
        x: startX,
        y: startY,
        progress: 0,
        speed,
        source: source.id,
        target: target.id,
        complete: false
    };
    
    signalFlows.push(flow);
}

// Update animation frame
function updateAnimation(timestamp) {
    if (!animationRunning) return;
    
    // Update signal flows
    const elements = animationData.layout.elements;
    const dt = 16; // approximate time between frames in ms
    
    signalFlows.forEach(flow => {
        if (flow.complete) return;
        
        // Update position
        flow.progress += flow.speed * dt;
        
        if (flow.progress >= 1) {
            // Signal reached destination
            flow.progress = 1;
            flow.complete = true;
            flow.x = flow.endX;
            flow.y = flow.endY;
            
            // Activate target
            const target = elements[flow.target];
            if (target) {
                target.active = true;
                
                // Continue signal propagation
                target.connections.forEach(conn => {
                    const nextTarget = elements[conn.to];
                    if (nextTarget) {
                        createSignalFlow(target, nextTarget, conn.delay);
                    }
                });
            }
        } else {
            // Update position along path
            flow.x = flow.startX + (flow.endX - flow.startX) * flow.progress;
            flow.y = flow.startY + (flow.endY - flow.startY) * flow.progress;
        }
    });
    
    // Remove completed flows
    signalFlows = signalFlows.filter(flow => !flow.complete || Date.now() - flow.completeTime < 300);
    
    // Draw updated board
    drawBoard();
    
    // Continue animation
    animationFrame = requestAnimationFrame(updateAnimation);
}

// Make functions available globally
window.initFPGABoardAnimation = initFPGABoardAnimation;