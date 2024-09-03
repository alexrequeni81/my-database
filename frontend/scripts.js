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
                filtrarTabla();
            }
        })
        .catch(error => console.error('Error:', error));
}

// Filtrado en tiempo real en el cliente
function filtrarTabla() {
    let filter = document.getElementById('searchInput').value.toLowerCase();
    let words = filter.split(' ').filter(word => word.trim() !== '');

    let rows = document.querySelectorAll('#partsTable tbody tr');

    rows.forEach(row => {
        let rowText = Array.from(row.querySelectorAll('td'))
                           .map(td => td.innerText.toLowerCase())
                           .join(' ');

        let match = words.every(word => rowText.includes(word));
        
        row.style.display = match ? '' : 'none';
    });
}

// Asignar eventos
document.getElementById('searchInput').addEventListener('input', filtrarTabla);
document.addEventListener('DOMContentLoaded', () => cargarDatos());

// Función para crear un nuevo repuesto
function crearRepuesto() {
    const referencia = document.getElementById('addReferencia').value;
    const descripcion = document.getElementById('addDescripcion').value;
    const maquina = document.getElementById('addMaquina').value;
    const grupo = document.getElementById('addGrupo').value;
    const comentario = document.getElementById('addComentario').value;
    const cantidad = document.getElementById('addCantidad').value;

    fetch('/api/parts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            referencia, 
            descripcion, 
            maquina, 
            grupo, 
            comentario, 
            cantidad 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            mostrarMensaje('error', data.error);
        } else {
            mostrarMensaje('success', 'Repuesto añadido con éxito');
            cargarDatos(currentPage, searchQuery); // Recargar la tabla después de añadir
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensaje('error', 'Error al añadir el repuesto');
    });
}

// Función para eliminar un repuesto
function eliminarRepuesto(id) {
    fetch(`/api/parts/${id}`, {
        method: 'DELETE'
    })
    .then(() => {
        cargarDatos(currentPage, searchQuery); // Recargar la tabla después de eliminar
    })
    .catch(error => console.error('Error:', error));
}

// Función para mostrar mensajes de error o éxito
function mostrarMensaje(tipo, mensaje) {
    const mensajeDiv = document.getElementById(tipo);
    mensajeDiv.textContent = mensaje;
    mensajeDiv.style.display = 'block';
    setTimeout(() => {
        mensajeDiv.style.display = 'none';
    }, 3000);
}
