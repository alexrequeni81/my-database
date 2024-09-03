require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para logging de las solicitudes
app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    next();
});

// Middleware para asegurar el tipo MIME correcto para archivos .js
app.use((req, res, next) => {
    if (req.url.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
    }
    next();
});

// Middleware para parsear JSON en el cuerpo de las solicitudes
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || '';

    // Dividir la consulta de búsqueda en palabras clave
    const searchTerms = searchQuery.split(' ').filter(term => term); // Eliminar espacios en blanco

    const query = searchTerms.length > 0 
        ? {
            $and: searchTerms.map(term => ({
                $or: [
                    { REFERENCIA: { $regex: term, $options: 'i' } },
                    { DESCRIPCIÓN: { $regex: term, $options: 'i' } },
                    { MÁQUINA: { $regex: term, $options: 'i' } },
                    { GRUPO: { $regex: term, $options: 'i' } },
                    { COMENTARIO: { $regex: term, $options: 'i' } }
                ]
            }))
        }
        : {};

    try {
        const parts = await Part.find(query).skip(skip).limit(limit);
        const total = await Part.countDocuments(query);

        res.json({
            parts,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('Error al obtener los repuestos:', err);
        res.status(500).send('Error al obtener los repuestos');
    }
});


// Crear un nuevo repuesto
app.post('/api/parts', async (req, res) => {
    try {
        // Asegúrate de que los datos recibidos son correctos
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

        // Responder con un éxito si todo salió bien
        res.status(201).json({
            message: 'Repuesto creado con éxito',
            part: newPart
        });
    } catch (err) {
        console.error('Error al crear un nuevo repuesto:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Actualizar un repuesto existente
app.put('/api/parts/:id', async (req, res) => {
    try {
        const updatedPart = await Part.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedPart) {
            return res.status(404).json({ error: 'Repuesto no encontrado' });
        }
        res.status(200).json(updatedPart);
    } catch (err) {
        console.error('Error al actualizar el repuesto:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Eliminar un repuesto
app.delete('/api/parts/:id', async (req, res) => {
    try {
        await Part.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (err) {
        console.error('Error al eliminar el repuesto:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
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
