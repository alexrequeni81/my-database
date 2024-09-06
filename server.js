require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Track connected users
let connectedUsers = 0;

io.on('connection', (socket) => {
    connectedUsers++;
    io.emit('userCount', connectedUsers); // Emit the new count to all clients

    socket.on('disconnect', () => {
        connectedUsers--;
        io.emit('userCount', connectedUsers); // Emit the new count
    });
});

// Add a route to get the total record count
app.get('/api/parts/count', async (req, res) => {
    try {
        const count = await Part.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el conteo de la base de datos' });
    }
});

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

    const searchTerms = searchQuery.split(' ').filter(term => term);

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
        const { referencia, descripcion, maquina, grupo, comentario, cantidad } = req.body;

        if (!referencia || !descripcion || !maquina || !grupo || !comentario || isNaN(cantidad)) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios y la cantidad debe ser un número.' });
        }

        const newPart = new Part({
            REFERENCIA: referencia,
            DESCRIPCIÓN: descripcion,
            MÁQUINA: maquina,
            GRUPO: grupo,
            COMENTARIO: comentario,
            CANTIDAD: cantidad
        });

        await newPart.save();

        res.status(201).json({
            message: 'Repuesto creado con éxito',
            part: newPart
        });
    } catch (err) {
        console.error('Error al crear un nuevo repuesto:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Actualizar un repuesto existente (API PUT con Logs y Normalización)
app.put('/api/parts/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Editando repuesto con ID: ${id}`); // Log del ID recibido

        // Validación y normalización de los datos recibidos
        let { referencia, descripcion, maquina, grupo, comentario, cantidad } = req.body;

        console.log('Datos recibidos antes de la normalización:', { referencia, descripcion, maquina, grupo, comentario, cantidad });

        // Convertir "cantidad" a número si es necesario y normalizar cadenas vacías
        cantidad = cantidad !== undefined && cantidad !== null ? (cantidad === "" ? null : Number(cantidad)) : null;

        if (!id) {
            console.error('ID no proporcionada');
            return res.status(400).json({ error: 'ID no proporcionada' });
        }

        if (!referencia || !descripcion || !maquina || !grupo || !comentario || isNaN(cantidad)) {
            console.error('Datos inválidos');
            return res.status(400).json({ error: 'Todos los campos son obligatorios y la cantidad debe ser un número.' });
        }

        // Normalizar campos vacíos a null
        referencia = referencia.trim() || null;
        descripcion = descripcion.trim() || null;
        maquina = maquina.trim() || null;
        grupo = grupo.trim() || null;
        comentario = comentario.trim() || null;

        console.log('Datos después de la normalización:', { referencia, descripcion, maquina, grupo, comentario, cantidad });

        const updatedPart = await Part.findByIdAndUpdate(id, {
            REFERENCIA: referencia,
            DESCRIPCIÓN: descripcion,
            MÁQUINA: maquina,
            GRUPO: grupo,
            COMENTARIO: comentario,
            CANTIDAD: cantidad
        }, { new: true });

        if (!updatedPart) {
            console.error('Repuesto no encontrado');
            return res.status(404).json({ error: 'Repuesto no encontrado' });
        }

        console.log('Repuesto actualizado:', updatedPart); // Log del repuesto actualizado
        res.status(200).json(updatedPart);
    } catch (err) {
        console.error('Error al editar el repuesto:', err);
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

// Cron job para hacer ping cada 5 minutos
cron.schedule('*/1 * * * *', () => { 
    axios.get('https://my-database-ahys.onrender.com/') 
        .then(() => console.log('Ping exitoso, el servidor sigue activo')) 
        .catch(err => console.error('Error al hacer ping:', err)); 
});

// Reseteo masivo de todos los repuestos
app.delete('/api/resetAllParts', async (req, res) => {
    try {
        const allParts = await Part.find();

        if (!allParts || allParts.length === 0) {
            return res.status(404).json({ success: false, message: 'No hay repuestos para resetear' });
        }

        const allPartsData = allParts.map(part => ({
            REFERENCIA: part.REFERENCIA,
            DESCRIPCIÓN: part.DESCRIPCIÓN,
            MÁQUINA: part.MÁQUINA,
            GRUPO: part.GRUPO,
            COMENTARIO: part.COMENTARIO,
            CANTIDAD: part.CANTIDAD
        }));

        await Part.deleteMany({});
        await Part.insertMany(allPartsData);

        res.json({ success: true, message: 'Todos los repuestos han sido reseteados' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
