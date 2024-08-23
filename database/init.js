require('dotenv').config();
const mongoose = require('mongoose');

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Conectado a MongoDB - Inicialización'))
.catch((err) => console.error('Error al conectar a MongoDB:', err));

// Definir un esquema y modelo
const UserSchema = new mongoose.Schema({
    name: String,
    email: String
});

const User = mongoose.model('User', UserSchema);

// Crear un nuevo usuario
const newUser = new User({
    name: 'Alex Requeni',
    email: 'alex@example.com'
});

newUser.save()
    .then(() => console.log('Usuario creado con éxito'))
    .catch((err) => console.error('Error al crear el usuario:', err))
    .finally(() => mongoose.connection.close());

