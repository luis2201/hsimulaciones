const express = require('express');
const seguridad = require('./seguridad');
const respuesta = require('../../red/respuestas');
const controlador = require('./index');

const router = express.Router();

router.get('/', FindAll);
router.get('/:id', FindID);
router.post('/', seguridad(), Add);
router.put('/', seguridad(), Delete);

async function FindAll(req, res, next) {
    try {
        const data = await controlador.FindAll();
        respuesta.success(req, res, data, 200);
    } catch (error) {
        next(error);
    }
}

async function FindID(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw new Error("El ID debe ser un número válido");
        }

        const data = await controlador.FindID(id);
        if (!data) {
            throw new Error("Usuario no encontrado");
        }

        respuesta.success(req, res, data, 200);
    } catch (error) {
        next(error);
    }
}

async function Add(req, res, next) {
    try {
        if (!req.body.Nombres || !req.body.Usuario || !req.body.Password) {
            throw new Error("Faltan datos requeridos");
        }

        const data = await controlador.Add(req.body);
        const mensaje = req.body.ID ? 'Registro actualizado' : 'Registro agregado';

        respuesta.success(req, res, mensaje, 200);
    } catch (error) {
        next(error);
    }
}

async function Delete(req, res, next) {
    try {
        if (!req.body.ID) {
            throw new Error("Se requiere un ID para eliminar");
        }

        await controlador.Delete(req.body);
        respuesta.success(req, res, 'Registro eliminado satisfactoriamente', 200);
    } catch (error) {
        next(error);
    }
}

module.exports = router;
