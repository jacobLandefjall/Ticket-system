

function showTable() {
    try {
        const sql = `
            SELECT * FROM test;
        `;
    } catch (error) {
        console.error(`Error showing categories:`, error);
        throw error;
    }
}

module.exports = { showTable };
// public.js
const mysql = require('mysql2');

// Skapa en pool med MySQL-anslutningar
const pool = mysql.createPool({
    host: 'localhost',
    database: 'sqltest',
    user: 'sqltest',
    password: 'mysecret1',
    connectionLimit: 10,
});

// Funktion som hämtar data från "test" tabellen
function getTestData(callback) {
    pool.query('SELECT * FROM test', (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
            callback(error, null);
            return;
        }
        callback(null, results);
    });
}

// Exportera funktionen så att den kan användas i andra filer
module.exports = { getTestData };
