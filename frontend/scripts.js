document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search');
    const table = document.getElementById('data-table').getElementsByTagName('tbody')[0];
    const dataTable = document.getElementById('data-table');  // Refers to the entire table
    const addRowButton = document.getElementById('add-row');

    // Hide the table initially
    dataTable.style.display = 'none';

    // Fetch data from the server and populate the table
    fetch('/api/data')
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                let row = table.insertRow();
                row.insertCell(0).textContent = item.REFERENCIA || '';
                row.insertCell(1).textContent = item.DESCRIPCIÓN || '';
                row.insertCell(2).textContent = item.MÁQUINA || '';
                row.insertCell(3).textContent = item.GRUPO || '';
                row.insertCell(4).textContent = item.COMENTARIO || '';
                row.insertCell(5).textContent = item.CANTIDAD || '';
                row.insertCell(6).innerHTML = ''; // For action buttons
            });
        })
        .catch(error => console.error('Error fetching data:', error));

    // Search and filter functionality
    searchInput.addEventListener('input', function() {
        const filter = searchInput.value.toLowerCase().trim();
        const keywords = filter.split(/\s+/); // Split the input by spaces
        const rows = table.getElementsByTagName('tr');

        for (let i = 0; i < rows.length; i++) {
            let cells = rows[i].getElementsByTagName('td');
            let match = keywords.every(keyword => {
                return Array.from(cells).some(cell => cell.textContent.toLowerCase().includes(keyword));
            });

            rows[i].style.display = match ? '' : 'none';
        }

        // Toggle the table's visibility based on the filter
        dataTable.style.display = filter ? '' : 'none';
    });

    // Add new row functionality
    addRowButton.addEventListener('click', function() {
        const newRow = table.insertRow();
        for (let i = 0; i < 6; i++) { // Create 6 editable cells
            const newCell = newRow.insertCell(i);
            newCell.contentEditable = true;
        }

        // Add action buttons (validate and cancel)
        const actionCell = newRow.insertCell(6);
        actionCell.className = 'action-buttons';

        const validateButton = document.createElement('button');
        validateButton.textContent = '✔️';
        validateButton.className = 'validate';

        const cancelButton = document.createElement('button');
        cancelButton.textContent = '❌';
        cancelButton.className = 'cancel';

        actionCell.appendChild(validateButton);
        actionCell.appendChild(cancelButton);

        // Event to validate the new row
        validateButton.addEventListener('click', function() {
            const newData = {
                REFERENCIA: newRow.cells[0].textContent.trim(),
                DESCRIPCIÓN: newRow.cells[1].textContent.trim(),
                MÁQUINA: newRow.cells[2].textContent.trim(),
                GRUPO: newRow.cells[3].textContent.trim(),
                COMENTARIO: newRow.cells[4].textContent.trim(),
                CANTIDAD: newRow.cells[5].textContent.trim()
            };

            fetch('/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newData)
            })
            .then(response => response.json())
            .then(result => {
                console.log('Registro guardado:', result);
                // Remover los botones después de guardar
                actionCell.innerHTML = '';
            })
            .catch(error => console.error('Error al guardar el registro:', error));
        });

        // Event to cancel the new row
        cancelButton.addEventListener('click', function() {
            table.deleteRow(newRow.rowIndex);
        });
    });
});
