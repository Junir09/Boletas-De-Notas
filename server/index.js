const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const app = express();
app.use(cors({ origin: '*'}));
app.use(express.json());

// Healthcheck
app.get('/', (req, res) => {
  res.json({ ok: true, name: 'Boletas API', version: '1.0.0' });
});

// Docentes
app.get('/api/docentes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT dni, nombre, descripcion FROM docente ORDER BY nombre');
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/docentes', async (req, res) => {
  const { dni, nombre, descripcion } = req.body || {};
  if (!dni || !nombre) {
    return res.status(400).json({ ok: false, error: 'Faltan dni y nombre' });
  }
  const password = String(dni).slice(-6) || Math.random().toString(36).slice(2, 8);
  try {
    const [result] = await pool.query('INSERT INTO docente (dni, nombre, descripcion, password) VALUES (?, ?, ?, ?)', [dni, nombre, descripcion || null, password]);
    res.json({ ok: true, id: result.insertId, password });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, error: 'DNI ya registrado' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
});

// Estudiantes
app.get('/api/estudiantes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT dni, apellidos, nombres FROM estudiantes ORDER BY apellidos, nombres');
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/estudiantes/bulk', async (req, res) => {
  const { estudiantes } = req.body || {};
  if (!Array.isArray(estudiantes)) {
    return res.status(400).json({ ok: false, error: 'Formato inválido: se esperaba { estudiantes: [...] }' });
  }
  const values = estudiantes
    .map(s => [String(s.dni || '').trim(), String(s.apellidos || '').trim(), String(s.nombres || '').trim()])
    .filter(v => v[0] && v[1] && v[2]);
  if (values.length === 0) {
    return res.status(400).json({ ok: false, error: 'No hay estudiantes válidos para insertar' });
  }
  const sql = 'INSERT INTO estudiantes (dni, apellidos, nombres) VALUES ? ON DUPLICATE KEY UPDATE apellidos=VALUES(apellidos), nombres=VALUES(nombres)';
  try {
    const [result] = await pool.query(sql, [values]);
    const affected = result.affectedRows;
    res.json({ ok: true, count: values.length, affected });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Login Docente
app.post('/api/login/docente', async (req, res) => {
  const { dni, password } = req.body || {};
  if (!dni || !password) {
    return res.status(400).json({ ok: false, error: 'Faltan credenciales' });
  }
  try {
    const [rows] = await pool.query('SELECT dni FROM docente WHERE dni = ? AND password = ? LIMIT 1', [dni, password]);
    if (rows.length === 0) {
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Login Alumno
app.post('/api/login/alumno', async (req, res) => {
  const { dni, boleta } = req.body || {};
  try {
    if (dni) {
      const [rows] = await pool.query('SELECT dni FROM estudiantes WHERE dni = ? LIMIT 1', [dni]);
      if (rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'DNI inválido' });
      }
      return res.json({ ok: true });
    }
    if (boleta) {
      const [rows] = await pool.query('SELECT b.codigo, e.dni FROM boletas b JOIN estudiantes e ON e.dni = b.dni WHERE b.codigo = ? AND b.estado = "activo" LIMIT 1', [boleta]);
      if (rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Boleta inválida' });
      }
      return res.json({ ok: true });
    }
    return res.status(400).json({ ok: false, error: 'Falta dni o boleta' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});