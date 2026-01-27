// Conexión MySQL (XAMPP) para la BD 'Boletas'
// Requiere instalar dependencia: npm install mysql2

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'boletas',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  ssl: (process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud'))) ? {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
  } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Diagnóstico de conexión
console.log(`Intentando conectar a DB: ${process.env.DB_NAME || 'boletas'} en ${process.env.DB_HOST || 'localhost'}`);

module.exports = { pool };

// Permite probar la conexión: `node server/db.js`
if (require.main === module) {
  (async () => {
    try {
      const conn = await pool.getConnection();
      const [rows] = await conn.query('SELECT DATABASE() AS db');
      console.log('Conectado a BD:', rows[0].db);
      conn.release();
      process.exit(0);
    } catch (err) {
      console.error('Error de conexión:', err.message);
      process.exit(1);
    }
  })();
}