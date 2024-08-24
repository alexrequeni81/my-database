require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');

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

// Ruta para obtener todos los repuestos (API)
app.get('/api/parts', async (req, res) => {
    try {
        const parts = await Part.find();
        res.json(parts);
    } catch (err) {
        console.error('Error al obtener los repuestos:', err);
        res.status(500).send('Error al obtener los repuestos');
    }
});

// Ruta para manejar solicitudes a la API de MongoDB (opcional)
app.get('/api/mongodb', async (req, res) => {
    try {
        const response = await axios.post(
            'https://data.mongodb-api.com/app/data-lnzazvf/endpoint/data/v1/action/findOne',
            {
                collection: "databasev1",
                database: "spareparts",
                dataSource: "Cluster0",
                projection: { _id: 1 }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': 'CELk75STkro8lvppxIO0SfPFkWgktZ6kFI5jg8BwMnzaUojLiLJXCdxtDpE3VzSG'
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error al conectar con MongoDB API:', error);
        res.status(500).send('Error al conectar con MongoDB API');
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
