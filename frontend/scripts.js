let currentPage = 1;
const limit = 10;
let searchQuery = '';
let isEditing = false;
let editingId = null;

function cargarDatos(page = 1, search = '') {
    fetch(`/api/parts?page=${page}&limit=${limit}&search=${search}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector('#partsTable tbody');
            tableBody.innerHTML = '';

            if (data.parts.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7">No se encontraron repuestos</td></tr>';
            } else {
                const isMobile = window.innerWidth <= 768;
                data.parts.forEach(part => {
                    const row = document.createElement('tr');
                    row.setAttribute('data-id', part._id);
                    row.innerHTML = `
                        <td data-label="REFERENCIA">${part.REFERENCIA || ''}${isMobile ? '<button class="expand-button">+</button>' : ''}</td>
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
            if (window.innerWidth <= 768) {
                addExpandButtonListeners();
            }
        })
        .catch(error => console.error('Error:', error));
}

function addExpandButtonListeners() {
    if (window.innerWidth <= 768) {
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
            });
        });
    }
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
                } else {
                    mostrarError('Error al resetear los repuestos');
                }
            })
            .catch(error => mostrarError('Error en la solicitud para resetear todos los repuestos.'));
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
    // Otras inicializaciones si las hay
});
