const mysql = require('promise-mysql');
const config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '0613',
    database: 'jungah',
}
const pool = mysql.createPool(config);

module.exports = pool;