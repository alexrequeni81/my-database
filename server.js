require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    dbName: 'spareparts'
})
.then(() => console.log('Conectado a MongoDB'))
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

const Part = mongoose.model('Part', partSchema);

// Obtener todos los repuestos
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

        res.json({ parts, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).send('Error al obtener los repuestos');
    }
});

// Crear un nuevo repuesto
app.post('/api/parts', async (req, res) => {
    try {
        const { referencia, descripcion, maquina, grupo, comentario, cantidad } = req.body;

        const newPart = new Part({ REFERENCIA: referencia, DESCRIPCIÓN: descripcion, MÁQUINA: maquina, GRUPO: grupo, COMENTARIO: comentario, CANTIDAD: cantidad });
        await newPart.save();

        res.status(201).json({ message: 'Repuesto creado con éxito', part: newPart });
    } catch (err) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Eliminar un repuesto
app.delete('/api/parts/:id', async (req, res) => {
    try {
        await Part.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar el repuesto' });
    }
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
