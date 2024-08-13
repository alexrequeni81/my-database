import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCRG0qopwJGCRVs8sUK04b5dkpUeDwvYjQ",
    authDomain: "my-database-12eeb.firebaseapp.com",
    databaseURL: "https://my-database-12eeb-default-rtdb.firebaseio.com",
    projectId: "my-database-12eeb",
    storageBucket: "my-database-12eeb.appspot.com",
    messagingSenderId: "546769208649",
    appId: "1:546769208649:web:db89f3ffcaf32014668698",
    measurementId: "G-QNZ64RB4JJ"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#data-table tbody');
    const formContainer = document.getElementById('form-container');
    const formTitle = document.getElementById('form-title');
    const dataForm = document.getElementById('data-form');
    const addRowBtn = document.getElementById('add-row-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    let data = [];
    let editIndex = -1;

    // Fetch data from Firebase
    const dataRef = ref(db, 'data');
    onValue(dataRef, (snapshot) => {
        data = snapshot.val() || [];
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

    // Save Data to Firebase
    function saveData() {
        set(dataRef, data);
    }
});
