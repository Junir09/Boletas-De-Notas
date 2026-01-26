// Conexión MySQL (XAMPP) para la BD 'Boletas'
// Requiere instalar dependencia: npm install mysql2

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'gateway01.us-east-1.prod.aws.tidbcloud.com',
  user: process.env.DB_USER || 'tezPfXBLBczYeBc.root',
  password: process.env.DB_PASSWORD || '2aMfaqM0ahICCAv9', // por defecto en XAMPP es vacío
  database: process.env.DB_NAME || 'test',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 4000,
  ssl: process.env.DB_SSL === 'true' ? {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
  } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

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