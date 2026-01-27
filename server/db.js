// Conexión MySQL (XAMPP) para la BD 'Boletas'
// Requiere instalar dependencia: npm install mysql2

const mysql = require('mysql2/promise');

const DB_HOST = process.env.DB_HOST || 'gateway01.us-east-1.prod.aws.tidbcloud.com';
const DB_USER = process.env.DB_USER || 'tezPfXBLBczYeBc.root';
const DB_PASSWORD = process.env.DB_PASSWORD || '2aMfaqM0ahICCAv9'; // por defecto en XAMPP es vacío
const DB_NAME = process.env.DB_NAME || 'test';
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 4000;

// Habilitar SSL si la variable DB_SSL es 'true' O si el host es de TiDB Cloud
const useSSL = process.env.DB_SSL === 'true' || DB_HOST.includes('tidbcloud');

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT,
  ssl: useSSL ? {
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
