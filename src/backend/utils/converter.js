/**
 * Converts an SDF file to JSON format
 * @param {string} sdfContent - The content of the SDF file
 * @returns {Object} - JSON representation of the SDF file
 */
function sdfToJson(sdfContent) {
  // Normalize content
  const normalizedContent = sdfContent
    .replace(/\r\n|\r/g, '\n')
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  let currentIndex = 0;

  function parseBlock() {
    skipWhitespace();

    if (currentIndex >= normalizedContent.length) {
      return null;
    }

    // Start of a block
    if (normalizedContent[currentIndex] === '(') {
      currentIndex++; // Skip open parenthesis
      skipWhitespace();

      // Parse the block name
      const name = parseIdentifier();
      skipWhitespace();

      // Process based on block type
      if (name === 'DELAYFILE') {
        return parseDelayFile();
      } else if (name === 'CELL') {
        return parseCell();
      } else if (name === 'DELAY') {
        return parseDelay();
      } else if (name === 'ABSOLUTE') {
        return parseAbsolute();
      } else if (name === 'TIMINGCHECK') {
        return parseTimingCheck();
      } else if (name === 'IOPATH') {
        return parseIoPath();
      } else if (name === 'SETUP') {
        return parseSetup();
      } else {
        // Generic blocks
        const value = parseValue();
        skipToClosingParenthesis();
        return { type: name, value };
      }
    } else if (normalizedContent[currentIndex] === '"') {
      // Quoted string
      return parseQuotedString();
    } else {
      // Simple value
      return parseValue();
    }
  }

  function parseDelayFile() {
    const result = {
      type: 'DELAYFILE',
      header: {},
      cells: []
    };

    // Parse DELAYFILE properties
    while (currentIndex < normalizedContent.length) {
      skipWhitespace();

      if (normalizedContent[currentIndex] === ')') {
        currentIndex++; // Skip closing parenthesis
        break;
      }

      if (normalizedContent[currentIndex] === '(') {
        const child = parseBlock();

        if (child) {
          if (child.type === 'SDFVERSION' ||
              child.type === 'DESIGN' ||
              child.type === 'VENDOR' ||
              child.type === 'PROGRAM' ||
              child.type === 'VERSION' ||
              child.type === 'DIVIDER' ||
              child.type === 'TIMESCALE') {
            // Header information
            result.header[child.type.toLowerCase()] = child.value;
          } else if (child.type === 'CELL') {
            // Cell definition
            result.cells.push(child);
          }
        }
      } else {
        currentIndex++;
      }
    }

    return result;
  }

  function parseCell() {
    const result = {
      type: 'CELL',
      properties: {},
      delays: [],
      timingchecks: []
    };

    // Parse cell properties
    while (currentIndex < normalizedContent.length) {
      skipWhitespace();

      if (normalizedContent[currentIndex] === ')') {
        currentIndex++; // Skip closing parenthesis
        break;
      }

      if (normalizedContent[currentIndex] === '(') {
        const child = parseBlock();

        if (child) {
          if (child.type === 'CELLTYPE' || child.type === 'INSTANCE') {
            result.properties[child.type.toLowerCase()] = child.value;
          } else if (child.type === 'DELAY') {
            result.delays.push(child);
          } else if (child.type === 'TIMINGCHECK') {
            result.timingchecks.push(child);
          }
        }
      } else {
        currentIndex++;
      }
    }

    return result;
  }

  function parseDelay() {
    const result = {
      type: 'DELAY',
      paths: []
    };

    // Parse DELAY children (typically ABSOLUTE blocks)
    while (currentIndex < normalizedContent.length) {
      skipWhitespace();

      if (normalizedContent[currentIndex] === ')') {
        currentIndex++; // Skip closing parenthesis
        break;
      }

      if (normalizedContent[currentIndex] === '(') {
        const child = parseBlock();

        if (child && child.type === 'ABSOLUTE') {
          result.paths = result.paths.concat(child.paths || []);
        }
      } else {
        currentIndex++;
      }
    }

    return result;
  }

  function parseAbsolute() {
    const result = {
      type: 'ABSOLUTE',
      paths: []
    };

    // Parse IOPATH entries
    while (currentIndex < normalizedContent.length) {
      skipWhitespace();

      if (normalizedContent[currentIndex] === ')') {
        currentIndex++; // Skip closing parenthesis
        break;
      }

      if (normalizedContent[currentIndex] === '(') {
        const child = parseBlock();

        if (child && child.type === 'IOPATH') {
          result.paths.push({
            from: child.from,
            to: child.to,
            rise: child.rise,
            fall: child.fall
          });
        }
      } else {
        currentIndex++;
      }
    }

    return result;
  }

  function parseIoPath() {
    const result = {
      type: 'IOPATH'
    };

    // Parse IOPATH components
    skipWhitespace();
    result.from = parseValue(); // 'datain' or similar
    skipWhitespace();
    result.to = parseValue();   // 'dataout' or similar
    skipWhitespace();

    // Parse rise delay
    if (normalizedContent[currentIndex] === '(') {
      result.rise = parseTimingValue();
      skipWhitespace();

      // Parse fall delay
      if (normalizedContent[currentIndex] === '(') {
        result.fall = parseTimingValue();
      }
    }

    skipToClosingParenthesis();
    return result;
  }

  function parseTimingCheck() {
    const result = {
      type: 'TIMINGCHECK',
      checks: []
    };

    // Parse timing checks
    while (currentIndex < normalizedContent.length) {
      skipWhitespace();

      if (normalizedContent[currentIndex] === ')') {
        currentIndex++; // Skip closing parenthesis
        break;
      }

      if (normalizedContent[currentIndex] === '(') {
        const child = parseBlock();

        if (child && child.type === 'SETUP') {
          result.checks.push({
            type: 'SETUP',
            from: child.from,
            to: child.to,
            value: child.value
          });
        }
      } else {
        currentIndex++;
      }
    }

    return result;
  }

  function parseSetup() {
    const result = {
      type: 'SETUP'
    };

    // Parse setup components
    skipWhitespace();
    result.from = parseValue(); // First port
    skipWhitespace();
    result.to = parseValue();   // Second port
    skipWhitespace();

    // Parse timing value
    if (normalizedContent[currentIndex] === '(') {
      result.value = parseTimingValue();
    }

    skipToClosingParenthesis();
    return result;
  }

  function parseIdentifier() {
    let identifier = '';

    // Parse alphanumeric characters and some symbols
    while (currentIndex < normalizedContent.length &&
           /[A-Za-z0-9_~\$\[\]\{\}\.\:\\]/.test(normalizedContent[currentIndex])) {
      identifier += normalizedContent[currentIndex++];
    }

    return identifier;
  }

  function parseValue() {
    skipWhitespace();

    if (currentIndex >= normalizedContent.length) {
      return null;
    }

    if (normalizedContent[currentIndex] === '"') {
      return parseQuotedString();
    } else if (normalizedContent[currentIndex] === '(') {
      return parseBlock();
    } else {
      // Simple values
      let value = '';
      while (currentIndex < normalizedContent.length &&
             /[^()\s]/.test(normalizedContent[currentIndex])) {
        value += normalizedContent[currentIndex++];
      }

      // Convert to number if possible
      const num = parseFloat(value);
      if (!isNaN(num) && num.toString() === value) {
        return num;
      }

      return value;
    }
  }

  function parseQuotedString() {
    currentIndex++; // Skip opening quote
    let value = '';

    while (currentIndex < normalizedContent.length && normalizedContent[currentIndex] !== '"') {
      if (normalizedContent[currentIndex] === '\\' && currentIndex + 1 < normalizedContent.length) {
        currentIndex++; // Skip escape character
      }
      value += normalizedContent[currentIndex++];
    }

    currentIndex++; // Skip closing quote
    return value;
  }

  function parseTimingValue() {
    if (normalizedContent[currentIndex] !== '(') {
      return null;
    }

    currentIndex++; // Skip opening parenthesis
    let valueStr = '';

    // Get everything until the closing parenthesis
    let parenCount = 1;
    while (currentIndex < normalizedContent.length && parenCount > 0) {
      if (normalizedContent[currentIndex] === '(') parenCount++;
      if (normalizedContent[currentIndex] === ')') parenCount--;

      if (parenCount > 0) {
        valueStr += normalizedContent[currentIndex];
      }
      currentIndex++;
    }

    // Handle min:typ:max format
    if (valueStr.includes(':')) {
      const parts = valueStr.split(':');
      if (parts.length === 3) {
        return {
          min: parseFloat(parts[0]),
          typical: parseFloat(parts[1]),
          max: parseFloat(parts[2])
        };
      }
    }

    // Handle a simple value
    return parseFloat(valueStr);
  }

  function skipWhitespace() {
    while (currentIndex < normalizedContent.length && /\s/.test(normalizedContent[currentIndex])) {
      currentIndex++;
    }
  }

  function skipToClosingParenthesis() {
    let parenCount = 1;

    while (currentIndex < normalizedContent.length && parenCount > 0) {
      if (normalizedContent[currentIndex] === '(') parenCount++;
      if (normalizedContent[currentIndex] === ')') parenCount--;
      currentIndex++;
    }
  }

  // Start parsing at the root
  return parseBlock();
}

/**
 * Helper function to load and convert an SDF file
 * @param {string} filePath - Path to the SDF file
 * @returns {Promise<Object>} - JSON representation of the SDF file
 */
async function loadAndConvertSdf(filePath) {
  try {
    const fs = require('fs').promises;
    const content = await fs.readFile(filePath, 'utf8');
    return sdfToJson(content);
  } catch (error) {
    console.error('Error converting SDF file:', error);
    throw error;
  }
}

module.exports = {
  sdfToJson,
  loadAndConvertSdf
};