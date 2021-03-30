const config =  require('plain-config')()
const util = require('util')
const mysql = require('mysql')
const pool = mysql.createPool({
    connectionLimit: 10,
    host: config.mysql.host,
    database: config.mysql.database,
    user: config.mysql.user,
    password: config.mysql.password,
    port: config.mysql.port
})

pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
    }

    if (connection) connection.release()

    return
})

pool.query = util.promisify(pool.query)

module.exports = pool