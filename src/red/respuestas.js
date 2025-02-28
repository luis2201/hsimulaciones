function sendResponse(req, res, mensaje = '', status = 200, isError = false) {
    res.status(status).send({
        error: isError,
        status: status,
        body: mensaje
    });
}

exports.success = (req, res, mensaje = '', status = 200) => {
    sendResponse(req, res, mensaje, status, false);
}

exports.error = (req, res, mensaje = 'Error Interno', status = 500) => {
    sendResponse(req, res, mensaje, status, true);
}
