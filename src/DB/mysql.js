const mysql = require('mysql');
const config = require('../config');

const dbconfig = {
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database
}

let conexion; 

function conMysql(){
    conexion = mysql.createConnection(dbconfig);

    conexion.connect((err) => {
        if(err){
            console.log('[db err]', err);
            setTimeout(conMysql, 200);
        } else{
            console.log('BD conectada')
        }
    });

    conexion.on('error', err => {
        console.log('[db err]', err);

        if(err.code === 'PROTOCOL_CONNECTION_LOST'){
            conMysql();
        } else{
            throw err;
        }
    });
}

conMysql();

function FindAll(table) {
    return new Promise( (resolve, reject) => {
        conexion.query(`SELECT * FROM ${table}`, (error, result) => {
            return error ? reject(error) : resolve(result);
        })
    });
}

function FindID(table, ID){
    return new Promise( (resolve, reject) => {
        conexion.query(`SELECT * FROM ${table} WHERE ID = ${ID}`, (error, result) => {
            return error ? reject(error) : resolve(result);
        })
    });
}

function insert(table, data){
    return new Promise( (resolve, reject) => {
        conexion.query(`INSERT INTO ${table} SET ?`, data, (error, result) => {
            return error ? reject(error) : resolve(result);
        })
    });
}


function update(table, data){
    return new Promise( (resolve, reject) => {
        conexion.query(`UPDATE ${table} SET ? WHERE ID = ?`, [data, data.ID], (error, result) => {
            return error ? reject(error) : resolve(result);
        })
    });
}

function Add(table, data){
    if (data && data.ID == 0) {
        console.log(data);
        return insert(table, data);
    } else {
        return update(table, data);
    }
}

function Delete(table, data){
    return new Promise( (resolve, reject) => {
        conexion.query(`DELETE FROM ${table} WHERE ID = ?`, data.ID, (error, result) => {
            return error ? reject(error) : resolve(result);
        })
    });
}

module.exports = {
    FindAll,
    FindID,
    Add,
    Delete
}