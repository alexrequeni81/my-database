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
    let filter = document.getElementById('searchInput').value.toLowerCase().trim();
    let words = filter.split(' ').filter(word => word.trim() !== ''); // Dividimos por espacios y eliminamos entradas vacías

    let rows = document.querySelectorAll('#partsTable tbody tr');

    rows.forEach(row => {
        let rowText = ''; // Inicializamos el texto concatenado
        let cells = row.querySelectorAll('td'); // Seleccionamos todas las celdas de la fila

        cells.forEach(cell => {
            rowText += cell.innerText.toLowerCase(); // Concatenamos el texto de todas las celdas
        });

        // Ahora revisamos si la secuencia de palabras aparece en el texto concatenado
        let match = true;
        let currentIndex = 0;

        for (let word of words) {
            currentIndex = rowText.indexOf(word, currentIndex);
            if (currentIndex === -1) {
                match = false;
                break;
            }
            currentIndex += word.length; // Avanzamos en el índice
        }

        row.style.display = match ? '' : 'none';
    });
}

// Asignar eventos
document.getElementById('searchInput').addEventListener('input', filtrarTabla);
document.addEventListener('DOMContentLoaded', () => cargarDatos());

// Funciones adicionales como crearRepuesto, eliminarRepuesto, mostrarExito y mostrarError permanecen igual
