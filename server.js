const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/api/data', async (req, res) => {
    try {
        await client.connect();
        const database = client.db('spareparts');
        const collection = database.collection('databasev1');
        const data = await collection.find({}).toArray();
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching data from MongoDB');
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
