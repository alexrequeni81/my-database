require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const axios = require('axios');
const http = require('http');
const socketIo = require('socket.io');
const Excel = require('exceljs');
const fileUpload = require('express-fileupload');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let activeUsers = 0;

io.on('connection', (socket) => {
    activeUsers++;
    io.emit('userCount', activeUsers);

    socket.on('disconnect', () => {
        activeUsers--;
        io.emit('userCount', activeUsers);
    });
});

// Middleware para logging de las solicitudes
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
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
    const skip = (page - 1) * limit; // Calculate the skip value
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
        const parts = await Part.find(query).skip(skip).limit(limit); // Fetch data with skip and limit
        const total = await Part.countDocuments(query); // Count total documents for pagination

        res.json({
            parts,
            total,
            page, 
            pages: Math.ceil(total / limit) // Calculate the total number of pages
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
        await updateTotalRecords();

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
        await updateTotalRecords();
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
        await updateTotalRecords();

        res.json({ success: true, message: 'Todos los repuestos han sido reseteados' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// Nueva ruta para obtener el conteo total de registros
let totalRecords = 0;
app.get('/api/totalRecords', (req, res) => {
    res.json({ total: totalRecords });
});

// Función para actualizar el conteo total
async function updateTotalRecords() {
    try {
        totalRecords = await Part.countDocuments();
        console.log(`Total de registros actualizado: ${totalRecords}`);
    } catch (err) {
        console.error('Error al actualizar el total de registros:', err);
    }
}

// Actualizar el conteo al iniciar el servidor
updateTotalRecords();

// Actualizar el conteo cada 5 minutos
cron.schedule('*/5 * * * *', updateTotalRecords);

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// Nueva ruta para verificar el estado del servidor
app.get('/api/status', async (req, res) => {
    try {
        // Verificar la conexión a la base de datos
        await mongoose.connection.db.admin().ping();
        res.status(200).json({ serverStatus: 'OK', dbStatus: 'OK' });
    } catch (error) {
        console.error('Error al verificar el estado de la base de datos:', error);
        res.status(200).json({ serverStatus: 'OK', dbStatus: 'ERROR' });
    }
});

// Nueva ruta para descargar los datos
app.get('/api/download', async (req, res) => {
    try {
        const parts = await Part.find({});
        
        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet('Repuestos');
        
        worksheet.columns = [
            { header: 'REFERENCIA', key: 'REFERENCIA', width: 15 },
            { header: 'DESCRIPCIÓN', key: 'DESCRIPCIÓN', width: 30 },
            { header: 'MÁQUINA', key: 'MÁQUINA', width: 15 },
            { header: 'GRUPO', key: 'GRUPO', width: 15 },
            { header: 'COMENTARIO', key: 'COMENTARIO', width: 30 },
            { header: 'CANTIDAD', key: 'CANTIDAD', width: 10 }
        ];

        parts.forEach(part => {
            worksheet.addRow(part);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=repuestos.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error al descargar los datos:', error);
        res.status(500).json({ error: 'Error al descargar los datos' });
    }
});

// Nueva ruta para cargar datos desde Excel
app.post('/api/upload', async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No se ha subido ningún archivo.');
    }

    let excelFile = req.files.file;
    let workbook = new Excel.Workbook();
    
    try {
        await workbook.xlsx.load(excelFile.data);
        let worksheet = workbook.getWorksheet(1);

        // Verificar los encabezados
        const expectedHeaders = ['REFERENCIA', 'DESCRIPCIÓN', 'MÁQUINA', 'GRUPO', 'COMENTARIO', 'CANTIDAD'];
        const actualHeaders = worksheet.getRow(1).values.slice(1); // Ignorar la primera celda vacía

        if (!arraysEqual(expectedHeaders, actualHeaders)) {
            return res.status(400).send('El formato del archivo no es válido. Verifique los encabezados de las columnas.');
        }

        let newParts = [];

        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber > 1) { // Ignorar la fila de encabezados
                if (row.values.length !== 7) { // 6 columnas + 1 (la primera celda está vacía)
                    throw new Error(`La fila ${rowNumber} no tiene el número correcto de columnas.`);
                }

                let newPart = {
                    REFERENCIA: row.getCell(1).value,
                    DESCRIPCIÓN: row.getCell(2).value,
                    MÁQUINA: row.getCell(3).value,
                    GRUPO: row.getCell(4).value,
                    COMENTARIO: row.getCell(5).value,
                    CANTIDAD: row.getCell(6).value
                };

                // Validación básica
                if (!newPart.REFERENCIA || !newPart.DESCRIPCIÓN || !newPart.MÁQUINA || !newPart.GRUPO || isNaN(newPart.CANTIDAD)) {
                    throw new Error(`La fila ${rowNumber} contiene datos inválidos.`);
                }

                newParts.push(newPart);
            }
        });

        if (newParts.length === 0) {
            return res.status(400).send('El archivo no contiene datos válidos.');
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            await Part.deleteMany({}, { session });
            await Part.insertMany(newParts, { session });
            await session.commitTransaction();
            session.endSession();

            await updateTotalRecords();

            res.status(200).send('Datos cargados exitosamente');
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('Error al cargar los datos:', error);
            res.status(500).send('Error al procesar el archivo: ' + error.message);
        }
    } catch (error) {
        console.error('Error al cargar los datos:', error);
        res.status(400).send('Error al procesar el archivo: ' + error.message);
    }
});

function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

app.use(fileUpload());
