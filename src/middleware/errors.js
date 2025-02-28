function createError(message, code = 500) {
    const error = new Error(message);
    error.statusCode = code;
    return error;
}

module.exports = createError;
