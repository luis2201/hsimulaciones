const TABLE = 'hs_usuario';

module.exports = function (dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql');
    }

    function FindAll () {
        return db.FindAll(TABLE)
    }
    
    function FindID (UsuarioID) {
        return db.FindID(TABLE, UsuarioID)
    }
    
    function Add (body) {
        return db.Add(TABLE, body)
    }
    
    function Delete (body) {
        return db.Delete(TABLE, body)
    }

    return{
        FindAll,
        FindID,
        Add,
        Delete
    }
    
}