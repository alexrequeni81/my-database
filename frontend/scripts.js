let currentPage = 1;
let totalPages = 1;
const limit = 10;
let searchQuery = '';
let isEditing = false;
let editingId = null;

const socket = io();

socket.on('userCount', (count) => {
    document.getElementById('userCount').textContent = count;
});

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
                        <td data-label="REFERENCIA">
                            ${part.REFERENCIA || ''}
                            <button class="expand-button">+</button>
                        </td>
                        <td data-label="DESCRIPCIÓN">${part.DESCRIPCIÓN || ''}</td>
                        <td data-label="MÁQUINA">${part.MÁQUINA || ''}</td>
                        <td data-label="GRUPO">${part.GRUPO || ''}</td>
                        <td data-label="COMENTARIO">${part.COMENTARIO || ''}</td>
                        <td data-label="CANTIDAD">${part.CANTIDAD !== undefined && part.CANTIDAD !== null ? part.CANTIDAD : ''}</td>
                        <td class="action-buttons">
                            <button class="edit-button" onclick="editarRepuesto('${part._id}')">✏️</button>
                            <button class="delete-button" onclick="eliminarRepuesto('${part._id}')">🗑️</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            }

            // Actualizar la paginación
            currentPage = data.page;
            totalPages = data.pages;
            document.getElementById('currentPage').textContent = currentPage;
            document.getElementById('prevButton').disabled = currentPage === 1;
            document.getElementById('nextButton').disabled = currentPage === totalPages;

            if (window.innerWidth <= 768) {
                addExpandButtonListeners();
            }
        })
        .catch(error => console.error('Error al cargar los datos:', error));
}

function addExpandButtonListeners() {
    const expandButtons = document.querySelectorAll('.expand-button');
    expandButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const row = this.closest('tr');
            const cells = row.querySelectorAll('td:not(:first-child):not(:last-child)');
            cells.forEach(cell => {
                cell.style.display = cell.style.display === 'block' ? 'none' : 'block';
            });
            this.textContent = this.textContent === '+' ? '-' : '+';
            this.classList.toggle('expanded');
        });
    });
}

function buscarRepuestos() {
    searchQuery = document.getElementById('searchInput').value.trim();
    cargarDatos(1, searchQuery);
}

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
        cargarDatos(currentPage);
        cancelarEdicion();
    })
    .then(() => {
        actualizarConteoTotal();
    })
    .catch(error => mostrarError(`Error al ${isEditing ? 'editar' : 'guardar'} el repuesto.`));
}

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
    editingId = id; // **Asegúrate de que esta línea se ejecuta y que `id` no es undefined**
    console.log(`ID del registro a editar: ${editingId}`); // Log para verificar que la ID se asigna correctamente
    document.getElementById('addButton').textContent = 'Añadir';
    document.getElementById('cancelButton').style.display = 'inline-block';
}

function cancelarEdicion() {
    isEditing = false;
    editingId = null;
    document.getElementById('addPartForm').reset();
    document.getElementById('addButton').textContent = 'Añadir'; // Mantiene "Añadir"
    document.getElementById('cancelButton').style.display = 'none';
}

function eliminarRepuesto(id) {
    if (confirm('¿Está seguro de que desea eliminar este repuesto?')) {
        fetch(`/api/parts/${id}`, { method: 'DELETE' })
            .then(() => {
                mostrarExito('Repuesto eliminado correctamente');
                cargarDatos(currentPage);
                actualizarConteoTotal();
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
                    cargarDatos(1);
                    actualizarConteoTotal();
                } else {
                    mostrarError('Error al resetear los repuestos');
                }
            })
            .catch(error => mostrarError('Error en la solicitud para resetear todos los repuestos.'));
    }
}

function descargarDatos() {
    fetch('/api/download')
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'repuestos.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => console.error('Error al descargar los datos:', error));
}

function cargarArchivoExcel(file) {
    if (!file) {
        mostrarError('No se ha seleccionado ningún archivo.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text) });
        }
        return response.text();
    })
    .then(result => {
        console.log(result);
        mostrarExito('Datos cargados exitosamente');
        cargarDatos(1); // Recargar la primera página de datos
        actualizarConteoTotal();
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarError('Error al cargar los datos: ' + error.message);
    });
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

function loadNextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        cargarDatos(currentPage, searchQuery);
    }
}

function loadPreviousPage() {
    if (currentPage > 1) {
        currentPage--;
        cargarDatos(currentPage, searchQuery);
    }
}

window.addEventListener('resize', function() {
    if (window.innerWidth <= 768) {
        addExpandButtonListeners();
    } else {
        // Restablecer la visualización de la tabla para escritorio
        const rows = document.querySelectorAll('#partsTable tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                cell.style.display = '';
            });
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    actualizarConteoTotal();
    verificarEstadoServidor();
});

function verificarEstadoServidor() {
    fetch('/api/status')
        .then(response => response.json())
        .then(data => {
            if (data.serverStatus === 'OK' && data.dbStatus === 'OK') {
                document.getElementById('serverStatus').textContent = '🟢';
            } else if (data.serverStatus === 'OK' && data.dbStatus === 'ERROR') {
                document.getElementById('serverStatus').textContent = '🟡';
            } else {
                document.getElementById('serverStatus').textContent = '🔴';
            }
        })
        .catch(() => {
            document.getElementById('serverStatus').textContent = '🔴';
        });
}

// Llamar a la función cada 30 segundos
setInterval(verificarEstadoServidor, 30000);

function actualizarConteoTotal() {
    fetch('/api/totalRecords')
        .then(response => response.json())
        .then(data => {
            document.getElementById('totalRecords').textContent = data.total;
        })
        .catch(error => console.error('Error al obtener el total de registros:', error));
}
