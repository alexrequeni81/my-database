let currentPage = 1;
const limit = 10;
let searchQuery = '';

// Función para cargar datos desde el servidor
function cargarDatos(page = 1, search = '') {
    fetch(`/api/parts?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector('#partsTable tbody');
            tableBody.innerHTML = '';

            if (data.parts.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7">No se encontraron repuestos</td></tr>';
            } else {
                data.parts.forEach(part => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${part.REFERENCIA}</td>
                        <td>${part.DESCRIPCIÓN}</td>
                        <td>${part.MÁQUINA}</td>
                        <td>${part.GRUPO}</td>
                        <td>${part.COMENTARIO}</td>
                        <td>${part.CANTIDAD}</td>
                        <td><button onclick="eliminarRepuesto('${part._id}')">Eliminar</button></td>
                    `;
                    tableBody.appendChild(row);
                });
                // Aplicar filtrado en cliente después de cargar datos
                filtrarTabla();
            }
        })
        .catch(error => console.error('Error:', error));
}

// Filtrado en tiempo real en el cliente
function filtrarTabla() {
    let filter = document.getElementById('searchInput').value.toLowerCase();
    let words = filter.split(' ').filter(word => word.trim() !== ''); // Dividimos por espacios y eliminamos entradas vacías

    let rows = document.querySelectorAll('#partsTable tbody tr');

    rows.forEach(row => {
        // Concatenamos todo el contenido de las celdas en una sola cadena de texto
        let rowText = Array.from(row.querySelectorAll('td'))
                           .map(td => td.innerText.toLowerCase())
                           .join(' ');

        // Verificamos que cada palabra de la búsqueda esté presente en la cadena combinada
        let match = words.every(word => rowText.includes(word));
        
        row.style.display = match ? '' : 'none'; // Mostramos u ocultamos la fila dependiendo del resultado
    });
}

// Asignar eventos
document.getElementById('searchInput').addEventListener('input', filtrarTabla);
document.addEventListener('DOMContentLoaded', () => cargarDatos());
