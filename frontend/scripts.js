let currentPage = 1;
const limit = 10;
let searchQuery = '';

function cargarDatos(page = 1, search = '') {
    fetch(`/api/parts?page=${page}&limit=${limit}&search=${search}`)
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

function buscarRepuestos() {
    // Obtener el valor del campo de búsqueda
    const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
    
    // Dividir la consulta en palabras clave
    const searchTerms = searchQuery.split(/\s+/);

    // Seleccionar todas las filas de la tabla
    const rows = document.querySelectorAll('#partsTable tbody tr');

    // Iterar sobre las filas
    rows.forEach(row => {
        // Obtener el texto de todas las celdas de la fila y concatenarlo
        const rowText = Array.from(row.cells).map(cell => cell.textContent.toLowerCase()).join(' ');

        // Verificar si todas las palabras clave están en el texto de la fila
        const matches = searchTerms.every(term => rowText.includes(term));

        // Mostrar u ocultar la fila según la coincidencia
        row.style.display = matches ? '' : 'none';
    });
}

// Cargar los datos y aplicar la búsqueda al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    buscarRepuestos();  // Para asegurar que la búsqueda funcione inmediatamente
});


function crearRepuesto() {
    const referencia = document.getElementById('addReferencia').value.trim();
    const descripcion = document.getElementById('addDescripcion').value.trim();
    const maquina = document.getElementById('addMaquina').value.trim();
    const grupo = document.getElementById('addGrupo').value.trim();
    const comentario = document.getElementById('addComentario').value.trim();
    const cantidad = parseInt(document.getElementById('addCantidad').value.trim(), 10);

    if (!referencia || !descripcion || !maquina || !grupo || !comentario || isNaN(cantidad)) {
        mostrarError('Todos los campos son obligatorios');
        return;
    }

    fetch('/api/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia, descripcion, maquina, grupo, comentario, cantidad })
    })
    .then(() => {
        mostrarExito('Repuesto añadido correctamente');
        cargarDatos(currentPage);
        document.getElementById('addPartForm').reset();
    })
    .catch(error => console.error('Error:', error));
}

function eliminarRepuesto(id) {
    if (confirm('¿Está seguro de que desea eliminar este repuesto?')) {
        fetch(`/api/parts/${id}`, { method: 'DELETE' })
            .then(() => cargarDatos(currentPage))
            .catch(error => console.error('Error:', error));
    }
}

function mostrarExito(mensaje) {
    const successDiv = document.getElementById('success');
    successDiv.innerText = mensaje;
    successDiv.style.display = 'block';
    setTimeout(() => successDiv.style.display = 'none', 3000);
}

function mostrarError(mensaje) {
    const errorDiv = document.getElementById('error');
    errorDiv.innerText = mensaje;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 5000);
}

document.addEventListener('DOMContentLoaded', () => cargarDatos());
