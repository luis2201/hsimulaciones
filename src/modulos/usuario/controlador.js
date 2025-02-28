const TABLE = 'hs_usuario';
const auth = require('../auth');

module.exports = function (dbInyectada) {
    let db = dbInyectada || require('../../DB/mysql');

    async function FindAll() {
        return db.FindAll(TABLE);
    }

    async function FindID(UsuarioID) {
        return db.FindID(TABLE, UsuarioID);
    }

    async function Add(body) {
        if (!body.Nombres || !body.Usuario || !body.Password) {
            throw new Error("Faltan datos requeridos");
        }

        const Usuario = {
            ID: body.ID ? body.ID : null,  // Si ID es 0, se almacena como `null`
            Nombres: body.Nombres.trim()
        };       

        try {
            const respuesta = await db.Add(TABLE, Usuario);
            const insertId = body.ID ? body.ID : respuesta.insertId;

            if (body.Usuario && body.Password) {
                await auth.Add({
                    ID: insertId,
                    Usuario: body.Usuario,
                    Password: body.Password
                });
            }

            return insertId;
        } catch (error) {
            throw new Error("Error al agregar usuario: " + error.message);
        }
    }

    async function Delete(body) {
        if (!body.ID) {
            throw new Error("Se requiere un ID para eliminar");
        }
    
        return db.executeQuery(`UPDATE ?? SET Estado = 0 WHERE ID = ?`, [TABLE, body.ID]);
    }
   

    return { FindAll, FindID, Add, Delete };
};
