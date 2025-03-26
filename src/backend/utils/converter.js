/**
 * Convertit un fichier SDF en format JSON
 * @param {string} sdfContent - Le contenu du fichier SDF
 * @returns {Object} - Représentation JSON du fichier SDF
 */
function sdfToJson(sdfContent) {
  // Normalisation du contenu
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
    
    // Début d'un bloc
    if (normalizedContent[currentIndex] === '(') {
      currentIndex++; // Skip open parenthesis
      skipWhitespace();
      
      // Parse le nom du bloc
      const name = parseIdentifier();
      skipWhitespace();
      
      // Traitement selon le type de bloc
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
        // Blocs génériques
        const value = parseValue();
        skipToClosingParenthesis();
        return { type: name, value };
      }
    } else if (normalizedContent[currentIndex] === '"') {
      // Chaîne de caractères entre guillemets
      return parseQuotedString();
    } else {
      // Valeur simple
      return parseValue();
    }
  }
  
  function parseDelayFile() {
    const result = {
      type: 'DELAYFILE',
      header: {},
      cells: []
    };
    
    // Parse les propriétés du DELAYFILE
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
            // Information d'en-tête
            result.header[child.type.toLowerCase()] = child.value;
          } else if (child.type === 'CELL') {
            // Définition de cellule
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
    
    // Parse les propriétés de la cellule
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
    
    // Parse les enfants DELAY (typiquement des blocs ABSOLUTE)
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
    
    // Parse les entrées IOPATH
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
    
    // Parse les composants IOPATH
    skipWhitespace();
    result.from = parseValue(); // 'datain' ou similaire
    skipWhitespace();
    result.to = parseValue();   // 'dataout' ou similaire
    skipWhitespace();
    
    // Parse le délai de montée
    if (normalizedContent[currentIndex] === '(') {
      result.rise = parseTimingValue();
      skipWhitespace();
      
      // Parse le délai de descente
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
    
    // Parse les vérifications de timing
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
    
    // Parse les composants setup
    skipWhitespace();
    result.from = parseValue(); // Premier port
    skipWhitespace();
    result.to = parseValue();   // Second port
    skipWhitespace();
    
    // Parse la valeur de timing
    if (normalizedContent[currentIndex] === '(') {
      result.value = parseTimingValue();
    }
    
    skipToClosingParenthesis();
    return result;
  }
  
  function parseIdentifier() {
    let identifier = '';
    
    // Parse les caractères alphanumérique et certains symboles
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
      // Valeurs simples
      let value = '';
      while (currentIndex < normalizedContent.length && 
             /[^()\s]/.test(normalizedContent[currentIndex])) {
        value += normalizedContent[currentIndex++];
      }
      
      // Conversion en nombre si possible
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
        currentIndex++; // Saute le caractère d'échappement
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
    
    // Récupère tout jusqu'à la parenthèse fermante
    let parenCount = 1;
    while (currentIndex < normalizedContent.length && parenCount > 0) {
      if (normalizedContent[currentIndex] === '(') parenCount++;
      if (normalizedContent[currentIndex] === ')') parenCount--;
      
      if (parenCount > 0) {
        valueStr += normalizedContent[currentIndex];
      }
      currentIndex++;
    }
    
    // Gère le format min:typ:max
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
    
    // Gère une valeur simple
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
  
  // Commence l'analyse à la racine
  return parseBlock();
}

/**
 * Fonction d'aide pour charger et convertir un fichier SDF
 * @param {string} filePath - Chemin vers le fichier SDF
 * @returns {Promise<Object>} - Représentation JSON du fichier SDF
 */
async function loadAndConvertSdf(filePath) {
  try {
    const fs = require('fs').promises;
    const content = await fs.readFile(filePath, 'utf8');
    return sdfToJson(content);
  } catch (error) {
    console.error('Erreur lors de la conversion du fichier SDF:', error);
    throw error;
  }
}

module.exports = {
  sdfToJson,
  loadAndConvertSdf
};