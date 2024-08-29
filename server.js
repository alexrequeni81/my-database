const express = require('express');
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Conectar a MongoDB usando Mongoose
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Definir el esquema y modelo de Mongoose
const partSchema = new mongoose.Schema({
    REFERENCIA: String,
    DESCRIPCIÓN: String,
    MÁQUINA: String,
    GRUPO: String,
    COMENTARIO: String,
    CANTIDAD: String
});

const Part = mongoose.model('Part', partSchema);

app.use(express.json()); // Middleware para parsear JSON

// Servir archivos estáticos desde la carpeta frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Ruta para obtener todos los datos (API GET)
app.get('/api/data', async (req, res) => {
    try {
        const parts = await Part.find({});
        res.json(parts);
    } catch (err) {
        console.error('Error al obtener datos:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para crear un nuevo repuesto (API POST)
app.post('/api/parts', async (req, res) => {
    try {
        const { referencia, descripcion, maquina, grupo, comentario, cantidad } = req.body;

        // Validar que todos los campos están presentes
        if (!referencia || !descripcion || !maquina || !grupo || !comentario || !cantidad) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        // Crear un nuevo documento con los datos recibidos
        const newPart = new Part({
            REFERENCIA: referencia,
            DESCRIPCIÓN: descripcion,
            MÁQUINA: maquina,
            GRUPO: grupo,
            COMENTARIO: comentario,
            CANTIDAD: cantidad
        });

        // Guardar en la base de datos
        await newPart.save();

        // Responder con éxito si todo salió bien
        res.status(201).json({
            message: 'Repuesto creado con éxito',
            part: newPart
        });
    } catch (err) {
        console.error('Error al crear un nuevo repuesto:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
