const express = require('express');
const respuesta = require('../../red/respuestas');
const controlador = require('./index');

const router = express.Router();

router.post('/login', Login); // 🔥 Cambiado a POST

async function Login(req, res, next) {
    try {
        const { Usuario, Password } = req.body;

        if (!Usuario || !Password) {
            throw new Error("Usuario y contraseña son obligatorios");
        }

        const token = await controlador.Login(Usuario, Password);
        respuesta.success(req, res, token, 200);
    } catch (error) {
        next(error);
    }
}

module.exports = router;
