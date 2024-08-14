document.addEventListener('DOMContentLoaded', () => {
    let db;

    // Abre la base de datos
    const request = indexedDB.open('MiBaseDeDatos', 1);

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        const objectStore = db.createObjectStore('records', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('referencia', 'referencia', { unique: false });
        objectStore.createIndex('descripcion', 'descripcion', { unique: false });
        objectStore.createIndex('maquina', 'maquina', { unique: false });
        objectStore.createIndex('grupo', 'grupo', { unique: false });
        objectStore.createIndex('comentario', 'comentario', { unique: false });
        objectStore.createIndex('cantidad', 'cantidad', { unique: false });
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        displayData();
    };

    request.onerror = (event) => {
        console.error('Error al abrir la base de datos', event);
    };

    // Maneja el envío del formulario
    document.getElementById('dataForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const referencia = document.getElementById('referencia').value;
        const descripcion = document.getElementById('descripcion').value;
        const maquina = document.getElementById('maquina').value;
        const grupo = document.getElementById('grupo').value;
        const comentario = document.getElementById('comentario').value;
        const cantidad = document.getElementById('cantidad').value;
        const recordId = document.getElementById('recordId').value;

        if (recordId) {
            // Actualiza el registro existente
            updateRecord(parseInt(recordId), referencia, descripcion, maquina, grupo, comentario, cantidad);
        } else {
            // Agrega un nuevo registro
            addRecord(referencia, descripcion, maquina, grupo, comentario, cantidad);
        }
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
        clearForm();
    });

    function addRecord(referencia, descripcion, maquina, grupo, comentario, cantidad) {
        const transaction = db.transaction(['records'], 'readwrite');
        const objectStore = transaction.objectStore('records');
        const request = objectStore.add({ referencia, descripcion, maquina, grupo, comentario, cantidad: parseInt(cantidad) });

        request.onsuccess = () => {
            displayData();
            clearForm();
        };

        request.onerror = (event) => {
            console.error('Error al agregar el registro', event);
        };
    }

    function updateRecord(id, referencia, descripcion, maquina, grupo, comentario, cantidad) {
        const transaction = db.transaction(['records'], 'readwrite');
        const objectStore = transaction.objectStore('records');
        const request = objectStore.put({ id, referencia, descripcion, maquina, grupo, comentario, cantidad: parseInt(cantidad) });

        request.onsuccess = () => {
            displayData();
            clearForm();
        };

        request.onerror = (event) => {
            console.error('Error al actualizar el registro', event);
        };
    }

    function deleteRecord(id) {
        const transaction = db.transaction(['records'], 'readwrite');
        const objectStore = transaction.objectStore('records');
        const request = objectStore.delete(id);

        request.onsuccess = () => {
            displayData();
        };

        request.onerror = (event) => {
            console.error('Error al borrar el registro', event);
        };
    }

    function displayData() {
        const objectStore = db.transaction('records').objectStore('records');
        const tbody = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
        tbody.innerHTML = '';

        objectStore.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${cursor.value.referencia}</td>
                    <td>${cursor.value.descripcion}</td>
                    <td>${cursor.value.maquina}</td>
                    <td>${cursor.value.grupo}</td>
                    <td>${cursor.value.comentario}</td>
                    <td>${cursor.value.cantidad}</td>
                    <td>
                        <button onclick="editRecord(${cursor.value.id}, '${cursor.value.referencia}', '${cursor.value.descripcion}', '${cursor.value.maquina}', '${cursor.value.grupo}', '${cursor.value.comentario}', ${cursor.value.cantidad})">Editar</button>
                        <button onclick="deleteRecord(${cursor.value.id})">Borrar</button>
                    </td>
                `;
                tbody.appendChild(row);
                cursor.continue();
            }
        };
    }

    window.editRecord = (id, referencia, descripcion, maquina, grupo, comentario, cantidad) => {
        document.getElementById('recordId').value = id;
        document.getElementById('referencia').value = referencia;
        document.getElementById('descripcion').value = descripcion;
        document.getElementById('maquina').value = maquina;
        document.getElementById('grupo').value = grupo;
        document.getElementById('comentario').value = comentario;
        document.getElementById('cantidad').value = cantidad;
    };

    window.deleteRecord = deleteRecord;

    function clearForm() {
        document.getElementById('recordId').value = '';
        document.getElementById('referencia').value = '';
        document.getElementById('descripcion').value = '';
        document.getElementById('maquina').value = '';
        document.getElementById('grupo').value = '';
        document.getElementById('comentario').value = '';
        document.getElementById('cantidad').value = '';
    }
});
