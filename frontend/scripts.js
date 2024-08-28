let currentPage = 1;
const limit = 10;
let searchQuery = '';

function cargarDatos(page = 1, search = '') {
    fetch(`/api/parts?page=${page}&limit=${limit}&search=${search}`)
        .then(response => response.json())
        .then(data => {
            mostrarDatos(data.parts);
        })
        .catch(error => console.error('Error al cargar los repuestos:', error));
}

function buscarRepuestos() {
    const textoBusqueda = document.getElementById('searchInput').value.trim().toLowerCase();
    const palabrasClave = textoBusqueda.split(/\s+/);  // Divide el texto en palabras clave separadas por espacios.

    fetch('/api/parts')  // Cargamos todos los datos de la API.
        .then(response => response.json())
        .then(data => {
            const datosFiltrados = data.parts.filter(part => {
                const textoCompleto = [
                    part.REFERENCIA || '',   // Aseguramos que la propiedad no sea null/undefined
                    part.DESCRIPCIÓN || '',
                    part.MÁQUINA || '',
                    part.GRUPO || '',
                    part.COMENTARIO || '',
                    (part.CANTIDAD || '').toString()  // Convertimos CANTIDAD a cadena de forma segura
                ].join(" ").toLowerCase();

                return palabrasClave.every(palabra => textoCompleto.includes(palabra));
            });

            mostrarDatos(datosFiltrados);  // Muestra los datos filtrados en la tabla.
        })
        .catch(error => console.error('Error al buscar repuestos:', error));
}

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
    .catch(error => console.error('Error al crear el repuesto:', error));
}

function eliminarRepuesto(id) {
    if (confirm('¿Está seguro de que desea eliminar este repuesto?')) {
        fetch(`/api/parts/${id}`, { method: 'DELETE' })
            .then(() => cargarDatos(currentPage))
            .catch(error => console.error('Error al eliminar el repuesto:', error));
    }
}

function mostrarDatos(parts) {
    const tableBody = document.querySelector('#partsTable tbody');
    tableBody.innerHTML = '';  // Limpiamos la tabla antes de insertar nuevos datos.

    if (parts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7">No se encontraron repuestos</td></tr>';
    } else {
        parts.forEach(part => {
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
