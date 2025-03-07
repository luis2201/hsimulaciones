const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const config = require('./config');

const tecnico = require('./modulos/tecnico/rutas');
const usuario = require('./modulos/usuario/rutas');
const auth = require('./modulos/auth/rutas');
const error = require('./red/errors');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Configuración de CORS
app.use(cors({
  origin: 'http://appit2.itsup.edu.ec', // Permitir cualquier origen (puedes limitarlo a dominios específicos)
  credentials: true,
  methods: ['GET', 'POST'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Encabezados permitidos
}));

// Configuración
app.set('port', config.app.port);

// Rutas
app.use('/api/tecnico', tecnico);
app.use('/api/usuario', usuario);
app.use('/api/auth', auth);
app.use(error);

module.exports = app;
