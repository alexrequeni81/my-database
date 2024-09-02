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
            }
        })
        .catch(error => console.error('Error:', error));
}

// Función para manejar la búsqueda y cargar datos
function buscarRepuestos() {
    searchQuery = document.getElementById('searchInput').value.trim();
    cargarDatos(1, searchQuery);
}

// Filtrado en tiempo real en el cliente
function filtrarTabla() {
    const filter = document.getElementById('searchInput').value.toLowerCase().trim();
    const keywords = filter.split(/\s+/); // Dividir el input por espacios
    const rows = document.querySelectorAll('#partsTable tbody tr');

    rows.forEach(row => {
        const cells = Array.from(row.getElementsByTagName('td'));
        const match = keywords.every(keyword => 
            cells.some(cell => cell.textContent.toLowerCase().includes(keyword))
        );
        row.style.display = match ? '' : 'none';
    });
}

// Asignar eventos
document.getElementById('searchInput').addEventListener('input', filtrarTabla);
document.addEventListener('DOMContentLoaded', () => cargarDatos());

// Funciones adicionales como crearRepuesto, eliminarRepuesto, mostrarExito y mostrarError permanecen igual
