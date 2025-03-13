document.addEventListener('DOMContentLoaded', () => {
    // Select the drop zone element
    const dropZone = document.getElementById('drop-zone');
    
    // Create a hidden file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true; 
    fileInput.accept = '.v,.sdf'; 
    fileInput.style.display = 'none';

    // Append the file input to the drop zone
    dropZone.appendChild(fileInput);

    // Add event listener for dragover to highlight the drop zone
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    // Add event listener for dragleave to remove the highlight
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    // Add event listener for drop to handle file drop
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');

        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    // Add event listener for click to open the file input dialog
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // Add event listener for file input change to handle file selection
    fileInput.addEventListener('change', () => {
        const files = fileInput.files;
        handleFiles(files);
    });

    // Function to handle the selected or dropped files
    function handleFiles(files) {
        const formData = new FormData();

        // Append each valid file to the FormData object
        for (const file of files) {
            if (file.name.endsWith('.v') || file.name.endsWith('.sdf')) {
                formData.append('files', file);
            } else {
                alert('Only .v and .sdf files are allowed.');
                return;
            }
        }

        // Send the files to the server using fetch
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            alert('Files uploaded successfully.');
        })
        .catch(error => {
            console.error(error);
            alert('Error uploading files.');
        });
    }
});