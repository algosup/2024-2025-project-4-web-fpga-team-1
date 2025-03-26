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
    
    // Remplacez la fonction parseSdfFile existante par celle-ci

    function parseSdfFile(sdfContent) {
      // Le premier niveau de parsing est géré par converter.js
      // Nous l'exposons globalement pour le rendre accessible
      window.converterSdfToJson = window.sdfToJson || sdfToJson;
      
      // Puis on applique notre restructuration
      return sdfToJson(sdfContent);
    }
    
    // Remplacer la fonction sdfToJson dans votre fichier animation.js

    function sdfToJson(sdfContent) {
      // Utiliser le parseur existant pour obtenir la structure brute
      const rawData = parseSdfRaw(sdfContent);
      
      // Restructurer les données pour séparer modules et connexions
      return restructureFpgaData(rawData);
    }
    
    // Fonction pour parser le SDF en structure brute (comme avant)
    function parseSdfRaw(sdfContent) {
      // Appel au parser externe ou utilisation du code de converter.js
      // Cette partie reste inchangée, elle utilise le parser existant
    
      // Utilisez la fonction window.sdfToJson si elle est disponible
      if (window.sdfToJson) {
        return window.sdfToJson(sdfContent);
      }
      
      // Sinon, si le code est accessible, importez-le ou copiez-le ici
      // Code du parser de converter.js...
      
      // En dernier recours, tentez d'appeler l'API
      console.error("Parser SDF non disponible. Tentative d'appel à l'API...");
      return { type: 'DELAYFILE', parsed: false, error: "Parser non disponible" };
    }
    
    // Fonction pour restructurer les données FPGA

    function restructureFpgaData(rawData) {
      if (!rawData || !rawData.cells || rawData.type !== 'DELAYFILE') {
        return rawData; // Retourner tel quel si format incorrect
      }
    
      const result = {
        type: 'FPGA',
        header: rawData.header,
        modules: [],
        connections: []
      };
    
      // Map pour suivre les modules déjà créés (par ID)
      const moduleMap = new Map();
    
      // Première passe: extraire les modules explicitement définis
      rawData.cells.forEach(cell => {
        const cellType = cell.properties.celltype;
        
        if (cellType !== 'fpga_interconnect') {
          // C'est un module fonctionnel (LUT, DFF, etc.)
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
    
      // Deuxième passe: traiter les connexions et détecter les modules manquants
      rawData.cells.forEach(cell => {
        const cellType = cell.properties.celltype;
        
        if (cellType === 'fpga_interconnect') {
          // C'est une connexion entre modules
          const instance = cell.properties.instance;
          const pathInfo = extractPathInfo(instance);
          
          // Créer les modules source/destination s'ils n'existent pas encore
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
    
          // Ajouter la connexion
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
    
    // Extraire les informations de chemin depuis le nom d'instance
    function extractPathInfo(instanceName) {
      // Format typique: routing_segment_SOURCE_output_X_Y_to_TARGET_input_A_B
      const parts = instanceName.split('_');
      let fromPart = '';
      let toPart = '';
      let isFromPart = true;
      let toIndex = parts.indexOf('to');
      
      if (toIndex === -1) {
        return { from: '', to: '', fromClean: '', toClean: '' };
      }
      
      // Extraire la partie source (avant "to")
      for (let i = 2; i < toIndex; i++) {
        fromPart += (fromPart ? '_' : '') + parts[i];
      }
    
      // Extraire la partie destination (après "to")
      for (let i = toIndex + 1; i < parts.length; i++) {
        toPart += (toPart ? '_' : '') + parts[i];
      }
      
      // Nettoyer les noms pour extraire les modules de base
      const fromClean = cleanModuleName(fromPart);
      const toClean = cleanModuleName(toPart);
    
      return {
        from: fromPart,
        to: toPart,
        fromClean: fromClean,
        toClean: toClean
      };
    }
    
    // Nettoie un nom de module en enlevant les suffixes comme "output_0_0"
    function cleanModuleName(name) {
      // Supprimer les suffixes communs
      return name
        .replace(/output_\d+_\d+$/, '')
        .replace(/input_\d+_\d+$/, '')
        .replace(/clock_\d+_\d+$/, '')
        .replace(/_+$/, ''); // Supprimer les underscores finaux
    }
    
    // Extraire les délais d'une cellule
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