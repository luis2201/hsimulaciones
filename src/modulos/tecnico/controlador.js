const TABLE = 'hs_tecnico';

module.exports = function (dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql');
    }

    function FindAll () {
        return db.FindAll(TABLE)
    }
    
    function FindID (TecnicoID) {
        return db.FindID(TABLE, TecnicoID)
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