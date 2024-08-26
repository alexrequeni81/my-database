let currentPage = 1;
const limit = 10;
let searchQuery = '';

function cargarDatos(page = 1, search = '') {
    fetch(`/api/parts?page=${page}&limit=${limit}&search=${search}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta de la API: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            const tableBody = document.querySelector('#partsTable tbody');
            tableBody.innerHTML = '';

            if (data.parts.length === 0) {
                document.getElementById('error').innerText = 'No se encontraron repuestos en la base de datos.';
            } else {
                data.parts.forEach(part => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td data-label="REFERENCIA">${part.REFERENCIA}</td>
                        <td data-label="DESCRIPCIÓN">${part.DESCRIPCIÓN}</td>
                        <td data-label="MÁQUINA">${part.MÁQUINA}</td>
                        <td data-label="GRUPO">${part.GRUPO}</td>
                        <td data-label="COMENTARIO">${part.COMENTARIO}</td>
                        <td data-label="CANTIDAD">${part.CANTIDAD}</td>
                        <td>
                            <button onclick="editarRepuesto('${part._id}')" class="btn btn-warning">Editar</button>
                            <button onclick="eliminarRepuesto('${part._id}')" class="btn btn-danger">Eliminar</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            }

            document.getElementById('pageInfo').innerText = `Página ${data.page} de ${data.pages}`;
            document.getElementById('prevPage').disabled = data.page === 1;
            document.getElementById('nextPage').disabled = data.page === data.pages;
            currentPage = data.page;
        })
        .catch(error => {
            console.error('Error al cargar los repuestos:', error);
            document.getElementById('error').innerText = 'Error al cargar los repuestos: ' + error.message;
        });
}

function cambiarPagina(direccion) {
    const nuevaPagina = currentPage + direccion;
    cargarDatos(nuevaPagina, searchQuery);
}

function buscarRepuestos() {
    searchQuery = document.getElementById('searchInput').value;
    cargarDatos(1, searchQuery);
}

function crearRepuesto() {
    const referencia = document.getElementById('addReferencia').value;
    const descripcion = document.getElementById('addDescripcion').value;
    const maquina = document.getElementById('addMaquina').value;
    const grupo = document.getElementById('addGrupo').value;
    const comentario = document.getElementById('addComentario').value;
    const cantidad = parseInt(document.getElementById('addCantidad').value, 10);

    fetch('/api/parts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ referencia, descripcion, maquina, grupo, comentario, cantidad })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la creación del repuesto');
        }
        return response.json();
    })
    .then(() => {
        cargarDatos(currentPage);
        document.getElementById('addPartForm').reset();
    })
    .catch(error => {
        console.error('Error al crear el repuesto:', error);
        document.getElementById('error').innerText = 'Error al crear el repuesto: ' + error.message;
    });
}

function editarRepuesto(id) {
    const referencia = prompt('Ingrese nueva referencia:');
    const descripcion = prompt('Ingrese nueva descripción:');
    const maquina = prompt('Ingrese nueva máquina:');
    const grupo = prompt('Ingrese nuevo grupo:');
    const comentario = prompt('Ingrese nuevo comentario:');
    const cantidad = prompt('Ingrese nueva cantidad:');

    fetch(`/api/parts/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ referencia, descripcion, maquina, grupo, comentario, cantidad: parseInt(cantidad, 10) })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al actualizar el repuesto');
        }
        cargarDatos(currentPage);
    })
    .catch(error => {
        console.error('Error al actualizar el repuesto:', error);
        document.getElementById('error').innerText = 'Error al actualizar el repuesto: ' + error.message;
    });
}

function eliminarRepuesto(id) {
    if (confirm('¿Está seguro de que desea eliminar este repuesto?')) {
        fetch(`/api/parts/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al eliminar el repuesto');
            }
            cargarDatos(currentPage);
        })
        .catch(error => {
            console.error('Error al eliminar el repuesto:', error);
            document.getElementById('error').innerText = 'Error al eliminar el repuesto: ' + error.message;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
});
