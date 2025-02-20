const TABLE = 'hs_auth';

module.exports = function (dbInyectada) {

    let db = dbInyectada;

    if(!db){
        db = require('../../DB/mysql');
    }
    
    function Add (body) {
        return db.Add(TABLE, body)
    }

    return{
        Add
    }
    
}