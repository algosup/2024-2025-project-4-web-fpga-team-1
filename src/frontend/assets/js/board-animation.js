class FPGABoardAnimation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.fpgaData = null;
        this.sdfData = null;
        this.cellElements = [];
        this.connections = [];
        this.signalParticles = [];
        this.animationFrame = null;
        this.isPlaying = false;
        this.timeScale = 1.0; // Time scaling factor to control animation speed
        this.animationTime = 0;
        
        // Configure canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = 600;
        if (this.fpgaData) {
            this.layoutBoard();
            this.draw(); // Explicitly call draw after resizing
        }
    }

    loadData(fpgaJson, sdfContent = null) {
        this.fpgaData = fpgaJson;
        
        if (sdfContent) {
            this.parseSDF(sdfContent);
        }
        
        this.layoutBoard();
        this.debugConnections();
        
        // Schedule multiple redraws to ensure rendering
        this.draw();
        
        // Force a resize which will trigger redrawing
        setTimeout(() => this.resizeCanvas(), 100);
        setTimeout(() => this.forceRedraw(), 300);
    }
    
    parseSDF(sdfContent) {
        // More comprehensive SDF parsing
        this.sdfData = {
            delays: {},
            cellDelays: {}
        };
        
        // Extract IOPATH delay information (pin-to-pin delays)
        const iopathRegex = /\(IOPATH\s+([^\s]+)\s+([^\s]+)\s+\(([^)]+)\)\s+\(([^)]+)\)/g;
        let match;
        
        while ((match = iopathRegex.exec(sdfContent)) !== null) {
            const inputPin = match[1].replace(/"/g, '');
            const outputPin = match[2].replace(/"/g, '');
            const riseDelay = parseFloat(match[3]);
            const fallDelay = parseFloat(match[4]);
            
            const key = `${inputPin}->${outputPin}`;
            this.sdfData.delays[key] = {
                rise: riseDelay,
                fall: fallDelay,
                avg: (riseDelay + fallDelay) / 2
            };
        }
        
        // Extract cell delays (CELL blocks)
        const cellBlockRegex = /\(CELL\s+\(CELLTYPE\s+"([^"]+)"\)\s+\(INSTANCE\s+([^)]+)\)([\s\S]*?)\)/g;
        let cellMatch;
        
        while ((cellMatch = cellBlockRegex.exec(sdfContent)) !== null) {
            const cellType = cellMatch[1];
            const instance = cellMatch[2].replace(/"/g, '');
            const cellContent = cellMatch[3];
            
            // Extract delays for this cell
            const cellDelays = {};
            let pathMatch;
            while ((pathMatch = iopathRegex.exec(cellContent)) !== null) {
                const inPin = pathMatch[1].replace(/"/g, '');
                const outPin = pathMatch[2].replace(/"/g, '');
                const riseDelay = parseFloat(pathMatch[3]);
                const fallDelay = parseFloat(pathMatch[4]);
                
                const pinKey = `${inPin}->${outPin}`;
                cellDelays[pinKey] = {
                    rise: riseDelay,
                    fall: fallDelay,
                    avg: (riseDelay + fallDelay) / 2
                };
            }
            
            this.sdfData.cellDelays[instance] = {
                type: cellType,
                delays: cellDelays
            };
        }
    }
    
    getDelayForConnection(sourceCell, targetCell, pinName = null) {
        // Try to get specific cell delay from SDF
        if (this.sdfData && this.sdfData.cellDelays[sourceCell.name]) {
            const cellDelays = this.sdfData.cellDelays[sourceCell.name].delays;
            
            // If we know the specific pin, use its delay
            if (pinName && cellDelays[`${pinName}->out`]) {
                return cellDelays[`${pinName}->out`].avg * 1000; // Convert to ms
            }
            
            // If there are any delays for this cell, use the average
            const delays = Object.values(cellDelays).map(d => d.avg);
            if (delays.length) {
                return (delays.reduce((a, b) => a + b, 0) / delays.length) * 1000;
            }
        }
        
        // Default delays based on cell type
        if (sourceCell.type === 'LUT_K') {
            return 25; // 25ms delay for LUTs
        } else if (sourceCell.type === 'DFF') {
            return 15; // 15ms delay for Flip-flops
        } else {
            return 10; // Default 10ms delay
        }
    }
    
    layoutBoard() {
        if (!this.fpgaData) return;
        
        this.cellElements = [];
        this.connections = [];
        
        const module = this.fpgaData.module;
        const gridSize = Math.ceil(Math.sqrt(module.cells.length + 2));
        const cellWidth = this.canvas.width / (gridSize + 2);
        const cellHeight = 80;
        
        // Place input ports on the left
        const inputPorts = module.ports.filter(p => p.direction === 'input');
        inputPorts.forEach((port, i) => {
            const x = cellWidth;
            const y = cellHeight * (i + 1);
            
            this.cellElements.push({
                type: 'input',
                name: port.name,
                x, y,
                width: cellWidth * 0.8,
                height: cellHeight * 0.6,
                state: 0
            });
        });
        
        // Place output ports on the right
        const outputPorts = module.ports.filter(p => p.direction === 'output');
        outputPorts.forEach((port, i) => {
            const x = this.canvas.width - cellWidth * 1.5;
            const y = cellHeight * (i + 1);
            
            this.cellElements.push({
                type: 'output',
                name: port.name,
                x, y,
                width: cellWidth * 0.8,
                height: cellHeight * 0.6,
                state: 0
            });
        });
        
        // Place cells in a grid
        module.cells.forEach((cell, i) => {
            const col = (i % (gridSize - 1)) + 1;
            const row = Math.floor(i / (gridSize - 1)) + 1;
            
            const x = col * cellWidth + cellWidth * 1.5;
            const y = row * cellHeight;
            
            this.cellElements.push({
                type: cell.type,
                name: cell.instance,
                x, y,
                width: cellWidth * 0.8,
                height: cellHeight * 0.6,
                state: 0,
                connections: cell.connections
            });
        });
        
        // Create connections between elements with wire points
        module.interconnects.forEach(interconnect => {
            const source = this.findElementByOutput(interconnect.datain);
            const target = this.findElementByInput(interconnect.dataout);
            
            if (source && target) {
                // Create the connection with waypoints for the wire
                this.connections.push(this.createWireConnection(source, target));
            }
        });
        
        // Add direct connections from inputs to cells
        module.cells.forEach(cell => {
            for (const [pinName, pinConnections] of Object.entries(cell.connections)) {
                if (typeof pinConnections === 'string') {
                    // Check if this connects to an input port
                    const port = module.ports.find(p => p.direction === 'input' && p.name === pinConnections);
                    if (port) {
                        const source = this.findElementByName(port.name);
                        const target = this.findElementByName(cell.instance);
                        
                        if (source && target) {
                            const conn = this.createWireConnection(source, target);
                            conn.pinName = pinName;
                            this.connections.push(conn);
                        }
                    }
                }
            }
        });
        
        this.draw();
    }
    
    createWireConnection(source, target) {
        const startX = source.x + source.width;
        const startY = source.y + source.height / 2;
        const endX = target.x;
        const endY = target.y + target.height / 2;
        
        // Create waypoints for wire routing
        const waypoints = [];
        
        // Start point
        waypoints.push({ x: startX, y: startY });
        
        // Add intermediate points for more complex routing
        // Simple routing: horizontal then vertical
        const midX = startX + (endX - startX) / 2;
        
        // Add turning points
        waypoints.push({ x: midX, y: startY });
        waypoints.push({ x: midX, y: endY });
        
        // End point
        waypoints.push({ x: endX, y: endY });
        
        // Calculate the total path length for animations
        let totalLength = 0;
        for (let i = 1; i < waypoints.length; i++) {
            const dx = waypoints[i].x - waypoints[i-1].x;
            const dy = waypoints[i].y - waypoints[i-1].y;
            totalLength += Math.sqrt(dx*dx + dy*dy);
        }
        
        return {
            source,
            target,
            waypoints,
            totalLength,
            active: false,
            animationProgress: 0,
            delay: this.getDelayForConnection(source, target)
        };
    }
    
    findElementByName(name) {
        return this.cellElements.find(el => el.name === name);
    }
    
    findElementByOutput(name) {
        return this.cellElements.find(el => 
            (el.type === 'input' && el.name === name) || 
            (el.connections && el.connections.out === name)
        );
    }
    
    findElementByInput(name) {
        return this.cellElements.find(el => 
            (el.type === 'output' && el.name === name) || 
            (el.connections && Object.values(el.connections).includes(name))
        );
    }
    
    // Update the draw method to ensure proper rendering order

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 0.5;
        this.ctx.beginPath();
        for (let x = 0; x <= this.canvas.width; x += 50) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
        }
        for (let y = 0; y <= this.canvas.height; y += 50) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
        }
        this.ctx.stroke();
        
        // IMPORTANT: Draw connections FIRST (before cells)
        if (this.connections && this.connections.length > 0) {
            console.log(`Drawing ${this.connections.length} connections`);
            this.connections.forEach(conn => {
                this.drawConnection(conn);
            });
        } else {
            console.warn("No connections to draw");
        }
        
        // Draw cells ON TOP OF connections
        if (this.cellElements && this.cellElements.length > 0) {
            this.cellElements.forEach(cell => {
                this.drawCell(cell);
            });
        }
    }
    
    drawCell(cell) {
        // Define colors based on cell type
        let fillColor = '#555';
        let strokeColor = '#999';
        
        if (cell.type === 'input') {
            fillColor = cell.state ? '#28a745' : '#dc3545';
            strokeColor = '#fff';
        } else if (cell.type === 'output') {
            fillColor = cell.state ? '#28a745' : '#dc3545';
            strokeColor = '#fff';
        } else if (cell.type === 'LUT_K') {
            fillColor = '#007bff';
            strokeColor = '#fff';
        } else if (cell.type === 'DFF') {
            fillColor = '#6610f2';
            strokeColor = '#fff';
        }
        
        // Draw cell
        this.ctx.fillStyle = fillColor;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.roundRect(cell.x, cell.y, cell.width, cell.height, 8);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Draw cell label
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const displayName = cell.name.length > 12 ? cell.name.substring(0, 10) + '...' : cell.name;
        this.ctx.fillText(displayName, cell.x + cell.width/2, cell.y + cell.height/2 - 8);
        
        // Draw cell type
        this.ctx.font = '10px Arial';
        this.ctx.fillText(cell.type, cell.x + cell.width/2, cell.y + cell.height/2 + 10);
    }
    
    drawConnection(conn) {
        // Increase wire visibility with more contrast
        this.ctx.strokeStyle = conn.active ? '#5bff8f' : '#a0a0a0'; // Brighter colors
        this.ctx.lineWidth = conn.active ? 4 : 2.5; // Thicker lines for better visibility
        
        // Draw the main wire with higher opacity
        this.ctx.beginPath();
        this.ctx.moveTo(conn.waypoints[0].x, conn.waypoints[0].y);
        
        for (let i = 1; i < conn.waypoints.length; i++) {
            this.ctx.lineTo(conn.waypoints[i].x, conn.waypoints[i].y);
        }
        
        this.ctx.stroke();
        
        // Add reflective highlight on wires for better visibility
        this.ctx.strokeStyle = conn.active ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = conn.active ? 1.5 : 1;
        this.ctx.beginPath();
        this.ctx.moveTo(conn.waypoints[0].x, conn.waypoints[0].y);
        
        for (let i = 1; i < conn.waypoints.length; i++) {
            this.ctx.lineTo(conn.waypoints[i].x, conn.waypoints[i].y);
        }
        
        this.ctx.stroke();
        
        // Draw connection endpoint markers (larger circles)
        this.ctx.fillStyle = conn.active ? '#5bff8f' : '#a0a0a0';
        
        // Start point marker
        this.ctx.beginPath();
        this.ctx.arc(conn.waypoints[0].x, conn.waypoints[0].y, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // End point marker
        this.ctx.beginPath();
        this.ctx.arc(conn.waypoints[conn.waypoints.length - 1].x, conn.waypoints[conn.waypoints.length - 1].y, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Enhance corners with junction points
        if (conn.waypoints.length > 2) {
            for (let i = 1; i < conn.waypoints.length - 1; i++) {
                this.ctx.fillStyle = conn.active ? '#5bff8f' : '#808080';
                this.ctx.beginPath();
                this.ctx.arc(conn.waypoints[i].x, conn.waypoints[i].y, 3.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Draw wire labels if connection has a name
        if (conn.pinName) {
            const midIndex = Math.floor(conn.waypoints.length / 2);
            const midPoint = conn.waypoints[midIndex];
            
            // Add background for better readability
            const textWidth = this.ctx.measureText(conn.pinName).width;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(midPoint.x - textWidth/2 - 4, midPoint.y - 19, textWidth + 8, 18);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '11px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(conn.pinName, midPoint.x, midPoint.y - 10);
        }
        
        // Draw signal particles if active
        if (conn.active && conn.animationProgress > 0) {
            this.drawSignalParticles(conn);
        }
    }
    
    drawSignalParticles(conn) {
        const particlePos = this.getPositionAlongPath(conn, conn.animationProgress);
        
        // Create trail effect with multiple particles
        const trailLength = 3;
        for (let i = 0; i < trailLength; i++) {
            const trailProgress = Math.max(0, conn.animationProgress - (i * 0.05));
            if (trailProgress <= 0) continue;
            
            const trailPos = this.getPositionAlongPath(conn, trailProgress);
            const alpha = 1 - (i / trailLength);
            const size = 5 - (i * 1.5);
            
            // Draw trail particle with fading effect
            this.ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(trailPos.x, trailPos.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Main signal particle
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        this.ctx.arc(particlePos.x, particlePos.y, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Glow effect
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(particlePos.x, particlePos.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    getPositionAlongPath(conn, progress) {
        // Find the position along the multi-segment path at the given progress (0-1)
        let distanceCovered = progress * conn.totalLength;
        let currentDistance = 0;
        
        for (let i = 1; i < conn.waypoints.length; i++) {
            const p1 = conn.waypoints[i-1];
            const p2 = conn.waypoints[i];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const segmentLength = Math.sqrt(dx*dx + dy*dy);
            
            if (currentDistance + segmentLength >= distanceCovered) {
                // This is the segment where our point lies
                const t = (distanceCovered - currentDistance) / segmentLength;
                return {
                    x: p1.x + dx * t,
                    y: p1.y + dy * t
                };
            }
            
            currentDistance += segmentLength;
        }
        
        // If we're beyond the path, return the last point
        return conn.waypoints[conn.waypoints.length - 1];
    }
    
    toggleInputState(inputName) {
        const input = this.cellElements.find(el => el.type === 'input' && el.name === inputName);
        if (input) {
            input.state = input.state ? 0 : 1;
            this.propagateSignals();
            this.draw();
        }
    }
    
    propagateSignals() {
        // Reset all connections and prepare for animation
        this.connections.forEach(conn => {
            conn.active = false;
            conn.animationProgress = 0;
        });
        
        // Reset all non-input cell states
        this.cellElements.forEach(cell => {
            if (cell.type !== 'input') {
                cell.state = 0;
            }
        });
        
        // Propagate from inputs
        const inputCells = this.cellElements.filter(el => el.type === 'input' && el.state);
        
        // Schedule signal propagation with delays
        inputCells.forEach(input => {
            // Start propagation immediately from inputs
            this.scheduleSignalPropagation(input, 0);
        });
    }
    
    scheduleSignalPropagation(cell, delay) {
        // Find outgoing connections
        const outgoingConnections = this.connections.filter(conn => conn.source === cell);
        
        outgoingConnections.forEach(conn => {
            conn.active = true;
            conn.startTime = this.animationTime + delay;
            conn.animationProgress = 0; // Start animation at beginning
            
            // Extract timing information from SDF data if available
            let propDelay = 0;
            if (this.sdfData && this.sdfData.cellDelays[cell.name]) {
                const pinName = conn.pinName || 'out';
                const outPin = pinName === 'out' ? pinName : `${pinName}->out`;
                
                if (this.sdfData.cellDelays[cell.name].delays[outPin]) {
                    propDelay = this.sdfData.cellDelays[cell.name].delays[outPin].avg * 1000;
                    console.log(`Using SDF delay for ${cell.name}.${outPin}: ${propDelay}ms`);
                } else {
                    propDelay = conn.delay || this.getDelayForConnection(conn.source, conn.target, conn.pinName);
                    console.log(`No SDF delay found for ${cell.name}.${outPin}, using default: ${propDelay}ms`);
                }
            } else {
                propDelay = conn.delay || this.getDelayForConnection(conn.source, conn.target, conn.pinName);
            }
            
            // Schedule the target cell to be activated after the signal reaches it
            setTimeout(() => {
                conn.target.state = 1;
                this.draw();
                
                // Continue propagation from this cell
                this.scheduleSignalPropagation(conn.target, propDelay);
            }, propDelay);
        });
    }
    
    startAnimation() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.animationTime = 0;
        
        // Toggle a random input to start
        const inputs = this.cellElements.filter(el => el.type === 'input');
        if (inputs.length > 0) {
            const randomInput = inputs[Math.floor(Math.random() * inputs.length)];
            this.toggleInputState(randomInput.name);
        }
        
        const animate = (timestamp) => {
            if (!this.lastTimestamp) {
                this.lastTimestamp = timestamp;
            }
            
            const deltaTime = timestamp - this.lastTimestamp;
            this.lastTimestamp = timestamp;
            
            this.animationTime += deltaTime;
            
            // Update connection animations
            this.connections.forEach(conn => {
                if (conn.active && conn.startTime !== undefined) {
                    // Calculate animation progress based on time elapsed and connection length
                    const elapsedTime = this.animationTime - conn.startTime;
                    const duration = conn.delay || 300; // Default 300ms if no delay specified
                    
                    conn.animationProgress = Math.min(elapsedTime / duration, 1);
                    
                    // When animation completes
                    if (conn.animationProgress === 1 && !conn.completed) {
                        conn.completed = true;
                    }
                }
            });
            
            // Every 3 seconds, toggle a random input to keep animation going
            if (this.animationTime % 3000 < 50 && this.animationTime > 1000) {
                const inputs = this.cellElements.filter(el => el.type === 'input');
                if (inputs.length > 0) {
                    const randomInput = inputs[Math.floor(Math.random() * inputs.length)];
                    this.toggleInputState(randomInput.name);
                }
            }
            
            this.draw();
            
            if (this.isPlaying) {
                this.animationFrame = requestAnimationFrame(animate);
            }
        };
        
        this.animationFrame = requestAnimationFrame(animate);
    }
    
    toggleAnimation() {
        if (this.isPlaying) {
            this.stopAnimation();
        } else {
            this.startAnimation();
        }
        return this.isPlaying;
    }
    
    stopAnimation() {
        this.isPlaying = false;
        this.lastTimestamp = null;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
    
    // Add this method to the FPGABoardAnimation class
    debugConnections() {
        console.log(`Total connections: ${this.connections.length}`);
        
        if (this.connections.length === 0) {
            console.warn("No connections found. Check if interconnects are properly defined in the Verilog file.");
        } else {
            this.connections.forEach((conn, i) => {
                console.log(`Connection ${i}:`);
                console.log(` - Source: ${conn.source?.name || 'undefined'} (${conn.source?.type || 'unknown type'})`);
                console.log(` - Target: ${conn.target?.name || 'undefined'} (${conn.target?.type || 'unknown type'})`);
                console.log(` - Waypoints: ${conn.waypoints?.length || 0}`);
                console.log(` - Pin name: ${conn.pinName || 'none'}`);
            });
        }
        
        // Log cells to check if they have connection data
        console.log(`Total cells: ${this.cellElements.length}`);
        this.cellElements.forEach((cell, i) => {
            console.log(`Cell ${i}: ${cell.name} (${cell.type})`);
            if (cell.connections) {
                console.log(` - Connections: ${JSON.stringify(cell.connections)}`);
            } else {
                console.log(` - No connection data`);
            }
        });
    }

    forceRedraw() {
        // Force canvas repaint by modifying a dimension
        const currentWidth = this.canvas.width;
        this.canvas.width = currentWidth + 1;
        this.canvas.width = currentWidth;
        
        // Rebuild connections if they're missing
        if (this.connections.length === 0 && this.fpgaData) {
            console.log("Rebuilding missing connections");
            this.layoutBoard();
        }
        
        // Log connection data for debugging
        console.log(`Force redrawing ${this.connections.length} connections`);
        
        // Redraw everything
        this.draw();
    }
}