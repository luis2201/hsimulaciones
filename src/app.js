const express = require('express');
const config = require('./config');

const tecnico = require('./modulos/tecnico/rutas');

const app = express();

//configuración
app.set('port', config.app.port);

//rutas
app.use('/api/tecnico', tecnico);

module.exports = app;