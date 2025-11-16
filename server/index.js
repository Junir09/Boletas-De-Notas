const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const app = express();
app.use(cors({ origin: '*'}));
app.use(express.json());

async function ensureSchema() {
  try {
    await pool.query(
      'CREATE TABLE IF NOT EXISTS cursos (id INT UNSIGNED NOT NULL AUTO_INCREMENT, nombre VARCHAR(120) NOT NULL, descripcion VARCHAR(255) NULL, PRIMARY KEY (id), UNIQUE KEY uniq_cursos_nombre (nombre)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
    await pool.query(
      'CREATE TABLE IF NOT EXISTS docente_curso (id INT UNSIGNED NOT NULL AUTO_INCREMENT, dni VARCHAR(20) NOT NULL, curso_id INT UNSIGNED NOT NULL, PRIMARY KEY (id), UNIQUE KEY uniq_docente_curso (dni, curso_id), KEY idx_docente_curso_dni (dni), KEY idx_docente_curso_curso (curso_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
  } catch (e) {
    console.error('Schema error:', e.message);
  }
}

ensureSchema();

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

// Cursos
app.get('/api/cursos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre, descripcion FROM cursos ORDER BY nombre');
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/cursos', async (req, res) => {
  const { nombre, descripcion } = req.body || {};
  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({ ok: false, error: 'Falta nombre' });
  }
  try {
    const [result] = await pool.query('INSERT INTO cursos (nombre, descripcion) VALUES (?, ?)', [String(nombre).trim(), descripcion ? String(descripcion).trim() : null]);
    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, error: 'Curso ya existe' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
});

// Asignaciones
app.get('/api/docentes/:dni/cursos', async (req, res) => {
  const dni = String(req.params.dni || '').trim();
  if (!dni) return res.status(400).json({ ok: false, error: 'Falta dni' });
  try {
    const [rows] = await pool.query(
      'SELECT c.id, c.nombre FROM docente_curso dc JOIN cursos c ON c.id = dc.curso_id WHERE dc.dni = ? ORDER BY c.nombre',
      [dni]
    );
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/asignaciones', async (req, res) => {
  const { dni, curso_id } = req.body || {};
  const d = String(dni || '').trim();
  const c = Number(curso_id);
  if (!d || !c) return res.status(400).json({ ok: false, error: 'Faltan dni y curso_id' });
  try {
    const [docRows] = await pool.query('SELECT dni FROM docente WHERE dni = ? LIMIT 1', [d]);
    if (docRows.length === 0) return res.status(404).json({ ok: false, error: 'Docente no existe' });
    const [curRows] = await pool.query('SELECT id FROM cursos WHERE id = ? LIMIT 1', [c]);
    if (curRows.length === 0) return res.status(404).json({ ok: false, error: 'Curso no existe' });
    const [result] = await pool.query('INSERT INTO docente_curso (dni, curso_id) VALUES (?, ?)', [d, c]);
    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, error: 'Ya asignado' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
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

// Redundante: asegurar ruta /api/cursos registrada
app.get('/api/cursos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre, descripcion FROM cursos ORDER BY nombre');
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
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
  const { dni } = req.body || {};
  try {
    if (dni) {
      const [rows] = await pool.query('SELECT dni FROM estudiantes WHERE dni = ? LIMIT 1', [dni]);
      if (rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'DNI inválido' });
      }
      return res.json({ ok: true });
    }
    return res.status(400).json({ ok: false, error: 'Falta dni' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});