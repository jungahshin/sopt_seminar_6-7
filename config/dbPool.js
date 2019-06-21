const mysql = require('promise-mysql');
const config = {
    host: 'jungahdbinstance.cwrefle8tjq1.ap-northeast-2.rds.amazonaws.com',
    port: 3306,
    user: 'jungah',
    password: 'ShinJungAh1!',
    database: 'seminar_4',
}
const pool = mysql.createPool(config);

module.exports = pool;