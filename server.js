const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.static(path.join(__dirname, 'frontend')));

app.post('/api/data', async (req, res) => {
    try {
        const newData = req.body;
        const database = client.db('spareparts');
        const collection = database.collection('databasev1');
        const result = await collection.insertOne(newData);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error al insertar el registro:', error);
        res.status(500).send('Error al insertar el registro');
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
