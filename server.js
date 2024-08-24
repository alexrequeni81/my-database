require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'spareparts'
})
.then(() => console.log('Conectado a MongoDB en la base de datos "spareparts"'))
.catch((err) => console.error('Error al conectar a MongoDB:', err));

// Definir el esquema y modelo para "Part"
const partSchema = new mongoose.Schema({
    REFERENCIA: String,
    DESCRIPCIÓN: String,
    MÁQUINA: String,
    GRUPO: String,
    COMENTARIO: String,
    CANTIDAD: Number
});

const Part = mongoose.model('Part', partSchema, 'databasev1');

// Configurar la carpeta de archivos estáticos
app.use(express.static(path.join(__dirname, 'frontend')));

// Obtener todos los repuestos (API)
app.get('/api/parts', async (req, res) => {
    try {
        const parts = await Part.find();
        res.json(parts);
    } catch (err) {
        console.error('Error al obtener los repuestos:', err);
        res.status(500).send('Error al obtener los repuestos');
    }
});

// Crear un nuevo repuesto
app.post('/api/parts', async (req, res) => {
    try {
        const newPart = new Part(req.body);
        await newPart.save();
        res.status(201).json(newPart);
    } catch (err) {
        console.error('Error al crear un nuevo repuesto:', err);
        res.status(500).send('Error al crear un nuevo repuesto');
    }
});

// Actualizar un repuesto existente
app.put('/api/parts/:id', async (req, res) => {
    try {
        const updatedPart = await Part.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updatedPart);
    } catch (err) {
        console.error('Error al actualizar el repuesto:', err);
        res.status(500).send('Error al actualizar el repuesto');
    }
});

// Eliminar un repuesto
app.delete('/api/parts/:id', async (req, res) => {
    try {
        await Part.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (err) {
        console.error('Error al eliminar el repuesto:', err);
        res.status(500).send('Error al eliminar el repuesto');
    }
});

// Servir el archivo 'index.html' en la ruta raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
