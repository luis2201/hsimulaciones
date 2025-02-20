function error (message, code) {
    let e = new Error(message);

    if(code){
        e.statusCode = code;
    }
}

module.exports = error;