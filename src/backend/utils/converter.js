function parseVerilog(verilog) {
    // --- Parse Module & Ports ---
    const moduleRegex = /module\s+\\?([\w\$:\.]+)\s*\(([^)]*)\)\s*;/;
    const moduleMatch = verilog.match(moduleRegex);
    if (!moduleMatch) {
      throw new Error("No top-level module found.");
    }
    const moduleName = moduleMatch[1];

    // Ports: create an object with direction & name
    const rawPorts = moduleMatch[2]
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const ports = rawPorts.map(portStr => {
      // Expect something like: "input \D" or "output O1"
      const portRegex = /^(input|output|inout)\s+\\?([\w\$:\.]+)/;
      const m = portStr.match(portRegex);
      if (m) {
        return { direction: m[1], name: m[2] };
      }
      // fallback
      return { direction: "unknown", name: portStr.replace(/^\\/, '') };
    });

    // --- Wires ---
    // capture each wire line: "wire name1, name2;"
    let wireRegex = /wire\s+([^;]+);/g;
    let wireMatch;
    const wires = [];
    while ((wireMatch = wireRegex.exec(verilog)) !== null) {
      const wireList = wireMatch[1].split(',').map(w => w.trim().replace(/^\\/, ''));
      wires.push(...wireList);
    }

    // --- Assignments ---
    // "assign \Q = \Q_input_0_0;"
    let assignRegex = /assign\s+\\?([\w\$:\.]+)\s*=\s*\\?([\w\$:\.]+)/g;
    let assignMatch;
    const assignments = [];
    while ((assignMatch = assignRegex.exec(verilog)) !== null) {
      assignments.push({
        target: assignMatch[1],
        source: assignMatch[2]
      });
    }

    // --- Interconnects ---
    // "fpga_interconnect name (... )"
    // We capture instance, datain, dataout
    let interRegex = /fpga_interconnect\s+\\?([\w\$:\.\~^]+)\s*\(\s*\.datain\s*\(\s*\\?([\w\$:\.]+)\s*\),\s*\.dataout\s*\(\s*\\?([\w\$:\.]+)\s*\)\s*\)/g;
    let interMatch;
    const interconnects = [];
    while ((interMatch = interRegex.exec(verilog)) !== null) {
      interconnects.push({
        instance: interMatch[1],
        datain: interMatch[2],
        dataout: interMatch[3]
      });
    }

    // --- Cells ---
    // We want to capture e.g. "LUT_K #( ... ) \lut_foo ( .in(...), .out(...) );"
    // We'll skip 'module' or 'fpga_interconnect' types, but keep LUT_K, DFF, etc.
    const cellRegex = /([\w\$]+)\s*(#\([^)]*\))?\s+\\?([\w\$:\.\~^]+)\s*\(([\s\S]*?)\);/g;
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(verilog)) !== null) {
      const cellType = cellMatch[1];
      if (cellType === "module" || cellType === "fpga_interconnect") {
        continue; // skip
      }

      // instance name can contain ~^
      const paramBlock = cellMatch[2] || "";
      const instanceName = cellMatch[3];
      const connBlock = cellMatch[4];

      // --- Parse Parameters ---
      // #(.K(5), .LUT_MASK(32'b...))
      const parameters = {};
      const paramRegex = /\.([\w\$]+)\(\s*([^()]+)\s*\)/g;
      let pMatch;
      while ((pMatch = paramRegex.exec(paramBlock)) !== null) {
        const paramName = pMatch[1];
        const paramValue = pMatch[2];
        parameters[paramName] = paramValue;
      }

      // --- Parse Connections ---
      // .portname(signal), or .portname({signal1, signal2}), etc.
      const connections = {};
      const portConnRegex = /\.([\w\$:\.\~^]+)\s*\(\s*([^)]*)\)/g;
      let cMatch;
      while ((cMatch = portConnRegex.exec(connBlock)) !== null) {
        const portName = cMatch[1];
        let signal = cMatch[2].trim();

        // remove any leading/trailing backslash or whitespace
        signal = signal.replace(/^\\/, '').trim();

        // If it's curly-braced (like { 1'b0, some_wire }), split it
        if (signal.startsWith('{') && signal.endsWith('}')) {
          // remove braces
          let inside = signal.slice(1, -1).trim();
          // split by comma
          let parts = inside.split(',').map(s => s.trim().replace(/^\\/, ''));
          connections[portName] = parts;
        } else {
          connections[portName] = signal;
        }
      }

      cells.push({
        type: cellType,
        instance: instanceName,
        parameters: parameters,
        connections: connections
      });
    }

    return {
      module: {
        name: moduleName,
        ports,
        wires,
        assignments,
        interconnects,
        cells
      }
    };
  }

function parseSDF(sdfContent) {
  if (!sdfContent) {
    return null;
  }

  const sdfData = {
    version: "",
    design: "",
    date: "",
    vendor: "",
    cells: {},
    nets: {}
  };

  // Extract header information
  const headerRegex = /\(DELAYFILE\s*\(SDFVERSION\s*"([^"]*)"\)\s*\(DESIGN\s*"([^"]*)"\)\s*\(DATE\s*"([^"]*)"\)\s*\(VENDOR\s*"([^"]*)"\)/;
  const headerMatch = sdfContent.match(headerRegex);
  if (headerMatch) {
    sdfData.version = headerMatch[1];
    sdfData.design = headerMatch[2];
    sdfData.date = headerMatch[3];
    sdfData.vendor = headerMatch[4];
  }

  // Extract cell timing information
  const cellRegex = /\(CELL\s*\(CELLTYPE\s*"([^"]*)"\)\s*\(INSTANCE\s*([^)]*)\)([\s\S]*?)(?=\(CELL|\)$)/g;
  let cellMatch;
  
  while ((cellMatch = cellRegex.exec(sdfContent)) !== null) {
    const cellType = cellMatch[1];
    const instance = cellMatch[2].replace(/"/g, "").trim();
    const cellContent = cellMatch[3];

    // Initialize cell data
    sdfData.cells[instance] = {
      type: cellType,
      delays: {}
    };

    // Extract IOPATH delays (pin-to-pin delays)
    const iopathRegex = /\(IOPATH\s+([^\s]+)\s+([^\s]+)\s+\(([^)]+)\)\s+\(([^)]+)\)/g;
    let iopathMatch;
    
    while ((iopathMatch = iopathRegex.exec(cellContent)) !== null) {
      const inputPin = iopathMatch[1].replace(/"/g, "");
      const outputPin = iopathMatch[2].replace(/"/g, "");
      const riseDelay = parseFloat(iopathMatch[3]);
      const fallDelay = parseFloat(iopathMatch[4]);
      
      const delayKey = `${inputPin}->${outputPin}`;
      sdfData.cells[instance].delays[delayKey] = {
        rise: riseDelay,
        fall: fallDelay,
        avg: (riseDelay + fallDelay) / 2
      };
    }

    // Extract INTERCONNECT delays
    const interconnectRegex = /\(INTERCONNECT\s+([^\s]+)\s+([^\s]+)\s+\(([^)]+)\)\s+\(([^)]+)\)/g;
    let interconnectMatch;
    
    while ((interconnectMatch = interconnectRegex.exec(cellContent)) !== null) {
      const startPin = interconnectMatch[1].replace(/"/g, "");
      const endPin = interconnectMatch[2].replace(/"/g, "");
      const riseDelay = parseFloat(interconnectMatch[3]);
      const fallDelay = parseFloat(interconnectMatch[4]);
      
      const netKey = `${startPin}->${endPin}`;
      sdfData.nets[netKey] = {
        rise: riseDelay,
        fall: fallDelay,
        avg: (riseDelay + fallDelay) / 2
      };
    }
  }

  return sdfData;
}

function parseFiles(verilogContent, sdfContent = null) {
  // Parse Verilog file
  const verilogData = parseVerilog(verilogContent);
  
  // Parse SDF file if provided
  const sdfData = sdfContent ? parseSDF(sdfContent) : null;
  
  // Create combined data structure
  const combinedData = {
    design: verilogData,
    timing: sdfData,
    // Add metadata
    metadata: {
      generatedAt: new Date().toISOString(),
      verilogPresent: true,
      sdfPresent: !!sdfData
    }
  };
  
  return combinedData;
}

// Export the functions for use in the browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
      parseVerilog,
      parseSDF,
      parseFiles
  };
} else if (typeof window !== 'undefined') {
  // Browser environment
  window.parseVerilog = parseVerilog;
  window.parseSDF = parseSDF;
  window.parseFiles = parseFiles;
}