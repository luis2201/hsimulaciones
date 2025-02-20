const express= require('express');

const respuesta = require('../../red/respuestas');
const controlador = require('./index');

const router = express.Router();

router.get('/', FindAll); 
router.get('/:id', FindID);
router.post('/', Add);
router.put('/', Delete);

async function FindAll (req, res, next) {
    try {
        const data = await controlador.FindAll()
        respuesta.success(req, res, data, 200);
    } catch (error) {
        next(error);
    }
};

async function FindID (req, res, next) {
    try {
        const data = await controlador.FindID(req.params.id);
        respuesta.success(req, res, data, 200);
    } catch (error) {
        next(error);
    }
};

async function Add (req, res, next) {
    try {
        const data = await controlador.Add(req.body);
        if (req.body.ID == 0) {
            mensaje = 'Registro agregado satisfactoriamente';
        } else {
            mensaje= 'Registro actualizado satisfactoriamente';
        }

        respuesta.success(req, res, mensaje, 200);
    } catch (error) {
        next(error);
    }
};

async function Delete (req, res, next) {
    try {
        const data = await controlador.Delete(req.body);
        respuesta.success(req, res, 'Registro eliminado satisfactoriamente', 200);
    } catch (error) {
        next(error);
    }
};

module.exports = router;