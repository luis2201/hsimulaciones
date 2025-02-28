const TABLE = 'hs_auth';
const bcrypt = require('bcrypt');
const auth = require('../../auth');

module.exports = function (dbInyectada) {
    let db = dbInyectada || require('../../DB/mysql');

    async function Login(Usuario, Password) {
        try {
            const resultados = await db.getAuthData(Usuario);            
    
            if (resultados.length === 0 || resultados[0].Estado !== 1) {
                throw new Error("Usuario o contraseña incorrectos");
            }
    
            const data = resultados[0];
    
            const resultado = await bcrypt.compare(Password, data.Password);
            if (!resultado) {
                throw new Error("Usuario o contraseña incorrectos");
            }
    
            return auth.asignarToken({ ID: data.ID, Usuario: data.Usuario });
        } catch (error) {
            throw new Error("Error en la autenticación: " + error.message);
        }
    }
    

    async function Add(data) {
        if (!data.Usuario || !data.Password) {
            throw new Error("Usuario y contraseña son obligatorios");
        }
    
        const authData = {
            ID: data.ID,
            Usuario: data.Usuario,
            Password: await bcrypt.hash(data.Password.toString(), 5)
        };
    
        // 🔥 Verificamos si el usuario ya existe en `hs_auth`
        const existe = await db.FindID('hs_auth', data.ID);
    
        if (existe) {
            // 🔥 Si el usuario ya existe, lo actualizamos en lugar de insertarlo
            return db.executeQuery(`UPDATE hs_auth SET Usuario = ?, Password = ? WHERE ID = ?`, 
                [authData.Usuario, authData.Password, authData.ID]);
        } else {
            // 🔥 Si no existe, lo insertamos
            return db.Add('hs_auth', authData);
        }
    }
    

    return {
        Login,
        Add
    };
};
