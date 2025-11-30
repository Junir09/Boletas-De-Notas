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
    try {
      const [idx] = await pool.query('SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = "docente_curso" AND INDEX_NAME = "uniq_curso_unico"');
      if (idx && idx.length > 0) {
        await pool.query('ALTER TABLE docente_curso DROP INDEX uniq_curso_unico');
      }
    } catch (_) {}
    await pool.query(
      'CREATE TABLE IF NOT EXISTS curso_grado (id INT UNSIGNED NOT NULL AUTO_INCREMENT, curso_id INT UNSIGNED NOT NULL, grado_id INT UNSIGNED NOT NULL, seccion_id INT UNSIGNED NULL, PRIMARY KEY (id), UNIQUE KEY uniq_curso_grado_seccion (curso_id, grado_id, seccion_id), KEY idx_curso_grado_curso (curso_id), KEY idx_curso_grado_grado (grado_id), KEY idx_curso_grado_seccion (seccion_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
  } catch (e) {
    console.error('Schema error:', e.message);
  }
}

ensureSchema();

async function ensureEstudianteGrado() {
  try {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = "estudiantes" AND COLUMN_NAME = "grado"'
    );
    if ((rows[0] && rows[0].cnt) === 0) {
      await pool.query('ALTER TABLE estudiantes ADD COLUMN grado TINYINT UNSIGNED NULL');
    }
    const [rows2] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = "estudiantes" AND COLUMN_NAME = "seccion"'
    );
    if ((rows2[0] && rows2[0].cnt) === 0) {
      await pool.query('ALTER TABLE estudiantes ADD COLUMN seccion VARCHAR(10) NULL');
    }
  } catch (e) {
    console.error('Ensure grado/seccion error:', e.message);
  }
}
ensureEstudianteGrado();

async function ensureGradosYSecciones() {
  try {
    await pool.query(
      'CREATE TABLE IF NOT EXISTS grados (id INT UNSIGNED NOT NULL AUTO_INCREMENT, nombre VARCHAR(50) NOT NULL, PRIMARY KEY (id), UNIQUE KEY uniq_grados_nombre (nombre)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
    await pool.query(
      'CREATE TABLE IF NOT EXISTS secciones (id INT UNSIGNED NOT NULL AUTO_INCREMENT, nombre VARCHAR(10) NOT NULL, PRIMARY KEY (id), UNIQUE KEY uniq_secciones_nombre (nombre)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
    const [hasNumeroCol] = await pool.query('SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = "grados" AND COLUMN_NAME = "numero"');
    if ((hasNumeroCol[0] && hasNumeroCol[0].cnt) > 0) {
      try { await pool.query('ALTER TABLE grados DROP COLUMN numero'); } catch (_) {}
    }
    const [grados] = await pool.query('SELECT COUNT(*) AS cnt FROM grados');
    if ((grados[0] && grados[0].cnt) === 0) {
      await pool.query('INSERT INTO grados (nombre) VALUES ("1°"), ("2°"), ("3°"), ("4°"), ("5°"), ("6°")');
    }
    const [secciones] = await pool.query('SELECT COUNT(*) AS cnt FROM secciones');
    if ((secciones[0] && secciones[0].cnt) === 0) {
      await pool.query('INSERT INTO secciones (nombre) VALUES ("A"), ("B"), ("C")');
    }
  } catch (e) {
    console.error('Ensure grados/secciones error:', e.message);
  }
}
ensureGradosYSecciones();

async function ensureEstudiantesFK() {
  try {
    const [hasGradoId] = await pool.query('SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = "estudiantes" AND COLUMN_NAME = "grado_id"');
    if ((hasGradoId[0] && hasGradoId[0].cnt) === 0) {
      await pool.query('ALTER TABLE estudiantes ADD COLUMN grado_id INT UNSIGNED NULL');
      await pool.query('CREATE INDEX idx_estudiantes_grado_id ON estudiantes (grado_id)');
    }
    const [hasSeccionId] = await pool.query('SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = "estudiantes" AND COLUMN_NAME = "seccion_id"');
    if ((hasSeccionId[0] && hasSeccionId[0].cnt) === 0) {
      await pool.query('ALTER TABLE estudiantes ADD COLUMN seccion_id INT UNSIGNED NULL');
      await pool.query('CREATE INDEX idx_estudiantes_seccion_id ON estudiantes (seccion_id)');
    }
    await pool.query(`
      UPDATE estudiantes e
      JOIN grados g ON CAST(SUBSTRING_INDEX(g.nombre, '°', 1) AS UNSIGNED) = e.grado
      SET e.grado_id = g.id
      WHERE e.grado IS NOT NULL AND e.grado_id IS NULL`);
    await pool.query(`
      UPDATE estudiantes e
      JOIN secciones s ON s.nombre = e.seccion
      SET e.seccion_id = s.id
      WHERE e.seccion IS NOT NULL AND e.seccion_id IS NULL`);
  } catch (e) {
    console.error('Ensure estudiantes FK error:', e.message);
  }
}
ensureEstudiantesFK();

async function ensureActividades() {
  try {
    await pool.query('CREATE TABLE IF NOT EXISTS curso_actividad (id INT UNSIGNED NOT NULL AUTO_INCREMENT, curso_id INT UNSIGNED NOT NULL, grado_id INT UNSIGNED NOT NULL, seccion_id INT UNSIGNED NULL, nombre VARCHAR(120) NOT NULL, orden INT UNSIGNED NOT NULL DEFAULT 1, created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), KEY idx_ca_curso (curso_id), KEY idx_ca_grado (grado_id), KEY idx_ca_seccion (seccion_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    await pool.query('CREATE TABLE IF NOT EXISTS actividad_nota (id INT UNSIGNED NOT NULL AUTO_INCREMENT, actividad_id INT UNSIGNED NOT NULL, estudiante_dni VARCHAR(20) NOT NULL, nota DECIMAL(5,2) NULL, PRIMARY KEY (id), UNIQUE KEY uniq_act_est (actividad_id, estudiante_dni), KEY idx_an_actividad (actividad_id), KEY idx_an_estudiante (estudiante_dni)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
  } catch (e) {
    console.error('Ensure actividades error:', e.message);
  }
}
ensureActividades();

// Healthcheck
app.get('/', (req, res) => {
  res.json({ ok: true, name: 'Boletas API', version: '1.0.0' });
});

// Docentes
app.get('/api/docentes', async (req, res) => {
  try {
    const sql = 'SELECT d.dni, d.nombre, d.descripcion, d.password, x.cursos FROM docente d LEFT JOIN (SELECT dc.dni, GROUP_CONCAT(c.nombre ORDER BY c.nombre SEPARATOR ", ") AS cursos FROM docente_curso dc JOIN cursos c ON c.id = dc.curso_id GROUP BY dc.dni) x ON x.dni COLLATE utf8mb4_unicode_ci = d.dni COLLATE utf8mb4_unicode_ci ORDER BY d.nombre';
    const [rows] = await pool.query(sql);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/docentes/:dni', async (req, res) => {
  const dni = String(req.params.dni || '').trim();
  if (!dni) return res.status(400).json({ ok: false, error: 'Falta dni' });
  try {
    const [rows] = await pool.query('SELECT dni, nombre FROM docente WHERE dni = ? LIMIT 1', [dni]);
    if (!rows || rows.length === 0) return res.status(404).json({ ok: false, error: 'Docente no encontrado' });
    res.json({ ok: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Cursos por docente con conteo de alumnos
app.get('/api/docentes/:dni/cursos', async (req, res) => {
  const dni = String(req.params.dni || '').trim();
  if (!dni) return res.status(400).json({ ok: false, error: 'Falta dni' });
  try {
    try { await pool.query("SET collation_connection = 'utf8mb4_unicode_ci'"); } catch (_) {}
    const sql = `
      SELECT c.id, c.nombre, c.descripcion,
             COALESCE(cnt.alumnos, 0) AS alumnos
      FROM docente_curso dc
      JOIN cursos c ON c.id = dc.curso_id
      LEFT JOIN (
        SELECT cg.curso_id, COUNT(DISTINCT e.dni) AS alumnos
        FROM curso_grado cg
        LEFT JOIN estudiantes e
          ON e.grado_id = cg.grado_id AND (cg.seccion_id IS NULL OR e.seccion_id = cg.seccion_id)
        GROUP BY cg.curso_id
      ) AS cnt ON cnt.curso_id = c.id
      WHERE CAST(dc.dni AS UNSIGNED) = CAST(? AS UNSIGNED)
      GROUP BY c.id, c.nombre, c.descripcion, cnt.alumnos
      ORDER BY c.nombre`;
    const [rows] = await pool.query(sql, [dni]);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/docentes/:dni/cursos/asignaciones', async (req, res) => {
  const dni = String(req.params.dni || '').trim();
  if (!dni) return res.status(400).json({ ok: false, error: 'Falta dni' });
  try {
    try { await pool.query("SET collation_connection = 'utf8mb4_unicode_ci'"); } catch (_) {}
    const sql = `
      SELECT c.id AS curso_id, c.nombre AS curso,
             g.id AS grado_id, g.nombre AS grado,
             s.id AS seccion_id, s.nombre AS seccion,
             COUNT(DISTINCT e.dni) AS alumnos
      FROM docente_curso dc
      JOIN cursos c ON c.id = dc.curso_id
      JOIN curso_grado cg ON cg.curso_id = c.id
      JOIN grados g ON g.id = cg.grado_id
      LEFT JOIN secciones s ON s.id = cg.seccion_id
      LEFT JOIN estudiantes e
        ON e.grado_id = g.id AND (cg.seccion_id IS NULL OR e.seccion_id = cg.seccion_id)
      WHERE CAST(dc.dni AS UNSIGNED) = CAST(? AS UNSIGNED)
      GROUP BY c.id, c.nombre, g.id, g.nombre, s.id, s.nombre
      ORDER BY c.nombre, g.nombre, s.nombre`;
    const [rows] = await pool.query(sql, [dni]);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Estudiantes por curso asignado al docente
app.get('/api/docentes/:dni/cursos/:cursoId/estudiantes', async (req, res) => {
  const dni = String(req.params.dni || '').trim();
  const cursoId = Number(req.params.cursoId || 0);
  if (!dni || !cursoId) return res.status(400).json({ ok: false, error: 'Faltan dni y cursoId' });
  try {
    const [asig] = await pool.query('SELECT 1 FROM docente_curso WHERE CAST(dni AS UNSIGNED) = CAST(? AS UNSIGNED) AND curso_id = ? LIMIT 1', [dni, cursoId]);
    if (!asig || asig.length === 0) return res.status(404).json({ ok: false, error: 'Curso no asignado al docente' });
    const gradoId = req.query && req.query.grado_id ? Number(req.query.grado_id) : null;
    const seccionId = req.query && req.query.seccion_id ? Number(req.query.seccion_id) : null;
    let sql = `
      SELECT DISTINCT e.dni, e.apellidos, e.nombres, e.grado, e.seccion
      FROM estudiantes e
      JOIN curso_grado cg
        ON e.grado_id = cg.grado_id AND (cg.seccion_id IS NULL OR e.seccion_id = cg.seccion_id)
      WHERE cg.curso_id = ?`;
    const params = [cursoId];
    if (gradoId) { sql += ' AND cg.grado_id = ?'; params.push(gradoId); }
    if (seccionId) { sql += ' AND cg.seccion_id = ?'; params.push(seccionId); }
    sql += ' ORDER BY e.apellidos, e.nombres';
    const [rows] = await pool.query(sql, params);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/curso-actividades', async (req, res) => {
  const cursoId = Number(req.query.curso_id || 0);
  const gradoId = Number(req.query.grado_id || 0);
  const seccionId = req.query.seccion_id ? Number(req.query.seccion_id) : null;
  if (!cursoId || !gradoId) return res.status(400).json({ ok: false, error: 'Falta curso_id o grado_id' });
  try {
    const params = [cursoId, gradoId];
    let sql = 'SELECT id, nombre, orden FROM curso_actividad WHERE curso_id = ? AND grado_id = ?';
    if (seccionId) { sql += ' AND seccion_id = ?'; params.push(seccionId); } else { sql += ' AND seccion_id IS NULL'; }
    sql += ' ORDER BY orden, id';
    const [rows] = await pool.query(sql, params);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/curso-actividades', async (req, res) => {
  const { curso_id, grado_id, seccion_id, nombre } = req.body || {};
  const c = Number(curso_id || 0);
  const g = Number(grado_id || 0);
  const s = seccion_id ? Number(seccion_id) : null;
  const n = String(nombre || '').trim();
  if (!c || !g || !n) return res.status(400).json({ ok: false, error: 'Faltan datos' });
  try {
    const [ord] = await pool.query('SELECT COALESCE(MAX(orden),0)+1 AS next FROM curso_actividad WHERE curso_id = ? AND grado_id = ? AND ' + (s ? 'seccion_id = ?' : 'seccion_id IS NULL'), s ? [c, g, s] : [c, g]);
    const next = (ord[0] && ord[0].next) ? Number(ord[0].next) : 1;
    const [ins] = await pool.query('INSERT INTO curso_actividad (curso_id, grado_id, seccion_id, nombre, orden) VALUES (?,?,?,?,?)', [c, g, s, n, next]);
    res.json({ ok: true, id: ins.insertId, orden: next });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.delete('/api/curso-actividades/:id', async (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) return res.status(400).json({ ok: false, error: 'Falta id' });
  try {
    await pool.query('DELETE FROM actividad_nota WHERE actividad_id = ?', [id]);
    const [del] = await pool.query('DELETE FROM curso_actividad WHERE id = ?', [id]);
    if (del.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Actividad no existe' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/actividad-notas', async (req, res) => {
  const actividadId = Number(req.query.actividad_id || 0);
  if (!actividadId) return res.status(400).json({ ok: false, error: 'Falta actividad_id' });
  try {
    const [rows] = await pool.query('SELECT actividad_id, estudiante_dni, nota FROM actividad_nota WHERE actividad_id = ? ORDER BY estudiante_dni', [actividadId]);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/actividad-notas/bulk', async (req, res) => {
  const { actividad_id, notas } = req.body || {};
  const a = Number(actividad_id || 0);
  if (!a || !Array.isArray(notas)) return res.status(400).json({ ok: false, error: 'Faltan datos' });
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const item of notas) {
        const dni = String(item.dni || '').trim();
        const val = item.nota != null ? Number(item.nota) : null;
        if (!dni) continue;
        await conn.query('INSERT INTO actividad_nota (actividad_id, estudiante_dni, nota) VALUES (?,?,?) ON DUPLICATE KEY UPDATE nota = VALUES(nota)', [a, dni, val]);
      }
      await conn.commit();
      conn.release();
      res.json({ ok: true });
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
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

app.get('/api/cursos/disponibles', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre, descripcion FROM cursos WHERE id NOT IN (SELECT curso_id FROM docente_curso) ORDER BY nombre');
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

// Actualizar curso
app.put('/api/cursos/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, descripcion } = req.body || {};
  if (!id) return res.status(400).json({ ok: false, error: 'Falta id' });
  const updates = [];
  const params = [];
  if (typeof nombre === 'string' && nombre.trim()) { updates.push('nombre = ?'); params.push(nombre.trim()); }
  if (typeof descripcion === 'string') { updates.push('descripcion = ?'); params.push(descripcion.trim() || null); }
  if (updates.length === 0) return res.status(400).json({ ok: false, error: 'No hay campos para actualizar' });
  try {
    params.push(id);
    const [result] = await pool.query(`UPDATE cursos SET ${updates.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Curso no existe' });
    res.json({ ok: true, affected: result.affectedRows });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, error: 'Nombre de curso ya existe' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
});

// Eliminar curso (incluye limpieza de asignaciones)
app.delete('/api/cursos/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok: false, error: 'Falta id' });
  try {
    await pool.query('DELETE FROM docente_curso WHERE curso_id = ?', [id]);
    const [result] = await pool.query('DELETE FROM cursos WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Curso no existe' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Asignaciones (ver cursos por docente) -> ver versión enriquecida más abajo

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
      res.status(409).json({ ok: false, error: 'Asignación ya existe para este docente' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
});

app.delete('/api/asignaciones', async (req, res) => {
  const { dni, curso_id } = req.body || {};
  const d = String(dni || '').trim();
  const c = Number(curso_id);
  if (!d || !c) return res.status(400).json({ ok: false, error: 'Faltan dni y curso_id' });
  try {
    const [result] = await pool.query('DELETE FROM docente_curso WHERE dni = ? AND curso_id = ?', [d, c]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: 'Asignación no existe' });
    }
    res.json({ ok: true });
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

// Actualizar docente
app.put('/api/docentes/:dni', async (req, res) => {
  const dni = String(req.params.dni || '').trim();
  const { nombre, descripcion, password } = req.body || {};
  if (!dni) return res.status(400).json({ ok: false, error: 'Falta dni' });
  try {
    const [rows] = await pool.query('SELECT dni FROM docente WHERE dni = ? LIMIT 1', [dni]);
    if (rows.length === 0) return res.status(404).json({ ok: false, error: 'Docente no existe' });
    const fields = [];
    const params = [];
    if (typeof nombre === 'string' && nombre.trim()) { fields.push('nombre = ?'); params.push(nombre.trim()); }
    if (typeof descripcion === 'string') { fields.push('descripcion = ?'); params.push(descripcion.trim() || null); }
    if (typeof password === 'string' && password.trim()) { fields.push('password = ?'); params.push(password.trim()); }
    if (fields.length === 0) return res.status(400).json({ ok: false, error: 'No hay campos para actualizar' });
    params.push(dni);
    const [result] = await pool.query(`UPDATE docente SET ${fields.join(', ')} WHERE dni = ?`, params);
    res.json({ ok: true, affected: result.affectedRows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Eliminar docente (incluye limpieza de asignaciones)
app.delete('/api/docentes/:dni', async (req, res) => {
  const dni = String(req.params.dni || '').trim();
  if (!dni) return res.status(400).json({ ok: false, error: 'Falta dni' });
  try {
    await pool.query('DELETE FROM docente_curso WHERE dni = ?', [dni]);
    const [result] = await pool.query('DELETE FROM docente WHERE dni = ?', [dni]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Docente no existe' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
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
    const [rows] = await pool.query('SELECT dni, apellidos, nombres, grado, seccion FROM estudiantes ORDER BY apellidos, nombres');
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Crear estudiante (individual)
app.post('/api/estudiantes', async (req, res) => {
  const { dni, apellidos, nombres } = req.body || {};
  const d = String(dni || '').trim();
  const a = String(apellidos || '').trim();
  const n = String(nombres || '').trim();
  if (!d || !a || !n) return res.status(400).json({ ok: false, error: 'Faltan dni, apellidos y nombres' });
  try {
    const [result] = await pool.query('INSERT INTO estudiantes (dni, apellidos, nombres) VALUES (?, ?, ?)', [d, a, n]);
    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, error: 'DNI ya registrado' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
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

// Estudiantes sin grado
app.get('/api/estudiantes/sin-grado', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT dni, apellidos, nombres FROM estudiantes WHERE grado IS NULL ORDER BY apellidos, nombres');
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Asignación masiva de grado y sección
app.post('/api/estudiantes/grados/bulk', async (req, res) => {
  const { grado, seccion, dnis } = req.body || {};
  const g = Number(grado);
  const sec = seccion ? String(seccion).trim() : null;
  const list = Array.isArray(dnis) ? dnis.map(d => String(d || '').trim()).filter(Boolean) : [];
  if (!g || g < 1 || g > 6) return res.status(400).json({ ok: false, error: 'Grado inválido' });
  if (list.length === 0) return res.status(400).json({ ok: false, error: 'Lista de DNI vacía' });
  const placeholders = list.map(() => '?').join(',');
  try {
    const fields = ['grado = ?'];
    const params = [g];
    if (sec) {
      fields.push('seccion = ?');
      params.push(sec);
    }
    const sql2 = `UPDATE estudiantes SET ${fields.join(', ')} WHERE dni IN (${placeholders})`;
    const [result] = await pool.query(sql2, [...params, ...list]);
    res.json({ ok: true, affected: result.affectedRows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Actualizar estudiante
app.put('/api/estudiantes/:dni', async (req, res) => {
  const dni = String(req.params.dni || '').trim();
  const { apellidos, nombres, grado, seccion } = req.body || {};
  if (!dni) return res.status(400).json({ ok: false, error: 'Falta dni' });
  try {
    const [rows] = await pool.query('SELECT dni FROM estudiantes WHERE dni = ? LIMIT 1', [dni]);
    if (rows.length === 0) return res.status(404).json({ ok: false, error: 'Estudiante no existe' });
    const fields = [];
    const params = [];
    if (typeof apellidos === 'string' && apellidos.trim()) { fields.push('apellidos = ?'); params.push(apellidos.trim()); }
    if (typeof nombres === 'string' && nombres.trim()) { fields.push('nombres = ?'); params.push(nombres.trim()); }
    if (grado === null) { fields.push('grado = NULL'); }
    else if (typeof grado !== 'undefined') {
      const g = Number(grado);
      if (!Number.isNaN(g) && g >= 1 && g <= 6) { fields.push('grado = ?'); params.push(g); } else {
        return res.status(400).json({ ok: false, error: 'Grado inválido' });
      }
    }
    if (seccion === null) { fields.push('seccion = NULL'); }
    else if (typeof seccion === 'string') { fields.push('seccion = ?'); params.push(seccion.trim() || null); }
    if (fields.length === 0) return res.status(400).json({ ok: false, error: 'No hay campos para actualizar' });
    params.push(dni);
    const [result] = await pool.query(`UPDATE estudiantes SET ${fields.join(', ')} WHERE dni = ?`, params);
    res.json({ ok: true, affected: result.affectedRows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Eliminar estudiante
app.delete('/api/estudiantes/:dni', async (req, res) => {
  const dni = String(req.params.dni || '').trim();
  if (!dni) return res.status(400).json({ ok: false, error: 'Falta dni' });
  try {
    const [result] = await pool.query('DELETE FROM estudiantes WHERE dni = ?', [dni]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Estudiante no existe' });
    res.json({ ok: true });
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

// Promover grado (+1, máx 6)
app.post('/api/estudiantes/grados/promover', async (req, res) => {
  const { dnis } = req.body || {};
  const list = Array.isArray(dnis) ? dnis.map(d => String(d || '').trim()).filter(Boolean) : [];
  if (list.length === 0) return res.status(400).json({ ok: false, error: 'Lista de DNI vacía' });
  const placeholders = list.map(() => '?').join(',');
  try {
    const sql = `UPDATE estudiantes SET grado = LEAST(6, grado + 1) WHERE grado IS NOT NULL AND dni IN (${placeholders})`;
    const [result] = await pool.query(sql, list);
    res.json({ ok: true, affected: result.affectedRows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Bajar grado (-1, mín 1)
app.post('/api/estudiantes/grados/bajar', async (req, res) => {
  const { dnis } = req.body || {};
  const list = Array.isArray(dnis) ? dnis.map(d => String(d || '').trim()).filter(Boolean) : [];
  if (list.length === 0) return res.status(400).json({ ok: false, error: 'Lista de DNI vacía' });
  const placeholders = list.map(() => '?').join(',');
  try {
    const sql = `UPDATE estudiantes SET grado = GREATEST(1, grado - 1) WHERE grado IS NOT NULL AND dni IN (${placeholders})`;
    const [result] = await pool.query(sql, list);
    res.json({ ok: true, affected: result.affectedRows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// === GRADOS ===
app.get('/api/grados', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM grados ORDER BY nombre');
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/grados', async (req, res) => {
  const { nombre } = req.body || {};
  const nom = String(nombre || '').trim();
  if (!nom) return res.status(400).json({ ok: false, error: 'Falta nombre' });
  try {
    const [result] = await pool.query('INSERT INTO grados (nombre) VALUES (?)', [nom]);
    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, error: 'Nombre de grado ya existe' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
});

app.put('/api/grados/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { nombre } = req.body || {};
  if (!id) return res.status(400).json({ ok: false, error: 'Falta id' });
  const nom = typeof nombre === 'string' ? nombre.trim() : '';
  if (!nom) return res.status(400).json({ ok: false, error: 'No hay campos para actualizar' });
  try {
    const [result] = await pool.query('UPDATE grados SET nombre = ? WHERE id = ?', [nom, id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Grado no existe' });
    res.json({ ok: true, affected: result.affectedRows });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, error: 'Nombre de grado ya existe' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
});

app.delete('/api/grados/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok: false, error: 'Falta id' });
  try {
    const [result] = await pool.query('DELETE FROM grados WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Grado no existe' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// === SECCIONES ===
app.get('/api/secciones', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM secciones ORDER BY nombre');
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/secciones', async (req, res) => {
  const { nombre } = req.body || {};
  const nom = String(nombre || '').trim();
  if (!nom) return res.status(400).json({ ok: false, error: 'Falta nombre' });
  try {
    const [result] = await pool.query('INSERT INTO secciones (nombre) VALUES (?)', [nom]);
    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, error: 'Sección ya existe' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
});

app.put('/api/secciones/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { nombre } = req.body || {};
  if (!id) return res.status(400).json({ ok: false, error: 'Falta id' });
  if (typeof nombre !== 'string' || !nombre.trim()) return res.status(400).json({ ok: false, error: 'Falta nombre' });
  try {
    const [result] = await pool.query('UPDATE secciones SET nombre = ? WHERE id = ?', [nombre.trim(), id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Sección no existe' });
    res.json({ ok: true, affected: result.affectedRows });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, error: 'Nombre de sección ya existe' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
});

app.delete('/api/secciones/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok: false, error: 'Falta id' });
  try {
    const [result] = await pool.query('DELETE FROM secciones WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Sección no existe' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// === CURSO POR GRADO/SECCION ===
app.get('/api/curso-grado', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT cg.id, cg.curso_id, c.nombre AS curso, cg.grado_id, g.nombre AS grado, cg.seccion_id, s.nombre AS seccion
      FROM curso_grado cg
      JOIN cursos c ON c.id = cg.curso_id
      JOIN grados g ON g.id = cg.grado_id
      LEFT JOIN secciones s ON s.id = cg.seccion_id
      ORDER BY g.nombre, c.nombre, s.nombre
    `);
    res.json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/curso-grado', async (req, res) => {
  const { curso_id, grado_id, seccion_id } = req.body || {};
  const cid = Number(curso_id || 0);
  const gid = Number(grado_id || 0);
  const sid = seccion_id != null ? Number(seccion_id) : null;
  if (!cid || !gid) return res.status(400).json({ ok: false, error: 'Falta curso y grado' });
  try {
    const [result] = await pool.query('INSERT INTO curso_grado (curso_id, grado_id, seccion_id) VALUES (?, ?, ?)', [cid, gid, sid]);
    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, error: 'Asignación duplicada' });
    } else {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
});

app.delete('/api/curso-grado/:id', async (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) return res.status(400).json({ ok: false, error: 'Falta id' });
  try {
    const [result] = await pool.query('DELETE FROM curso_grado WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, error: 'Asignación no existe' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});
