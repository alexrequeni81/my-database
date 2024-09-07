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

            // Update pagination buttons based on data.pages
            const prevButton = document.getElementById('prevButton');
            const nextButton = document.getElementById('nextButton');
            const currentPageSpan = document.getElementById('currentPage');

            currentPageSpan.textContent = page;

            if (page === 1) {
                prevButton.disabled = true;
            } else {
                prevButton.disabled = false;
            }

            if (page === data.pages) {
                nextButton.disabled = true;
            } else {
                nextButton.disabled = false;
            }
        })
        .catch(error => console.error('Error:', error));
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
        cargarDatos(currentPage); // Reload current page
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
                cargarDatos(currentPage); // Reload current page
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
                    cargarDatos(1); // Reload page 1
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

document.addEventListener('DOMContentLoaded', () => cargarDatos());

// Código Javascript para la funcionalidad de la tabla acordeón
const tableRows = document.querySelectorAll('#partsTable tbody tr');

tableRows.forEach(row => {
  // Agrega un botón "+" al final de cada fila
  const expandButton = document.createElement('button');
  expandButton.textContent = '+';
  expandButton.classList.add('expand-button');
  row.appendChild(expandButton);

  expandButton.addEventListener('click', () => {
    // Encuentra las celdas de la fila actual
    const cells = row.querySelectorAll('td');

    // Despliega las celdas ocultas
    cells.forEach((cell, index) => {
      if (index > 0) { // Excluye la primera columna
        cell.classList.remove('hidden');
        cell.classList.add('show');
      }
    });

    // Cambia el texto del botón a "-"
    expandButton.textContent = '-';
    expandButton.removeEventListener('click', this); // Evita que se agregue un nuevo listener
    expandButton.addEventListener('click', () => {
      // Ocultar las celdas
      cells.forEach((cell, index) => {
        if (index > 0) { // Excluye la primera columna
          cell.classList.remove('show');
          cell.classList.add('hidden');
        }
      });

      // Cambia el texto del botón a "+"
      expandButton.textContent = '+';
      expandButton.removeEventListener('click', this); // Evita que se agregue un nuevo listener
      expandButton.addEventListener('click', () => {
        // Despliega las celdas ocultas
        cells.forEach((cell, index) => {
          if (index > 0) { // Excluye la primera columna
            cell.classList.remove('hidden');
            cell.classList.add('show');
          }
        });

        // Cambia el texto del botón a "-"
        expandButton.textContent = '-';
        expandButton.removeEventListener('click', this); // Evita que se agregue un nuevo listener
        expandButton.addEventListener('click', () => {
          // Ocultar las celdas
          cells.forEach((cell, index) => {
            if (index > 0) { // Excluye la primera columna
              cell.classList.remove('show');
              cell.classList.add('hidden');
            }
          });

          // Cambia el texto del botón a "+"
          expandButton.textContent = '+';
        });
      });
    });
  });
});
