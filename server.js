require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'spareparts'
})
.then(() => console.log('Conectado a MongoDB en la base de datos "spareparts"'))
.catch((err) => console.error('Error al conectar a MongoDB:', err));

// Configurar la carpeta de archivos estáticos
app.use(express.static(path.join(__dirname, 'frontend')));

// Ruta para obtener todos los repuestos (API)
app.get('/api/parts', async (req, res) => {
    try {
        console.log('Solicitando datos desde la API /api/parts');
        const parts = await Part.find();
        console.log('Datos obtenidos:', parts);
        res.json(parts);
    } catch (err) {
        console.error('Error al obtener los repuestos:', err);
        res.status(500).send('Error al obtener los repuestos');
    }
});

// Ruta para servir el archivo 'index.html' en la ruta raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
