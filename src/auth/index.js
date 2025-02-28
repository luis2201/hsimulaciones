const jwt = require('jsonwebtoken');
const config = require('../config');
const error = require('../middleware/errors');

const secret = config.jwt.secret;

function asignarToken(data) {    
    return jwt.sign({ ID: data.ID, Usuario: data.Usuario }, secret, { expiresIn: '1h' });
}

function verificarToken(token) {
    try {
        return jwt.verify(token, secret);
    } catch (err) {
        throw error("Token inválido o expirado", 401);
    }
}

const chequearToken = {    
    confirmarToken: function(req, ID) {      
        try {
            const decodificado = decodificarCabecera(req);

            if (String(decodificado.ID) !== String(ID)) {
                throw error("No tienes permisos para realizar esta acción", 401);
            }
        } catch (err) {
            console.log("⚠️ Intento de acceso no autorizado");
            throw error("No tienes permisos para realizar esta acción", 401);
        }
    }
}

function obtenerToken(autorizacion) {
    if (!autorizacion) {
        throw error("No se ha enviado token", 401);
    }

    if (!autorizacion.startsWith('Bearer ')) {
        throw error("Formato del token no es válido", 401);
    }

    return autorizacion.split(' ')[1]; // Extraer solo el token
}

function decodificarCabecera(req) {
    const autorizacion = req.headers.authorization || '';
    const token = obtenerToken(autorizacion);
    const decodificado = verificarToken(token);

    req.user = decodificado;
    return decodificado;
}

module.exports = {
    asignarToken,
    chequearToken
}
