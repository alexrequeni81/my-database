// Variables globales para manejar la paginación y el estado de edición
let currentPage = 1;
const limit = 10;
let searchQuery = '';
let isEditing = false;
let editingId = null;

// Iniciamos la conexión con Socket.IO para gestionar los usuarios conectados en tiempo real
const socket = io();

// Escuchar la actualización de usuarios conectados en tiempo real
socket.on('updateUserCount', (count) => {
    document.getElementById('userCount').textContent = `Online: ${count} usuarios`;
});

// Función para obtener el total de registros en la base de datos
function obtenerTotalRegistros() {
    fetch('/api/countParts')
        .then(response => response.json())
        .then(data => {
            document.getElementById('dbCount').textContent = `Base de datos: ${data.totalParts} referencias`;
        })
        .catch(error => console.error('Error al obtener la cantidad de registros:', error));
}

// Llamar a esta función cuando la página cargue para inicializar datos y mostrar estadísticas
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();  // Cargar los datos de la primera página
    obtenerTotalRegistros();  // Obtener el número total de registros
});

// Función para cargar los repuestos con paginación y búsqueda
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
                    row.setAttribute('data-id', part._id);
                    row.innerHTML = `
                        <td>${part.REFERENCIA || ''}</td>
                        <td>${part.DESCRIPCIÓN || ''}</td>
                        <td>${part.MÁQUINA || ''}</td>
                        <td>${part.GRUPO || ''}</td>
                        <td>${part.COMENTARIO || ''}</td>
                        <td>${part.CANTIDAD !== undefined && part.CANTIDAD !== null ? part.CANTIDAD : ''}</td>
                        <td class="action-buttons">
                            <button class="edit-button" onclick="editarRepuesto('${part._id}')">✏️</button>
                            <button class="delete-button" onclick="eliminarRepuesto('${part._id}')">🗑️</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            }

            // Actualizar la información de la página y habilitar/deshabilitar los botones de navegación
            document.getElementById('pageInfo').textContent = `Página ${page} de ${data.pages}`;
            document.getElementById('prevPage').disabled = page === 1;
            document.getElementById('nextPage').disabled = page === data.pages;
        })
        .catch(error => console.error('Error:', error));
}

// Función para cambiar de página (anterior o siguiente)
function cambiarPagina(delta) {
    currentPage += delta;
    cargarDatos(currentPage, searchQuery);  // Cargar la nueva página
}

// Función para realizar la búsqueda de repuestos
function buscarRepuestos() {
    searchQuery = document.getElementById('searchInput').value.trim();
    cargarDatos(1, searchQuery);  // Reiniciamos a la primera página cuando se hace una búsqueda
}

// Función para crear o editar un repuesto
function crearRepuesto() {
    const referencia = document.getElementById('addReferencia').value.trim();
    const descripcion = document.getElementById('addDescripcion').value.trim();
    const maquina = document.getElementById('addMaquina').value.trim();
    const grupo = document.getElementById('addGrupo').value.trim();
    const comentario = document.getElementById('addComentario').value.trim();
    const cantidadValue = document.getElementById('addCantidad').value.trim();
    const cantidad = cantidadValue !== '' ? parseInt(cantidadValue, 10) : undefined;

    if (!referencia || !descripcion || !maquina || !grupo || !comentario || isNaN(cantidad)) {
        mostrarError('Todos los campos son obligatorios y la cantidad debe ser un número.');
        return;
    }

    const partData = {
        referencia,
        descripcion,
        maquina,
        grupo,
        comentario,
        cantidad: cantidad !== undefined ? cantidad : null
    };

    const method = isEditing ? 'PUT' : 'POST';

    if (isEditing && !editingId) {
        mostrarError('No se puede editar el registro porque falta el ID.');
        return;
    }

    const url = isEditing ? `/api/parts/${editingId}` : '/api/parts';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la solicitud');
        }
        const message = isEditing ? 'Repuesto editado correctamente' : 'Repuesto añadido correctamente';
        mostrarExito(message);
        cargarDatos(currentPage);  // Recargar la tabla con los nuevos datos
        cancelarEdicion();
    })
    .catch(error => mostrarError(`Error al ${isEditing ? 'editar' : 'guardar'} el repuesto.`));
}

// Función para editar un repuesto (rellenar el formulario con los datos del repuesto)
function editarRepuesto(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    const cells = row.querySelectorAll('td');

    document.getElementById('addReferencia').value = cells[0].textContent;
    document.getElementById('addDescripcion').value = cells[1].textContent;
    document.getElementById('addMaquina').value = cells[2].textContent;
    document.getElementById('addGrupo').value = cells[3].textContent;
    document.getElementById('addComentario').value = cells[4].textContent;
    const cantidad = cells[5].textContent;
    document.getElementById('addCantidad').value = cantidad !== '' ? parseInt(cantidad, 10) : '';

    isEditing = true;
    editingId = id;
    document.getElementById('addButton').textContent = 'Guardar';
    document.getElementById('cancelButton').style.display = 'inline-block';
}

// Función para cancelar la edición actual y resetear el formulario
function cancelarEdicion() {
    isEditing = false;
    editingId = null;
    document.getElementById('addPartForm').reset();
    document.getElementById('addButton').textContent = 'Añadir';  // Volver a mostrar el botón como "Añadir"
    document.getElementById('cancelButton').style.display = 'none';
}

// Función para eliminar un repuesto
function eliminarRepuesto(id) {
    if (confirm('¿Está seguro de que desea eliminar este repuesto?')) {
        fetch(`/api/parts/${id}`, { method: 'DELETE' })
            .then(() => {
                mostrarExito('Repuesto eliminado correctamente');
                cargarDatos(currentPage);  // Recargar la página actual después de eliminar el repuesto
            })
            .catch(error => mostrarError('Error al eliminar el repuesto.'));
    }
}

// Función para resetear todos los repuestos
function resetearTodos() {
    if (confirm('¿Está seguro de que desea resetear todos los repuestos?')) {
        fetch(`/api/resetAllParts`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    mostrarExito('Todos los repuestos reseteados correctamente');
                    cargarDatos(1);  // Recargar la tabla desde la primera página después de resetear
                } else {
                    mostrarError('Error al resetear los repuestos');
                }
            })
            .catch(error => mostrarError('Error en la solicitud para resetear todos los repuestos.'));
    }
}

// Función para mostrar mensajes de éxito
function mostrarExito(mensaje) {
    const successDiv = document.getElementById('success');
    successDiv.innerText = mensaje;
    successDiv.style.display = 'block';
    setTimeout(() => successDiv.style.display = 'none', 3000);
}

// Función para mostrar mensajes de error
function mostrarError(mensaje) {
    const errorDiv = document.getElementById('error');
    errorDiv.innerText = mensaje;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 5000);
}
