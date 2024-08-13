// script.js
document.addEventListener('DOMContentLoaded', () => {
    const dataUrl = 'data.json';
    const tableBody = document.querySelector('#data-table tbody');
    const formContainer = document.getElementById('form-container');
    const formTitle = document.getElementById('form-title');
    const dataForm = document.getElementById('data-form');
    const addRowBtn = document.getElementById('add-row-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    let data = [];
    let editIndex = -1;

    // Fetch data
    fetch(dataUrl)
        .then(response => response.json())
        .then(json => {
            data = json;
            renderTable();
        });

    // Render table
    function renderTable() {
        tableBody.innerHTML = '';
        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.referencia}</td>
                <td>${row.descripcion}</td>
                <td>${row.maquina}</td>
                <td>${row.grupo}</td>
                <td>${row.comentario}</td>
                <td>${row.cantidad}</td>
                <td>
                    <button onclick="editRow(${index})">Editar</button>
                    <button onclick="deleteRow(${index})">Borrar</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Add Row
    addRowBtn.addEventListener('click', () => {
        formTitle.textContent = 'Añadir Fila';
        dataForm.reset();
        editIndex = -1;
        formContainer.style.display = 'block';
    });

    // Cancel Form
    cancelBtn.addEventListener('click', () => {
        formContainer.style.display = 'none';
    });

    // Submit Form
    dataForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(dataForm);
        const row = Object.fromEntries(formData.entries());

        if (editIndex === -1) {
            data.push(row);
        } else {
            data[editIndex] = row;
        }

        renderTable();
        formContainer.style.display = 'none';
        saveData();
    });

    // Edit Row
    window.editRow = function(index) {
        formTitle.textContent = 'Editar Fila';
        const row = data[index];
        for (let key in row) {
            dataForm.elements[key].value = row[key];
        }
        editIndex = index;
        formContainer.style.display = 'block';
    };

    // Delete Row
    window.deleteRow = function(index) {
        data.splice(index, 1);
        renderTable();
        saveData();
    };

    // Save Data
    function saveData() {
        fetch(dataUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(response => response.json())
          .then(json => {
              console.log('Data saved', json);
          });
    }
});
