/**
 * Animation FPGA - Visualisation des délais et des connexions
 * Cette animation montre comment les signaux se propagent à travers un FPGA
 * basé sur les données de timing SDF converties en JSON
 */

// Variables globales
let fpgaData = null;
let animationSpeed = 1;
let animationRunning = false;
let animationFrame = null;
let canvas = null;
let ctx = null;
let modules = [];
let connections = [];
let signals = [];
let moduleInputsRequired = new Map(); // Suivi des entrées nécessaires par module
let moduleInputsReceived = new Map(); // Suivi des entrées reçues par module
// Dimensions initiales, seront ajustées dynamiquement
let boardWidth = 800;
let boardHeight = 600;
let moduleSize = 60;
let gridSpacing = 120;
let startTime = 0;
// Marges pour éviter que les éléments soient coupés
const MARGIN = 80;

/**
 * Initialise l'animation du FPGA avec les données JSON fournies
 * @param {Object} data - Données JSON contenant les modules et connexions
 */
function initFPGABoardAnimation(data) {
    console.log("Initialisation de l'animation FPGA", data);
    fpgaData = data;
    
    // Réinitialisation des données
    resetAnimation();
    
    // Calculer la taille du canvas en fonction des modules
    calculateCanvasSize();
    
    // Initialisation du canvas avec la taille calculée
    canvas = document.getElementById('fpga-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'fpga-canvas';
        canvas.width = boardWidth;
        canvas.height = boardHeight;
        document.getElementById('board-container').appendChild(canvas);
    } else {
        // Si le canvas existe déjà, mettre à jour sa taille
        canvas.width = boardWidth;
        canvas.height = boardHeight;
    }
    
    // Ajouter un style pour que le canvas soit responsive
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    
    ctx = canvas.getContext('2d');
    
    // Initialisation des contrôles
    initializeControls();
    
    // Placement des modules et connexions
    placeModules();
    createConnections();
    
    // Premier rendu
    render();
}

/**
 * Calcule la taille optimale du canvas en fonction du nombre de modules
 */
function calculateCanvasSize() {
    if (!fpgaData || !fpgaData.modules || fpgaData.modules.length === 0) {
        // Taille par défaut si pas de modules
        boardWidth = 800;
        boardHeight = 600;
        return;
    }
    
    const moduleCount = fpgaData.modules.length;
    
    // Ajuster l'espacement de la grille en fonction du nombre de modules
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
    
    // Calculer le nombre de colonnes optimal (approximativement carré)
    const modulesPerRow = Math.ceil(Math.sqrt(moduleCount));
    
    // Calculer le nombre de lignes nécessaires
    const rowCount = Math.ceil(moduleCount / modulesPerRow);
    
    // Calculer la largeur et la hauteur nécessaires pour le canvas
    boardWidth = modulesPerRow * gridSpacing + MARGIN * 2;
    boardHeight = rowCount * gridSpacing + MARGIN * 2;
    
    // Assurer une taille minimale
    boardWidth = Math.max(boardWidth, 600);
    boardHeight = Math.max(boardHeight, 400);
    
    console.log(`Canvas size calculated: ${boardWidth}x${boardHeight} for ${moduleCount} modules`);
}

/**
 * Réinitialise l'animation
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
 * Initialise les contrôles de l'animation
 */
function initializeControls() {
    const controlsContainer = document.getElementById('animation-controls');
    if (!controlsContainer) return;
    
    // Vider les contrôles existants
    controlsContainer.innerHTML = '';
    
    // Créer les boutons de contrôle
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
    
    const speedContainer = document.createElement('div');
    speedContainer.className = 'd-flex align-items-center ms-2';
    
    const speedLabel = document.createElement('label');
    speedLabel.textContent = 'Speed: ';
    speedLabel.className = 'me-2';
    
    const speedSlider = document.createElement('input');
    speedSlider.type = 'range';
    speedSlider.min = '0.2';
    speedSlider.max = '5';
    speedSlider.step = '0.2';
    speedSlider.value = animationSpeed;
    speedSlider.className = 'form-range';
    speedSlider.style.width = '100px';
    speedSlider.addEventListener('input', (e) => {
        animationSpeed = parseFloat(e.target.value);
        speedValue.textContent = animationSpeed.toFixed(1) + 'x';
    });
    
    const speedValue = document.createElement('span');
    speedValue.textContent = animationSpeed.toFixed(1) + 'x';
    speedValue.className = 'ms-2';
    
    speedContainer.appendChild(speedLabel);
    speedContainer.appendChild(speedSlider);
    speedContainer.appendChild(speedValue);
    
    // Ajouter les boutons au conteneur
    controlsContainer.appendChild(startButton);
    controlsContainer.appendChild(resetButton);
    controlsContainer.appendChild(speedContainer);
    
    // Ajouter une légende
    const legend = document.createElement('div');
    legend.className = 'mt-3 d-flex flex-wrap';
    legend.innerHTML = `
        <div class="me-4 mb-2"><span style="display:inline-block;width:20px;height:20px;background-color:#4a90e2;margin-right:5px;"></span> LUT</div>
        <div class="me-4 mb-2"><span style="display:inline-block;width:20px;height:20px;background-color:#50c878;margin-right:5px;"></span> DFF</div>
        <div class="me-4 mb-2"><span style="display:inline-block;width:20px;height:20px;background-color:#f39c12;margin-right:5px;"></span> I/O</div>
        <div class="me-4 mb-2"><span style="display:inline-block;width:20px;height:20px;background-color:#e74c3c;margin-right:5px;"></span> Signal</div>
    `;
    controlsContainer.appendChild(legend);
    
    // Ajouter des informations d'utilisation
    const info = document.createElement('div');
    info.className = 'mt-3 small text-muted';
    info.innerHTML = 'Cette animation montre la propagation des signaux à travers les modules FPGA. Les délais sont basés sur les temps définis dans le fichier SDF.';
    controlsContainer.appendChild(info);
}

/**
 * Démarre ou arrête l'animation
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
 * Place les modules sur le canvas selon une disposition plus logique
 */
function placeModules() {
  if (!fpgaData || !fpgaData.modules) return;
  
  modules = [];
  
  // Séparer les modules par type
  const ioModules = fpgaData.modules.filter(m => m.type === 'IO_PORT');
  const functionalModules = fpgaData.modules.filter(m => m.type !== 'IO_PORT');
  
  // Placer d'abord les modules fonctionnels en grille
  const modulesPerRow = Math.ceil(Math.sqrt(functionalModules.length));
  
  // Calculer le décalage pour centrer la grille
  const offsetX = (boardWidth - (modulesPerRow * gridSpacing)) / 2 + moduleSize;
  const offsetY = MARGIN + moduleSize * 2; // Laisser de l'espace en haut pour les entrées
  
  // Placer chaque module fonctionnel dans la grille
  functionalModules.forEach((moduleData, index) => {
    const row = Math.floor(index / modulesPerRow);
    const col = index % modulesPerRow;
    
    const x = offsetX + col * gridSpacing;
    const y = offsetY + row * gridSpacing;
    
    // Déterminer la couleur du module
    let color = '#4a90e2';  // Bleu par défaut (LUT)
    
    if (moduleData.type.includes('DFF')) {
      color = '#50c878';  // Vert pour les DFF (flip-flops)
    }
    
    modules.push({
      id: moduleData.instance,
      type: moduleData.type,
      x: x,
      y: y,
      width: moduleSize,
      height: moduleSize,
      color: color,
      data: moduleData
    });
  });
  
  // Identifier les entrées et sorties
  const inputs = ioModules.filter(m => m.isInput || !m.isOutput);
  const outputs = ioModules.filter(m => m.isOutput);
  
  // Placer les entrées en haut
  const inputWidth = boardWidth / (inputs.length + 1);
  inputs.forEach((input, index) => {
    modules.push({
      id: input.instance,
      type: 'IO_PORT',
      x: inputWidth * (index + 1),
      y: MARGIN,
      width: moduleSize * 0.8,
      height: moduleSize * 0.8,
      color: '#f39c12', // Orange pour les I/O
      isInput: true,
      data: input
    });
  });
  
  // Placer les sorties en bas
  const outputWidth = boardWidth / (outputs.length + 1);
  outputs.forEach((output, index) => {
    modules.push({
      id: output.instance,
      type: 'IO_PORT',
      x: outputWidth * (index + 1),
      y: boardHeight - MARGIN,
      width: moduleSize * 0.8,
      height: moduleSize * 0.8,
      color: '#f39c12', // Orange pour les I/O
      isOutput: true,
      data: output
    });
  });
}

/**
 * Crée les connexions entre les modules et détecte les entrées requises
 */
function createConnections() {
    if (!fpgaData || !fpgaData.connections) return;
    
    connections = [];
    
    // Réinitialiser les maps de suivi des entrées
    moduleInputsRequired = new Map();
    moduleInputsReceived = new Map();
    
    fpgaData.connections.forEach(connectionData => {
        // Trouver les modules source et destination
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
            
            // Enregistrer cette connexion comme entrée requise pour le module cible
            if (!moduleInputsRequired.has(targetModule.id)) {
                moduleInputsRequired.set(targetModule.id, new Set());
            }
            moduleInputsRequired.get(targetModule.id).add(connection.id);
            
            // Initialiser l'ensemble des entrées reçues pour le module
            if (!moduleInputsReceived.has(targetModule.id)) {
                moduleInputsReceived.set(targetModule.id, new Set());
            }
        }
    });
}

/**
 * Trouve un module par ID partiel
 */
function findModuleByPartialId(partialId) {
    return modules.find(module => 
        module.id.includes(partialId) || 
        partialId.includes(module.id)
    );
}

/**
 * Obtient le délai maximum d'une connexion
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
 * Crée les signaux initiaux pour l'animation
 */
function createInitialSignals() {
    // Trouver les modules d'entrée (ceux avec isInput=true ou type=IO_PORT)
    const inputModules = modules.filter(module => 
        module.type === 'IO_PORT' && module.isInput
    );
    
    // Si aucun module d'entrée spécifique n'est trouvé, utiliser la méthode précédente
    const sourcesToUse = inputModules.length > 0 ? inputModules : 
        modules.filter(module => {
            return connections.some(conn => conn.source === module) &&
                  !connections.some(conn => conn.target === module);
        });
    
    // Créer un signal pour chaque source
    sourcesToUse.forEach(source => {
        propagateSignalsFromModule(source, performance.now());
    });
}

/**
 * Anime les signaux sur le canvas
 */
function animate() {
    const currentTime = performance.now();
    const elapsedTime = (currentTime - startTime) * animationSpeed;
    
    // Mettre à jour la progression des signaux existants
    signals.forEach(signal => {
        if (!signal.active) return;
        
        const signalDuration = signal.connection.delay || 1000;
        signal.progress = Math.min(1, (currentTime - signal.startTime) * animationSpeed / signalDuration);
        
        // Si le signal a atteint sa destination
        if (signal.progress >= 1) {
            signal.active = false;
            
            // Trouver le module cible
            const targetModule = signal.connection.target;
            
            // Marquer cette entrée comme reçue
            if (moduleInputsReceived.has(targetModule.id)) {
                moduleInputsReceived.get(targetModule.id).add(signal.connection.id);
            }
            
            // Vérifier si toutes les entrées nécessaires sont reçues
            const allInputsReceived = checkAllInputsReceived(targetModule);
            
            // Créer des signaux pour toutes les connexions sortantes du module cible
            // seulement si toutes les entrées nécessaires sont reçues
            if (allInputsReceived || targetModule.type === 'IO_PORT') {
                propagateSignalsFromModule(targetModule, currentTime);
            }
        }
    });
    
    // Dessiner la scène
    render();
    
    // Continuer l'animation si activée
    if (animationRunning) {
        animationFrame = requestAnimationFrame(animate);
    }
}

/**
 * Vérifie si un module a reçu toutes ses entrées nécessaires
 */
function checkAllInputsReceived(module) {
    // Les modules d'entrée n'ont pas d'entrées requises (ou sont directement actifs)
    if (module.type === 'IO_PORT' && module.isInput) {
        return true;
    }
    
    // Si le module n'a pas d'entrées requises, considérer qu'il est prêt
    if (!moduleInputsRequired.has(module.id)) {
        return true;
    }
    
    const requiredInputs = moduleInputsRequired.get(module.id);
    const receivedInputs = moduleInputsReceived.get(module.id);
    
    // Si on n'a pas encore d'entrées reçues, retourner false
    if (!receivedInputs) return false;
    
    // Vérifier si toutes les entrées requises sont dans les entrées reçues
    for (const required of requiredInputs) {
        if (!receivedInputs.has(required)) {
            return false;
        }
    }
    
    return true;
}

/**
 * Propage des signaux depuis un module source
 */
function propagateSignalsFromModule(sourceModule, currentTime) {
    // Trouver toutes les connexions partant de cette source
    const outgoingConnections = connections.filter(conn => conn.source === sourceModule);
    
    // Délai de traitement interne du module (pour les éléments qui ne sont pas des I/O)
    const processingDelay = sourceModule.type === 'IO_PORT' ? 0 : 50;
    
    outgoingConnections.forEach(connection => {
        // Vérifier si ce signal existe déjà récemment créé (éviter les doublons)
        const existingSignal = signals.find(s => 
            s.connection === connection && s.startTime > currentTime - 5000
        );
        
        if (!existingSignal) {
            signals.push({
                id: `signal-${sourceModule.id}-${connection.target.id}`,
                connection: connection,
                progress: 0,
                startTime: currentTime + processingDelay, // Ajouter délai de traitement
                color: '#e74c3c',
                active: true
            });
        }
    });
}

/**
 * Dessine l'état actuel de l'animation
 */
function render() {
    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner l'arrière-plan
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner les connexions
    drawConnections();
    
    // Dessiner les signaux
    drawSignals();
    
    // Dessiner les modules
    drawModules();
    
    // Ajouter les délais sur les connexions
    if (!animationRunning) {
        addDelayLabels();
    }
}

/**
 * Dessine les connexions entre les modules
 */
function drawConnections() {
    connections.forEach(connection => {
        const source = connection.source;
        const target = connection.target;
        
        ctx.beginPath();
        ctx.moveTo(source.x + source.width / 2, source.y + source.height / 2);
        
        // Dessiner une ligne courbe
        const cp1x = source.x + source.width / 2 + (target.x - source.x) / 3;
        const cp1y = source.y + source.height / 2;
        const cp2x = target.x + target.width / 2 - (target.x - source.x) / 3;
        const cp2y = target.y + target.height / 2;
        
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, target.x + target.width / 2, target.y + target.height / 2);
        
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

/**
 * Dessine les signaux en cours de propagation
 */
function drawSignals() {
    signals.forEach(signal => {
        if (!signal.active) return;
        
        const source = signal.connection.source;
        const target = signal.connection.target;
        
        // Calculer la position du signal le long de la courbe de Bézier
        const t = signal.progress;
        
        const cp1x = source.x + source.width / 2 + (target.x - source.x) / 3;
        const cp1y = source.y + source.height / 2;
        const cp2x = target.x + target.width / 2 - (target.x - source.x) / 3;
        const cp2y = target.y + target.height / 2;
        
        const startX = source.x + source.width / 2;
        const startY = source.y + source.height / 2;
        const endX = target.x + target.width / 2;
        const endY = target.y + target.height / 2;
        
        // Équation paramétrique de la courbe de Bézier cubique
        const x = Math.pow(1-t, 3) * startX + 
                 3 * Math.pow(1-t, 2) * t * cp1x +
                 3 * (1-t) * Math.pow(t, 2) * cp2x +
                 Math.pow(t, 3) * endX;
                 
        const y = Math.pow(1-t, 3) * startY + 
                 3 * Math.pow(1-t, 2) * t * cp1y +
                 3 * (1-t) * Math.pow(t, 2) * cp2y +
                 Math.pow(t, 3) * endY;
        
        // Dessiner le point du signal
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = signal.color;
        ctx.fill();
        
        // Tracer sillage
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        // Dessiner la partie de la courbe parcourue
        const steps = 20;
        for (let i = 1; i <= steps * t; i++) {
            const st = i / steps;
            const sx = Math.pow(1-st, 3) * startX + 
                      3 * Math.pow(1-st, 2) * st * cp1x +
                      3 * (1-st) * Math.pow(st, 2) * cp2x +
                      Math.pow(st, 3) * endX;
                      
            const sy = Math.pow(1-st, 3) * startY + 
                      3 * Math.pow(1-st, 2) * st * cp1y +
                      3 * (1-st) * Math.pow(st, 2) * cp2y +
                      Math.pow(st, 3) * endY;
            
            ctx.lineTo(sx, sy);
        }
        
        ctx.strokeStyle = signal.color;
        ctx.lineWidth = 3;
        ctx.stroke();
    });
}

/**
 * Dessine les modules sur le canvas
 */
function drawModules() {
  modules.forEach(module => {
    // Dessiner le fond du module
    ctx.fillStyle = module.color;
    
    // Forme différente pour les I/O
    if (module.type === 'IO_PORT') {
      if (module.isInput) {
        // Triangle pour les entrées (pointe vers le bas)
        ctx.beginPath();
        ctx.moveTo(module.x, module.y - module.height/2);
        ctx.lineTo(module.x + module.width/2, module.y + module.height/2);
        ctx.lineTo(module.x - module.width/2, module.y + module.height/2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Triangle pour les sorties (pointe vers le haut)
        ctx.beginPath();
        ctx.moveTo(module.x, module.y + module.height/2);
        ctx.lineTo(module.x + module.width/2, module.y - module.height/2);
        ctx.lineTo(module.x - module.width/2, module.y - module.height/2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else {
      // Rectangle arrondi pour les modules fonctionnels
      roundRect(ctx, module.x - module.width/2, module.y - module.height/2, 
               module.width, module.height, 8, true, false);
      
      // Dessiner le contour
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      roundRect(ctx, module.x - module.width/2, module.y - module.height/2, 
               module.width, module.height, 8, false, true);
    }
    
    // Ajouter le nom du module
    ctx.fillStyle = module.type === 'IO_PORT' ? '#000' : '#fff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Extraire le nom simplifié du module
    let displayName = module.id;
    
    // Si le nom est trop long, extraire une partie plus courte
    const nameParts = module.id.split('_');
    if (nameParts.length > 1) {
      if (module.id.includes('lut_')) {
        displayName = nameParts[1];
      } else if (module.type === 'IO_PORT') {
        // Pour les I/O, utiliser le premier segment qui est souvent le nom du port
        displayName = nameParts[0];
      } else {
        // Prendre la dernière partie significative
        displayName = nameParts[nameParts.length - 1];
      }
    }
    
    // Limiter la longueur
    if (displayName.length > 10) {
      displayName = displayName.substring(0, 9) + '...';
    }
    
    // Position différente du texte pour les I/O
    if (module.type === 'IO_PORT') {
      const textY = module.isInput ? module.y + module.height/2 + 12 : module.y - module.height/2 - 12;
      ctx.fillText(displayName, module.x, textY);
    } else {
      ctx.fillText(displayName, module.x, module.y);
      // Ajouter le type en dessous (plus petit)
      ctx.font = '8px Arial';
      ctx.fillText(module.type, module.x, module.y + 12);
    }
  });
}

/**
 * Ajoute les étiquettes de délai sur les connexions
 */
function addDelayLabels() {
    connections.forEach(connection => {
        const source = connection.source;
        const target = connection.target;
        
        // Calculer le point central de la connexion
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        
        // Ajouter un décalage pour éviter que les étiquettes se chevauchent
        const offsetX = (target.y - source.y) * 0.1;
        const offsetY = (source.x - target.x) * 0.1;
        
        // Afficher le délai arrondi
        const delayValue = connection.delay;
        const displayDelay = delayValue >= 1000 
            ? (delayValue / 1000).toFixed(1) + ' ns' 
            : delayValue.toFixed(0) + ' ps';
        
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Fond blanc pour l'étiquette
        const textWidth = ctx.measureText(displayDelay).width;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(midX + offsetX - textWidth/2 - 2, midY + offsetY - 7, textWidth + 4, 14);
        
        // Texte du délai
        ctx.fillStyle = '#333';
        ctx.fillText(displayDelay, midX + offsetX, midY + offsetY);
    });
}

/**
 * Dessine un rectangle avec coins arrondis
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

// Ajouter un gestionnaire de redimensionnement de fenêtre
window.addEventListener('resize', function() {
    // Seulement si le canvas et les données sont initialisés
    if (canvas && fpgaData) {
        // Recalculer la taille et redessiner
        render();
    }
});

/**
 * Réinitialise l'animation et redimensionne le canvas
 */
function resetAnimationAndResize() {
    resetAnimation();
    calculateCanvasSize();
    
    // Mettre à jour la taille du canvas
    if (canvas) {
        canvas.width = boardWidth;
        canvas.height = boardHeight;
    }
    
    placeModules();
    createConnections();
    render();
}