// FPGA Board Animation
let boardData = null;
let animationRunning = false;
let animationStep = 0;
let animationInterval = null;
let canvas = null;
let ctx = null;
let components = [];
let wires = [];
let signals = [];

// Constants for visualization
const CANVAS_PADDING = 50;
const COMPONENT_SIZE = 40;
const COMPONENT_SPACING = 100;
const SIGNAL_SPEED = 10; // pixels per frame
const COLORS = {
  INPUT_INACTIVE: '#dc3545',
  INPUT_ACTIVE: '#28a745',
  OUTPUT_INACTIVE: '#dc3545',
  OUTPUT_ACTIVE: '#28a745',
  LUT: '#007bff',
  DFF: '#6610f2',
  SIGNAL_ON: '#ffc107',
  SIGNAL_OFF: '#6c757d',
  WIRE: '#adb5bd',
  CRITICAL_PATH: '#ff6b6b'
};

// Initialize the FPGA board animation
function initFPGABoardAnimation(data) {
  boardData = data;
  canvas = document.getElementById('fpga-canvas');
  ctx = canvas.getContext('2d');
  
  // Reset animation state
  animationRunning = false;
  animationStep = 0;
  components = [];
  wires = [];
  signals = [];
  
  // Set up canvas size
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Parse components from data
  parseComponents();
  
  // Draw initial state
  drawBoard();
  
  // Set up animation controls
  const animateButton = document.getElementById('animate-button');
  animateButton.addEventListener('click', toggleAnimation);
  animateButton.textContent = 'Start Animation';
}

// Resize canvas to fit container
function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = 600; // Fixed height or use container.clientHeight
}

// Parse components from data
function parseComponents() {
  if (!boardData || !boardData.design || !boardData.design.module) {
    console.error('Invalid board data');
    return;
  }
  
  const module = boardData.design.module;
  const gridSize = Math.ceil(Math.sqrt(
    module.ports.length + module.cells.length
  ));
  
  // Layout variables
  let row = 0;
  let col = 0;
  
  // Process input ports
  module.ports.filter(port => port.direction === 'input').forEach(port => {
    components.push({
      id: port.name,
      type: 'input',
      name: port.name,
      x: CANVAS_PADDING + col * COMPONENT_SPACING,
      y: CANVAS_PADDING + row * COMPONENT_SPACING,
      state: 'inactive'
    });
    
    // Update grid position
    col++;
    if (col >= gridSize) {
      col = 0;
      row++;
    }
  });
  
  // Process output ports
  module.ports.filter(port => port.direction === 'output').forEach(port => {
    components.push({
      id: port.name,
      type: 'output',
      name: port.name,
      x: CANVAS_PADDING + (gridSize - 1) * COMPONENT_SPACING,
      y: CANVAS_PADDING + row * COMPONENT_SPACING,
      state: 'inactive'
    });
    
    // Update grid position
    row++;
  });
  
  // Process cells (LUTs, FFs, etc.)
  module.cells.forEach(cell => {
    components.push({
      id: cell.instance,
      type: cell.type.startsWith('LUT') ? 'lut' : 
            cell.type.startsWith('DFF') ? 'dff' : 'component',
      name: cell.instance,
      x: CANVAS_PADDING + col * COMPONENT_SPACING,
      y: CANVAS_PADDING + row * COMPONENT_SPACING,
      state: 'inactive',
      cellData: cell
    });
    
    // Update grid position
    col++;
    if (col >= gridSize - 1) {  // Leave rightmost column for outputs
      col = 0;
      row++;
    }
  });
  
  // Process interconnects
  module.interconnects.forEach(interconnect => {
    const sourceComp = findComponentByOutput(interconnect.datain);
    const targetComp = findComponentByInput(interconnect.dataout);
    
    if (sourceComp && targetComp) {
      wires.push({
        id: interconnect.instance,
        source: sourceComp,
        sourcePin: interconnect.datain,
        target: targetComp,
        targetPin: interconnect.dataout,
        active: false,
        points: calculateWirePoints(sourceComp, targetComp)
      });
    }
  });
  
  // Process assignments
  module.assignments.forEach(assignment => {
    const sourceComp = findComponentByOutput(assignment.source);
    const targetComp = findComponentByName(assignment.target);
    
    if (sourceComp && targetComp) {
      wires.push({
        id: `assign_${assignment.source}_to_${assignment.target}`,
        source: sourceComp,
        sourcePin: assignment.source,
        target: targetComp,
        targetPin: assignment.target,
        active: false,
        points: calculateWirePoints(sourceComp, targetComp)
      });
    }
  });
}

// Find component by name
function findComponentByName(name) {
  return components.find(comp => comp.id === name);
}

// Find component by output signal
function findComponentByOutput(signalName) {
  // For simplicity, assume the signal name either matches the component
  // or follows a pattern we can derive from
  return components.find(comp => 
    comp.id === signalName || 
    `${comp.id}_output_0_0` === signalName
  );
}

// Find component by input signal
function findComponentByInput(signalName) {
  // Similar to findComponentByOutput, but for inputs
  return components.find(comp => 
    comp.id === signalName || 
    `${comp.id}_input_0_0` === signalName
  );
}

// Calculate wire routing points between components
function calculateWirePoints(source, target) {
  // Simple direct line for now
  return [
    { x: source.x + COMPONENT_SIZE/2, y: source.y + COMPONENT_SIZE/2 },
    { x: target.x + COMPONENT_SIZE/2, y: target.y + COMPONENT_SIZE/2 }
  ];
}

// Draw the board state
function drawBoard() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw wires
  wires.forEach(wire => {
    drawWire(wire);
  });
  
  // Draw components
  components.forEach(component => {
    drawComponent(component);
  });
  
  // Draw signals
  signals.forEach(signal => {
    drawSignal(signal);
  });
}

// Draw a component
function drawComponent(component) {
  ctx.save();
  
  // Set color based on component type and state
  if (component.type === 'input') {
    ctx.fillStyle = component.state === 'active' ? COLORS.INPUT_ACTIVE : COLORS.INPUT_INACTIVE;
  } else if (component.type === 'output') {
    ctx.fillStyle = component.state === 'active' ? COLORS.OUTPUT_ACTIVE : COLORS.OUTPUT_INACTIVE;
  } else if (component.type === 'lut') {
    ctx.fillStyle = COLORS.LUT;
  } else if (component.type === 'dff') {
    ctx.fillStyle = COLORS.DFF;
  } else {
    ctx.fillStyle = COLORS.COMPONENT;
  }
  
  // Draw component shape
  if (component.type === 'input' || component.type === 'output') {
    // Draw as circle
    ctx.beginPath();
    ctx.arc(component.x + COMPONENT_SIZE/2, component.y + COMPONENT_SIZE/2, 
            COMPONENT_SIZE/2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Draw as rectangle
    ctx.fillRect(component.x, component.y, COMPONENT_SIZE, COMPONENT_SIZE);
  }
  
  // Draw component label
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '12px Arial';
  
  // For complex component names, just display a shortened version
  const displayName = component.name.length > 8 ? 
                      component.name.substring(0, 6) + '...' : 
                      component.name;
  
  ctx.fillText(displayName, component.x + COMPONENT_SIZE/2, component.y + COMPONENT_SIZE/2);
  
  ctx.restore();
}

// Draw a wire
function drawWire(wire) {
  ctx.save();
  
  ctx.strokeStyle = wire.active ? COLORS.SIGNAL_ON : COLORS.WIRE;
  ctx.lineWidth = wire.active ? 3 : 1;
  
  ctx.beginPath();
  ctx.moveTo(wire.points[0].x, wire.points[0].y);
  
  // Draw line segments through all points
  for (let i = 1; i < wire.points.length; i++) {
    ctx.lineTo(wire.points[i].x, wire.points[i].y);
  }
  
  ctx.stroke();
  
  ctx.restore();
}

// Draw a signal
function drawSignal(signal) {
  ctx.save();
  
  ctx.fillStyle = COLORS.SIGNAL_ON;
  ctx.beginPath();
  ctx.arc(signal.x, signal.y, 6, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

// Toggle animation state
function toggleAnimation() {
  const animateButton = document.getElementById('animate-button');
  
  if (animationRunning) {
    stopAnimation();
    animateButton.textContent = 'Start Animation';
  } else {
    startAnimation();
    animateButton.textContent = 'Pause Animation';
  }
}

// Start the animation
function startAnimation() {
  if (!boardData || !boardData.actions) {
    console.error('No animation data available');
    return;
  }
  
  animationRunning = true;
  
  // If animation was completed, reset
  if (animationStep >= getTotalAnimationSteps()) {
    resetAnimation();
  }
  
  // Start animation loop
  animationInterval = setInterval(animationTick, 100);
}

// Stop the animation
function stopAnimation() {
  animationRunning = false;
  clearInterval(animationInterval);
}

// Reset animation to initial state
function resetAnimation() {
  animationStep = 0;
  signals = [];
  
  // Reset component states
  components.forEach(component => {
    component.state = 'inactive';
  });
  
  // Reset wire states
  wires.forEach(wire => {
    wire.active = false;
  });
  
  drawBoard();
}

// Animation tick - process the next animation step
function animationTick() {
  if (animationStep >= getTotalAnimationSteps()) {
    stopAnimation();
    const animateButton = document.getElementById('animate-button');
    animateButton.textContent = 'Restart Animation';
    return;
  }
  
  // Process current animation step
  processAnimationStep(animationStep);
  
  // Move signals along wires
  updateSignals();
  
  // Draw current state
  drawBoard();
  
  // Increment step
  animationStep++;
}

// Get total number of animation steps
function getTotalAnimationSteps() {
  let total = 0;
  
  if (boardData && boardData.actions) {
    // Count all action types
    total += boardData.actions.signals.length;
    total += boardData.actions.routing.length;
    total += boardData.actions.components.length;
    total += boardData.actions.timing.length;
  }
  
  return total;
}

// Process a specific animation step
function processAnimationStep(step) {
  if (!boardData || !boardData.actions) return;
  
  const actions = boardData.actions;
  
  // Determine which action to process based on step number
  let currentAction = null;
  let actionType = '';
  
  if (step < actions.signals.length) {
    currentAction = actions.signals[step];
    actionType = 'signal';
  } else if (step < actions.signals.length + actions.routing.length) {
    currentAction = actions.routing[step - actions.signals.length];
    actionType = 'routing';
  } else if (step < actions.signals.length + actions.routing.length + actions.components.length) {
    currentAction = actions.components[step - actions.signals.length - actions.routing.length];
    actionType = 'component';
  } else {
    currentAction = actions.timing[step - actions.signals.length - actions.routing.length - actions.components.length];
    actionType = 'timing';
  }
  
  // Process the action based on type
  if (actionType === 'signal') {
    processSignalAction(currentAction);
  } else if (actionType === 'routing') {
    processRoutingAction(currentAction);
  } else if (actionType === 'component') {
    processComponentAction(currentAction);
  } else if (actionType === 'timing') {
    processTimingAction(currentAction);
  }
}

// Process a signal action
function processSignalAction(action) {
  if (action.type === 'input_signal') {
    // Activate an input component
    const component = findComponentByName(action.name);
    if (component) {
      component.state = 'active';
      
      // Create a signal at this component
      const sourceX = component.x + COMPONENT_SIZE/2;
      const sourceY = component.y + COMPONENT_SIZE/2;
      
      // Find the wire that starts at this component
      const wire = wires.find(w => w.source.id === component.id);
      if (wire) {
        signals.push({
          id: `signal_${action.name}_${Date.now()}`,
          x: sourceX,
          y: sourceY,
          wire: wire,
          progress: 0,
          speed: SIGNAL_SPEED
        });
      }
    }
  } else if (action.type === 'signal_assignment') {
    // Find the components and wire
    const sourceComp = findComponentByOutput(action.source);
    const targetComp = findComponentByName(action.target);
    
    if (sourceComp && targetComp) {
      // Find or create a wire between these components
      let wire = wires.find(w => 
        (w.source.id === sourceComp.id && w.target.id === targetComp.id) ||
        (w.sourcePin === action.source && w.targetPin === action.target)
      );
      
      if (!wire) {
        wire = {
          id: `assign_${action.source}_to_${action.target}`,
          source: sourceComp,
          sourcePin: action.source,
          target: targetComp,
          targetPin: action.target,
          active: true,
          points: calculateWirePoints(sourceComp, targetComp)
        };
        wires.push(wire);
      } else {
        wire.active = true;
      }
      
      // Create a signal at the source component
      const sourceX = sourceComp.x + COMPONENT_SIZE/2;
      const sourceY = sourceComp.y + COMPONENT_SIZE/2;
      
      signals.push({
        id: `signal_${action.source}_to_${action.target}_${Date.now()}`,
        x: sourceX,
        y: sourceY,
        wire: wire,
        progress: 0,
        speed: SIGNAL_SPEED
      });
    }
  }
}

// Process a routing action
function processRoutingAction(action) {
  // Find the wire corresponding to this routing action
  const wire = wires.find(w => w.id === action.instance || 
                              (w.sourcePin === action.source && w.targetPin === action.target));
  
  if (wire) {
    wire.active = true;
    
    // Create a signal at the source
    const sourceX = wire.source.x + COMPONENT_SIZE/2;
    const sourceY = wire.source.y + COMPONENT_SIZE/2;
    
    signals.push({
      id: `signal_${action.instance}_${Date.now()}`,
      x: sourceX,
      y: sourceY,
      wire: wire,
      progress: 0,
      speed: SIGNAL_SPEED * (action.timing ? 5 / (action.timing.delay || 5) : 1)
    });
  }
}

// Process a component action
function processComponentAction(action) {
  // Find the component
  const component = findComponentByName(action.instance);
  
  if (component) {
    component.state = 'active';
    
    // If component has outputs, create signals for each output
    if (action.outputs) {
      Object.entries(action.outputs).forEach(([port, signal]) => {
        // Find wire connecting to this output
        const wire = wires.find(w => 
          w.source.id === component.id && 
          (w.sourcePin === signal || w.sourcePin.includes(signal))
        );
        
        if (wire) {
          wire.active = true;
          
          // Create a signal on this wire
          const sourceX = component.x + COMPONENT_SIZE/2;
          const sourceY = component.y + COMPONENT_SIZE/2;
          
          signals.push({
            id: `signal_${component.id}_${port}_${Date.now()}`,
            x: sourceX,
            y: sourceY,
            wire: wire,
            progress: 0,
            speed: SIGNAL_SPEED
          });
        }
      });
    }
  }
}

// Process a timing action
function processTimingAction(action) {
  if (action.type === 'critical_path_analysis') {
    // Highlight critical path - this would need path calculation
    // For now, we'll just flash all components
    components.forEach(component => {
      setTimeout(() => {
        component.state = 'active';
        drawBoard();
        
        setTimeout(() => {
          component.state = 'inactive';
          drawBoard();
        }, 300);
      }, Math.random() * 1000);
    });
  }
}

// Update signal positions
function updateSignals() {
  for (let i = signals.length - 1; i >= 0; i--) {
    const signal = signals[i];
    
    // Update signal progress
    signal.progress += signal.speed / 100;
    
    if (signal.progress >= 1) {
      // Signal reached target
      // Activate target component
      if (signal.wire.target) {
        signal.wire.target.state = 'active';
      }
      
      // Remove the signal
      signals.splice(i, 1);
    } else {
      // Calculate new signal position along the wire
      const startPoint = signal.wire.points[0];
      const endPoint = signal.wire.points[signal.wire.points.length - 1];
      
      signal.x = startPoint.x + (endPoint.x - startPoint.x) * signal.progress;
      signal.y = startPoint.y + (endPoint.y - startPoint.y) * signal.progress;
    }
  }
}