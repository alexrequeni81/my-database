require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar a MongoDB usando la base de datos "spareparts"
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'spareparts'
})
.then(() => console.log('Conectado a MongoDB en la base de datos "spareparts"'))
.catch((err) => console.error('Error al conectar a MongoDB:', err));

// Definir un esquema y modelo para la colección "databasev1"
const partSchema = new mongoose.Schema({
    REFERENCIA: String,
    DESCRIPCIÓN: String,
    MÁQUINA: String,
    GRUPO: String,
    COMENTARIO: String,
    CANTIDAD: Number
});

const Part = mongoose.model('Part', partSchema, 'databasev1');

// Ruta para obtener todos los documentos en la colección "databasev1"
app.get('/api/parts', async (req, res) => {
    try {
        const parts = await Part.find();
        res.json(parts);
    } catch (err) {
        res.status(500).send('Error al obtener los repuestos');
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
