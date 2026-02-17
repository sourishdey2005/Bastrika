const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
});

console.log('Testing connection to:', process.env.DATABASE_URL.replace(/:.*@/, ':****@'));

pool.query('SELECT NOW()')
    .then(res => {
        console.log('Connection Successful:', res.rows[0]);
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection Failed!');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        process.exit(1);
    });
