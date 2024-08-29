document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search');
    const table = document.getElementById('data-table').getElementsByTagName('tbody')[0];

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
            });
        })
        .catch(error => console.error('Error fetching data:', error));

    // Search and filter functionality
    searchInput.addEventListener('input', function() {
        const filter = searchInput.value.toLowerCase();
        const rows = table.getElementsByTagName('tr');

        for (let i = 0; i < rows.length; i++) {
            let cells = rows[i].getElementsByTagName('td');
            let match = false;

            for (let j = 0; j < cells.length; j++) {
                if (cells[j]) {
                    if (cells[j].textContent.toLowerCase().indexOf(filter) > -1) {
                        match = true;
                        break;
                    }
                }
            }
            rows[i].style.display = match ? '' : 'none';
        }

        // Hide table if no input
        if (!filter) {
            table.style.display = 'none';
        } else {
            table.style.display = '';
        }
    });
});
