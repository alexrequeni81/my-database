let currentPage = 1;
const limit = 10;
let searchQuery = '';
let isEditing = false;
let editingId = null;

// Función para cargar los datos desde la API y mostrarlos en la tabla
function cargarDatos(page = 1, search = '') {
    fetch(`/api/parts?page=${page}&limit=${limit}&search=${search}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector('#partsTable tbody');
            tableBody.innerHTML = ''; // Limpiar la tabla

            if (data.parts.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6">No se encontraron repuestos</td></tr>';
            } else {
                data.parts.forEach(part => {
                    const row = document.createElement('tr');
                    row.setAttribute('data-id', part._id);
                    row.innerHTML = `
                        <td data-label="REFERENCIA">${part.REFERENCIA || ''}</td>
                        <td data-label="DESCRIPCIÓN" class="hidden">${part.DESCRIPCIÓN || ''}</td>
                        <td data-label="MÁQUINA" class="hidden">${part.MÁQUINA || ''}</td>
                        <td data-label="GRUPO" class="hidden">${part.GRUPO || ''}</td>
                        <td data-label="COMENTARIO" class="hidden">${part.COMENTARIO || ''}</td>
                        <td data-label="CANTIDAD" class="hidden">${part.CANTIDAD !== undefined && part.CANTIDAD !== null ? part.CANTIDAD : ''}</td>
                    `;

                    // Crear el botón de expansión para la fila
                    const expandButton = document.createElement('button');
                    expandButton.textContent = '+';
                    expandButton.classList.add('expand-button');
                    expandButton.onclick = () => expandirFila(row);
                    row.appendChild(expandButton);

                    tableBody.appendChild(row);
                });
            }

            // Habilitar/deshabilitar los botones de paginación según la página actual
            document.getElementById('prevButton').disabled = page === 1;
            document.getElementById('nextButton').disabled = page === Math.ceil(data.total / limit);
            document.getElementById('currentPage').textContent = page;
        })
        .catch(error => console.error('Error:', error));
}

// Función para realizar la búsqueda
function buscarRepuestos() {
    searchQuery = document.getElementById('searchInput').value.trim();
    cargarDatos(1, searchQuery); // Reiniciar a la página 1 cuando se realiza una búsqueda
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

    // Validar que todos los campos estén completos
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
    const url = isEditing ? `/api/parts/${editingId}` : '/api/parts';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partData)
    })
    .then(response => {
        if (!response.ok) throw new Error('Error en la solicitud');
        const message = isEditing ? 'Repuesto editado correctamente' : 'Repuesto añadido correctamente';
        mostrarExito(message);
        cargarDatos(currentPage); // Volver a cargar los datos después de añadir/editar
        cancelarEdicion(); // Restablecer el formulario
    })
    .catch(error => mostrarError(`Error al ${isEditing ? 'editar' : 'guardar'} el repuesto.`));
}

// Función para expandir una fila y mostrar columnas ocultas
function expandirFila(row) {
    const hiddenCols = row.querySelectorAll('td.hidden');
    if (hiddenCols.length > 0) {
        hiddenCols[0].classList.remove('hidden');
    } else {
        alert('No hay más columnas que mostrar.');
    }
}

// Función para habilitar la edición de un repuesto
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
    document.getElementById('addButton').textContent = 'Actualizar';
    document.getElementById('cancelButton').style.display = 'inline-block';
}

// Función para cancelar la edición y restablecer el formulario
function cancelarEdicion() {
    isEditing = false;
    editingId = null;
    document.getElementById('addPartForm').reset();
    document.getElementById('addButton').textContent = 'Añadir';
    document.getElementById('cancelButton').style.display = 'none';
}

// Función para mostrar un mensaje de error
function mostrarError(mensaje) {
    const errorDiv = document.getElementById('error');
    errorDiv.innerText = mensaje;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 5000);
}

// Función para mostrar un mensaje de éxito
function mostrarExito(mensaje) {
    const successDiv = document.getElementById('success');
    successDiv.innerText = mensaje;
    successDiv.style.display = 'block';
    setTimeout(() => successDiv.style.display = 'none', 3000);
}

// Funciones de paginación
function loadNextPage() {
    currentPage++;
    cargarDatos(currentPage, searchQuery);
}

function loadPreviousPage() {
    if (currentPage > 1) {
        currentPage--;
        cargarDatos(currentPage, searchQuery);
    }
}

// Cargar datos al cargar el documento
document.addEventListener('DOMContentLoaded', () => cargarDatos());
