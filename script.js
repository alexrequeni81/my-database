const dataUrl = "https://raw.githubusercontent.com/alexrequeni81/my-database/main/data.json"; 
const dataTable = document.getElementById("dataTable");
const searchInput = document.getElementById("searchInput");
const addBtn = document.getElementById("addBtn");

// Fetch data from GitHub
fetch(dataUrl)
    .then(response => response.json())
    .then(data => {
        displayData(data);
    })
    .catch(error => {
        console.error("Error fetching data:", error);
    });

// Display data in the table
function displayData(data) {
    const tableBody = dataTable.querySelector("tbody");
    tableBody.innerHTML = ""; // Clear previous data

    data.forEach(item => {
        const row = tableBody.insertRow();
        const nameCell = row.insertCell();
        const ageCell = row.insertCell();
        const cityCell = row.insertCell();
        const actionsCell = row.insertCell();

        nameCell.textContent = item.name;
        ageCell.textContent = item.age;
        cityCell.textContent = item.city;

        // Add Edit/Delete buttons
        actionsCell.innerHTML = `
            <button data-id="${item.name}" class="editBtn">Edit</button>
            <button data-id="${item.name}" class="deleteBtn">Delete</button>
        `;
    });

    // Add event listeners for Edit/Delete buttons
    const editButtons = document.querySelectorAll(".editBtn");
    editButtons.forEach(button => {
        button.addEventListener("click", handleEdit);
    });

    const deleteButtons = document.querySelectorAll(".deleteBtn");
    deleteButtons.forEach(button => {
        button.addEventListener("click", handleDelete);
    });
}

// Search functionality
searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();
    const tableRows = dataTable.querySelectorAll("tbody tr");

    tableRows.forEach(row => {
        const nameCell = row.querySelector("td:first-child");
        const name = nameCell.textContent.toLowerCase();

        if (name.includes(searchTerm)) {
            row.style.display = "table-row";
        } else {
            row.style.display = "none";
        }
    });
});

// Handle data addition (addBtn click)
addBtn.addEventListener("click", () => {
    // Implement logic to prompt user for new data and add to the table
    // You'll need to update the `data` array and then re-render the table
});

// Handle Edit button click
function handleEdit(event) {
    // Get the data ID from the button
    const dataId = event.target.dataset.id;

    // Implement logic to find the corresponding data item,
    // allow editing, and update the data array
    // Then, re-render the table
}

// Handle Delete button click
function handleDelete(event) {
    // Get the data ID from the button
    const dataId = event.target.dataset.id;

    // Implement logic to delete the corresponding data item from the array
    // Update the `data` array and re-render the table
}
