document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = '.v,.sdf';
    fileInput.style.display = 'none';
    dropZone.appendChild(fileInput);

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        const files = fileInput.files;
        handleFiles(files);
    });

    async function handleFiles(files) {
        const formData = new FormData();
        for (const file of files) {
            if (file.name.endsWith('.v') || file.name.endsWith('.sdf')) {
                formData.append('files', file);
            } else {
                alert('Only .v and .sdf files are allowed.');
                return;
            }
        }

        try {
            const response = await fetch('/animation/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.message === 'Files uploaded and processed successfully') {
                createAnimation(data.data);
            } else {
                alert('Error processing files.');
            }
        } catch (error) {
            console.error(error);
            alert('Error uploading files.');
        }
    }

    function createAnimation(data) {
        console.log('Animation data:', data);

        const verilogContent = data.verilog;
        try {
            const designJson = parseVerilog(verilogContent);
            document.getElementById('jsonOutput').textContent = JSON.stringify(designJson, null, 2);
            visualizeCircuit(designJson);
        } catch (err) {
            document.getElementById('jsonOutput').textContent = "Error: " + err.message;
        }
    }

    function parseVerilog(verilog) {
        const moduleRegex = /module\s+(\w+)\s*\(([^)]*)\)\s*;/;
        const match = verilog.match(moduleRegex);
        if (!match) return null;

        const moduleName = match[1];
        const ports = match[2].split(',').map(p => p.trim());
        return { moduleName, ports, components: [] };
    }

    function visualizeCircuit(circuit) {
        const svg = d3.select('#circuit-diagram')
                      .append('svg')
                      .attr('width', 800)
                      .attr('height', 400);
        
        svg.selectAll('circle')
           .data(circuit.ports)
           .enter()
           .append('circle')
           .attr('cx', (d, i) => 100 + i * 50)
           .attr('cy', 200)
           .attr('r', 20)
           .style('fill', 'lightblue')
           .on('mouseover', function() {
               d3.select(this).style('fill', 'orange');
           })
           .on('mouseout', function() {
               d3.select(this).style('fill', 'lightblue');
           });
    }
});
