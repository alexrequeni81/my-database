document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();  // Cargar datos desde el backend al inicio
});

const buscador = document.getElementById("buscador");
const tabla = document.getElementById("partsTable");
const tablaBody = tabla.querySelector("tbody");
const limit = 10; // Límite de elementos por página, ajustable según necesidad

function cargarDatos(page = 1, search = '') {
    fetch(`/api/parts?page=${page}&limit=${limit}&search=${search}`)
        .then(response => response.json())
        .then(data => {
            tablaBody.innerHTML = '';  // Limpiar el cuerpo de la tabla

            if (data.parts.length === 0) {
                tablaBody.innerHTML = '<tr><td colspan="7">No se encontraron repuestos</td></tr>';
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
                    tablaBody.appendChild(row);
                });
                buscarRepuestos();  // Aplicar la búsqueda después de cargar los datos
            }
        })
        .catch(error => console.error('Error:', error));
}

buscador.addEventListener("input", () => buscarRepuestos());

function buscarRepuestos() {
    const filtro = buscador.value.toLowerCase().split(" ");
    const filas = tablaBody.querySelectorAll("tr");
    let resultados = 0;

    for (let i = 0; i < filas.length; i++) {
        const fila = filas[i];
        let mostrar = true;

        for (let j = 0; j < filtro.length; j++) {
            let coincide = false;

            for (let k = 0; k < fila.cells.length; k++) {
                const textoCelda = fila.cells[k].textContent.toLowerCase();
                if (textoCelda.includes(filtro[j])) {
                    coincide = true;
                    break;
                }
            }

            if (!coincide) {
                mostrar = false;
                break;
            }
        }

        if (mostrar) {
            fila.classList.remove("oculto");
            resultados++;
        } else {
            fila.classList.add("oculto");
        }
    }

    tabla.style.display = buscador.value.trim() === "" ? "none" : "";
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
        cargarDatos();  // Recargar la tabla para reflejar el nuevo repuesto
        document.getElementById('addPartForm').reset();
    })
    .catch(error => console.error('Error:', error));
}

function eliminarRepuesto(id) {
    if (confirm('¿Está seguro de que desea eliminar este repuesto?')) {
        fetch(`/api/parts/${id}`, { method: 'DELETE' })
            .then(() => cargarDatos())  // Recargar la tabla después de eliminar
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
