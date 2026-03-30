import mariadb from 'mariadb';

async function setup() {
  let conn;
  try {
    conn = await mariadb.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });
    console.log('Connected to MySQL/MariaDB');
    await conn.query('CREATE DATABASE IF NOT EXISTS bookhunt');
    console.log('Database "bookhunt" created or already exists.');
  } catch (err) {
    console.error('Error setting up DB:', err);
  } finally {
    if (conn) await conn.end();
  }
}

setup();
