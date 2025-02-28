const auth = require("../../auth");

module.exports = function chequearAuth(){
    function middleware(req, res, next){
        const ID = req.body.ID;

        // Si es una inserción nueva (ID: 0), permitimos la operación sin autenticación
        if (!ID || ID === 0) {
            return next();
        }

        auth.chequearToken.confirmarToken(req, ID);
        
        next();
    }

    return middleware;
}
