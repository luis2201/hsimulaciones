const mysql = require('mysql');
const path = require('path');
const config = require(path.join(__dirname, '../config'));


const pool = mysql.createPool({
    connectionLimit: 10, // Control de conexiones simultáneas
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database
});

// Función genérica para ejecutar consultas
function executeQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (error, result) => {
            if (error) {
                console.error('[DB Error]', error);
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

async function getAuthData(Usuario) {
    const sql = `
        SELECT u.ID, a.Usuario, a.Password, u.Estado 
        FROM hs_auth a 
        JOIN hs_usuario u ON a.ID = u.ID 
        WHERE a.Usuario = ?;
    `;

    return executeQuery(sql, [Usuario]);
}

// Métodos de Base de Datos
const db = {
    FindAll: (table) => executeQuery(`SELECT * FROM ??`, [table]),

    FindID: (table, ID) => executeQuery(`SELECT * FROM ?? WHERE ID = ?`, [table, ID]),

    Add: (table, data) => executeQuery(`INSERT INTO ?? SET ? ON DUPLICATE KEY UPDATE ?`, [table, data, data]),

    Delete: (table, ID) => executeQuery(`DELETE FROM ?? WHERE ID = ?`, [table, ID]),

    Query: (table, query) => executeQuery(`SELECT * FROM ?? WHERE ?`, [table, query])
        .then(result => result.length > 0 ? result[0] : null),

    executeQuery,

    getAuthData
};

// Exportamos la conexión optimizada
module.exports = db;
